'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getTheme } from '../../../utils/theme';

export default function ProfissionaisPage() {
  const router = useRouter();
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); 
  const [tema, setTema] = useState(getTheme('SALAO_BELEZA'));

  // Estados de Modais
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [profEmEdicao, setProfEmEdicao] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' });

  // --- NOVO: ESTADOS PARA HISTÓRICO ---
  const [profHistorico, setProfHistorico] = useState<any>(null); // Profissional selecionado
  const [buscaServicoHist, setBuscaServicoHist] = useState('');
  const [buscaDataHist, setBuscaDataHist] = useState('');
  const [statusFiltroHist, setStatusFiltroHist] = useState('TODOS');
  // ------------------------------------

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    fetchDados(user.tenant.id);
  }, []);

  const fetchDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const [resProf, resTenant] = await Promise.all([
        fetch(`${apiUrl}/professionals/tenant/${tenantId}`),
        fetch(`${apiUrl}/tenants/${tenantId}`)
      ]);

      if (resProf.ok) setProfissionais(await resProf.json());
      if (resTenant.ok) {
          const t = await resTenant.json();
          setTenant(t);
          setTema(getTheme(t.segmento || 'SALAO_BELEZA'));
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- AÇÕES DE FORMULÁRIO ---
  const abrirModalCriacao = () => {
      setProfEmEdicao(null);
      setForm({ nome: '', email: '', telefone: '' });
      setModalFormAberto(true);
  };

  const abrirModalEdicao = (prof: any) => {
      setProfEmEdicao(prof);
      setForm({ nome: prof.nome, email: prof.email, telefone: prof.telefone || '' });
      setModalFormAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    try {
        let res;
        if (profEmEdicao) {
            res = await fetch(`${apiUrl}/professionals/${profEmEdicao.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
        } else {
            res = await fetch(`${apiUrl}/professionals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, tenantId: usuario.tenant.id })
            });
        }

        if (res.ok) {
            alert(profEmEdicao ? 'Profissional atualizado! ✅' : 'Profissional cadastrado! 🎉');
            setModalFormAberto(false);
            fetchDados(usuario.tenant.id);
        } else {
            const erro = await res.json();
            alert(`❌ Erro: ${erro.message}`);
        }
    } catch (error) { alert('Erro de conexão.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este profissional? Isso apagará todo o histórico dele.')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/professionals/${id}`, { method: 'DELETE' });
      if (res.ok) {
          setProfissionais(profissionais.filter(p => p.id !== id));
      } else {
          alert('Erro ao excluir.');
      }
    } catch (error) { alert('Erro ao excluir'); }
  };

  // --- FILTRO DO HISTÓRICO ---
  const getHistoricoFiltrado = () => {
      if (!profHistorico || !profHistorico.agendamentos) return [];

      return profHistorico.agendamentos.filter((ag: any) => {
          // Filtro de Status
          if (statusFiltroHist !== 'TODOS' && ag.status !== statusFiltroHist) return false;

          // Filtro de Nome do Serviço
          if (buscaServicoHist && !ag.servico.nome.toLowerCase().includes(buscaServicoHist.toLowerCase())) return false;

          // Filtro de Data
          if (buscaDataHist && !ag.dataHora.startsWith(buscaDataHist)) return false;

          return true;
      });
  };

  if (!usuario) return <div className="p-10">Carregando...</div>;
  
  const isDono = usuario.role === 'DONO_SALAO' || usuario.role === 'ADMIN_GLOBAL';
  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button 
                onClick={() => router.push('/dashboard')} 
                className="px-4 py-2 rounded-lg font-bold border-2 transition-colors shadow-sm hover:opacity-90 text-sm"
                style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff" }}
            >
                ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Minha Equipe</h1>
          </div>

          {isDono && (
            <button 
                onClick={abrirModalCriacao}
                className="w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: corPrincipal }}
            >
                + Novo Profissional
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {profissionais.length === 0 ? <p className="text-gray-500">Nenhum profissional cadastrado.</p> : (
              profissionais.map((prof) => {
                  const telLimpo = prof.telefone ? prof.telefone.replace(/\D/g, '') : '';
                  
                  // Último atendimento Confirmado ou Concluído
                  const ultimoAtendimento = prof.agendamentos?.find((a: any) => a.status === 'CONFIRMADO' || a.status === 'CONCLUIDO');

                  return (
                    <div key={prof.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex justify-between items-start">
                        
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm" style={{ backgroundColor: corPrincipal }}>
                                {prof.avatarUrl ? <img src={prof.avatarUrl} className="w-full h-full object-cover rounded-full" /> : prof.nome.charAt(0).toUpperCase()}
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-800 text-lg">{prof.nome}</h3>
                                    
                                    {/* Ícone WhatsApp */}
                                    {telLimpo && (
                                        <a href={`https://wa.me/55${telLimpo}`} target="_blank" className="text-green-500 hover:scale-110 transition-transform" title="WhatsApp">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM8.003 14.527a6.56 6.56 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                                        </a>
                                    )}

                                    {/* ÍCONE DE HISTÓRICO (SÓ DONO) */}
                                    {isDono && (
                                        <button 
                                            onClick={() => {
                                                setProfHistorico(prof);
                                                setBuscaServicoHist('');
                                                setStatusFiltroHist('TODOS');
                                            }} 
                                            className="text-gray-400 hover:text-indigo-600 hover:scale-110 transition-transform" 
                                            title="Ver Histórico de Atendimentos"
                                        >
                                            📋
                                        </button>
                                    )}
                                </div>
                                
                                <p className="text-xs text-gray-500">{prof.email}</p>
                                <p className="text-xs text-gray-500">{prof.telefone}</p>

                                {/* ÚLTIMO ATENDIMENTO (SÓ DONO) */}
                                {isDono && ultimoAtendimento && (
                                    <p className="text-[10px] text-gray-500 mt-2 bg-gray-50 p-1 rounded inline-block">
                                        <span className="font-bold">Último agendamento:</span> {format(new Date(ultimoAtendimento.dataHora), 'dd/MM')} ({ultimoAtendimento.servico.nome})
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {/* AÇÕES (SÓ DONO) */}
                        {isDono && (
                            <div className="flex flex-col gap-2">
                                <button onClick={() => abrirModalEdicao(prof)} className="text-xs font-bold hover:underline px-2 py-1 rounded border border-gray-200 hover:bg-gray-50" style={{ color: corPrincipal }}>
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(prof.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-100 hover:bg-red-50">
                                    Excluir
                                </button>
                            </div>
                        )}
                    </div>
                  );
              })
          )}
        </div>

        {/* MODAL DE CADASTRO / EDIÇÃO */}
        {modalFormAberto && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800" style={{ color: corPrincipal }}>
                            {profEmEdicao ? 'Editar Profissional' : 'Novo Profissional'}
                        </h3>
                        <button onClick={() => setModalFormAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                    </div>

                    <form onSubmit={handleSalvar} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Login)</label>
                            <input required type="email" className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                        </div>

                        <button type="submit" className="w-full text-white py-3 rounded-xl font-bold text-lg shadow-lg mt-4 transition-transform active:scale-95" style={{ backgroundColor: corPrincipal }}>
                            {profEmEdicao ? 'Salvar Alterações' : 'Cadastrar'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- NOVO: MODAL DE HISTÓRICO DE AGENDAMENTOS --- */}
        {profHistorico && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{profHistorico.nome}</h3>
                            <p className="text-xs text-gray-500">Histórico de Atendimentos</p>
                        </div>
                        <button onClick={() => setProfHistorico(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex gap-2">
                            <select 
                                className="border rounded px-2 py-1 text-sm w-1/3 bg-white" 
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
                                className="flex-1 border rounded px-2 py-1 text-sm" 
                                value={buscaServicoHist} 
                                onChange={(e) => setBuscaServicoHist(e.target.value)} 
                            />
                        </div>
                        <input 
                            type="date" 
                            className="w-full border rounded px-2 py-1 text-sm" 
                            value={buscaDataHist} 
                            onChange={(e) => setBuscaDataHist(e.target.value)} 
                        />
                    </div>

                    {/* Lista */}
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
                                            <p className="text-xs text-gray-500">{tema.icons.cliente} {ag.cliente.nome}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800 text-sm">{format(new Date(ag.dataHora), 'dd/MM/yy')}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${corBadge}`}>{ag.status}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-2xl mb-2">📭</p>
                                <p className="text-sm">Nenhum serviço encontrado.</p>
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