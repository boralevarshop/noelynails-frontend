'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  
  // Dados para o Dashboard
  const [todosAgendamentos, setTodosAgendamentos] = useState<any[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<any[]>([]);
  const [filtroId, setFiltroId] = useState('');
  const [stats, setStats] = useState({ hoje: 0, faturamento: 0 });
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA O MODAL DE AGENDAMENTO ---
  const [modalAberto, setModalAberto] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [novoAgendamento, setNovoAgendamento] = useState({
    nomeCliente: '',
    telefoneCliente: '',
    serviceId: '',
    professionalId: ''
  });
  // ------------------------------------------

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
    setFiltroId(user.id); 

    fetchDados(user.tenant.id);
    
    // Já carrega listas para o modal ficar rápido
    carregarListas(user.tenant.id);
  }, []);

  useEffect(() => {
    filtrarEstatistiscas();
  }, [filtroId, todosAgendamentos]);

  // Lógica de pré-seleção do profissional no modal
  useEffect(() => {
    if (usuario && usuario.role === 'PROFISSIONAL' && modalAberto) {
        setNovoAgendamento(prev => ({ ...prev, professionalId: usuario.id }));
    }
  }, [usuario, modalAberto]);

  const fetchDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const [resAgenda, resProf, resTenant] = await Promise.all([
        fetch(`${apiUrl}/appointments/tenant/${tenantId}`),
        fetch(`${apiUrl}/professionals/tenant/${tenantId}`),
        fetch(`${apiUrl}/tenants/${tenantId}`)
      ]);

      const dadosAgenda = await resAgenda.json();
      const dadosProf = await resProf.json();
      const dadosTenant = await resTenant.json();

      setTenant(dadosTenant);
      const ativos = dadosAgenda.filter((a: any) => a.status !== 'CANCELADO');
      setTodosAgendamentos(ativos);
      setProfissionais(dadosProf); // Também usada no filtro do dashboard

    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // Busca dados específicos para o Modal (Serviços e Clientes)
  const carregarListas = async (tenantId: string) => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const [resServ, resCli] = await Promise.all([
            fetch(`${apiUrl}/services/tenant/${tenantId}`),
            fetch(`${apiUrl}/clients/tenant/${tenantId}`)
        ]);
        if (resServ.ok) setServicos(await resServ.json());
        if (resCli.ok) setClientes(await resCli.json());
    } catch (e) { console.error(e); }
  };

  const filtrarEstatistiscas = () => {
    if (!filtroId) return;
    let lista = todosAgendamentos;
    if (filtroId !== 'todos') {
        lista = todosAgendamentos.filter(ag => ag.profissional.id === filtroId);
    }
    setAgendamentosFiltrados(lista);

    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = lista.filter((a: any) => a.dataHora.startsWith(hoje));
    const totalMes = lista.reduce((acc: number, curr: any) => acc + Number(curr.servico.preco), 0);

    setStats({ hoje: agendamentosHoje.length, faturamento: totalMes });

    const agrupado: any = {};
    todosAgendamentos.forEach((ag: any) => {
      const nome = ag.profissional.nome;
      if (!agrupado[nome]) agrupado[nome] = { qtd: 0, total: 0 };
      agrupado[nome].qtd += 1;
      agrupado[nome].total += Number(ag.servico.preco);
    });

    const rankingArray = Object.keys(agrupado).map(key => ({
      nome: key, ...agrupado[key]
    })).sort((a, b) => b.total - a.total);

    setRanking(rankingArray);
  };

  // --- FUNÇÕES DO MODAL ---
  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNovoAgendamento(prev => ({ ...prev, nomeCliente: val }));
    const cli = clientes.find(c => c.nome === val);
    if (cli) setNovoAgendamento(prev => ({ ...prev, nomeCliente: val, telefoneCliente: cli.telefone }));
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
        setNovoAgendamento({ 
            nomeCliente: '', telefoneCliente: '', serviceId: '', 
            professionalId: usuario.role === 'PROFISSIONAL' ? usuario.id : '' 
        });
        setDataSelecionada(''); setHorarioSelecionado('');
        setModalAberto(false);
        fetchDados(usuario.tenant.id); // Atualiza o dashboard
      } else { 
        const erro = await res.json();
        alert(`Erro: ${erro.message}`);
      }
    } catch (error) { alert('Erro de conexão'); }
  };
  // ------------------------

  const renderAgendaSemana = () => {
    const dias = [];
    const hoje = new Date();
    for (let i = 0; i < 5; i++) {
      const diaAtual = new Date(hoje);
      diaAtual.setDate(hoje.getDate() + i);
      const dataString = diaAtual.toLocaleDateString('pt-BR');
      const nomeDia = diaAtual.toLocaleDateString('pt-BR', { weekday: 'long' });
      const agendamentosDoDia = agendamentosFiltrados.filter((a: any) => {
        return new Date(a.dataHora).toLocaleDateString('pt-BR') === dataString;
      });

      dias.push(
        <div key={i} className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="font-bold text-gray-700 capitalize mb-2 border-b pb-2">
            {i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : nomeDia} <span className="text-xs text-gray-400 font-normal">({dataString.slice(0,5)})</span>
          </h3>
          {agendamentosDoDia.length === 0 ? <p className="text-xs text-gray-400 italic text-center py-4">Livre</p> : (
            <ul className="space-y-2">
              {agendamentosDoDia.map((ag: any) => (
                <li key={ag.id} className={`text-sm p-2 rounded border-l-2 ${ag.status === 'CONCLUIDO' ? 'bg-gray-100 border-gray-400 text-gray-500' : 'bg-indigo-50 border-indigo-500 text-indigo-700'}`}>
                  <strong className="block">{new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</strong>
                  <p className="truncate font-medium">{ag.cliente.nome}</p>
                  {filtroId === 'todos' && <p className="text-[10px] uppercase tracking-wide mt-1">{ag.profissional.nome}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    return dias;
  };

  if (!usuario) return <div className="p-10">Carregando...</div>;

  const isProfissional = usuario.role === 'PROFISSIONAL';
  const isDono = usuario.role === 'DONO_SALAO' || usuario.role === 'ADMIN_GLOBAL';
  let planoLabel = null;
  if (tenant) {
      if (tenant.statusAssinatura === 'TRIAL') {
          const dias = Math.ceil((new Date(tenant.trialFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          planoLabel = <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold border border-green-300 shadow-sm animate-pulse">💎 Teste: {dias} dias</span>;
      } else if (tenant.plano === 'FREE') {
          planoLabel = <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">Free</span>;
      } else {
          planoLabel = <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-bold">{tenant.plano}</span>;
      }
  }
  
  const linkPublico = usuario.tenant?.slug ? `agendar.devhenri.shop/${usuario.tenant.slug}` : '';

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-indigo-600 truncate max-w-[100px] md:max-w-none">{usuario.tenant.nome}</h1>
              <div className="hidden md:block">{planoLabel}</div>
              <div className="hidden md:flex space-x-1 ml-4">
                <button onClick={() => router.push('/dashboard/agendamentos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Agenda</button>
                <button onClick={() => router.push('/dashboard/calendario')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Calendário</button>
                <button onClick={() => router.push('/dashboard/servicos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Serviços</button>
                <button onClick={() => router.push('/dashboard/profissionais')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Equipe</button>
                <button onClick={() => router.push('/dashboard/clientes')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Clientes</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {usuario.role === 'ADMIN_GLOBAL' && <button onClick={() => router.push('/admin')} className="hidden md:block text-xs bg-gray-900 text-yellow-400 px-3 py-1.5 rounded font-bold border border-yellow-500/30 hover:bg-black shadow-sm">👑 ADMIN</button>}
              <button onClick={() => router.push('/dashboard/plano')} className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200">💎</button>
              <button onClick={() => router.push('/dashboard/perfil')} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 group"><div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 group-hover:bg-indigo-200">{usuario.nome.charAt(0).toUpperCase()}</div></button>
              <button onClick={() => { localStorage.removeItem('usuario_saas'); router.push('/login'); }} className="text-sm text-red-600 hover:text-red-800 font-semibold px-2">Sair</button>
            </div>
          </div>
        </div>
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-5 divide-x divide-gray-200">
            <button onClick={() => router.push('/dashboard/agendamentos')} className="py-3 text-[10px] font-medium text-indigo-600 hover:bg-gray-100 flex flex-col items-center"><span>📅</span> Agenda</button>
            <button onClick={() => router.push('/dashboard/calendario')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>🗓️</span> Mês</button>
            <button onClick={() => router.push('/dashboard/servicos')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>💅</span> Serv</button>
            <button onClick={() => router.push('/dashboard/profissionais')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>👥</span> Eqp</button>
            <button onClick={() => router.push('/dashboard/clientes')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>👩</span> Cli</button>
          </div>
          <div className="bg-white border-t border-gray-200 py-1 text-center">{planoLabel}</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Link Público */}
        {isDono && (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between text-white">
                <div className="mb-3 md:mb-0 text-center md:text-left">
                    <h3 className="font-bold text-lg">🚀 Divulgue seu Salão!</h3>
                    <p className="text-indigo-100 text-sm">Envie este link para seus clientes agendarem sozinhos.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-md border border-white/20 w-full md:w-auto justify-between md:justify-start">
                    <code className="text-xs md:text-sm font-mono truncate max-w-[200px] md:max-w-none">{linkPublico}</code>
                    <button onClick={() => navigator.clipboard.writeText(`https://${linkPublico}`).then(() => alert('Link copiado!'))} className="bg-white text-indigo-600 px-3 py-1 rounded text-xs font-bold hover:bg-indigo-50 transition shrink-0">Copiar</button>
                </div>
            </div>
        )}

        {/* Filtro e Botão de Agendamento (Lado a Lado) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">
                    {filtroId === 'todos' ? 'Visão Geral' : isProfissional ? 'Minha Agenda' : `Agenda de ${profissionais.find(p => p.id === filtroId)?.nome || '...'}`}
                </h2>
                <select value={filtroId} onChange={(e) => setFiltroId(e.target.value)} disabled={isProfissional} className={`border border-gray-300 rounded-md p-2 text-sm bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isProfissional ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}>
                    {!isProfissional && <option value="todos">👀 Ver Todos</option>}
                    {profissionais.map(prof => (<option key={prof.id} value={prof.id}>{prof.id === usuario.id ? '👤 Minha Agenda' : `👤 ${prof.nome}`}</option>))}
                </select>
            </div>

            {/* BOTÃO QUE ABRE O MODAL AQUI */}
            <button 
                onClick={() => setModalAberto(true)}
                className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                <span>+</span> Novo Agendamento
            </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">{filtroId === 'todos' ? 'Agendamentos Totais Hoje' : 'Meus Agendamentos Hoje'} ({stats.hoje})</dt>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min(stats.hoje * 10, 100)}%` }}></div></div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">{filtroId === 'todos' ? 'Faturamento Global (Mês)' : 'Minha Comissão Base (Mês)'}</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">R$ {stats.faturamento.toFixed(2)}</dd>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={isDono ? "lg:col-span-2" : "lg:col-span-3"}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Agenda da Semana</h2>
                {loading ? <p>Carregando...</p> : <div className={isDono ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"}>{renderAgendaSemana()}</div>}
            </div>
            {isDono && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Desempenho da Equipe</h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {ranking.map((prof, index) => (
                                <li key={index} className={`p-4 flex items-center justify-between ${prof.nome === usuario?.nome ? 'bg-indigo-50' : ''}`}>
                                    <div className="flex items-center"><span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">{prof.nome.charAt(0)}</span><div><p className="text-sm font-medium text-gray-900">{prof.nome}</p><p className="text-xs text-gray-500">{prof.qtd} agendamentos</p></div></div>
                                    <div className="text-sm font-bold text-green-600">R$ {prof.total.toFixed(2)}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>

        {/* MODAL DE NOVO AGENDAMENTO (COPIADO DA OUTRA PÁGINA) */}
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
                            <input list="lista-cli-modal" required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none" value={novoAgendamento.nomeCliente} onChange={handleNomeChange} placeholder="Buscar nome..." />
                            <datalist id="lista-cli-modal">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label>
                            <input required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none" value={novoAgendamento.telefoneCliente} onChange={e => setNovoAgendamento({...novoAgendamento, telefoneCliente: e.target.value})} placeholder="11999..." />
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
                        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg mt-4">Confirmar Agendamento</button>
                    </form>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}