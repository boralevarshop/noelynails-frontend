'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); // CORES

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
      
      const [resServ, resTenant] = await Promise.all([
        fetch(`${apiUrl}/services/tenant/${tenantId}`),
        fetch(`${apiUrl}/tenants/${tenantId}`)
      ]);
      
      if (resServ.ok) {
        const data = await resServ.json();
        if (Array.isArray(data)) setServices(data);
        else setServices([]);
      }
      
      if (resTenant.ok) {
          setTenant(await resTenant.json());
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

  // Cores Dinâmicas
  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Serviços</h1>
          <button onClick={() => router.push('/dashboard')} className="font-medium hover:opacity-75" style={{ color: '#6B7280' }}>← Voltar ao Painel</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4" style={{ color: corPrincipal }}>Novo Serviço</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} placeholder="Ex: Progressiva" value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                <input type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} placeholder="0.00" value={novoServico.preco} onChange={e => setNovoServico({...novoServico, preco: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Duração (min)</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoServico.duracaoMin} onChange={e => setNovoServico({...novoServico, duracaoMin: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-medium font-bold" style={{ color: corPrincipal }}>Retorno (dias)</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border shadow-sm border p-2 bg-gray-50 outline-none focus:ring-2" style={{ borderColor: corPrincipal, '--tw-ring-color': corPrincipal } as any} value={novoServico.diasRetorno} onChange={e => setNovoServico({...novoServico, diasRetorno: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full text-white py-2 px-4 rounded font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: corPrincipal }}>Salvar Serviço</button>
            </form>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Lista de Serviços</h2>
            {loading ? <p>Carregando...</p> : services.length === 0 ? <p className="text-gray-500">Nenhum serviço cadastrado.</p> : (
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center border-l-4" style={{ borderLeftColor: corPrincipal }}>
                    <div>
                      <h3 className="font-bold text-gray-800">{service.nome}</h3>
                      <p className="text-sm text-gray-500">
                        {service.duracaoMin} min • R$ {Number(service.preco).toFixed(2)}
                      </p>
                      <p className="text-xs font-medium mt-1" style={{ color: corPrincipal }}>
                        🔄 Retorno sugerido: {service.diasRetorno || 30} dias
                      </p>
                    </div>
                    <button onClick={() => handleDelete(service.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold bg-red-50 px-3 py-1 rounded">Excluir</button>
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