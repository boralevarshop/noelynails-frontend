'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); // CORES

  // --- ESTADO DE EDIÇÃO ---
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [form, setForm] = useState({
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
        setServices(Array.isArray(data) ? data : []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Se tiver editando, usa a URL com ID e método PATCH. Se não, usa POST.
      const url = editandoId ? `${apiUrl}/services/${editandoId}` : `${apiUrl}/services`;
      const method = editandoId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          preco: parseFloat(form.preco),
          duracaoMin: parseInt(form.duracaoMin),
          diasRetorno: parseInt(form.diasRetorno),
          tenantId: usuario.tenant.id
        })
      });

      if (res.ok) {
        alert(editandoId ? 'Serviço atualizado!' : 'Serviço criado!');
        // Limpa formulário e sai do modo edição
        setForm({ nome: '', preco: '', duracaoMin: '30', diasRetorno: '30' });
        setEditandoId(null);
        fetchServices(usuario.tenant.id);
      } else {
        alert('Erro ao salvar. Verifique os dados.');
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  // --- FUNÇÃO PARA PREENCHER O FORMULÁRIO ---
  const iniciarEdicao = (servico: any) => {
      setEditandoId(servico.id);
      setForm({
          nome: servico.nome,
          preco: servico.preco,
          duracaoMin: servico.duracaoMin,
          diasRetorno: servico.diasRetorno
      });
      // Rola a página para o topo suavemente
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
      setEditandoId(null);
      setForm({ nome: '', preco: '', duracaoMin: '30', diasRetorno: '30' });
  };
  // -----------------------------------------

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
          <button 
                onClick={() => router.push('/dashboard')} 
                className="px-4 py-2 rounded-lg font-bold border-2 transition-colors flex items-center gap-2 hover:bg-gray-50"
                style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff"}}
             >
                <span>←</span> Voltar ao Painel
             </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Formulário Inteligente (Cria ou Edita) */}
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4" style={{ color: corPrincipal }}>
                {editandoId ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} placeholder="Ex: Progressiva" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                <input type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} placeholder="0.00" value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Duração (min)</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.duracaoMin} onChange={e => setForm({...form, duracaoMin: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-medium font-bold" style={{ color: corPrincipal }}>Retorno (dias)</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border shadow-sm border p-2 bg-gray-50 outline-none focus:ring-2" style={{ borderColor: corPrincipal, '--tw-ring-color': corPrincipal } as any} value={form.diasRetorno} onChange={e => setForm({...form, diasRetorno: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-2">
                  <button type="submit" className="w-full text-white py-2 px-4 rounded font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: corPrincipal }}>
                      {editandoId ? 'Atualizar' : 'Salvar'}
                  </button>

                  {editandoId && (
                      <button type="button" onClick={cancelarEdicao} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded font-bold hover:bg-gray-300 transition-colors">
                          Cancelar
                      </button>
                  )}
              </div>
            </form>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Lista de Serviços</h2>
            {loading ? <p>Carregando...</p> : services.length === 0 ? <p className="text-gray-500">Nenhum serviço cadastrado.</p> : (
              <ul className="space-y-3">
                {services.map((service) => (
                  <li 
                    key={service.id} 
                    className={`bg-white p-4 rounded-lg shadow flex justify-between items-center border-l-4 ${editandoId === service.id ? 'bg-gray-50 ring-2 ring-offset-2' : ''}`} 
                    style={{ borderLeftColor: corPrincipal, '--tw-ring-color': corPrincipal } as any}
                  >
                    <div>
                      <h3 className="font-bold text-gray-800">{service.nome}</h3>
                      <p className="text-sm text-gray-500">
                        {service.duracaoMin} min • R$ {Number(service.preco).toFixed(2)}
                      </p>
                      <p className="text-xs font-medium mt-1" style={{ color: corPrincipal }}>
                        🔄 Retorno sugerido: {service.diasRetorno || 30} dias
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => iniciarEdicao(service)} 
                            className="text-sm font-bold hover:opacity-70" 
                            style={{ color: corPrincipal }}
                        >
                            Editar
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold ml-2">
                            Excluir
                        </button>
                    </div>
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