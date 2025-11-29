'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTheme } from '../../utils/theme';

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  
  // Estado do Tema
  const [tema, setTema] = useState(getTheme('SALAO_BELEZA'));
  
  // Dados
  const [todosAgendamentos, setTodosAgendamentos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<any[]>([]);
  const [filtroId, setFiltroId] = useState('');
  const [mostrarValores, setMostrarValores] = useState(false);

  const [loading, setLoading] = useState(true);
  
  // Estatísticas
  const [stats, setStats] = useState({ hoje: 0, faturamento: 0, faturamentoHoje: 0 });
  const [ranking, setRanking] = useState<any[]>([]);

  // Estados para o Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
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
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    setFiltroId(user.id); 

    fetchDados(user.tenant.id);
    carregarListas(user.tenant.id);
  }, []);

  useEffect(() => {
    filtrarEstatistiscas();
  }, [filtroId, todosAgendamentos]);

  useEffect(() => {
    if (modalAberto && usuario) {
        if (usuario.role === 'PROFISSIONAL') {
            setNovoAgendamento(prev => ({ ...prev, professionalId: usuario.id }));
        } else if (filtroId && filtroId !== 'todos') {
            setNovoAgendamento(prev => ({ ...prev, professionalId: filtroId }));
        } else {
            setNovoAgendamento(prev => ({ ...prev, professionalId: '' }));
        }
    }
  }, [modalAberto, usuario, filtroId]);

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
      setTema(getTheme(dadosTenant.segmento || 'SALAO_BELEZA'));
      
      const ativos = dadosAgenda.filter((a: any) => a.status !== 'CANCELADO');
      setTodosAgendamentos(ativos);
      setProfissionais(dadosProf);
    } catch (error) {
      console.error('Erro ao buscar dados', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    const agendamentosHojeQtd = lista.filter((a: any) => a.dataHora.startsWith(hoje)).length;
    
    const totalMes = lista.reduce((acc: number, curr: any) => acc + Number(curr.servico.preco), 0);

    const totalHoje = lista
        .filter((a: any) => a.dataHora.startsWith(hoje) && a.status === 'CONCLUIDO')
        .reduce((acc: number, curr: any) => acc + Number(curr.servico.preco), 0);

    setStats({ hoje: agendamentosHojeQtd, faturamento: totalMes, faturamentoHoje: totalHoje });

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
          dataHora: dataHoraCombinada.toISOString(),
          isInternal: true 
        })
      });

      if (res.ok) {
        alert('Agendamento realizado! ' + tema.icons.agenda);
        const manterProfissional = (usuario.role === 'PROFISSIONAL' || (filtroId && filtroId !== 'todos')) ? novoAgendamento.professionalId : '';
        setNovoAgendamento({ 
            nomeCliente: '', telefoneCliente: '', serviceId: '', 
            professionalId: manterProfissional 
        });
        setDataSelecionada(''); setHorarioSelecionado('');
        setModalAberto(false);
        fetchDados(usuario.tenant.id);
      } else { 
        const erro = await res.json();
        alert(`Erro: ${erro.message}`);
      }
    } catch (error) { alert('Erro de conexão'); }
  };

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
        <div key={i} className="p-4 rounded-lg shadow border" style={{ backgroundColor: corTerciaria, borderColor: '#E5E7EB' }}>
          <h3 className="font-bold text-gray-700 capitalize mb-2 border-b pb-2">
            {i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : nomeDia} <span className="text-xs text-gray-400 font-normal">({dataString.slice(0,5)})</span>
          </h3>
          {agendamentosDoDia.length === 0 ? <p className="text-xs text-gray-400 italic text-center py-4">Livre</p> : (
            <ul className="space-y-3">
              {agendamentosDoDia.map((ag: any) => {
                const telLimpo = ag.cliente.telefone ? ag.cliente.telefone.replace(/\D/g, '') : '';
                
                return (
                  <li key={ag.id} className="text-sm p-2 rounded border-l-4 bg-gray-50 shadow-sm" style={{ borderLeftColor: corPrincipal }}>
                    <strong className="block text-gray-800 text-xs mb-0.5">
                        {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </strong>
                    
                    <div className="flex items-center gap-1">
                        <span className="truncate font-bold text-gray-800 block">
                            {ag.cliente.nome}
                        </span>
                        {telLimpo && (
                            <a 
                                href={`https://wa.me/55${telLimpo}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="text-green-500 hover:text-green-600 transition-colors p-0.5"
                                title="Chamar no WhatsApp"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"> <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM8.003 14.527a6.56 6.56 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/> </svg>
                            </a>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 truncate mt-0.5">
                       {tema.icons.servico} {ag.servico.nome}
                    </p>

                    {filtroId === 'todos' && <p className="text-[10px] uppercase tracking-wide mt-1 text-gray-500">{ag.profissional.nome.split(' ')[0]}</p>}
                  </li>
                );
              })}
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
  
  // --- DEFINIÇÃO DAS 4 CORES ---
  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';
  const corTerciaria = tenant?.corTerciaria || '#FFFFFF';
  const corTexto = tenant?.corTexto || '#FFFFFF';

  let planoLabel = null;
  if (tenant) {
      if (tenant.statusAssinatura === 'TRIAL') {
          const dias = Math.ceil((new Date(tenant.trialFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          planoLabel = <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold border border-green-300 shadow-sm animate-pulse">💎 Teste: {dias} dias</span>;
      } else if (tenant.plano === 'FREE') {
          planoLabel = <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">Free</span>;
      } else {
          planoLabel = <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ backgroundColor: corPrincipal, color: corTexto }}>{tenant.plano}</span>;
      }
  }
  const linkPublico = usuario.tenant?.slug ? `agendar.devhenri.shop/${usuario.tenant.slug}` : '';

  const IconEyeOpen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  const IconEyeClosed = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: corFundo }}>
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold truncate max-w-[100px] md:max-w-none" style={{ color: corPrincipal }}>{usuario.tenant.nome}</h1>
              <div className="hidden md:block">{planoLabel}</div>
              <div className="hidden md:flex space-x-1 ml-4">
                <button onClick={() => router.push('/dashboard/agendamentos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">{tema.icons.agenda} Agenda</button>
                <button onClick={() => router.push('/dashboard/calendario')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Calendário</button>
                <button onClick={() => router.push('/dashboard/servicos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">{tema.icons.servico} Serviços</button>
                <button onClick={() => router.push('/dashboard/profissionais')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">{tema.icons.profissional} Equipe</button>
                <button onClick={() => router.push('/dashboard/clientes')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">{tema.icons.cliente} Clientes</button>
                <button onClick={() => router.push('/dashboard/bloqueios')} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium">Bloqueios</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {usuario.role === 'ADMIN_GLOBAL' && <button onClick={() => router.push('/admin')} className="hidden md:block text-xs bg-gray-900 text-yellow-400 px-3 py-1.5 rounded font-bold border border-yellow-500/30 hover:bg-black shadow-sm">👑 ADMIN</button>}
              <button onClick={() => router.push('/dashboard/plano')} className="flex items-center justify-center h-8 w-8 rounded-full border bg-white" style={{ color: corPrincipal, borderColor: corPrincipal }}>💎</button>
              
              <button 
                  onClick={() => router.push('/dashboard/perfil')} 
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
                  title="Meu Perfil"
                >
                  <div className="h-9 w-9 rounded-full overflow-hidden border-2 flex items-center justify-center bg-gray-100 shadow-sm" style={{ borderColor: corPrincipal }}>
                      {usuario.avatarUrl ? (
                          <img src={usuario.avatarUrl} alt={usuario.nome} className="h-full w-full object-cover" />
                      ) : (
                          <span className="text-xs font-bold" style={{ color: corPrincipal }}>
                              {usuario.nome.charAt(0).toUpperCase()}
                          </span>
                      )}
                  </div>
                  
                  <div className="hidden md:flex flex-col items-start text-sm">
                      <span className="font-bold text-gray-700 leading-tight">
                          {usuario.nome.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-gray-400 leading-tight uppercase font-semibold">
                          {usuario.role === 'DONO_SALAO' ? 'Dono' : 'Pro'}
                      </span>
                  </div>
              </button>

              <button onClick={() => { localStorage.removeItem('usuario_saas'); router.push('/login'); }} className="text-sm text-red-600 hover:text-red-800 font-semibold px-2">Sair</button>
            </div>
          </div>
        </div>
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-6 divide-x divide-gray-200">
            <button onClick={() => router.push('/dashboard/agendamentos')} className="py-3 text-[10px] font-medium hover:bg-gray-100 flex flex-col items-center" style={{ color: corPrincipal }}><span>{tema.icons.agenda}</span> Agenda</button>
            <button onClick={() => router.push('/dashboard/calendario')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>🗓️</span> Mês</button>
            <button onClick={() => router.push('/dashboard/servicos')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>{tema.icons.servico}</span> Serv</button>
            <button onClick={() => router.push('/dashboard/profissionais')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>{tema.icons.profissional}</span> Eqp</button>
            <button onClick={() => router.push('/dashboard/clientes')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>{tema.icons.cliente}</span> Cli</button>
            <button onClick={() => router.push('/dashboard/bloqueios')} className="py-3 text-[10px] font-medium text-red-600 hover:bg-red-50 flex flex-col items-center"><span>⛔</span> Bloq</button>
          </div>
          <div className="bg-white border-t border-gray-200 py-1 text-center">{planoLabel}</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">
                    {filtroId === 'todos' ? 'Visão Geral' : isProfissional ? `Minha Agenda` : `Agenda de ${profissionais.find(p => p.id === filtroId)?.nome || '...'}`}
                </h2>
                <select value={filtroId} onChange={(e) => setFiltroId(e.target.value)} disabled={isProfissional} className={`border border-gray-300 rounded-md p-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${isProfissional ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} style={{ borderColor: corPrincipal }}>
                    {!isProfissional && <option value="todos">👀 Ver Todos</option>}
                    {profissionais.map(prof => (<option key={prof.id} value={prof.id}>{prof.id === usuario.id ? '👤 Minha Agenda' : `👤 ${prof.nome}`}</option>))}
                </select>
            </div>

            <button onClick={() => setModalAberto(true)} className="w-full md:w-auto text-white px-6 py-2 rounded-lg font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: corPrincipal, color: corTexto }}>
                <span>+</span> {tema.labels.novoAgendamento}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="shadow rounded-lg p-5" style={{ backgroundColor: corTerciaria }}>
            <dt className="text-sm font-medium text-gray-500 truncate">{filtroId === 'todos' ? 'Agendamentos Totais Hoje' : 'Meus Agendamentos Hoje'} ({stats.hoje})</dt>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="h-2.5 rounded-full" style={{ width: `${Math.min(stats.hoje * 10, 100)}%`, backgroundColor: corPrincipal }}></div></div>
          </div>
          
          <div className="shadow rounded-lg p-5 relative" style={{ backgroundColor: corTerciaria }}>
            <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-gray-500 truncate">
                    {filtroId === 'todos' ? 'Faturamento Hoje' : 'Meu Faturamento Hoje'}
                </dt>
                <button onClick={() => setMostrarValores(!mostrarValores)} className="text-gray-400 hover:opacity-70 transition" style={{ color: corPrincipal }}>
                    {mostrarValores ? <IconEyeOpen /> : <IconEyeClosed />}
                </button>
            </div>
            {/* FATURAMENTO DE HOJE (GRANDE) */}
            <dd className="mt-1 text-3xl font-semibold text-green-600 flex items-center gap-2">
                {tema.icons.dinheiro} {mostrarValores ? `R$ ${stats.faturamentoHoje.toFixed(2)}` : 'R$ ••••'}
            </dd>
            
            {/* FATURAMENTO DO MÊS (PEQUENO) */}
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t flex justify-between">
                <span className="text-[10px] self-center opacity-70 uppercase font-bold">Acumulado Mês:</span>
                <span className="font-bold text-gray-700">
                    {mostrarValores ? `R$ ${stats.faturamento.toFixed(2)}` : 'R$ •••'}
                </span>
            </div>
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
                    <div className="shadow rounded-lg overflow-hidden" style={{ backgroundColor: corTerciaria }}>
                        <ul className="divide-y divide-gray-200">
                            {ranking.map((prof, index) => (
                                <li key={index} className={`p-4 flex items-center justify-between ${prof.nome === usuario?.nome ? 'bg-gray-50' : ''}`}>
                                    <div className="flex items-center"><span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold mr-3" style={{ color: corPrincipal }}>{prof.nome.charAt(0)}</span><div><p className="text-sm font-medium text-gray-900">{prof.nome}</p><p className="text-xs text-gray-500">{prof.qtd} agendamentos</p></div></div>
                                    <div className="text-sm font-bold text-green-600">{mostrarValores ? `R$ ${prof.total.toFixed(2)}` : 'R$ ••••'}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>

        {isDono && (
            <div className="mt-10 rounded-lg shadow-lg p-4 flex flex-col md:flex-row items-center justify-between text-white order-last md:order-first" style={{ backgroundColor: corPrincipal }}>
                <div className="mb-3 md:mb-0 text-center md:text-left">
                    <h3 className="font-bold text-lg" style={{ color: corTexto }}>🚀 Divulgue seu Espaço!</h3>
                    <p className="text-white/80 text-sm" style={{ color: corTexto }}>Envie este link para seus {tema.labels.cliente.toLowerCase()}s agendarem sozinhos.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-md border border-white/20 w-full md:w-auto justify-between md:justify-start">
                    <code className="text-xs md:text-sm font-mono truncate max-w-[200px] md:max-w-none" style={{ color: corTexto }}>{linkPublico}</code>
                    <button onClick={() => navigator.clipboard.writeText(`https://${linkPublico}`).then(() => alert('Link copiado!'))} className="bg-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 transition shrink-0" style={{ color: corPrincipal }}>Copiar</button>
                </div>
            </div>
        )}

        {/* Modal */}
        {modalAberto && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800" style={{ color: corPrincipal }}>{tema.labels.novoAgendamento}</h2>
                        <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">{tema.labels.cliente}</label>
                            <input list="lista-cli-modal" required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.nomeCliente} onChange={handleNomeChange} placeholder="Buscar nome..." />
                            <datalist id="lista-cli-modal">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label>
                            <input required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.telefoneCliente} onChange={e => setNovoAgendamento({...novoAgendamento, telefoneCliente: e.target.value})} placeholder="11999..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{tema.labels.servico}</label>
                                <select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.serviceId} onChange={e => setNovoAgendamento({...novoAgendamento, serviceId: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{tema.labels.profissional}</label>
                                <select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.professionalId} onChange={e => setNovoAgendamento({...novoAgendamento, professionalId: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                                <input type="date" required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Hora</label>
                                <select required className="w-full mt-1 border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={horarioSelecionado} onChange={e => setHorarioSelecionado(e.target.value)}>
                                    <option value="">...</option>
                                    {horariosDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4 transition-transform active:scale-95" style={{ backgroundColor: corPrincipal, color: corTexto }}>
                            Confirmar {tema.icons.agenda}
                        </button>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}