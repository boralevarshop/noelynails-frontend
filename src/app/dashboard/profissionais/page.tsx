'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfissionaisPage() {
  const router = useRouter();
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); // CORES

  // Estado do formulário
  const [novoProfissional, setNovoProfissional] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

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
      
      const [resProf, resTenant] = await Promise.all([
        fetch(`${apiUrl}/professionals/tenant/${tenantId}`),
        fetch(`${apiUrl}/tenants/${tenantId}`)
      ]);

      if (resProf.ok) setProfissionais(await resProf.json());
      if (resTenant.ok) setTenant(await resTenant.json());

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/professionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoProfissional,
          tenantId: usuario.tenant.id
        })
      });

      if (res.ok) {
        alert('Profissional cadastrado com sucesso!');
        setNovoProfissional({ nome: '', email: '', telefone: '' });
        // Recarrega apenas a lista de profissionais
        const resProf = await fetch(`${apiUrl}/professionals/tenant/${usuario.tenant.id}`);
        setProfissionais(await resProf.json());
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Erro ao cadastrar');
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este profissional da equipe?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/professionals/${id}`, { method: 'DELETE' });
      setProfissionais(profissionais.filter(p => p.id !== id));
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  if (!usuario) return <div className="p-10">Carregando...</div>;

  // Verifica permissão
  const isDono = usuario.role === 'DONO_SALAO' || usuario.role === 'ADMIN_GLOBAL';

  // Cores Dinâmicas
  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minha Equipe</h1>
          <button onClick={() => router.push('/dashboard')} className="font-medium hover:opacity-75" style={{ color: '#6B7280' }}>
            ← Voltar ao Painel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Formulário de Cadastro (SÓ APARECE PARA O DONO) */}
          {isDono && (
            <div className="bg-white p-6 rounded-lg shadow h-fit">
              <h2 className="text-lg font-semibold mb-4" style={{ color: corPrincipal }}>Novo Profissional</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': corPrincipal } as any}
                    placeholder="Ex: Ana Clara"
                    value={novoProfissional.nome}
                    onChange={e => setNovoProfissional({...novoProfissional, nome: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': corPrincipal } as any}
                    placeholder="ana@equipe.com"
                    value={novoProfissional.email}
                    onChange={e => setNovoProfissional({...novoProfissional, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': corPrincipal } as any}
                    placeholder="11999999999"
                    value={novoProfissional.telefone}
                    onChange={e => setNovoProfissional({...novoProfissional, telefone: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full text-white py-2 px-4 rounded font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: corPrincipal }}>
                  Cadastrar Profissional
                </button>
              </form>
            </div>
          )}

          {/* Lista de Profissionais */}
          <div className={isDono ? "md:col-span-2" : "md:col-span-3"}>
            <h2 className="text-lg font-semibold mb-4">Equipe Atual</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : profissionais.length === 0 ? (
              <p className="text-gray-500">Nenhum profissional cadastrado.</p>
            ) : (
              <ul className="space-y-3">
                {profissionais.map((prof) => (
                  <li key={prof.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center border-l-4" style={{ borderLeftColor: corPrincipal }}>
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: corPrincipal }}>
                        {prof.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{prof.nome}</h3>
                        <p className="text-xs text-gray-500">{prof.email}</p>
                        <p className="text-xs text-gray-500">{prof.telefone}</p>
                      </div>
                    </div>
                    
                    {/* Botão de Remover (SÓ APARECE PARA O DONO) */}
                    {isDono && (
                        <button 
                          onClick={() => handleDelete(prof.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold bg-red-50 px-3 py-1 rounded"
                        >
                          Remover
                        </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}