'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AgendamentosPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de Controle de Interface
  const [abaAtiva, setAbaAtiva] = useState<'proximos' | 'historico'>('proximos');
  const [modalAberto, setModalAberto] = useState(false);

  // Formulário
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [novoAgendamento, setNovoAgendamento] = useState({
    nomeCliente: '',
    telefoneCliente: '',
    serviceId: '',
    professionalId: ''
  });

  const horariosDisponiveis = (() => {
    const h = [];
    let hora = 8;
    let minuto = 0;
    while (hora <= 23) {
      h.push(`${hora.toString().padStart(2,'0')}:${minuto.toString().padStart(2,'0')}`);
      minuto += 30;
      if (minuto === 60) { minuto = 0; hora++; }
    }
    return h;
  })();

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    carregarDados(user.tenant.id);
  }, []);

  // --- LÓGICA NOVA: PRE-SELECIONAR PROFISSIONAL LOGADO ---
  useEffect(() => {
    if (usuario && profissionais.length > 0) {
        // Verifica se o usuário logado existe na lista de profissionais carregada
        const souProfissional = profissionais.find(p => p.id === usuario.id);
        
        if (souProfissional) {
            setNovoAgendamento(prev => ({
                ...prev,
                professionalId: usuario.id
            }));
        }
    }
  }, [usuario, profissionais, modalAberto]); // Roda também ao abrir o modal para garantir
  // -------------------------------------------------------

  const carregarDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const [resServ, resProf, resAgenda, resCli] = await Promise.all([
        fetch(`${apiUrl}/services/tenant/${tenantId}`),
        fetch(`${apiUrl}/professionals/tenant/${tenantId}`),
        fetch(`${apiUrl}/appointments/tenant/${tenantId}`),
        fetch(`${apiUrl}/clients/tenant/${tenantId}`)
      ]);

      if (resServ.ok) setServicos(await resServ.json());
      if (resProf.ok) setProfissionais(await resProf.json());
      if (resCli.ok) setClientes(await resCli.json());
      
      if (resAgenda.ok) {
        const dados = await resAgenda.json();
        setAgendamentos(Array.isArray(dados) ? dados : []);
      }
    } catch (error) { console.error(error); } 
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
          dataHora: dataHoraCombinada.toISOString()
        })
      });

      if (res.ok) {
        alert('Agendamento realizado! 📅');
        
        // Limpa o formulário, mas mantém o profissional logado selecionado se aplicável
        const manterProfissional = profissionais.find(p => p.id === usuario.id);
        
        setNovoAgendamento({ 
            nomeCliente: '', 
            telefoneCliente: '', 
            serviceId: '', 
            professionalId: manterProfissional ? usuario.id : '' 
        });
        
        setDataSelecionada(''); setHorarioSelecionado('');
        setModalAberto(false);
        carregarDados(usuario.tenant.id);
      } else { 
        const erro = await res.json();
        alert(`Erro: ${erro.message}`);
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/appointments/${id}/cancel`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: usuario.nome }) 
      });
      carregarDados(usuario.tenant.id);
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNovoAgendamento(prev => ({ ...prev, nomeCliente: val }));
    const cli = clientes.find(c => c.nome === val);
    if (cli) setNovoAgendamento(prev => ({ ...prev, nomeCliente: val, telefoneCliente: cli.telefone }));
  };

  // Lógica de Agrupamento
  const getListaFiltrada = () => {
    return agendamentos.filter(a => {
        if (abaAtiva === 'proximos') return a.status === 'CONFIRMADO';
        else return a.status === 'CANCELADO' || a.status === 'CONCLUIDO';
    });
  };

  const agruparPorData = (lista: any[]) => {
    const grupos: any = {};
    lista.forEach(ag => {
        const dataKey = new Date(ag.dataHora).toDateString();
        if (!grupos[dataKey]) grupos[dataKey] = [];
        grupos[dataKey].push(ag);
    });
    return grupos;
  };

  const listaAgrupada = agruparPorData(getListaFiltrada());

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      
      {/* Cabeçalho Responsivo (Mobile / Desktop) */}
      <div className="bg-white shadow-sm sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
         <div className="flex items-center gap-4">
             {/* Botão Voltar */}
             <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                ← Voltar ao Painel
             </button>
             <h1 className="text-xl font-bold text-gray-800 hidden md:block">Agenda Inteligente</h1>
         </div>

         {/* Botão Desktop (Aparece só no PC) */}
         <button 
            onClick={() => setModalAberto(true)}
            className="hidden md:block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
         >
            + Novo Agendamento
         </button>

         {/* Título Mobile (Aparece só no Celular) */}
         <h1 className="text-lg font-bold text-gray-800 md:hidden">Agenda</h1>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        
        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm mb-8 border border-gray-200 max-w-md mx-auto md:mx-0">
            <button 
                onClick={() => setAbaAtiva('proximos')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${abaAtiva === 'proximos' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                📅 Próximos
            </button>
            <button 
                onClick={() => setAbaAtiva('historico')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${abaAtiva === 'historico' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                📜 Histórico
            </button>
        </div>

        {/* LISTA DE AGENDAMENTOS */}
        {loading ? <p className="text-center p-10 text-gray-500">Carregando agenda...</p> : (
            <div className="space-y-8">
                {Object.keys(listaAgrupada).length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-4xl mb-2">📅</p>
                        <p className="text-gray-500">Nenhum agendamento encontrado nesta aba.</p>
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
                                <span className="w-2 h-2 rounded-full bg-indigo-400"></span> {labelDia}
                            </h3>
                            
                            {/* Grid Responsivo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {listaAgrupada[dataKey].map((ag: any) => (
                                    <div key={ag.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-gray-800">
                                                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${ag.status === 'CONFIRMADO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {ag.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 font-medium mt-1 text-lg">{ag.cliente.nome}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                💅 {ag.servico.nome} 
                                                <span className="text-gray-300">|</span> 
                                                👤 {ag.profissional.nome.split(' ')[0]}
                                            </p>
                                            {ag.status === 'CANCELADO' && <p className="text-[10px] text-red-500 mt-1 font-bold">Cancelado por: {ag.canceladoPor}</p>}
                                        </div>
                                        
                                        {ag.status === 'CONFIRMADO' && (
                                            <button 
                                                onClick={() => handleCancel(ag.id)}
                                                className="bg-white border border-red-200 text-red-500 p-2 rounded-lg hover:bg-red-50 transition shadow-sm"
                                                title="Cancelar"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* BOTÃO FLUTUANTE (FAB) - APENAS MOBILE */}
      {abaAtiva === 'proximos' && (
          <button 
            onClick={() => setModalAberto(true)}
            className="md:hidden fixed bottom-20 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl hover:bg-indigo-700 transition-transform hover:scale-110 z-50"
          >
            +
          </button>
      )}

      {/* MODAL DE NOVO AGENDAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Novo Agendamento</h2>
                    <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                        <input list="lista-cli-modal" required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={novoAgendamento.nomeCliente} onChange={handleNomeChange} placeholder="Buscar nome..." />
                        <datalist id="lista-cli-modal">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label>
                        <input required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={novoAgendamento.telefoneCliente} onChange={e => setNovoAgendamento({...novoAgendamento, telefoneCliente: e.target.value})} placeholder="11999..." />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Serviço</label>
                            <select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none" value={novoAgendamento.serviceId} onChange={e => setNovoAgendamento({...novoAgendamento, serviceId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Profissional</label>
                            <select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none" value={novoAgendamento.professionalId} onChange={e => setNovoAgendamento({...novoAgendamento, professionalId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                            <input type="date" required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Hora</label>
                            <select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none" value={horarioSelecionado} onChange={e => setHorarioSelecionado(e.target.value)}>
                                <option value="">...</option>
                                {horariosDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg mt-4 transition-transform active:scale-95">
                        Confirmar Agendamento
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}