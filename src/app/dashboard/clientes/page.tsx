'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTheme } from '../../../utils/theme';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [tema, setTema] = useState(getTheme('SALAO_BELEZA'));

  // Estado para Edição
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' });

  // Estado para Histórico
  const [clienteHistorico, setClienteHistorico] = useState<any>(null); 
  
  // Filtros do Histórico
  const [buscaServicoHist, setBuscaServicoHist] = useState('');
  const [buscaDataHist, setBuscaDataHist] = useState('');
  const [statusFiltroHist, setStatusFiltroHist] = useState('TODOS'); // NOVO: Filtro de Status

  // Filtro da Lista Principal
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    carregarClientes(user.tenant.id);
  }, []);

  const carregarClientes = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const [resCli, resTenant] = await Promise.all([
        fetch(`${apiUrl}/clients/tenant/${tenantId}`),
        fetch(`${apiUrl}/tenants/${tenantId}`)
      ]);

      if (resCli.ok) setClientes(await resCli.json());
      if (resTenant.ok) {
          const dadosTenant = await resTenant.json();
          setTenant(dadosTenant);
          setTema(getTheme(dadosTenant.segmento || 'SALAO_BELEZA'));
      }

    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const iniciarEdicao = (cliente: any) => {
    setEditando(cliente);
    setForm({ 
        nome: cliente.nome, 
        telefone: cliente.telefone, 
        email: cliente.email || '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setForm({ nome: '', telefone: '', email: '' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/clients/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantId: usuario.tenant.id })
      });

      if (res.ok) {
        alert('Cliente atualizado com sucesso!');
        cancelarEdicao();
        carregarClientes(usuario.tenant.id);
      } else {
        const erro = await res.json();
        alert(erro.message || 'Erro ao atualizar');
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ATENÇÃO: Tem certeza? Isso apagará o histórico de agendamentos deste cliente também.')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/clients/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        alert('Cliente removido.');
        setClientes(clientes.filter(c => c.id !== id));
      } else {
        const erro = await res.json();
        alert(erro.message || 'Não foi possível excluir.');
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  // --- FUNÇÃO AUXILIAR: Remover acentos para busca ---
  const normalizarTexto = (texto: string) => {
      return texto ? texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  // Filtro da lista principal (Busca inteligente)
  const clientesFiltrados = clientes.filter(cli => 
    normalizarTexto(cli.nome).includes(normalizarTexto(busca)) || 
    cli.telefone.includes(busca)
  );

  // Filtro do Modal de Histórico
  const getHistoricoFiltrado = () => {
      if (!clienteHistorico || !clienteHistorico.agendamentos) return [];

      return clienteHistorico.agendamentos.filter((ag: any) => {
          // Regra 1: Filtro de Status (Dropdown)
          if (statusFiltroHist !== 'TODOS' && ag.status !== statusFiltroHist) return false;

          // Regra 2: Filtro por Nome do Serviço (Sem acento)
          if (buscaServicoHist && !normalizarTexto(ag.servico.nome).includes(normalizarTexto(buscaServicoHist))) return false;

          // Regra 3: Filtro por Data
          if (buscaDataHist && !ag.dataHora.startsWith(buscaDataHist)) return false;

          return true;
      });
  };

  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Clientes</h1>
          
          {/* BOTÃO VOLTAR PERSONALIZADO */}
          <button 
            onClick={() => router.push('/dashboard')} 
            className="px-4 py-2 rounded-lg font-bold border-2 transition-colors shadow-sm hover:opacity-90"
            style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff" }}
          >
            ← Voltar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Formulário de Edição */}
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4" style={{ color: corPrincipal }}>
                {editando ? 'Editar Cliente' : 'Gerenciar Clientes'}
            </h2>
            
            {!editando ? (
                <p className="text-gray-500 text-sm">
                    Selecione um cliente na lista ao lado para editar seus dados ou ver o histórico completo.
                </p>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                        <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                    </div>
                    
                    <div className="flex gap-2">
                        <button type="submit" className="w-full text-white py-2 px-4 rounded hover:opacity-90 transition-opacity" style={{ backgroundColor: corPrincipal }}>Salvar</button>
                        <button type="button" onClick={cancelarEdicao} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">Cancelar</button>
                    </div>
                </form>
            )}
          </div>

          {/* Lista de Clientes */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-semibold">Carteira ({clientes.length})</h2>
                <input 
                    type="text" 
                    placeholder="🔍 Buscar..." 
                    className="border rounded-lg px-3 py-1.5 text-sm w-full max-w-xs outline-none focus:ring-2"
                    style={{ '--tw-ring-color': corPrincipal } as any}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            {loading ? <p>Carregando...</p> : clientesFiltrados.length === 0 ? <p className="text-gray-500 text-center py-10 bg-white rounded-lg border border-dashed">Nenhum cliente encontrado.</p> : (
              <ul className="space-y-3">
                {clientesFiltrados.map((cli) => {
                    const telLimpo = cli.telefone.replace(/\D/g, '');
                    
                    // Filtra apenas os CONCLUÍDOS para mostrar a última visita
                    const historicoConcluido = cli.agendamentos?.filter((a: any) => a.status === 'CONCLUIDO') || [];
                    const ultimoAgendamento = historicoConcluido[0]; // O primeiro é o mais recente (vem do backend desc)

                    return (
                      <li 
                        key={cli.id} 
                        className="bg-white p-4 rounded-lg shadow flex justify-between items-center border-l-4 hover:shadow-md transition-shadow"
                        style={{ 
                            borderLeftColor: editando?.id === cli.id ? corPrincipal : 'transparent',
                            borderLeftWidth: editando?.id === cli.id ? '4px' : '0' 
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-800 text-lg">{cli.nome}</h3>
                              
                              {/* ÍCONE WHATSAPP */}
                              {telLimpo && (
                                <a href={`https://wa.me/55${telLimpo}`} target="_blank" className="text-green-500 hover:scale-110 transition-transform" title="WhatsApp">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM8.003 14.527a6.56 6.56 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                                </a>
                              )}

                              {/* ÍCONE HISTÓRICO */}
                              <button 
                                onClick={() => {
                                    setClienteHistorico(cli);
                                    setBuscaServicoHist('');
                                    setBuscaDataHist('');
                                    setStatusFiltroHist('TODOS'); // Reseta filtro
                                }} 
                                className="text-gray-400 hover:text-indigo-600 hover:scale-110 transition-transform" 
                                title="Ver Histórico Completo"
                              >
                                  📋
                              </button>
                          </div>

                          <p className="text-sm text-gray-500">{cli.telefone}</p>
                          
                          {/* ÚLTIMA VISITA */}
                          {ultimoAgendamento ? (
                              <p className="text-[10px] text-gray-500 mt-1">
                                  <strong className="text-gray-800">Última visita:</strong> {format(new Date(ultimoAgendamento.dataHora), 'dd/MM/yy')} ({ultimoAgendamento.servico.nome})
                              </p>
                          ) : (
                              <p className="text-[10px] text-gray-300 mt-1 italic">Nunca concluiu um agendamento</p>
                          )}
                        </div>
                        
                        {/* BOTÕES DE AÇÃO MELHORADOS */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => iniciarEdicao(cli)} 
                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-colors hover:bg-opacity-10"
                                style={{ borderColor: corPrincipal, color: corPrincipal }}
                            >
                                ✏️ Editar
                            </button>
                            
                            <button 
                                onClick={() => handleDelete(cli.id)} 
                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                                🗑️ Excluir
                            </button>
                        </div>
                      </li>
                    );
                })}
              </ul>
            )}
          </div>

        </div>

        {/* MODAL DE HISTÓRICO COM FILTROS */}
        {clienteHistorico && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
                    
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{clienteHistorico.nome}</h3>
                            <p className="text-xs text-gray-500">Histórico de Atendimentos</p>
                        </div>
                        <button onClick={() => setClienteHistorico(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                    </div>

                    {/* Filtros do Histórico */}
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex gap-2">
                            <select 
                                className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 w-1/3 bg-white"
                                value={statusFiltroHist}
                                onChange={(e) => setStatusFiltroHist(e.target.value)}
                            >
                                <option value="TODOS">Todos</option>
                                <option value="CONCLUIDO">✅ Concluídos</option>
                                <option value="CONFIRMADO">📅 Confirmados</option>
                                <option value="PENDENTE">⏳ Pendentes</option>
                                <option value="CANCELADO">❌ Cancelados</option>
                            </select>
                            <input 
                                type="text" 
                                placeholder="Filtrar serviço..." 
                                className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:ring-1"
                                style={{ '--tw-ring-color': corPrincipal } as any}
                                value={buscaServicoHist}
                                onChange={(e) => setBuscaServicoHist(e.target.value)}
                            />
                        </div>
                        <input 
                            type="date" 
                            className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1"
                            style={{ '--tw-ring-color': corPrincipal } as any}
                            value={buscaDataHist}
                            onChange={(e) => setBuscaDataHist(e.target.value)}
                        />
                    </div>

                    {/* Lista Filtrada */}
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                        {getHistoricoFiltrado().length > 0 ? (
                            getHistoricoFiltrado().map((ag: any) => {
                                let corBadge = 'bg-gray-200 text-gray-600';
                                if (ag.status === 'CONCLUIDO') corBadge = 'bg-green-100 text-green-700';
                                if (ag.status === 'CONFIRMADO') corBadge = 'bg-blue-100 text-blue-700';
                                if (ag.status === 'CANCELADO') corBadge = 'bg-red-100 text-red-700';
                                if (ag.status === 'PENDENTE') corBadge = 'bg-yellow-100 text-yellow-700';

                                return (
                                    <div key={ag.id} className="bg-gray-50 p-3 rounded border flex justify-between items-center hover:bg-white hover:shadow-sm transition-all">
                                        <div>
                                            <p className="font-bold text-gray-700 text-sm">
                                                {tema.icons.servico} {ag.servico.nome}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {tema.icons.profissional} {ag.profissional.nome}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800 text-sm">
                                                {format(new Date(ag.dataHora), 'dd/MM/yy')}
                                            </p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${corBadge}`}>
                                                {ag.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-2xl mb-2">📭</p>
                                <p className="text-sm">Nenhum agendamento encontrado com esses filtros.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}