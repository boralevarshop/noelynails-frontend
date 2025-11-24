'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlanoPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    // Busca dados atualizados do salão
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${user.tenant.id}`)
        .then(res => res.json())
        .then(data => setTenant(data));
  }, []);

  if (!tenant) return <div className="p-10">Carregando...</div>;

  // Lógica visual do Trial
  const isTrial = tenant.statusAssinatura === 'TRIAL';
  const diasRestantes = tenant.trialFim 
    ? Math.ceil((new Date(tenant.trialFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const planos = [
    {
        id: 'FREE',
        nome: 'Free',
        preco: 'R$ 0,00',
        recursos: ['2 Profissionais (Dono + 1)', 'Max. 20 Agendamentos/mês', 'Sem WhatsApp'],
        cor: 'bg-gray-500'
    },
    {
        id: 'PRIME',
        nome: 'Prime',
        preco: 'R$ 49,90',
        recursos: ['Até 4 Profissionais', 'Agendamentos Ilimitados', 'WhatsApp Confirmação'],
        cor: 'bg-blue-600'
    },
    {
        id: 'SUPREME',
        nome: 'Supreme',
        preco: 'R$ 89,90',
        recursos: ['Profissionais Ilimitados', 'WhatsApp Completo (Lembretes)', 'Gestão Financeira'],
        cor: 'bg-yellow-500',
        destaque: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sua Assinatura</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
                Plano Atual: <span className="font-bold text-indigo-600">{tenant.plano}</span>
                
                {isTrial && diasRestantes > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold border border-green-200">
                        TESTE GRÁTIS: RESTAM {diasRestantes} DIAS
                    </span>
                )}
                
                {isTrial && diasRestantes <= 0 && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold border border-red-200">
                        TESTE EXPIRADO
                    </span>
                )}
            </p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planos.map(plano => (
                <div key={plano.id} className={`relative bg-white rounded-xl shadow-lg overflow-hidden border-2 ${tenant.plano === plano.id ? 'border-green-500' : 'border-transparent'} flex flex-col`}>
                    
                    {tenant.plano === plano.id && (
                        <div className="bg-green-500 text-white text-center text-xs font-bold py-1">
                            PLANO ATUAL
                        </div>
                    )}

                    <div className={`p-6 text-white ${plano.cor}`}>
                        <h3 className="text-xl font-bold">{plano.nome}</h3>
                        <p className="text-3xl font-extrabold mt-2">{plano.preco}<span className="text-sm font-normal">/mês</span></p>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                        <ul className="space-y-3 mb-6">
                            {plano.recursos.map((rec, i) => (
                                <li key={i} className="flex items-center text-sm text-gray-600">
                                    <span className="mr-2 text-green-500">✓</span> {rec}
                                </li>
                            ))}
                        </ul>

                        {/* Botão de Assinar */}
                        {tenant.plano !== plano.id && plano.id !== 'FREE' && (
                            <button 
                                className="w-full py-2 rounded-md font-bold text-sm border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                onClick={() => alert('Em breve: Integração Asaas para pagamento via Pix!')}
                            >
                                Assinar {plano.nome}
                            </button>
                        )}
                        
                        {/* Botão de Voltar pro Free */}
                        {tenant.plano !== 'FREE' && plano.id === 'FREE' && (
                             <button 
                                className="w-full py-2 rounded-md font-bold text-sm border-2 border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                                onClick={() => alert('Ao voltar para o Free, você perderá o WhatsApp e terá limite de agendamentos.')}
                            >
                                Voltar para o Free
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}