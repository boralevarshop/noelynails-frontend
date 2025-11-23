'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  // Form com o campo novo
  const [novoServico, setNovoServico] = useState({
    nome: '',
    preco: '',
    duracaoMin: '30',
    diasRetorno: '30' 
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    fetchServices(user.tenant.id);
  }, []);

  const fetchServices = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/services/tenant/${tenantId}`);
      
      if (res.ok) {
        const data = await res.json();
        // PROTEÇÃO: Garante que é uma lista antes de salvar
        if (Array.isArray(data)) {
            setServices(data);
        } else {
            setServices([]);
        }
      } else {
        console.error("Erro ao buscar serviços:", res.status);
        setServices([]);
      }
    } catch (error) { 
        console.error(error);
        setServices([]); 
    } 
    finally { setLoading(false); }
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
          preco: parseFloat(novoServico.preco),
          duracaoMin: parseInt(novoServico.duracaoMin),
          diasRetorno: parseInt(novoServico.diasRetorno),
          tenantId: usuario.tenant.id
        })
      });

      if (res.ok) {
        alert('Serviço criado!');
        setNovoServico({ nome: '', preco: '', duracaoMin: '30', diasRetorno: '30' });
        fetchServices(usuario.tenant.id);
      } else {
        alert('Erro ao salvar. Verifique os dados.');
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/services/${id}`, { method: 'DELETE' });
      setServices(services.filter(s => s.id !== id));
    } catch (error) { alert('Erro ao excluir'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Serviços</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4">Novo Serviço</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" placeholder="Ex: Progressiva" value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                <input type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" placeholder="0.00" value={novoServico.preco} onChange={e => setNovoServico({...novoServico, preco: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Duração (min)</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={novoServico.duracaoMin} onChange={e => setNovoServico({...novoServico, duracaoMin: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 text-indigo-600 font-bold">Retorno (dias)</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border-indigo-300 shadow-sm border p-2 bg-indigo-50" value={novoServico.diasRetorno} onChange={e => setNovoServico({...novoServico, diasRetorno: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">Salvar Serviço</button>
            </form>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Lista de Serviços</h2>
            {loading ? <p>Carregando...</p> : services.length === 0 ? <p className="text-gray-500">Nenhum serviço cadastrado.</p> : (
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800">{service.nome}</h3>
                      <p className="text-sm text-gray-500">
                        {service.duracaoMin} min • R$ {Number(service.preco).toFixed(2)}
                      </p>
                      <p className="text-xs text-indigo-600 font-medium mt-1">
                        🔄 Retorno sugerido: {service.diasRetorno || 30} dias
                      </p>
                    </div>
                    <button onClick={() => handleDelete(service.id)} className="text-red-500 hover:text-red-700 text-sm">Excluir</button>
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