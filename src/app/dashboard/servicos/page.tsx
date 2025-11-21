'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  // Estado do formulário
  const [novoServico, setNovoServico] = useState({
    nome: '',
    preco: '',
    duracaoMin: '30'
  });

  useEffect(() => {
    // 1. Verifica login
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);

    // 2. Busca os serviços do backend
    fetchServices(user.tenant.id);
  }, []);

  const fetchServices = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/services/tenant/${tenantId}`);
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoServico,
          tenantId: usuario.tenant.id
        })
      });

      if (res.ok) {
        alert('Serviço criado!');
        setNovoServico({ nome: '', preco: '', duracaoMin: '30' }); // Limpa form
        fetchServices(usuario.tenant.id); // Recarrega lista
      }
    } catch (error) {
      alert('Erro ao criar serviço');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/services/${id}`, { method: 'DELETE' });
      // Remove da lista visualmente
      setServices(services.filter(s => s.id !== id));
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Serviços</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
            ← Voltar ao Painel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Formulário de Cadastro */}
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4">Novo Serviço</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  placeholder="Ex: Corte de Cabelo"
                  value={novoServico.nome}
                  onChange={e => setNovoServico({...novoServico, nome: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  placeholder="0.00"
                  value={novoServico.preco}
                  onChange={e => setNovoServico({...novoServico, preco: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duração (minutos)</label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={novoServico.duracaoMin}
                  onChange={e => setNovoServico({...novoServico, duracaoMin: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
                Salvar Serviço
              </button>
            </form>
          </div>

          {/* Lista de Serviços */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Lista de Serviços</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : services.length === 0 ? (
              <p className="text-gray-500">Nenhum serviço cadastrado ainda.</p>
            ) : (
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800">{service.nome}</h3>
                      <p className="text-sm text-gray-500">
                        {service.duracaoMin} min • R$ {Number(service.preco).toFixed(2)}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Excluir
                    </button>
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