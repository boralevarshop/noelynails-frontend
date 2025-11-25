'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlanoPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${user.tenant.id}`)
        .then(res => res.json())
        .then(data => setTenant(data));
  }, []);

  if (!tenant) return <div className="p-10">Carregando...</div>;

  const isTrial = tenant.statusAssinatura === 'TRIAL';
  const diasRestantes = tenant.trialFim 
    ? Math.ceil((new Date(tenant.trialFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const planos = [
    {
        id: 'FREE',
        nome: 'Free',
        preco: 'R$ 0,00',
        recursos: ['1 Profissional (Você)', 'Max. 20 Agendamentos/mês', 'Sem WhatsApp'],
        corHeader: 'bg-gray-500',
        corTexto: 'text-white'
    },
    {
        id: 'INDIVIDUAL',
        nome: 'Individual',
        preco: 'R$ 24,90',
        recursos: ['1 Profissional (Você)', 'Agendamentos Ilimitados', 'WhatsApp (Confirm. + Lembrete)'],
        corHeader: 'bg-[#AEEFD4]',
        corTexto: 'text-gray-800'
    },
    {
        id: 'PRIME',
        nome: 'Prime (Equipe)',
        preco: 'R$ 49,90',
        recursos: ['Até 4 Profissionais', 'Agendamentos Ilimitados', 'WhatsApp Completo'],
        corHeader: 'bg-[#4C7FBE]',
        corTexto: 'text-white',
        destaque: true
    },
    {
        id: 'SUPREME',
        nome: 'Supreme',
        preco: 'R$ 89,90',
        recursos: ['Equipe Ilimitada', 'WhatsApp + Resumos', 'Financeiro Completo', 'Suporte VIP'],
        corHeader: 'bg-[#7B5CFF]',
        corTexto: 'text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {planos.map(plano => (
                <div key={plano.id} className={`relative bg-white rounded-xl shadow-lg overflow-hidden border-2 ${tenant.plano === plano.id ? 'border-green-500' : 'border-transparent'} flex flex-col`}>
                    
                    {tenant.plano === plano.id && (
                        <div className="bg-green-500 text-white text-center text-xs font-bold py-1">
                            ATUAL
                        </div>
                    )}

                    {plano.destaque && tenant.plano !== plano.id && (
                        <div className="bg-indigo-100 text-indigo-800 text-center text-xs font-bold py-1">
                            MAIS POPULAR
                        </div>
                    )}

                    {/* HEADER DO CARD COM A COR PERSONALIZADA */}
                    <div className={`p-4 ${plano.corHeader} ${plano.corTexto}`}>
                        <h3 className="text-lg font-bold">{plano.nome}</h3>
                        <p className="text-2xl font-extrabold mt-1">{plano.preco}<span className="text-xs font-normal opacity-80">/mês</span></p>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                        <ul className="space-y-2 mb-4">
                            {plano.recursos.map((rec, i) => (
                                <li key={i} className="flex items-start text-xs text-gray-600">
                                    <span className="mr-2 text-green-500 font-bold">✓</span> {rec}
                                </li>
                            ))}
                        </ul>

                        {tenant.plano !== plano.id && plano.id !== 'FREE' && (
                            <button 
                                className="w-full py-2 rounded-md font-bold text-xs border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                onClick={() => alert(`Em breve: Assinar ${plano.nome} por ${plano.preco}`)}
                            >
                                Assinar
                            </button>
                        )}
                        
                        {tenant.plano !== 'FREE' && plano.id === 'FREE' && (
                             <button 
                                className="w-full py-2 rounded-md font-bold text-xs border-2 border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                                onClick={() => alert('Downgrade para Free irá limitar seus recursos.')}
                            >
                                Voltar p/ Free
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