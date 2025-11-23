'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfissionaisPage() {
  const router = useRouter();
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

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

    fetchProfessionals(user.tenant.id);
  }, []);

  const fetchProfessionals = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/professionals/tenant/${tenantId}`);
      const data = await res.json();
      setProfissionais(data);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
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
        fetchProfessionals(usuario.tenant.id);
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minha Equipe</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
            ← Voltar ao Painel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Formulário de Cadastro (SÓ APARECE PARA O DONO) */}
          {isDono && (
            <div className="bg-white p-6 rounded-lg shadow h-fit">
              <h2 className="text-lg font-semibold mb-4">Novo Profissional</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    placeholder="11999999999"
                    value={novoProfissional.telefone}
                    onChange={e => setNovoProfissional({...novoProfissional, telefone: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
                  Cadastrar Profissional
                </button>
              </form>
            </div>
          )}

          {/* Lista de Profissionais (Se não for dono, ocupa a tela toda) */}
          <div className={isDono ? "md:col-span-2" : "md:col-span-3"}>
            <h2 className="text-lg font-semibold mb-4">Equipe Atual</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : profissionais.length === 0 ? (
              <p className="text-gray-500">Nenhum profissional cadastrado.</p>
            ) : (
              <ul className="space-y-3">
                {profissionais.map((prof) => (
                  <li key={prof.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
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
                          className="text-red-500 hover:text-red-700 text-sm"
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