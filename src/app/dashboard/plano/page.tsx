'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react'; // Vamos usar uma lib leve, se não tiver, usaremos texto puro

export default function PlanoPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  
  // Estados de Pagamento
  const [loadingPay, setLoadingPay] = useState(false);
  const [modalPix, setModalPix] = useState(false);
  const [dadosPix, setDadosPix] = useState({ code: '', url: '' });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${user.tenant.id}`)
        .then(res => res.json())
        .then(data => setTenant(data));
  }, []);

  const handleAssinar = async (planoId: string) => {
      if (!confirm(`Confirmar assinatura do plano ${planoId}?`)) return;
      setLoadingPay(true);

      try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const res = await fetch(`${apiUrl}/billing/subscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tenantId: usuario.tenant.id,
                  planoId: planoId
              })
          });

          const data = await res.json();

          if (res.ok) {
              setDadosPix({ code: data.pixUrl, url: data.pixUrl }); // O Asaas retorna a URL da fatura
              setModalPix(true);
          } else {
              alert(`Erro: ${data.message}`);
          }
      } catch (error) {
          alert('Erro de conexão com o pagamento.');
      } finally {
          setLoadingPay(false);
      }
  };

  if (!tenant) return <div className="p-10">Carregando...</div>;

  const isTrial = tenant.statusAssinatura === 'TRIAL';
  const diasRestantes = tenant.trialFim 
    ? Math.ceil((new Date(tenant.trialFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  // Cores (usando padrão se não tiver)
  const corPrincipal = tenant.corPrimaria || '#4F46E5';
  const corFundo = tenant.corSecundaria || '#F3F4F6';

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
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sua Assinatura</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
                Plano Atual: <span className="font-bold" style={{ color: corPrincipal }}>{tenant.plano}</span>
                
                {isTrial && diasRestantes > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold border border-green-200">
                        TESTE: {diasRestantes} DIAS RESTANTES
                    </span>
                )}
                {isTrial && diasRestantes <= 0 && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold border border-red-200">
                        TESTE EXPIRADO
                    </span>
                )}
            </p>
          </div>
          <button 
                onClick={() => router.push('/dashboard')} 
                className="px-4 py-2 rounded-lg font-bold border-2 transition-colors flex items-center gap-2 hover:bg-gray-50"
                style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff"}}
             >
                <span>←</span> Voltar ao Painel
             </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {planos.map(plano => (
                <div key={plano.id} className={`relative bg-white rounded-xl shadow-lg overflow-hidden border-2 ${tenant.plano === plano.id ? 'border-green-500' : 'border-transparent'} flex flex-col`}>
                    
                    {tenant.plano === plano.id && (
                        <div className="bg-green-500 text-white text-center text-xs font-bold py-1">ATUAL</div>
                    )}

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
                                disabled={loadingPay}
                                className="w-full py-2 rounded-md font-bold text-xs border-2 hover:bg-opacity-10 transition-colors"
                                style={{ borderColor: corPrincipal, color: corPrincipal }}
                                onClick={() => handleAssinar(plano.id)}
                            >
                                {loadingPay ? 'Gerando...' : 'Assinar'}
                            </button>
                        )}
                        
                        {tenant.plano !== 'FREE' && plano.id === 'FREE' && (
                             <button 
                                className="w-full py-2 rounded-md font-bold text-xs border-2 border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                                onClick={() => alert('Para cancelar, entre em contato com o suporte.')}
                            >
                                Cancelar Assinatura
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* MODAL DE PIX */}
        {modalPix && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Pagamento via Pix 💸</h3>
                    <p className="text-sm text-gray-500 mb-4">Pague para liberar seu acesso imediatamente.</p>
                    
                    <div className="bg-gray-100 p-4 rounded mb-4 break-all">
                        <p className="text-xs text-gray-500 mb-1">Link da Fatura:</p>
                        <a href={dadosPix.url} target="_blank" className="text-blue-600 font-bold text-sm underline">
                            Clique aqui para abrir o Pix/Boleto
                        </a>
                    </div>

                    <button 
                        onClick={() => setModalPix(false)}
                        className="w-full text-white py-3 rounded-lg font-bold"
                        style={{ backgroundColor: corPrincipal }}
                    >
                        Já paguei! Fechar
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}