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

  // Dados para seleção
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  
  // Dados do Agendamento
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

  // Carrega dados do salão pelo SLUG
  useEffect(() => {
    if (slug) buscarSalao();
  }, [slug]);

  const buscarSalao = async () => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        // Busca o salão pelo link (slug)
        const res = await fetch(`${apiUrl}/tenants/slug/${slug}`);
        
        if (!res.ok) {
            alert('Salão não encontrado!');
            return;
        }

        const dadosTenant = await res.json();
        setTenant(dadosTenant);

        // Já busca os serviços desse salão
        const resServicos = await fetch(`${apiUrl}/services/tenant/${dadosTenant.id}`);
        setServicos(await resServicos.json());

        setLoading(false);
    } catch (error) {
        console.error(error);
        setLoading(false);
    }
  };

  // Busca profissionais que fazem o serviço escolhido
  const buscarProfissionais = async (serviceId: string) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // Por enquanto busca todos, no futuro filtraremos por especialidade
      const res = await fetch(`${apiUrl}/professionals/tenant/${tenant.id}`);
      setProfissionais(await res.json());
  };

  const avancarPasso = (dados: any) => {
      setSelecao({ ...selecao, ...dados });
      if (dados.serviceId) buscarProfissionais(dados.serviceId);
      setStep(step + 1);
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

          if (res.ok) {
              setStep(5); // Tela de Sucesso
          } else {
              const erro = await res.json();
              alert(erro.message || 'Erro ao agendar.');
          }
      } catch (error) { alert('Erro de conexão.'); }
  };

  // Geração de horários simples (8h as 20h)
  const horarios = [];
  for (let h = 8; h <= 20; h++) {
      horarios.push(`${h.toString().padStart(2, '0')}:00`);
      horarios.push(`${h.toString().padStart(2, '0')}:30`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando salão...</div>;
  if (!tenant) return <div className="min-h-screen flex items-center justify-center">Salão não encontrado.</div>;

  const corPrincipal = tenant.corPrimaria || '#4F46E5';
  const corFundo = tenant.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4" style={{ backgroundColor: corFundo }}>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-6 text-center text-white" style={{ backgroundColor: corPrincipal }}>
            <h1 className="text-2xl font-bold">{tenant.nome}</h1>
            <p className="text-sm opacity-90">Agendamento Online</p>
        </div>

        <div className="p-6">
            
            {/* PASSO 1: SERVIÇOS */}
            {step === 1 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">1. Escolha o Serviço</h2>
                    <div className="space-y-3">
                        {servicos.map(serv => (
                            <div 
                                key={serv.id} 
                                onClick={() => avancarPasso({ serviceId: serv.id, serviceNome: serv.nome, servicePreco: serv.preco, serviceDuracao: serv.duracaoMin })}
                                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors"
                            >
                                <div>
                                    <p className="font-bold text-gray-800">{serv.nome}</p>
                                    <p className="text-xs text-gray-500">{serv.duracaoMin} min</p>
                                </div>
                                <p className="font-bold text-indigo-600" style={{ color: corPrincipal }}>R$ {Number(serv.preco).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PASSO 2: PROFISSIONAL */}
            {step === 2 && (
                <div>
                    <button onClick={() => setStep(1)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">2. Escolha o Profissional</h2>
                    <div className="space-y-3">
                        {profissionais.map(prof => (
                            <div 
                                key={prof.id} 
                                onClick={() => avancarPasso({ professionalId: prof.id, professionalNome: prof.nome })}
                                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-4 transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: corPrincipal }}>
                                    {prof.nome.charAt(0)}
                                </div>
                                <p className="font-bold text-gray-800">{prof.nome}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PASSO 3: DATA E HORA */}
            {step === 3 && (
                <div>
                    <button onClick={() => setStep(2)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">3. Data e Hora</h2>
                    
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dia</label>
                    <input 
                        type="date" 
                        className="w-full border rounded-lg p-3 mb-4 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': corPrincipal } as any}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelecao({...selecao, data: e.target.value})}
                    />

                    {selecao.data && (
                        <>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horários Disponíveis</label>
                            <div className="grid grid-cols-3 gap-2">
                                {horarios.map(hora => (
                                    <button 
                                        key={hora}
                                        onClick={() => avancarPasso({ horario: hora })}
                                        className="p-2 border rounded text-sm font-medium hover:bg-indigo-50 hover:border-indigo-500 transition-colors"
                                    >
                                        {hora}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* PASSO 4: IDENTIFICAÇÃO */}
            {step === 4 && (
                <form onSubmit={finalizarAgendamento}>
                    <button type="button" onClick={() => setStep(3)} className="text-xs text-gray-500 mb-4">← Voltar</button>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">4. Seus Dados</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Resumo: {selecao.serviceNome} com {selecao.professionalNome} <br/>
                        Dia {format(new Date(selecao.data), 'dd/MM')} às {selecao.horario}
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seu Nome</label>
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} 
                                onChange={e => setSelecao({...selecao, clienteNome: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seu WhatsApp</label>
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} 
                                placeholder="11999999999"
                                onChange={e => setSelecao({...selecao, clienteTelefone: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-2" style={{ backgroundColor: corPrincipal }}>
                            Confirmar Agendamento
                        </button>
                    </div>
                </form>
            )}

            {/* PASSO 5: SUCESSO */}
            {step === 5 && (
                <div className="text-center py-10">
                    <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                        ✓
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Agendado!</h2>
                    <p className="text-gray-600 mb-6">
                        Seu horário foi reservado com sucesso.<br/>
                        Enviamos a confirmação no seu WhatsApp.
                    </p>
                    <button onClick={() => window.location.reload()} className="text-indigo-600 font-bold hover:underline" style={{ color: corPrincipal }}>
                        Fazer outro agendamento
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}