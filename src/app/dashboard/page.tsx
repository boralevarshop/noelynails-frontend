'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  
  // Dados
  const [todosAgendamentos, setTodosAgendamentos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  
  // Filtros
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<any[]>([]);
  const [filtroId, setFiltroId] = useState('');

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    hoje: 0,
    faturamento: 0
  });

  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    // Visão Inicial
    setFiltroId(user.id); 

    fetchDados(user.tenant.id);
  }, []);

  useEffect(() => {
    filtrarEstatistiscas();
  }, [filtroId, todosAgendamentos]);

  const fetchDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const [resAgenda, resProf] = await Promise.all([
        fetch(`${apiUrl}/appointments/tenant/${tenantId}`),
        fetch(`${apiUrl}/professionals/tenant/${tenantId}`)
      ]);

      const dadosAgenda = await resAgenda.json();
      const dadosProf = await resProf.json();
      
      const ativos = dadosAgenda.filter((a: any) => a.status !== 'CANCELADO');
      
      setTodosAgendamentos(ativos);
      setProfissionais(dadosProf);

    } catch (error) {
      console.error('Erro ao buscar dados', error);
    } finally {
      setLoading(false);
    }
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
    
    const totalMes = lista.reduce((acc: number, curr: any) => {
      return acc + Number(curr.servico.preco);
    }, 0);

    setStats({
      hoje: agendamentosHoje.length,
      faturamento: totalMes
    });

    // Ranking (Sempre calculado com base em todos para o dono)
    const agrupado: any = {};
    todosAgendamentos.forEach((ag: any) => {
      const nome = ag.profissional.nome;
      if (!agrupado[nome]) {
          agrupado[nome] = { qtd: 0, total: 0 };
      }
      agrupado[nome].qtd += 1;
      agrupado[nome].total += Number(ag.servico.preco);
    });

    const rankingArray = Object.keys(agrupado).map(key => ({
      nome: key,
      ...agrupado[key]
    })).sort((a, b) => b.total - a.total);

    setRanking(rankingArray);
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
        const dataAgendamento = new Date(a.dataHora).toLocaleDateString('pt-BR');
        return dataAgendamento === dataString;
      });

      dias.push(
        <div key={i} className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="font-bold text-gray-700 capitalize mb-2 border-b pb-2">
            {i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : nomeDia} <span className="text-xs text-gray-400 font-normal">({dataString.slice(0,5)})</span>
          </h3>
          
          {agendamentosDoDia.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">Livre</p>
          ) : (
            <ul className="space-y-2">
              {agendamentosDoDia.map((ag: any) => (
                <li key={ag.id} className={`text-sm p-2 rounded border-l-2 ${ag.status === 'CONCLUIDO' ? 'bg-gray-100 border-gray-400 text-gray-500' : 'bg-indigo-50 border-indigo-500 text-indigo-700'}`}>
                  <strong className="block">
                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </strong>
                  <p className="truncate font-medium">{ag.cliente.nome}</p>
                  {filtroId === 'todos' && (
                      <p className="text-[10px] uppercase tracking-wide mt-1">{ag.profissional.nome}</p>
                  )}
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

  // --- NOVO: Link de Agendamento Público ---
  const linkPublico = `agendar.devhenri.shop/${usuario.tenant.slug}`;
  // -----------------------------------------

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra Superior */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-indigo-600 truncate max-w-[120px] md:max-w-none">
                {usuario.tenant.nome}
              </h1>
              
              {/* MENU DESKTOP */}
              <div className="hidden md:flex space-x-1 ml-4">
                <button onClick={() => router.push('/dashboard/agendamentos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Agenda</button>
                <button onClick={() => router.push('/dashboard/calendario')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Calendário</button>
                <button onClick={() => router.push('/dashboard/servicos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Serviços</button>
                <button onClick={() => router.push('/dashboard/profissionais')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Equipe</button>
                <button onClick={() => router.push('/dashboard/clientes')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Clientes</button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botão Admin */}
              {usuario.role === 'ADMIN_GLOBAL' && (
                <button onClick={() => router.push('/admin')} className="hidden md:block text-xs bg-gray-900 text-yellow-400 px-3 py-1.5 rounded font-bold border border-yellow-500/30 hover:bg-black transition-colors shadow-sm">👑 ADMIN</button>
              )}
              <button onClick={() => router.push('/dashboard/plano')} className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200">💎</button>
              <button onClick={() => router.push('/dashboard/perfil')} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors group">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 group-hover:bg-indigo-200">
                    {usuario.nome.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden md:block">Olá, {usuario.nome.split(' ')[0]}</span>
              </button>
              <button onClick={() => { localStorage.removeItem('usuario_saas'); router.push('/login'); }} className="text-sm text-red-600 hover:text-red-800 font-semibold border border-red-200 px-3 py-1 rounded hover:bg-red-50">Sair</button>
            </div>
          </div>
        </div>
        {/* Menu Mobile */}
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-5 divide-x divide-gray-200">
            <button onClick={() => router.push('/dashboard/agendamentos')} className="py-3 text-[10px] font-medium text-indigo-600 hover:bg-gray-100 flex flex-col items-center"><span>📅</span> Agenda</button>
            <button onClick={() => router.push('/dashboard/calendario')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>🗓️</span> Mês</button>
            <button onClick={() => router.push('/dashboard/servicos')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>💅</span> Serv</button>
            <button onClick={() => router.push('/dashboard/profissionais')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>👥</span> Eqp</button>
            <button onClick={() => router.push('/dashboard/clientes')} className="py-3 text-[10px] font-medium text-gray-600 hover:bg-gray-100 flex flex-col items-center"><span>👩</span> Cli</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* --- NOVO: CARD DE DIVULGAÇÃO (LINK PÚBLICO) --- */}
        {/* Só aparece para Dono ou Admin */}
        {isDono && (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between text-white">
                <div className="mb-3 md:mb-0 text-center md:text-left">
                    <h3 className="font-bold text-lg">🚀 Divulgue seu Salão!</h3>
                    <p className="text-indigo-100 text-sm">Envie este link para seus clientes agendarem sozinhos.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-md border border-white/20 w-full md:w-auto justify-between md:justify-start">
                    <code className="text-xs md:text-sm font-mono truncate max-w-[200px] md:max-w-none">{linkPublico}</code>
                    <button 
                        onClick={() => navigator.clipboard.writeText(`https://${linkPublico}`).then(() => alert('Link copiado!'))}
                        className="bg-white text-indigo-600 px-3 py-1 rounded text-xs font-bold hover:bg-indigo-50 transition shrink-0"
                    >
                        Copiar
                    </button>
                </div>
            </div>
        )}
        {/* ----------------------------------------------- */}

        {/* --- SELETOR DE VISÃO (FILTRO INTELIGENTE) --- */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">
                {filtroId === 'todos' ? 'Visão Geral' : isProfissional ? 'Minha Agenda' : `Agenda de ${profissionais.find(p => p.id === filtroId)?.nome || '...'}`}
            </h2>
            
            <select 
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
                disabled={isProfissional}
                className={`border border-gray-300 rounded-md p-2 text-sm bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isProfissional ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
            >
                {!isProfissional && <option value="todos">👀 Ver Todos</option>}
                {profissionais.map(prof => (
                    <option key={prof.id} value={prof.id}>
                        {prof.id === usuario.id ? '👤 Minha Agenda' : `👤 ${prof.nome}`}
                    </option>
                ))}
            </select>
        </div>

        {/* Cards Globais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">
                {filtroId === 'todos' ? 'Agendamentos Totais Hoje' : 'Meus Agendamentos Hoje'}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.hoje}</dd>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">
                {filtroId === 'todos' ? 'Faturamento Global (Mês)' : 'Minha Comissão Base (Mês)'}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              R$ {stats.faturamento.toFixed(2)}
            </dd>
          </div>

          <div className="bg-indigo-600 overflow-hidden shadow rounded-lg p-5 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => router.push('/dashboard/agendamentos')}>
            <span className="text-white font-bold text-lg">+ Novo Agendamento</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna Esquerda: Agenda da Semana */}
            <div className={isDono ? "lg:col-span-2" : "lg:col-span-3"}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                   Agenda da Semana
                </h2>
                {loading ? <p>Carregando...</p> : (
                    <div className={isDono ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"}>
                        {renderAgendaSemana()}
                    </div>
                )}
            </div>

            {/* Coluna Direita: Ranking (SÓ APARECE PARA O DONO) */}
            {isDono && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Desempenho da Equipe</h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {ranking.map((prof, index) => (
                                <li key={index} className={`p-4 flex items-center justify-between ${prof.nome === usuario?.nome ? 'bg-indigo-50' : ''}`}>
                                    <div className="flex items-center">
                                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                            {prof.nome.charAt(0)}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {prof.nome} {prof.nome === usuario?.nome && '(Você)'}
                                            </p>
                                            <p className="text-xs text-gray-500">{prof.qtd} agendamentos</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-green-600">R$ {prof.total.toFixed(2)}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>

      </main>
    </div>
  );
}