'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  const [modalTrialAberto, setModalTrialAberto] = useState(false);
  const [tenantSelecionado, setTenantSelecionado] = useState<any>(null);
  const [diasTrial, setDiasTrial] = useState(7);

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

  // --- NOVA FUNÇÃO: EXCLUIR SALÃO ---
  const handleDelete = async (id: string, nome: string) => {
    const confirmacao = prompt(`ATENÇÃO PERIGO 🚨\n\nIsso apagará o salão "${nome}" e TODOS os dados (clientes, agendamentos, financeiros) para sempre.\n\nPara confirmar, digite "DELETAR" abaixo:`);
    
    if (confirmacao !== 'DELETAR') return;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/tenants/${id}`, { method: 'DELETE' });
        
        if (res.ok) {
            alert('Salão excluído permanentemente.');
            fetchTenants();
        } else {
            alert('Erro ao excluir.');
        }
    } catch (error) { alert('Erro de conexão'); }
  };
  // ----------------------------------

  const abrirModalTrial = (tenant: any) => {
      setTenantSelecionado(tenant);
      setDiasTrial(7);
      setModalTrialAberto(true);
  };

  const salvarTrial = async () => {
      try {
          const dataFim = new Date();
          dataFim.setDate(dataFim.getDate() + parseInt(diasTrial.toString()));
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          await fetch(`${apiUrl}/tenants/${tenantSelecionado.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ statusAssinatura: 'TRIAL', trialFim: dataFim.toISOString(), plano: 'SUPREME' })
          });
          alert(`Sucesso! ${tenantSelecionado.nome} ganhou ${diasTrial} dias.`);
          setModalTrialAberto(false);
          fetchTenants();
      } catch (error) { alert('Erro ao aplicar trial'); }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

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
                        <th className="p-4">Plano</th>
                        <th className="p-4 text-center">Dados</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {tenants.map(t => {
                        const diasRestantes = t.trialFim ? Math.ceil((new Date(t.trialFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        return (
                        <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-white">{t.nome}</div>
                                <div className="text-xs text-gray-500">/{t.slug}</div>
                            </td>
                            <td className="p-4">
                                <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded mr-2">{t.plano}</span>
                                {t.statusAssinatura === 'TRIAL' && <span className={`text-xs font-bold ${diasRestantes > 0 ? 'text-green-400' : 'text-red-400'}`}>{diasRestantes > 0 ? `${diasRestantes}d rest.` : 'EXPIRADO'}</span>}
                            </td>
                            <td className="p-4 text-center text-sm text-gray-400">
                                {t._count?.usuarios || 0} usuários<br/>{t._count?.agendamentos || 0} agendamentos
                            </td>
                            <td className="p-4">
                                {t.ativo ? <span className="text-green-400 text-xs font-bold">ATIVO</span> : <span className="text-red-400 text-xs font-bold">BLOQUEADO</span>}
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                                <button onClick={() => abrirModalTrial(t)} className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 rounded" title="Dar Trial">🎁</button>
                                <button onClick={() => acessarSalao(t)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded font-bold">ENTRAR</button>
                                <button onClick={() => handleToggleStatus(t.id, t.ativo)} className={`text-xs font-bold px-2 py-1 rounded ${t.ativo ? 'bg-gray-600 hover:bg-gray-500' : 'bg-green-600'}`}>{t.ativo ? 'BLOQ' : 'LIB'}</button>
                                
                                {/* BOTÃO EXCLUIR */}
                                <button onClick={() => handleDelete(t.id, t.nome)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-bold ml-2" title="Excluir Salão">🗑️</button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>

        {modalTrialAberto && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-gray-600 w-full max-w-sm rounded-lg p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4">Presentear {tenantSelecionado?.nome}</h3>
                    <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white mt-1 mb-4" value={diasTrial} onChange={e => setDiasTrial(Number(e.target.value))} min="1" max="365" />
                    <div className="flex gap-3">
                        <button onClick={salvarTrial} className="flex-1 bg-green-600 text-white py-2 rounded font-bold">Confirmar</button>
                        <button onClick={() => setModalTrialAberto(false)} className="flex-1 bg-gray-700 text-white py-2 rounded">Cancelar</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}