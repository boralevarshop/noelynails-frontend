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
      'INDIVIDUAL': '#059669', // Verde Esmeralda (Escuro para ler no branco)
      'PRIME': '#4C7FBE',      // Azul
      'SUPREME': '#7B5CFF'     // Roxo
  };
  const corTextoPlano = coresPlanos[tenant.plano] || '#000000';
  // --------------------------------

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
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Sua Assinatura</h1>
            
            {/* CARD DE STATUS DO PLANO ATUAL */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white shadow-sm border border-gray-200">
                <span className="text-gray-500 font-medium">Plano Atual:</span>
                
                {/* NOME DO PLANO COLORIDO */}
                <span 
                    className="font-extrabold text-xl tracking-wide uppercase" 
                    style={{ color: corTextoPlano }}
                >
                    {tenant.plano}
                </span>
                
                {/* ETIQUETAS DE TRIAL */}
                {isTrial && diasRestantes > 0 && (
                    <span className="ml-2 bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold border border-green-200 animate-pulse">
                        TESTE: {diasRestantes} DIAS RESTANTES
                    </span>
                )}
                {isTrial && diasRestantes <= 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded-full font-bold border border-red-200">
                        TESTE EXPIRADO
                    </span>
                )}
            </div>
          </div>

          <button 
                onClick={() => router.push('/dashboard')} 
                className="px-4 py-2 rounded-lg font-bold border-2 transition-colors flex items-center gap-2 hover:bg-gray-50"
                style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff"}}
             >
                <span>←</span> ← Voltar
             </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {planos.map(plano => (
                <div key={plano.id} className={`relative bg-white rounded-xl shadow-lg overflow-hidden border-2 ${tenant.plano === plano.id ? 'border-green-500 transform scale-105 z-10' : 'border-transparent'} flex flex-col transition-all duration-300`}>
                    
                    {tenant.plano === plano.id && (
                        <div className="bg-green-500 text-white text-center text-xs font-bold py-1 shadow-sm">PLANO ATUAL</div>
                    )}

                    <div className={`p-4 ${plano.corHeader} ${plano.corTexto}`}>
                        <h3 className="text-lg font-bold">{plano.nome}</h3>
                        <p className="text-2xl font-extrabold mt-1">{plano.preco}<span className="text-xs font-normal opacity-80">/mês</span></p>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                        <ul className="space-y-3 mb-6">
                            {plano.recursos.map((rec, i) => (
                                <li key={i} className="flex items-start text-xs text-gray-600">
                                    <span className="mr-2 text-green-500 font-bold text-sm">✓</span> {rec}
                                </li>
                            ))}
                        </ul>

                        {tenant.plano !== plano.id && plano.id !== 'FREE' && (
                            <button 
                                disabled={loadingPay}
                                className="w-full py-3 rounded-lg font-bold text-sm border-2 hover:bg-opacity-10 transition-colors"
                                style={{ borderColor: coresPlanos[plano.id] || '#000', color: coresPlanos[plano.id] || '#000' }}
                                onClick={() => handleAssinar(plano.id)}
                            >
                                {loadingPay ? 'Gerando...' : `Assinar ${plano.nome.split(' ')[0]}`}
                            </button>
                        )}
                        
                        {tenant.plano !== 'FREE' && plano.id === 'FREE' && (
                             <button 
                                className="w-full py-3 rounded-lg font-bold text-sm border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                                onClick={() => alert('Para cancelar, entre em contato com o suporte via WhatsApp.')}
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
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Pagamento via Pix 💸</h3>
                    <p className="text-sm text-gray-500 mb-6">Escaneie o QR Code ou copie o link abaixo para liberar seu acesso.</p>
                    
                    {/* QR CODE */}
                    <div className="flex justify-center mb-6 p-2 bg-white border rounded-lg inline-block mx-auto">
                        <QRCodeSVG value={dadosPix.code} size={180} />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6 break-all border border-gray-200">
                        <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Link da Fatura / Boleto</p>
                        <a href={dadosPix.url} target="_blank" className="text-indigo-600 font-bold text-sm hover:underline block">
                            Abrir Fatura no Navegador ↗
                        </a>
                    </div>

                    <button 
                        onClick={() => setModalPix(false)}
                        className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: corTextoPlano }}
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