'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    hoje: 0,
    faturamento: 0
  });

  // Estado para o ranking
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    fetchDados(user.tenant.id);
  }, []);

  const fetchDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/appointments/tenant/${tenantId}`);
      const data = await res.json();
      
      // Filtra ativos
      const ativos = data.filter((a: any) => a.status !== 'CANCELADO');
      setAgendamentos(ativos);

      // 1. Estatísticas Globais
      const hoje = new Date().toISOString().split('T')[0];
      const agendamentosHoje = ativos.filter((a: any) => a.dataHora.startsWith(hoje));
      
      const totalMes = ativos.reduce((acc: number, curr: any) => {
        return acc + Number(curr.servico.preco);
      }, 0);

      setStats({
        hoje: agendamentosHoje.length,
        faturamento: totalMes
      });

      // 2. Cálculo por Profissional (Ranking)
      const agrupado: any = {};
      ativos.forEach((ag: any) => {
        const nome = ag.profissional.nome;
        if (!agrupado[nome]) {
            agrupado[nome] = { qtd: 0, total: 0 };
        }
        agrupado[nome].qtd += 1;
        agrupado[nome].total += Number(ag.servico.preco);
      });

      // Transforma em array e ordena por faturamento
      const rankingArray = Object.keys(agrupado).map(key => ({
        nome: key,
        ...agrupado[key]
      })).sort((a, b) => b.total - a.total);

      setRanking(rankingArray);

    } catch (error) {
      console.error('Erro ao buscar dados', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAgendaSemana = () => {
    const dias = [];
    const hoje = new Date();

    for (let i = 0; i < 5; i++) {
      const diaAtual = new Date(hoje);
      diaAtual.setDate(hoje.getDate() + i);
      
      const dataString = diaAtual.toLocaleDateString('pt-BR');
      const nomeDia = diaAtual.toLocaleDateString('pt-BR', { weekday: 'long' });
      
      const agendamentosDoDia = agendamentos.filter((a: any) => {
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
                <li key={ag.id} className="text-sm bg-indigo-50 p-2 rounded border-l-2 border-indigo-500">
                  <strong className="text-indigo-700">
                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </strong>
                  <p className="truncate text-gray-600">{ag.cliente.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{ag.profissional.nome}</p>
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra Superior */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-indigo-600">
                {usuario.tenant.nome}
              </h1>
              <div className="hidden md:flex space-x-2 ml-8">
                <button onClick={() => router.push('/dashboard/agendamentos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Agenda</button>
                <button onClick={() => router.push('/dashboard/servicos')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Serviços</button>
                <button onClick={() => router.push('/dashboard/profissionais')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Equipe</button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4 text-sm truncate max-w-[100px] md:max-w-none">{usuario.nome}</span>
              <button onClick={() => { localStorage.removeItem('usuario_saas'); router.push('/login'); }} className="text-sm text-red-600 hover:text-red-800 font-semibold">
                Sair
              </button>
            </div>
          </div>
        </div>
        {/* Menu Mobile */}
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <button onClick={() => router.push('/dashboard/agendamentos')} className="py-3 text-sm font-medium text-indigo-600 hover:bg-gray-100">📅 Agenda</button>
            <button onClick={() => router.push('/dashboard/servicos')} className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-100">💅 Serviços</button>
            <button onClick={() => router.push('/dashboard/profissionais')} className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-100">👥 Equipe</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Cards Globais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Agendamentos Hoje</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.hoje}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Faturamento Estimado (Mês)</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">R$ {stats.faturamento.toFixed(2)}</dd>
          </div>
          <div className="bg-indigo-600 overflow-hidden shadow rounded-lg p-5 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => router.push('/dashboard/agendamentos')}>
            <span className="text-white font-bold text-lg">+ Novo Agendamento</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna Esquerda: Agenda da Semana */}
            <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Visão da Semana</h2>
                {loading ? <p>Carregando...</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderAgendaSemana()}
                    </div>
                )}
            </div>

            {/* Coluna Direita: Ranking da Equipe (NOVO) */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Desempenho da Equipe</h2>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {ranking.map((prof, index) => (
                            <li key={index} className="p-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                        {prof.nome.charAt(0)}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{prof.nome}</p>
                                        <p className="text-xs text-gray-500">{prof.qtd} agendamentos</p>
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-green-600">
                                    R$ {prof.total.toFixed(2)}
                                </div>
                            </li>
                        ))}
                        {ranking.length === 0 && (
                            <p className="p-4 text-sm text-gray-500 text-center">Sem dados ainda.</p>
                        )}
                    </ul>
                </div>
            </div>

        </div>

      </main>
    </div>
  );
}