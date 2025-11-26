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

  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [horariosLivres, setHorariosLivres] = useState<string[]>([]); // Novo estado
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  
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
        if (!res.ok) { alert('Salão fechado ou não encontrado.'); return; }
        
        const dadosTenant = await res.json();
        // Verifica se o salão permite agendamento online
        if (!dadosTenant.agendamentoOnline) {
            alert('Este salão desativou o agendamento online temporariamente.');
            return;
        }
        setTenant(dadosTenant);

        const resServicos = await fetch(`${apiUrl}/services/tenant/${dadosTenant.id}`);
        setServicos(await resServicos.json());
        setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };

  // Busca profissionais FILTRADOS pelo serviço e pela visibilidade
  const buscarProfissionais = async (serviceId: string) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/professionals/tenant/${tenant.id}?serviceId=${serviceId}`);
      setProfissionais(await res.json());
  };

  // Busca HORÁRIOS REAIS (Calculadora do Backend)
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
              setHorariosLivres(await res.json());
          }
      } catch (e) { console.error(e); }
      finally { setBuscandoHorarios(false); }
  };

  const avancarPasso = (dados: any) => {
      setSelecao(prev => ({ ...prev, ...dados }));
      
      if (step === 1 && dados.serviceId) {
          buscarProfissionais(dados.serviceId);
          setStep(2);
      }
      else if (step === 2) {
          // Ao escolher profissional, vai pra data (mas não busca horário ainda)
          setStep(3);
      }
      else if (step === 3 && dados.horario) {
          setStep(4);
      }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!tenant) return null;

  const corPrincipal = tenant.corPrimaria || '#4F46E5';
  const corFundo = tenant.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4" style={{ backgroundColor: corFundo }}>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 text-center text-white" style={{ backgroundColor: corPrincipal }}>
            <h1 className="text-2xl font-bold">{tenant.nome}</h1>
        </div>

        <div className="p-6">
            
            {step === 1 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">1. Escolha o Serviço</h2>
                    <div className="space-y-3">
                        {servicos.map(serv => (
                            <div key={serv.id} onClick={() => avancarPasso({ serviceId: serv.id, serviceNome: serv.nome, servicePreco: serv.preco })} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex justify-between items-center">
                                <p className="font-bold text-gray-800">{serv.nome}</p>
                                <p className="font-bold" style={{ color: corPrincipal }}>R$ {Number(serv.preco).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <button onClick={() => setStep(1)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">2. Escolha o Profissional</h2>
                    {profissionais.length === 0 ? <p>Nenhum profissional disponível para este serviço.</p> : (
                        <div className="space-y-3">
                            {profissionais.map(prof => (
                                <div key={prof.id} onClick={() => avancarPasso({ professionalId: prof.id, professionalNome: prof.nome })} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: corPrincipal }}>{prof.nome.charAt(0)}</div>
                                    <p className="font-bold text-gray-800">{prof.nome}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div>
                    <button onClick={() => setStep(2)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">3. Data e Hora</h2>
                    
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dia</label>
                    <input type="date" className="w-full border rounded-lg p-3 mb-4 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': corPrincipal } as any}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => buscarHorarios(e.target.value)}
                    />

                    {buscandoHorarios && <p className="text-center text-gray-500">Buscando horários...</p>}

                    {selecao.data && !buscandoHorarios && (
                        <>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horários Livres</label>
                            <div className="grid grid-cols-3 gap-2">
                                {horariosLivres.length === 0 ? <p className="col-span-3 text-center text-gray-400 text-sm">Sem horários livres.</p> : 
                                    horariosLivres.map(hora => (
                                    <button key={hora} onClick={() => avancarPasso({ horario: hora })} className="p-2 border rounded text-sm font-medium hover:bg-gray-50">
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
                    <button type="button" onClick={() => setStep(3)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">4. Seus Dados</h2>
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label><input required className="w-full border rounded-lg p-3" onChange={e => setSelecao({...selecao, clienteNome: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label><input required className="w-full border rounded-lg p-3" placeholder="11999999999" onChange={e => setSelecao({...selecao, clienteTelefone: e.target.value})} /></div>
                        <button type="submit" className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-2" style={{ backgroundColor: corPrincipal }}>Confirmar</button>
                    </div>
                </form>
            )}

            {step === 5 && (
                <div className="text-center py-10">
                    <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✓</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Agendado!</h2>
                    <button onClick={() => window.location.reload()} className="text-indigo-600 font-bold hover:underline" style={{ color: corPrincipal }}>Novo Agendamento</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}