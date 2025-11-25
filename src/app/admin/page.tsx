'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  // --- ESTADOS DO MODAL DE EDIÇÃO ---
  const [modalEditAberto, setModalEditAberto] = useState(false);
  const [editTenant, setEditTenant] = useState<any>({
    id: '',
    nome: '',
    slug: '',
    plano: '',
    statusAssinatura: '',
    whatsappInstance: '',
    trialFim: ''
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);

    if (user.role !== 'ADMIN_GLOBAL') {
        alert('Acesso negado.');
        router.push('/dashboard');
        return;
    }

    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/tenants`);
      if (res.ok) setTenants(await res.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleToggleStatus = async (id: string, statusAtual: boolean) => {
    const acao = statusAtual ? 'BLOQUEAR' : 'DESBLOQUEAR';
    if (!confirm(`Tem certeza que deseja ${acao} este salão?`)) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/tenants/${id}/toggle`, { method: 'PATCH' });
      fetchTenants();
    } catch (error) { alert('Erro ao alterar status'); }
  };

  const acessarSalao = (tenant: any) => {
    if (!confirm(`Deseja entrar no painel do salão "${tenant.nome}"?`)) return;
    const sessaoHibrida = {
        ...usuario,
        tenant: { id: tenant.id, nome: tenant.nome, slug: tenant.slug }
    };
    localStorage.setItem('usuario_saas', JSON.stringify(sessaoHibrida));
    router.push('/dashboard');
  };

  const handleDelete = async (id: string, nome: string) => {
    const confirmacao = prompt(`ATENÇÃO PERIGO 🚨\n\nDigite "DELETAR" para apagar o salão "${nome}" e todos os dados permanentemente:`);
    if (confirmacao !== 'DELETAR') return;
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/tenants/${id}`, { method: 'DELETE' });
        if (res.ok) { alert('Salão excluído.'); fetchTenants(); }
    } catch (error) { alert('Erro de conexão'); }
  };

  // --- FUNÇÕES DE EDIÇÃO ---
  const abrirModalEdit = (t: any) => {
      setEditTenant({
          id: t.id,
          nome: t.nome,
          slug: t.slug,
          plano: t.plano,
          statusAssinatura: t.statusAssinatura,
          whatsappInstance: t.whatsappInstance || '',
          trialFim: t.trialFim ? t.trialFim.split('T')[0] : '' // Formata data para o input
      });
      setModalEditAberto(true);
  };

  const salvarEdicao = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          
          // Prepara os dados (se data vazia, manda null)
          const payload = {
              ...editTenant,
              trialFim: editTenant.trialFim ? new Date(editTenant.trialFim).toISOString() : null
          };

          const res = await fetch(`${apiUrl}/tenants/${editTenant.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              alert('Dados atualizados com sucesso!');
              setModalEditAberto(false);
              fetchTenants();
          } else {
              alert('Erro ao atualizar.');
          }
      } catch (error) { alert('Erro de conexão.'); }
  };
  // ------------------------

  if (loading) return <div className="p-10 text-center text-white">Carregando Painel Admin...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin 👑</h1>
            <p className="text-gray-400">Gestão Global do SaaS</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">Ver meu Dashboard</button>
            <button onClick={() => { localStorage.removeItem('usuario_saas'); router.push('/login'); }} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 font-bold">Sair</button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
                    <tr>
                        <th className="p-4">Salão</th>
                        <th className="p-4">Plano / Status</th>
                        <th className="p-4 text-center">WhatsApp</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {tenants.map(t => (
                        <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-white">{t.nome}</div>
                                <div className="text-xs text-gray-500">/{t.slug}</div>
                            </td>
                            <td className="p-4">
                                <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded mr-2">{t.plano}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${t.statusAssinatura === 'ACTIVE' ? 'bg-green-900 text-green-300' : t.statusAssinatura === 'OVERDUE' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                    {t.statusAssinatura}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                {t.whatsappInstance ? (
                                    <span className="text-green-400 text-xs">✅ {t.whatsappInstance}</span>
                                ) : (
                                    <span className="text-gray-500 text-xs">Sem Config</span>
                                )}
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                                {/* BOTÃO EDITAR (Lápis) */}
                                <button onClick={() => abrirModalEdit(t)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded font-bold">✏️ EDITAR</button>
                                
                                <button onClick={() => acessarSalao(t)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded font-bold">ACESSAR</button>
                                
                                <button onClick={() => handleToggleStatus(t.id, t.ativo)} className={`text-xs font-bold px-3 py-1 rounded ${t.ativo ? 'bg-gray-700 hover:bg-red-900 text-gray-300' : 'bg-green-800 text-green-100'}`}>
                                    {t.ativo ? 'BLOQ' : 'LIB'}
                                </button>
                                
                                <button onClick={() => handleDelete(t.id, t.nome)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-bold" title="Excluir">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MODAL DE EDIÇÃO COMPLETA */}
        {modalEditAberto && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-gray-600 w-full max-w-md rounded-lg p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">Editar Salão</h3>
                    
                    <form onSubmit={salvarEdicao} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Salão</label>
                            <input type="text" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-indigo-500" 
                                value={editTenant.nome} onChange={e => setEditTenant({...editTenant, nome: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instância WhatsApp (Evolution)</label>
                            <input type="text" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-indigo-500" 
                                placeholder="Ex: Zappy"
                                value={editTenant.whatsappInstance} onChange={e => setEditTenant({...editTenant, whatsappInstance: e.target.value})} />
                            <p className="text-[10px] text-gray-500 mt-1">Nome exato criado na Evolution API.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plano</label>
                                <select className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none"
                                    value={editTenant.plano} onChange={e => setEditTenant({...editTenant, plano: e.target.value})}>
                                    <option value="FREE">FREE</option>
                                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                                    <option value="PRIME">PRIME</option>
                                    <option value="SUPREME">SUPREME</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status Financeiro</label>
                                <select className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none"
                                    value={editTenant.statusAssinatura} onChange={e => setEditTenant({...editTenant, statusAssinatura: e.target.value})}>
                                    <option value="TRIAL">TRIAL (Teste)</option>
                                    <option value="ACTIVE">ACTIVE (Pago)</option>
                                    <option value="OVERDUE">OVERDUE (Devendo)</option>
                                    <option value="CANCELED">CANCELED</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Validade (Trial/Vencimento)</label>
                            <input type="date" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none" 
                                value={editTenant.trialFim} onChange={e => setEditTenant({...editTenant, trialFim: e.target.value})} />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700">Salvar Alterações</button>
                            <button type="button" onClick={() => setModalEditAberto(false)} className="flex-1 bg-gray-700 text-white py-2 rounded hover:bg-gray-600">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}