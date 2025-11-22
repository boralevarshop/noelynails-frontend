'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estado para Edição
  const [editando, setEditando] = useState<any>(null); // Se null, não está editando
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    carregarClientes(user.tenant.id);
  }, []);

  const carregarClientes = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/clients/tenant/${tenantId}`);
      setClientes(await res.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const iniciarEdicao = (cliente: any) => {
    setEditando(cliente);
    setForm({ 
        nome: cliente.nome, 
        telefone: cliente.telefone, 
        email: cliente.email || '' 
    });
    // Rola a página para o topo onde está o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setForm({ nome: '', telefone: '', email: '' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/clients/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantId: usuario.tenant.id })
      });

      if (res.ok) {
        alert('Cliente atualizado com sucesso!');
        cancelarEdicao();
        carregarClientes(usuario.tenant.id);
      } else {
        const erro = await res.json();
        alert(erro.message || 'Erro ao atualizar');
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ATENÇÃO: Tem certeza? Se este cliente tiver agendamentos, a exclusão será bloqueada.')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/clients/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        alert('Cliente removido.');
        setClientes(clientes.filter(c => c.id !== id));
      } else {
        const erro = await res.json();
        alert(erro.message || 'Não foi possível excluir (provavelmente possui agendamentos).');
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Clientes</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar ao Painel</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Formulário de Edição (Só aparece se clicar em editar) */}
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4 text-indigo-600">
                {editando ? 'Editar Cliente' : 'Gerenciar Clientes'}
            </h2>
            
            {!editando ? (
                <p className="text-gray-500 text-sm">
                    Selecione um cliente na lista ao lado para editar seus dados ou corrigir o WhatsApp.
                </p>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                        <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                    </div>
                    
                    <div className="flex gap-2">
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">Salvar</button>
                        <button type="button" onClick={cancelarEdicao} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">Cancelar</button>
                    </div>
                </form>
            )}
          </div>

          {/* Lista de Clientes */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Carteira de Clientes ({clientes.length})</h2>
            {loading ? <p>Carregando...</p> : clientes.length === 0 ? <p className="text-gray-500">Nenhum cliente cadastrado.</p> : (
              <ul className="space-y-3">
                {clientes.map((cli) => (
                  <li key={cli.id} className={`bg-white p-4 rounded-lg shadow flex justify-between items-center ${editando?.id === cli.id ? 'border-2 border-indigo-500' : ''}`}>
                    <div>
                      <h3 className="font-bold text-gray-800">{cli.nome}</h3>
                      <p className="text-sm text-gray-500">{cli.telefone}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => iniciarEdicao(cli)} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
                            Editar
                        </button>
                        <button onClick={() => handleDelete(cli.id)} className="text-red-500 hover:text-red-700 text-sm">
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