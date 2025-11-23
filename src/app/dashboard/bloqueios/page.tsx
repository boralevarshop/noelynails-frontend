'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BloqueiosPage() {
  const router = useRouter();
  const [bloqueios, setBloqueios] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [novoBloqueio, setNovoBloqueio] = useState({
    profissionalId: '',
    data: '',
    horaInicio: '',
    horaFim: '',
    motivo: ''
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    // Se for profissional, já fixa o ID dele
    if (user.role === 'PROFISSIONAL') {
        setNovoBloqueio(prev => ({ ...prev, profissionalId: user.id }));
    }

    carregarDados(user);
  }, []);

  const carregarDados = async (user: any) => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        let urlBloqueios = '';
        
        // 1. Busca Profissionais (se for dono)
        if (user.role !== 'PROFISSIONAL') {
            urlBloqueios = `${apiUrl}/blocks/tenant/${user.tenant.id}`;
            const resProf = await fetch(`${apiUrl}/professionals/tenant/${user.tenant.id}`);
            if (resProf.ok) {
                setProfissionais(await resProf.json());
            }
        } else {
            urlBloqueios = `${apiUrl}/blocks/professional/${user.id}`;
        }

        // 2. Busca Bloqueios com Proteção
        const res = await fetch(urlBloqueios);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                setBloqueios(data);
            } else {
                setBloqueios([]);
            }
        } else {
            console.error("Erro API Bloqueios:", res.status);
            setBloqueios([]);
        }

    } catch (error) { 
        console.error(error);
        setBloqueios([]);
    }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    try {
        const inicioISO = new Date(`${novoBloqueio.data}T${novoBloqueio.horaInicio}:00`).toISOString();
        const fimISO = new Date(`${novoBloqueio.data}T${novoBloqueio.horaFim}:00`).toISOString();

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantId: usuario.tenant.id,
                profissionalId: novoBloqueio.profissionalId || usuario.id,
                inicio: inicioISO,
                fim: fimISO,
                motivo: novoBloqueio.motivo
            })
        });

        if (res.ok) {
            alert('Horário bloqueado com sucesso!');
            carregarDados(usuario);
            setNovoBloqueio(prev => ({ ...prev, motivo: '', horaInicio: '', horaFim: '' }));
        } else {
            alert('Erro ao bloquear. Verifique as datas.');
        }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('Desbloquear este horário?')) return;
      try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          await fetch(`${apiUrl}/blocks/${id}`, { method: 'DELETE' });
          setBloqueios(bloqueios.filter(b => b.id !== id));
      } catch (error) { alert('Erro ao excluir'); }
  };

  if (!usuario) return <div className="p-10">Carregando...</div>;

  const isDono = usuario.role !== 'PROFISSIONAL';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bloqueios de Agenda</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Formulário */}
            <div className="bg-white p-6 rounded-lg shadow h-fit">
                <h2 className="text-lg font-semibold mb-4 text-red-600">Bloquear Horário</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    
                    {isDono && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Profissional</label>
                            <select 
                                required 
                                className="mt-1 block w-full rounded border-gray-300 border p-2"
                                value={novoBloqueio.profissionalId}
                                onChange={e => setNovoBloqueio({...novoBloqueio, profissionalId: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {profissionais.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                                <option value={usuario.id}>Eu mesmo ({usuario.nome})</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dia</label>
                        <input type="date" required className="mt-1 block w-full rounded border-gray-300 border p-2" value={novoBloqueio.data} onChange={e => setNovoBloqueio({...novoBloqueio, data: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Início</label>
                            <input type="time" required className="mt-1 block w-full rounded border-gray-300 border p-2" value={novoBloqueio.horaInicio} onChange={e => setNovoBloqueio({...novoBloqueio, horaInicio: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Fim</label>
                            <input type="time" required className="mt-1 block w-full rounded border-gray-300 border p-2" value={novoBloqueio.horaFim} onChange={e => setNovoBloqueio({...novoBloqueio, horaFim: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Motivo (Opcional)</label>
                        <input type="text" className="mt-1 block w-full rounded border-gray-300 border p-2" placeholder="Ex: Médico, Almoço" value={novoBloqueio.motivo} onChange={e => setNovoBloqueio({...novoBloqueio, motivo: e.target.value})} />
                    </div>

                    <button type="submit" className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 font-bold">
                        Bloquear
                    </button>
                </form>
            </div>

            {/* Lista de Bloqueios */}
            <div className="md:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Horários Bloqueados</h2>
                {bloqueios.length === 0 ? <p className="text-gray-500">Agenda totalmente livre.</p> : (
                    <ul className="space-y-3">
                        {bloqueios.map(b => (
                            <li key={b.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">
                                        {new Date(b.inicio).toLocaleDateString('pt-BR')} • {new Date(b.inicio).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})} até {new Date(b.fim).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {b.motivo || 'Sem motivo'} 
                                        {isDono && b.profissional && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-2">{b.profissional.nome}</span>}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                                    Desbloquear
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