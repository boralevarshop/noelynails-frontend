'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(dadosSalvos);
    setUsuario(user);

    // SEGURANÇA NO FRONTEND:
    // Se não for ADMIN_GLOBAL, chuta de volta pro dashboard comum
    if (user.role !== 'ADMIN_GLOBAL') {
        alert('Acesso negado. Área restrita.');
        router.push('/dashboard');
        return;
    }

    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/tenants`);
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, statusAtual: boolean) => {
    const acao = statusAtual ? 'BLOQUEAR' : 'DESBLOQUEAR';
    if (!confirm(`Tem certeza que deseja ${acao} este salão?`)) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/tenants/${id}/toggle`, { method: 'PATCH' });
      fetchTenants(); // Recarrega a lista
    } catch (error) {
      alert('Erro ao alterar status');
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando Painel Admin...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin 👑</h1>
            <p className="text-gray-400">Gestão Global do SaaS</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
              Ver meu Salão
            </button>
            <button onClick={() => { localStorage.removeItem('usuario_saas'); router.push('/login'); }} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 font-bold">
              Sair
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-sm uppercase">Total de Salões</h3>
                <p className="text-4xl font-bold text-white mt-2">{tenants.length}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-sm uppercase">Salões Ativos</h3>
                <p className="text-4xl font-bold text-green-400 mt-2">
                    {tenants.filter(t => t.ativo).length}
                </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-gray-400 text-sm uppercase">Bloqueados (Inadimplentes)</h3>
                <p className="text-4xl font-bold text-red-400 mt-2">
                    {tenants.filter(t => !t.ativo).length}
                </p>
            </div>
        </div>

        {/* Lista de Clientes (Salões) */}
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
                    <tr>
                        <th className="p-4">Nome do Salão</th>
                        <th className="p-4">Link (Slug)</th>
                        <th className="p-4">Plano</th>
                        <th className="p-4 text-center">Usuários</th>
                        <th className="p-4 text-center">Agendamentos</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {tenants.map(t => (
                        <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                            <td className="p-4 font-medium">{t.nome}</td>
                            <td className="p-4 text-gray-400">/{t.slug}</td>
                            <td className="p-4"><span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded">{t.plano}</span></td>
                            <td className="p-4 text-center">{t._count?.usuarios || 0}</td>
                            <td className="p-4 text-center">{t._count?.agendamentos || 0}</td>
                            <td className="p-4">
                                {t.ativo ? (
                                    <span className="text-green-400 text-xs font-bold border border-green-400 px-2 py-1 rounded">ATIVO</span>
                                ) : (
                                    <span className="text-red-400 text-xs font-bold border border-red-400 px-2 py-1 rounded">BLOQUEADO</span>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleToggleStatus(t.id, t.ativo)}
                                    className={`text-xs font-bold px-3 py-1 rounded transition-colors ${t.ativo ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                >
                                    {t.ativo ? 'BLOQUEAR' : 'LIBERAR'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

      </div>
    </div>
  );
}