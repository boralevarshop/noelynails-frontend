'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, parseISO, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx'; 
import { getTheme } from '../../../utils/theme';

export default function AgendamentosPage() {
  const router = useRouter();
  
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); 
  const [loading, setLoading] = useState(true); // Loading inicial (esqueleto)
  const [refreshing, setRefreshing] = useState(false); // Loading de fundo
  
  const [abaAtiva, setAbaAtiva] = useState<'proximos' | 'historico'>('proximos');
  const [modalAberto, setModalAberto] = useState(false);
  const [tema, setTema] = useState(getTheme('SALAO_BELEZA'));
  const [busca, setBusca] = useState('');
  
  // Filtros Histórico
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd')); 
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd')); 
  const [filtroHistProfissional, setFiltroHistProfissional] = useState('');
  const [filtroHistServico, setFiltroHistServico] = useState('');

  // Formulário Novo
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [novoAgendamento, setNovoAgendamento] = useState({
    nomeCliente: '', telefoneCliente: '', serviceId: '', professionalId: ''
  });

  const horariosDisponiveis = (() => {
    const h = []; let hora = 8; let minuto = 0;
    while (hora <= 23) { h.push(`${hora.toString().padStart(2,'0')}:${minuto.toString().padStart(2,'0')}`); minuto += 30; if (minuto === 60) { minuto = 0; hora++; } }
    return h;
  })();

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    // --- 1. CARREGA TEMA E DADOS DO CACHE (INSTANTÂNEO) ---
    const cachedTenant = localStorage.getItem('tenant_cache');
    if (cachedTenant) {
        const t = JSON.parse(cachedTenant);
        setTenant(t);
        setTema(getTheme(t.segmento || 'SALAO_BELEZA'));
    }
    
    const cachedAgenda = localStorage.getItem('agenda_cache');
    if (cachedAgenda) {
        setAgendamentos(JSON.parse(cachedAgenda));
        setLoading(false); // Tira o loading na hora
    }

    // --- 2. BUSCA DADOS ATUALIZADOS EM SEGUNDO PLANO ---
    carregarDadosIniciais(user.tenant.id);
  }, []);

  useEffect(() => {
    if (usuario && profissionais.length > 0) {
        const souProfissional = profissionais.find(p => p.id === usuario.id);
        if (souProfissional) {
            setNovoAgendamento(prev => ({ ...prev, professionalId: usuario.id }));
        }
    }
  }, [usuario, profissionais, modalAberto]);

  const carregarDadosIniciais = async (tenantId: string) => {
    setRefreshing(true); // Mostra loading pequeno se quiser
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Reduzi o range padrão para 30 dias (15 antes, 15 depois) para ser leve
      const start = format(subDays(new Date(), 15), 'yyyy-MM-dd');
      const end = format(addDays(new Date(), 15), 'yyyy-MM-dd');

      const [resServ, resProf, resAgenda, resCli, resTenant] = await Promise.all([
        fetch(`${apiUrl}/services/tenant/${tenantId}`),
        fetch(`${apiUrl}/professionals/tenant/${tenantId}`),
        fetch(`${apiUrl}/appointments/tenant/${tenantId}?startDate=${start}&endDate=${end}`),
        fetch(`${apiUrl}/clients/tenant/${tenantId}`),
        fetch(`${apiUrl}/tenants/${tenantId}`)
      ]);

      if (resServ.ok) setServicos(await resServ.json());
      if (resProf.ok) setProfissionais(await resProf.json());
      if (resCli.ok) setClientes(await resCli.json());
      if (resTenant.ok) {
          const t = await resTenant.json();
          setTenant(t);
          setTema(getTheme(t.segmento || 'SALAO_BELEZA'));
          localStorage.setItem('tenant_cache', JSON.stringify(t));
      }
      if (resAgenda.ok) {
          const agendaData = await resAgenda.json();
          setAgendamentos(agendaData);
          // Salva no cache para a próxima vez
          localStorage.setItem('agenda_cache', JSON.stringify(agendaData));
      }
      
    } catch (error) { console.error(error); } 
    finally { 
        setLoading(false); 
        setRefreshing(false);
    }
  };

  // Busca completa (quando clica no botão de filtro histórico)
  const buscarHistoricoBackend = async () => {
      if (!usuario) return;
      setLoading(true); // Aqui mostra loading full pois é uma ação explícita
      try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const res = await fetch(`${apiUrl}/appointments/tenant/${usuario.tenant.id}?startDate=${dataInicio}&endDate=${dataFim}`);
          if (res.ok) {
              setAgendamentos(await res.json());
          }
      } catch (error) { alert('Erro ao buscar dados.'); }
      finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    try {
      const dataHoraCombinada = new Date(`${dataSelecionada}T${horarioSelecionado}:00`);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoAgendamento,
          tenantId: usuario.tenant.id,
          dataHora: dataHoraCombinada.toISOString(),
          isInternal: true 
        })
      });

      if (res.ok) {
        alert('Agendamento realizado! 📅');
        setNovoAgendamento({ nomeCliente: '', telefoneCliente: '', serviceId: '', professionalId: '' });
        setDataSelecionada(''); setHorarioSelecionado('');
        setModalAberto(false);
        carregarDadosIniciais(usuario.tenant.id);
      } else { const erro = await res.json(); alert(`Erro: ${erro.message}`); }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/appointments/${id}/cancel`, { 
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: usuario.nome }) 
      });
      setAgendamentos(prev => prev.map(ag => ag.id === id ? { ...ag, status: 'CANCELADO', canceladoPor: usuario.nome } : ag));
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNovoAgendamento(prev => ({ ...prev, nomeCliente: val }));
    const cli = clientes.find(c => c.nome === val);
    if (cli) setNovoAgendamento(prev => ({ ...prev, nomeCliente: val, telefoneCliente: cli.telefone }));
  };

  const getListaFiltrada = () => {
    let lista = agendamentos;
    const termo = busca.toLowerCase();

    if (abaAtiva === 'proximos') {
        lista = lista.filter(a => a.status === 'CONFIRMADO');
        if (busca) lista = lista.filter(a => a.cliente.nome.toLowerCase().includes(termo) || a.cliente.telefone?.includes(termo));
        return lista.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
    } else {
        lista = lista.filter(a => a.status !== 'CONFIRMADO' && a.status !== 'PENDENTE');
        if (filtroHistProfissional) lista = lista.filter(a => a.profissional.id === filtroHistProfissional);
        if (filtroHistServico) lista = lista.filter(a => a.servico.id === filtroHistServico);
        if (busca) lista = lista.filter(a => a.cliente.nome.toLowerCase().includes(termo));
        // O filtro de data já foi feito no backend, aqui só ordenamos
        return lista.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    }
  };

  const listaAtual = getListaFiltrada();

  const exportarExcel = () => {
      if (listaAtual.length === 0) { alert('Nada para exportar.'); return; }
      const dadosParaExcel = listaAtual.map(ag => ({
          Data: format(new Date(ag.dataHora), 'dd/MM/yyyy'),
          Hora: format(new Date(ag.dataHora), 'HH:mm'),
          Cliente: ag.cliente.nome,
          Telefone: ag.cliente.telefone,
          Serviço: ag.servico.nome,
          Valor: Number(ag.servico.preco),
          Profissional: ag.profissional.nome,
          Status: ag.status
      }));
      const ws = XLSX.utils.json_to_sheet(dadosParaExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório");
      XLSX.writeFile(wb, `Relatorio_${abaAtiva}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';
  const corTexto = tenant?.corTexto || '#FFFFFF';

  const agruparPorData = (lista: any[]) => {
    const grupos: any = {};
    lista.forEach(ag => {
        const dataKey = new Date(ag.dataHora).toDateString();
        if (!grupos[dataKey]) grupos[dataKey] = [];
        grupos[dataKey].push(ag);
    });
    return grupos;
  };
  
  const listaAgrupada = agruparPorData(listaAtual);

  return (
    <div className="min-h-screen pb-20 md:pb-8 transition-colors duration-300" style={{ backgroundColor: corFundo }}>
      
      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
         <div className="flex items-center gap-4">
             <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg font-bold border-2 transition-colors flex items-center gap-2 hover:bg-gray-50" style={{ borderColor: corPrincipal, color: corPrincipal }}>
                <span>←</span> Voltar ao Painel
             </button>
             <h1 className="text-xl font-bold text-gray-800 hidden md:block">Agenda Inteligente</h1>
             {refreshing && <span className="text-xs text-gray-400 animate-pulse">Atualizando...</span>}
         </div>
         <button onClick={() => setModalAberto(true)} className="hidden md:block text-white px-4 py-2 rounded-lg font-bold transition-colors hover:opacity-90" style={{ backgroundColor: corPrincipal }}>+ Novo Agendamento</button>
         <h1 className="text-lg font-bold md:hidden" style={{ color: '#1F2937' }}>Agenda</h1>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* ABAS */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto">
                <button onClick={() => setAbaAtiva('proximos')} className={`flex-1 px-6 py-2 text-sm font-bold rounded-lg transition-all ${abaAtiva === 'proximos' ? 'text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`} style={abaAtiva === 'proximos' ? { backgroundColor: corPrincipal } : {}}>📅 Próximos</button>
                <button onClick={() => setAbaAtiva('historico')} className={`flex-1 px-6 py-2 text-sm font-bold rounded-lg transition-all ${abaAtiva === 'historico' ? 'text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`} style={abaAtiva === 'historico' ? { backgroundColor: corPrincipal } : {}}>📜 Histórico</button>
            </div>

            <div className="w-full md:w-64">
                <input type="text" placeholder="🔍 Buscar cliente..." className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 bg-white shadow-sm" style={{ '--tw-ring-color': corPrincipal } as any} value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
        </div>

        {/* FILTROS HISTÓRICO */}
        {abaAtiva === 'historico' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Filtrar Período e Dados</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <div><label className="text-xs font-bold text-gray-500">Início</label><input type="date" className="w-full border rounded p-2 text-sm" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-gray-500">Fim</label><input type="date" className="w-full border rounded p-2 text-sm" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-gray-500">Profissional</label><select className="w-full border rounded p-2 text-sm bg-white" value={filtroHistProfissional} onChange={e => setFiltroHistProfissional(e.target.value)}><option value="">Todos</option>{profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
                    <div><label className="text-xs font-bold text-gray-500">Serviço</label><select className="w-full border rounded p-2 text-sm bg-white" value={filtroHistServico} onChange={e => setFiltroHistServico(e.target.value)}><option value="">Todos</option>{servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
                    
                    <button onClick={buscarHistoricoBackend} className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-black flex items-center justify-center gap-2 transition-colors">🔎 Buscar</button>
                </div>
                
                <div className="mt-4 pt-4 border-t flex justify-end">
                    <button onClick={exportarExcel} className="text-green-600 font-bold text-sm hover:underline flex items-center gap-1">📊 Baixar Excel</button>
                </div>
             </div>
        )}

        {/* LISTA */}
        {loading ? (
            <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
            </div>
        ) : (
            <div className="space-y-8">
                {Object.keys(listaAgrupada).length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-4xl mb-2">📅</p>
                        <p className="text-gray-500">Nenhum agendamento encontrado.</p>
                    </div>
                )}

                {Object.keys(listaAgrupada).map(dataKey => {
                    const date = new Date(dataKey);
                    let labelDia = format(date, "dd 'de' MMMM", { locale: ptBR });
                    if (isToday(date)) labelDia = "Hoje";
                    if (isTomorrow(date)) labelDia = "Amanhã";

                    return (
                        <div key={dataKey}>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: corPrincipal }}></span> {labelDia}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {listaAgrupada[dataKey].map((ag: any) => {
                                    const telLimpo = ag.cliente.telefone ? ag.cliente.telefone.replace(/\D/g, '') : '';
                                    let corBadge = 'bg-gray-200 text-gray-600';
                                    if (ag.status === 'CONCLUIDO') corBadge = 'bg-green-100 text-green-700';
                                    if (ag.status === 'CONFIRMADO') corBadge = 'bg-blue-100 text-blue-700';
                                    if (ag.status === 'CANCELADO') corBadge = 'bg-red-100 text-red-700';

                                    return (
                                    <div key={ag.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-colors flex justify-between items-center hover:shadow-md">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-gray-800">
                                                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${corBadge}`}>
                                                    {ag.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 font-medium mt-1 text-lg">{ag.cliente.nome}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                {tema.icons.servico} {ag.servico.nome} <span className="text-gray-300">|</span> {tema.icons.profissional} {ag.profissional.nome.split(' ')[0]}
                                            </p>
                                            {ag.status === 'CANCELADO' && <p className="text-[10px] text-red-500 mt-1 font-bold">Cancelado por: {ag.canceladoPor}</p>}
                                        </div>
                                        
                                        {ag.status === 'CONFIRMADO' && (
                                            <button onClick={() => handleCancel(ag.id)} className="bg-white border border-red-200 text-red-500 p-2 rounded-lg hover:bg-red-50 transition shadow-sm" title="Cancelar">✕</button>
                                        )}
                                    </div>
                                );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800" style={{ color: corPrincipal }}>{tema.labels.novoAgendamento}</h2>
                    <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                     <div><label className="text-xs font-bold text-gray-500 uppercase">Cliente</label><input list="lista-cli-modal" required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 focus:ring-2 outline-none" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.nomeCliente} onChange={handleNomeChange} placeholder="Buscar..." /><datalist id="lista-cli-modal">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist></div>
                     <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label><input required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 focus:ring-2 outline-none" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.telefoneCliente} onChange={e => setNovoAgendamento({...novoAgendamento, telefoneCliente: e.target.value})} placeholder="11..." /></div>
                     <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-gray-500 uppercase">Serviço</label><select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.serviceId} onChange={(e) => setNovoAgendamento({...novoAgendamento, serviceId: e.target.value})}><option value="">Selecione...</option>{servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 uppercase">Profissional</label><select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.professionalId} onChange={(e) => setNovoAgendamento({...novoAgendamento, professionalId: e.target.value})}><option value="">Selecione...</option>{profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div></div>
                     <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-gray-500 uppercase">Data</label><input type="date" required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Hora</label><select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={horarioSelecionado} onChange={(e) => setHorarioSelecionado(e.target.value)}><option value="">...</option>{horariosDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}</select></div></div>
                     <button type="submit" className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4" style={{ backgroundColor: corPrincipal, color: corTexto }}>Confirmar</button>
                </form>
            </div>
        </div>
      )}
      {abaAtiva === 'proximos' && <button onClick={() => setModalAberto(true)} className="md:hidden fixed bottom-20 right-6 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl hover:scale-110 transition-transform z-50" style={{ backgroundColor: corPrincipal }}>+</button>}
    </div>
  );
}