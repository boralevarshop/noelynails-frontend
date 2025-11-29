'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PublicAgendamentoPage() {
  const params = useParams();
  const slug = params.slug;

  const [tenant, setTenant] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Inicializa como arrays vazios para evitar erro de .map
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [horariosLivres, setHorariosLivres] = useState<string[]>([]);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  
  const [busca, setBusca] = useState('');

  const [selecao, setSelecao] = useState({
    serviceId: '',
    serviceNome: '',
    servicePreco: 0,
    serviceDuracao: 0,
    professionalId: '',
    professionalNome: '',
    data: '',
    horario: '',
    clienteNome: '',
    clienteTelefone: ''
  });

  useEffect(() => { if (slug) buscarSalao(); }, [slug]);

  const buscarSalao = async () => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/tenants/slug/${slug}`);
        
        if (!res.ok) { 
            setLoading(false);
            alert('Salão não encontrado.'); 
            return; 
        }
        
        const dadosTenant = await res.json();
        setTenant(dadosTenant);

        const resServicos = await fetch(`${apiUrl}/services/tenant/${dadosTenant.id}`);
        if (resServicos.ok) {
            const listaServicos = await resServicos.json();
            setServicos(Array.isArray(listaServicos) ? listaServicos : []);
        } else {
            setServicos([]);
        }

        setLoading(false);
    } catch (error) { 
        console.error(error); 
        setLoading(false); 
    }
  };

  const buscarProfissionais = async (serviceId: string) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/professionals/tenant/${tenant.id}?serviceId=${serviceId}`);
      if (res.ok) {
          const lista = await res.json();
          setProfissionais(Array.isArray(lista) ? lista : []);
      } else {
          setProfissionais([]);
      }
  };

  const buscarHorarios = async (data: string) => {
      if (!data || !selecao.professionalId || !selecao.serviceId) return;
      
      setBuscandoHorarios(true);
      setSelecao(prev => ({ ...prev, data }));

      try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const query = new URLSearchParams({
              tenantId: tenant.id,
              professionalId: selecao.professionalId,
              serviceId: selecao.serviceId,
              date: data
          });

          const res = await fetch(`${apiUrl}/appointments/availability?${query}`);
          if (res.ok) {
              const lista = await res.json();
              setHorariosLivres(Array.isArray(lista) ? lista : []);
          } else {
              setHorariosLivres([]);
          }
      } catch (e) { console.error(e); setHorariosLivres([]); }
      finally { setBuscandoHorarios(false); }
  };

  const avancarPasso = (dados: any) => {
      setSelecao(prev => ({ ...prev, ...dados }));
      setBusca(''); 
      
      if (step === 1 && dados.serviceId) {
          buscarProfissionais(dados.serviceId);
          setStep(2);
      }
      else if (step === 2) {
          setStep(3);
      }
      else if (step === 3 && dados.horario) {
          setStep(4);
      }
  };

  const voltarPasso = (novoPasso: number) => {
      setBusca('');
      setStep(novoPasso);
  };

  const finalizarAgendamento = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const dataHoraCombinada = new Date(`${selecao.data}T${selecao.horario}:00`).toISOString();
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const res = await fetch(`${apiUrl}/appointments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tenantId: tenant.id,
                  nomeCliente: selecao.clienteNome,
                  telefoneCliente: selecao.clienteTelefone,
                  serviceId: selecao.serviceId,
                  professionalId: selecao.professionalId,
                  dataHora: dataHoraCombinada
              })
          });

          if (res.ok) setStep(5);
          else {
              const erro = await res.json();
              alert(erro.message || 'Erro ao agendar.');
          }
      } catch (error) { alert('Erro de conexão.'); }
  };

  // Normalização para busca sem acento
  const normalizarTexto = (texto: string) => {
      return texto ? texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!tenant) return <div className="min-h-screen flex items-center justify-center text-red-500">Salão não encontrado ou fechado.</div>;

  const corPrincipal = tenant.corPrimaria || '#4F46E5';
  const corFundo = tenant.corSecundaria || '#F3F4F6';

  // Filtros Seguros
  const servicosFiltrados = Array.isArray(servicos) ? servicos.filter(s => 
      normalizarTexto(s.nome).includes(normalizarTexto(busca))
  ) : [];
  
  const profissionaisFiltrados = Array.isArray(profissionais) ? profissionais.filter(p => 
      normalizarTexto(p.nome).includes(normalizarTexto(busca))
  ) : [];

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4" style={{ backgroundColor: corFundo }}>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 text-center text-white" style={{ backgroundColor: corPrincipal }}>
            <h1 className="text-2xl font-bold">{tenant.nome}</h1>
            <p className="text-sm opacity-90">Agendamento Online</p>
        </div>

        <div className="p-6">
            
            {step === 1 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">1. Escolha o Serviço</h2>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar serviço..." 
                        className="w-full border rounded-lg p-3 mb-4 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': corPrincipal } as any}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {servicosFiltrados.length === 0 && <p className="text-center text-gray-400 py-4">Nenhum serviço encontrado.</p>}
                        {servicosFiltrados.map(serv => (
                            <div 
                                key={serv.id} 
                                onClick={() => avancarPasso({ serviceId: serv.id, serviceNome: serv.nome, servicePreco: serv.preco, serviceDuracao: serv.duracaoMin })}
                                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors"
                            >
                                <div>
                                    <p className="font-bold text-gray-800">{serv.nome}</p>
                                    <p className="text-xs text-gray-500">{serv.duracaoMin} min</p>
                                </div>
                                <p className="font-bold" style={{ color: corPrincipal }}>R$ {Number(serv.preco).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <button onClick={() => voltarPasso(1)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">2. Escolha o Profissional</h2>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar profissional..." 
                        className="w-full border rounded-lg p-3 mb-4 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': corPrincipal } as any}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />

                    {profissionaisFiltrados.length === 0 ? <p className="text-center text-gray-400 py-4">Nenhum profissional encontrado.</p> : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {profissionaisFiltrados.map(prof => (
                                <div 
                                    key={prof.id} 
                                    onClick={() => avancarPasso({ professionalId: prof.id, professionalNome: prof.nome })}
                                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-4 transition-colors"
                                >
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden" style={{ backgroundColor: corPrincipal }}>
                                        {prof.avatarUrl ? <img src={prof.avatarUrl} className="w-full h-full object-cover" /> : prof.nome.charAt(0)}
                                    </div>
                                    <p className="font-bold text-gray-800">{prof.nome}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div>
                    <button onClick={() => voltarPasso(2)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">3. Data e Hora</h2>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dia</label>
                    <input 
                        type="date" 
                        className="w-full border rounded-lg p-3 mb-4 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': corPrincipal } as any}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => buscarHorarios(e.target.value)}
                    />

                    {buscandoHorarios && <p className="text-center text-gray-500 animate-pulse">Buscando horários livres...</p>}

                    {selecao.data && !buscandoHorarios && (
                        <>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horários Livres</label>
                            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                {horariosLivres.length === 0 ? <p className="col-span-3 text-center text-gray-400 text-sm py-4">Sem horários livres neste dia.</p> : 
                                    horariosLivres.map(hora => (
                                    <button key={hora} onClick={() => avancarPasso({ horario: hora })} className="p-2 border rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                                        {hora}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {step === 4 && (
                <form onSubmit={finalizarAgendamento}>
                    <button type="button" onClick={() => voltarPasso(3)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">4. Seus Dados</h2>
                    <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-600 border">
                        <p><strong>{selecao.serviceNome}</strong> com {selecao.professionalNome}</p>
                        <p>{format(new Date(selecao.data), 'dd/MM')} às {selecao.horario}</p>
                        <p className="font-bold mt-1" style={{ color: corPrincipal }}>R$ {Number(selecao.servicePreco).toFixed(2)}</p>
                    </div>
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label><input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} onChange={e => setSelecao({...selecao, clienteNome: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label><input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} placeholder="11999999999" onChange={e => setSelecao({...selecao, clienteTelefone: e.target.value})} /></div>
                        <button type="submit" className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: corPrincipal }}>Confirmar Agendamento</button>
                    </div>
                </form>
            )}

            {step === 5 && (
                <div className="text-center py-10">
                    <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-bounce">✓</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Agendado!</h2>
                    <p className="text-gray-600 mb-8">Enviamos a confirmação no seu WhatsApp.</p>
                    <button onClick={() => window.location.reload()} className="font-bold hover:underline" style={{ color: corPrincipal }}>Fazer outro agendamento</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}