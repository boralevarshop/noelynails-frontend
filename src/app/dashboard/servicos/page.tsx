'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getTheme } from '../../../utils/theme';

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); 
  const [tema, setTema] = useState(getTheme('SALAO_BELEZA'));

  // Estados Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEmEdicao, setServicoEmEdicao] = useState<any>(null);
  
  const [form, setForm] = useState({
    nome: '', preco: '', duracaoMin: '30', diasRetorno: '30' 
  });

  const [busca, setBusca] = useState('');

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
      
      if (resServ.ok) setServices(await resServ.json());
      if (resTenant.ok) {
          const t = await resTenant.json();
          setTenant(t);
          setTema(getTheme(t.segmento || 'SALAO_BELEZA'));
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const abrirModal = (servico: any = null) => {
      setServicoEmEdicao(servico);
      if (servico) {
          setForm({ nome: servico.nome, preco: servico.preco, duracaoMin: servico.duracaoMin, diasRetorno: servico.diasRetorno });
      } else {
          setForm({ nome: '', preco: '', duracaoMin: '30', diasRetorno: '30' });
      }
      setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const payload = { ...form, tenantId: usuario.tenant.id, usuarioId: usuario.id }; // Envia quem mexeu

    try {
        let res;
        if (servicoEmEdicao) {
            res = await fetch(`${apiUrl}/services/${servicoEmEdicao.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`${apiUrl}/services`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            alert(servicoEmEdicao ? 'Atualizado com sucesso! ✅' : 'Criado com sucesso! 🎉');
            setModalAberto(false);
            fetchServices(usuario.tenant.id);
        } else {
            const erro = await res.json();
            alert(`❌ Erro: ${erro.message}`);
        }
    } catch (error) { alert('Erro de conexão.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso pode afetar agendamentos futuros.')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // Envia o ID do usuário no body do DELETE para auditoria
      await fetch(`${apiUrl}/services/${id}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: usuario.id })
      });
      setServices(services.filter(s => s.id !== id));
    } catch (error) { alert('Erro ao excluir'); }
  };

  // Filtro
  const servicosFiltrados = services.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()));

  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg font-bold border-2 transition-colors shadow-sm hover:opacity-90 text-sm" style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff" }}>← Voltar</button>
             <h1 className="text-2xl font-bold text-gray-900">Meus Serviços</h1>
          </div>
          <button onClick={() => abrirModal(null)} className="w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white shadow-md hover:scale-105 transition-transform" style={{ backgroundColor: corPrincipal }}>+ Novo Serviço</button>
        </div>

        {/* Busca */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-2 border border-gray-200">
            <span className="text-2xl">🔍</span>
            <input type="text" placeholder="Buscar serviço..." className="w-full outline-none text-gray-700" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicosFiltrados.map((serv) => (
              <div key={serv.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex justify-between items-start border-l-4" style={{ borderLeftColor: corPrincipal }}>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">{serv.nome}</h3>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <p>⏱️ {serv.duracaoMin} min • 💰 R$ {Number(serv.preco).toFixed(2)}</p>
                      <p>🔄 Retorno: {serv.diasRetorno || 30} dias</p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex flex-col gap-1">
                      <p>Criado por: <strong>{serv.createdBy?.nome || 'Sistema'}</strong></p>
                      {serv.updatedBy && <p>Editado por: <strong>{serv.updatedBy.nome}</strong></p>}
                      {serv.agendamentos?.[0] ? (
                          <p className="text-green-600">Última realização: {format(new Date(serv.agendamentos[0].dataHora), 'dd/MM/yy')}</p>
                      ) : <p className="text-gray-300">Nunca realizado</p>}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => abrirModal(serv)} className="px-3 py-1.5 rounded text-xs font-bold border border-gray-300 hover:bg-gray-50 text-gray-700">✏️ Editar</button>
                    <button onClick={() => handleDelete(serv.id)} className="px-3 py-1.5 rounded text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50">🗑️ Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL FORMULÁRIO */}
        {modalAberto && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800" style={{ color: corPrincipal }}>{servicoEmEdicao ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                        <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                    </div>
                    <form onSubmit={handleSalvar} className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label><input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (R$)</label><input type="number" required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duração (min)</label><input type="number" required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.duracaoMin} onChange={e => setForm({...form, duracaoMin: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retorno (dias)</label><input type="number" required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={form.diasRetorno} onChange={e => setForm({...form, diasRetorno: e.target.value})} /></div>
                        </div>
                        <button type="submit" className="w-full text-white py-3 rounded-xl font-bold text-lg shadow-lg mt-4 transition-transform active:scale-95" style={{ backgroundColor: corPrincipal }}>{servicoEmEdicao ? 'Salvar Alterações' : 'Cadastrar'}</button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}