'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  const rolarParaPlanos = () => {
    const section = document.getElementById('planos');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
              <span className="text-xl font-bold text-indigo-900">Agendim</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={rolarParaPlanos} className="text-gray-600 hover:text-indigo-600 font-medium">Planos</button>
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Entrar</Link>
              <Link href="/cadastro" className="bg-indigo-600 text-white px-5 py-2 rounded-full font-bold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-200">
                Criar Conta Grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (TOPO) --- */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase mb-6 inline-block">
            🚀 O sistema nº 1 para pequenos negócios
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Sua agenda cheia,<br />
            <span className="text-indigo-600">sem perder tempo no WhatsApp.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            O **Agendim** organiza seus horários, envia lembretes automáticos e cobra seus clientes via Pix. Tudo no piloto automático.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link href="/cadastro" className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              Começar Grátis Agora
            </Link>
            <button onClick={rolarParaPlanos} className="w-full md:w-auto bg-white text-indigo-600 border-2 border-indigo-100 px-8 py-4 rounded-xl font-bold text-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all">
              Ver Planos e Preços
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500">✨ Sem cartão de crédito • Cancele quando quiser</p>

          {/* Imagem do Sistema (Mockup) */}
          <div className="mt-16 relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-indigo-600 blur-3xl opacity-10 rounded-full transform translate-y-10"></div>
            <img src="https://placehold.co/1200x700/F3F4F6/4F46E5?text=Painel+do+Agendim" alt="Dashboard do Sistema" className="relative rounded-2xl shadow-2xl border-4 border-white" />
          </div>
        </div>
      </section>

      {/* --- MULTI-NICHO (PARA QUEM É) --- */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Perfeito para o seu negócio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: '💇‍♀️', title: 'Salão de Beleza', desc: 'Manicures, Cabelereiros' },
              { icon: '💈', title: 'Barbearia', desc: 'Barba, Cabelo e Bigode' },
              { icon: '🏥', title: 'Saúde & Clínica', desc: 'Dentistas, Nutricionistas' },
              { icon: '🐶', title: 'Petshops', desc: 'Banho, Tosa e Veterinário' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100 hover:border-indigo-100 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- RECURSOS (BENEFÍCIOS) --- */}
      <section className="py-20 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Seu assistente pessoal 24 horas por dia</h2>
                    <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">🤖</div>
                            <div>
                                <h3 className="font-bold text-lg">Robô de WhatsApp</h3>
                                <p className="text-gray-400">Confirmação automática e lembretes para reduzir o não comparecimento.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">🌍</div>
                            <div>
                                <h3 className="font-bold text-lg">Site de Agendamento Próprio</h3>
                                <p className="text-gray-400">Seu cliente agenda sozinho pelo link na bio do Instagram.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">💸</div>
                            <div>
                                <h3 className="font-bold text-lg">Pagamento Online</h3>
                                <p className="text-gray-400">Receba via Pix e cartão sem precisar cobrar ninguém.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="relative">
                    {/* Simulação de Celular com Notificação */}
                    <div className="bg-white text-gray-900 p-6 rounded-3xl shadow-2xl max-w-sm mx-auto rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">Z</div>
                            <div>
                                <p className="font-bold text-sm">Zappy (Agendim)</p>
                                <p className="text-xs text-gray-500">Agora</p>
                            </div>
                        </div>
                        <p className="text-sm bg-green-50 p-3 rounded-lg rounded-tl-none border border-green-100">
                            Olá! 👋 Seu agendamento para <strong>Sexta, 14:00</strong> foi confirmado! Te esperamos lá. 💅
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- PLANOS (PRICING) --- */}
      <section id="planos" className="py-24 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos que cabem no bolso</h2>
          <p className="text-gray-600 mb-12">Comece grátis e cresça com a gente.</p>

          <div className="grid md:grid-cols-4 gap-6">
            {/* FREE */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-gray-200">
              <h3 className="font-bold text-gray-500 uppercase text-sm mb-2">Iniciante</h3>
              <div className="text-4xl font-extrabold text-gray-900 mb-4">Grátis</div>
              <ul className="text-left space-y-3 mb-8 text-sm text-gray-600">
                <li>✅ 1 Profissional (Você)</li>
                <li>✅ 20 Agendamentos/mês</li>
                <li>🚫 Sem WhatsApp</li>
              </ul>
              <Link href="/cadastro" className="block w-full py-3 rounded-lg border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Criar Conta</Link>
            </div>

            {/* INDIVIDUAL */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-green-400 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full bg-green-500 text-white text-xs font-bold py-1">POPULAR</div>
              <h3 className="font-bold text-green-600 uppercase text-sm mb-2 mt-2">Individual</h3>
              <div className="text-4xl font-extrabold text-gray-900 mb-4">R$ 24<small className="text-lg">,90</small></div>
              <ul className="text-left space-y-3 mb-8 text-sm text-gray-600">
                <li>✅ 1 Profissional (Você)</li>
                <li>✅ <strong>Agendamentos Ilimitados</strong></li>
                <li>✅ <strong>WhatsApp Confirm.</strong></li>
              </ul>
              <Link href="/cadastro" className="block w-full py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg hover:shadow-green-200">Escolher este</Link>
            </div>

            {/* PRIME */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200">
              <h3 className="font-bold text-blue-600 uppercase text-sm mb-2">Equipe</h3>
              <div className="text-4xl font-extrabold text-gray-900 mb-4">R$ 49<small className="text-lg">,90</small></div>
              <ul className="text-left space-y-3 mb-8 text-sm text-gray-600">
                <li>✅ Até 4 Profissionais</li>
                <li>✅ Agendamentos Ilimitados</li>
                <li>✅ WhatsApp Completo</li>
              </ul>
              <Link href="/cadastro" className="block w-full py-3 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">Escolher este</Link>
            </div>

            {/* SUPREME */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200">
              <h3 className="font-bold text-purple-600 uppercase text-sm mb-2">Ilimitado</h3>
              <div className="text-4xl font-extrabold text-gray-900 mb-4">R$ 89<small className="text-lg">,90</small></div>
              <ul className="text-left space-y-3 mb-8 text-sm text-gray-600">
                <li>✅ Equipe Ilimitada</li>
                <li>✅ WhatsApp VIP</li>
                <li>✅ Gestão Financeira</li>
              </ul>
              <Link href="/cadastro" className="block w-full py-3 rounded-lg bg-purple-50 text-purple-600 font-bold hover:bg-purple-100">Escolher este</Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-200 py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">A</div>
          <span className="text-lg font-bold text-gray-800">Agendim</span>
        </div>
        <p className="text-gray-500 text-sm">© 2025 Agendim. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
            <a href="#" className="hover:text-indigo-600">Termos de Uso</a>
            <a href="#" className="hover:text-indigo-600">Privacidade</a>
            <a href="/login" className="hover:text-indigo-600">Login Cliente</a>
        </div>
      </footer>

    </div>
  );
}