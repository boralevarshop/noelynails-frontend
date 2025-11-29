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

  // Estado para Busca
  const [busca, setBusca] = useState('');

  // Estado para Modal de Cadastro/Edição
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<any>(null); // Se null = Criar, Se objeto = Editar
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' });

  // Estado para Modal de Histórico
  const [clienteHistorico, setClienteHistorico] = useState<any>(null);
  const [buscaServicoHist, setBuscaServicoHist] = useState('');
  const [buscaDataHist, setBuscaDataHist] = useState('');
  const [statusFiltroHist, setStatusFiltroHist] = useState('TODOS');

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

  // --- FUNÇÕES DO FORMULÁRIO (CRIAR E EDITAR) ---
  const abrirModalCriacao = () => {
      setClienteEmEdicao(null); // Modo Criação
      setForm({ nome: '', telefone: '', email: '' });
      setModalFormAberto(true);
  };

  const abrirModalEdicao = (cliente: any) => {
      setClienteEmEdicao(cliente); // Modo Edição
      setForm({ 
          nome: cliente.nome, 
          telefone: cliente.telefone, 
          email: cliente.email || '' 
      });
      setModalFormAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
        let res;
        if (clienteEmEdicao) {
            // --- MODO EDIÇÃO ---
            res = await fetch(`${apiUrl}/clients/${clienteEmEdicao.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, tenantId: usuario.tenant.id })
            });
        } else {
            // --- MODO CRIAÇÃO ---
            res = await fetch(`${apiUrl}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, tenantId: usuario.tenant.id })
            });
        }

        // LÓGICA DE RESPOSTA MELHORADA
        if (res.ok) {
            alert(clienteEmEdicao ? 'Editado com sucesso! ✅' : 'Cliente cadastrado com sucesso! 🎉');
            setModalFormAberto(false);
            carregarClientes(usuario.tenant.id);
        } else {
            // Lê a mensagem de erro específica do backend (Ex: "Telefone já existe")
            const erro = await res.json();
            alert(`❌ Erro: ${erro.message}`);
        }

    } catch (error) { alert('❌ Erro de conexão.'); }
  };
  // ----------------------------------------------

  const handleDelete = async (id: string) => {
    if (!confirm('ATENÇÃO: Tem certeza? Isso apagará o histórico deste cliente.')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/clients/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        alert('Cliente removido.');
        setClientes(clientes.filter(c => c.id !== id));
      } else {
        const erro = await res.json();
        alert(erro.message || 'Erro ao excluir.');
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  const normalizarTexto = (texto: string) => {
      return texto ? texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  const clientesFiltrados = clientes.filter(cli => 
    normalizarTexto(cli.nome).includes(normalizarTexto(busca)) || 
    cli.telefone.includes(busca)
  );

  const getHistoricoFiltrado = () => {
      if (!clienteHistorico || !clienteHistorico.agendamentos) return [];
      return clienteHistorico.agendamentos.filter((ag: any) => {
          if (statusFiltroHist !== 'TODOS' && ag.status !== statusFiltroHist) return false;
          if (buscaServicoHist && !normalizarTexto(ag.servico.nome).includes(normalizarTexto(buscaServicoHist))) return false;
          if (buscaDataHist && !ag.dataHora.startsWith(buscaDataHist)) return false;
          return true;
      });
  };

  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER: TÍTULO E BOTÕES */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                 {/* Botão Voltar */}
                <button 
                    onClick={() => router.push('/dashboard')} 
                    className="px-4 py-2 rounded-lg font-bold border-2 transition-colors shadow-sm hover:opacity-90 text-sm"
                    style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff" }}
                >
                    ← Voltar
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Meus Clientes</h1>
            </div>

            {/* BOTÃO NOVO CLIENTE */}
            <button 
                onClick={abrirModalCriacao}
                className="w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white shadow-md transition-transform hover:scale-105 flex items-center justify-center gap-2"
                style={{ backgroundColor: corPrincipal }}
            >
                <span>+</span> Novo Cliente
            </button>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-2 border border-gray-200">
            <span className="text-2xl">🔍</span>
            <input 
                type="text" 
                placeholder="Buscar por nome ou telefone..." 
                className="w-full outline-none text-gray-700"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
            />
        </div>

        {/* LISTA DE CLIENTES */}
        {loading ? <p className="text-center p-10 text-gray-500">Carregando...</p> : clientesFiltrados.length === 0 ? <p className="text-gray-500 text-center py-10 bg-white rounded-lg border border-dashed">Nenhum cliente encontrado.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientesFiltrados.map((cli) => {
                const telLimpo = cli.telefone.replace(/\D/g, '');
                const historicoConcluido = cli.agendamentos?.filter((a: any) => a.status === 'CONCLUIDO') || [];
                const ultimoAgendamento = historicoConcluido[0]; 

                return (
                    <div key={cli.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex justify-between items-center">
                        
                        {/* INFO DO CLIENTE */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800 text-lg">{cli.nome}</h3>
                                
                                {telLimpo && (
                                    <a href={`https://wa.me/55${telLimpo}`} target="_blank" className="text-green-500 hover:scale-110 transition-transform" title="WhatsApp">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM8.003 14.527a6.56 6.56 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                                </a>
                              )}

                              <button onClick={() => {
                                    setClienteHistorico(cli);
                                    setBuscaServicoHist('');
                                    setBuscaDataHist('');
                                    setStatusFiltroHist('TODOS');
                                }} className="text-gray-400 hover:text-indigo-600 hover:scale-110 transition-transform" title="Ver Histórico">📋</button>
                          </div>

                          <p className="text-sm text-gray-500">{cli.telefone}</p>
                          
                          {ultimoAgendamento ? (
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                  <strong className="text-gray-800">Última visita:</strong> {format(new Date(ultimoAgendamento.dataHora), 'dd/MM/yy')} ({ultimoAgendamento.servico.nome})
                              </p>
                          ) : (
                              <p className="text-[10px] text-gray-300 mt-1 italic">Nunca concluiu um agendamento</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                            <button 
                                onClick={() => abrirModalEdicao(cli)} 
                                className="px-3 py-1.5 rounded text-xs font-bold border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700"
                            >
                                ✏️ Editar
                            </button>
                            
                            <button 
                                onClick={() => handleDelete(cli.id)} 
                                className="px-3 py-1.5 rounded text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                                🗑️ Excluir
                            </button>
                        </div>

                    </div>
                );
            })}
            </div>
        )}

        {/* MODAL DE FORMULÁRIO (CRIAR / EDITAR) */}
        {modalFormAberto && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800" style={{ color: corPrincipal }}>
                            {clienteEmEdicao ? 'Editar Cliente' : 'Novo Cliente'}
                        </h3>
                        <button onClick={() => setModalFormAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                    </div>

                    <form onSubmit={handleSalvar} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                        </div>

                        <button type="submit" className="w-full text-white py-3 rounded-xl font-bold text-lg shadow-lg mt-4 transition-transform active:scale-95" style={{ backgroundColor: corPrincipal }}>
                            {clienteEmEdicao ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL DE HISTÓRICO */}
        {clienteHistorico && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{clienteHistorico.nome}</h3>
                            <p className="text-xs text-gray-500">Histórico Completo</p>
                        </div>
                        <button onClick={() => setClienteHistorico(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex gap-2">
                            <select className="border rounded px-2 py-1 text-sm w-1/3 bg-white" value={statusFiltroHist} onChange={(e) => setStatusFiltroHist(e.target.value)}>
                                <option value="TODOS">Todos</option>
                                <option value="CONCLUIDO">✅ Concluídos</option>
                                <option value="CONFIRMADO">📅 Confirmados</option>
                                <option value="PENDENTE">⏳ Pendentes</option>
                                <option value="CANCELADO">❌ Cancelados</option>
                            </select>
                            <input type="text" placeholder="Filtrar serviço..." className="flex-1 border rounded px-2 py-1 text-sm" value={buscaServicoHist} onChange={(e) => setBuscaServicoHist(e.target.value)} />
                        </div>
                        <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={buscaDataHist} onChange={(e) => setBuscaDataHist(e.target.value)} />
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                        {getHistoricoFiltrado().length > 0 ? (
                            getHistoricoFiltrado().map((ag: any) => {
                                let corBadge = 'bg-gray-200 text-gray-600';
                                if (ag.status === 'CONCLUIDO') corBadge = 'bg-green-100 text-green-700';
                                if (ag.status === 'CONFIRMADO') corBadge = 'bg-blue-100 text-blue-700';
                                if (ag.status === 'CANCELADO') corBadge = 'bg-red-100 text-red-700';
                                return (
                                    <div key={ag.id} className="bg-gray-50 p-3 rounded border flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-700 text-sm">{tema.icons.servico} {ag.servico.nome}</p>
                                            <p className="text-xs text-gray-500">{tema.icons.profissional} {ag.profissional.nome}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800 text-sm">{format(new Date(ag.dataHora), 'dd/MM/yy')}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${corBadge}`}>{ag.status}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : <p className="text-center text-gray-400 py-6">Nada encontrado.</p>}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}