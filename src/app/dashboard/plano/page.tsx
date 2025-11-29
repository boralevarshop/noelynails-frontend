'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

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

    // Trava de segurança
    if (user.role !== 'DONO_SALAO' && user.role !== 'ADMIN_GLOBAL') {
        alert('Acesso restrito! Apenas o dono do salão pode gerenciar a assinatura.');
        router.push('/dashboard');
        return;
    }
    
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
              setDadosPix({ code: data.pixUrl, url: data.pixUrl });
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
  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant.corSecundaria || '#F3F4F6';

  // --- CORES DOS PLANOS (TEXTO) ---
  const coresPlanos: Record<string, string> = {
      'FREE': '#6B7280',       // Cinza
      'INDIVIDUAL': '#059669', // Verde
      'PRIME': '#2563EB',      // Azul Royal
      'SUPREME': '#7C3AED'     // Roxo Vibrante
  };
  const corTextoPlano = coresPlanos[tenant.plano] || '#000000';
  
  // --- CONFIGURAÇÃO DOS PLANOS ---
  const planos = [
    {
        id: 'FREE',
        nome: 'Grátis',
        preco: 'R$ 0,00',
        recursos: [
            '1 Profissional (Você)',
            'Max. 20 Agendamentos/mês',
            '🚫 Sem WhatsApp Automático'
        ],
        corHeader: 'bg-gray-500',
        corTexto: 'text-white',
        botaoTexto: 'Plano Atual'
    },
    {
        id: 'INDIVIDUAL',
        nome: 'Individual',
        preco: 'R$ 24,90',
        recursos: [
            '✅ 1 Profissional (Você)',
            '✅ Agendamentos Ilimitados',
            '✅ WhatsApp de Confirmação'
        ],
        corHeader: 'bg-emerald-500', // Verde
        corTexto: 'text-white',
        botaoTexto: 'Quero ser Individual'
    },
    {
        id: 'PRIME',
        nome: 'Prime (Equipe)',
        preco: 'R$ 49,90',
        recursos: [
            '👥 Até 4 Profissionais',
            '✅ Agendamentos Ilimitados',
            '✅ WhatsApp Completo',
            '✅ Cálculo de Comissões'
        ],
        corHeader: 'bg-blue-600', // Azul
        corTexto: 'text-white',
        destaque: true,
        botaoTexto: 'Quero ser Prime'
    },
    {
        id: 'SUPREME',
        nome: 'Supreme (Ilimitado)',
        preco: 'R$ 89,90',
        recursos: [
            '🚀 Equipe Ilimitada',
            '✅ WhatsApp VIP (Retenção)',
            '✅ Gestão Financeira Total',
            '✅ Suporte Prioritário'
        ],
        corHeader: 'bg-purple-600', // Roxo
        corTexto: 'text-white',
        botaoTexto: 'Quero ser Supreme'
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Gerenciar Assinatura</h1>
            
            {/* CARD DE STATUS DO PLANO ATUAL */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white shadow-sm border border-gray-200">
                <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">Seu Plano:</span>
                
                {/* NOME DO PLANO COLORIDO */}
                <span 
                    className="font-extrabold text-2xl tracking-tight" 
                    style={{ color: corTextoPlano }}
                >
                    {tenant.plano}
                </span>
                
                {/* ETIQUETAS DE TRIAL */}
                {isTrial && diasRestantes > 0 && (
                    <span className="ml-2 bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold border border-green-200 animate-pulse">
                        TESTE GRÁTIS: {diasRestantes} DIAS
                    </span>
                )}
                {isTrial && diasRestantes <= 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded-full font-bold border border-red-200">
                        EXPIRADO
                    </span>
                )}
            </div>
          </div>

          <button 
                onClick={() => router.push('/dashboard')} 
                className="px-4 py-2 rounded-lg font-bold border-2 transition-colors flex items-center gap-2 hover:bg-gray-50"
                style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff"}}
             >
                <span>←</span> Voltar
             </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {planos.map(plano => (
                <div key={plano.id} className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden border transition-all duration-300 flex flex-col ${tenant.plano === plano.id ? 'border-2 border-gray-800 transform scale-105 z-10 ring-4 ring-gray-100' : 'border-gray-200 hover:border-gray-300'}`}>
                    
                    {tenant.plano === plano.id && (
                        <div className="bg-gray-800 text-white text-center text-[10px] uppercase font-bold py-1 tracking-widest">Seu Plano Atual</div>
                    )}

                    <div className={`p-6 ${plano.corHeader} ${plano.corTexto}`}>
                        <h3 className="text-lg font-bold opacity-90">{plano.nome}</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <p className="text-3xl font-extrabold">{plano.preco}</p>
                            <span className="text-xs font-medium opacity-80">/mês</span>
                        </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                        <ul className="space-y-4 mb-8">
                            {plano.recursos.map((rec, i) => (
                                <li key={i} className="flex items-start text-sm text-gray-600">
                                    <span className="mr-3 text-green-500 font-bold text-base">✓</span> 
                                    <span className="leading-tight">{rec}</span>
                                </li>
                            ))}
                        </ul>

                        {tenant.plano !== plano.id && plano.id !== 'FREE' && (
                            <button 
                                disabled={loadingPay}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md ${plano.corHeader} text-white hover:opacity-90`}
                                onClick={() => handleAssinar(plano.id)}
                            >
                                {loadingPay ? 'Gerando Pix...' : plano.botaoTexto}
                            </button>
                        )}
                        
                        {tenant.plano === plano.id && (
                             <button disabled className="w-full py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-400 cursor-default">
                                Plano Ativo
                            </button>
                        )}

                        {tenant.plano !== 'FREE' && plano.id === 'FREE' && (
                             <button 
                                className="w-full py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                onClick={() => alert('Para cancelar, entre em contato com o suporte via WhatsApp.')}
                            >
                                Quero Cancelar
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* MODAL DE PIX */}
        {modalPix && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center relative">
                    <button onClick={() => setModalPix(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                    
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💸</div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Pagamento via Pix</h3>
                    <p className="text-sm text-gray-500 mb-6">Escaneie o QR Code ou clique no link para pagar e liberar na hora.</p>
                    
                    {/* QR CODE */}
                    <div className="flex justify-center mb-6 p-2 bg-white border-2 border-gray-100 rounded-xl inline-block mx-auto shadow-sm">
                        <QRCodeSVG value={dadosPix.code} size={180} />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl mb-6 break-all border border-gray-200">
                        <p className="text-[10px] text-gray-400 mb-2 uppercase font-bold tracking-wider">Link da Fatura</p>
                        <a href={dadosPix.url} target="_blank" className="text-indigo-600 font-bold text-sm hover:underline block">
                            Abrir Fatura / Copia e Cola ↗
                        </a>
                    </div>

                    <button 
                        onClick={() => setModalPix(false)}
                        className="w-full text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg bg-green-600"
                    >
                        Já realizei o pagamento
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}