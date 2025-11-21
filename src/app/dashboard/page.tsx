'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    // 1. Tenta recuperar os dados salvos no login
    const dadosSalvos = localStorage.getItem('usuario_saas');
    
    if (!dadosSalvos) {
      // Se não tiver nada salvo, chuta de volta pro login
      router.push('/login');
      return;
    }

    setUsuario(JSON.parse(dadosSalvos));
  }, []);

  if (!usuario) return <div className="p-10">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra Superior */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">
                {usuario.tenant.nome}
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Olá, {usuario.nome}</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('usuario_saas');
                  router.push('/login');
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card de Estatística 1 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Agendamentos Hoje
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  0
                </dd>
              </div>
            </div>

            {/* Card de Estatística 2 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Faturamento Mês
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  R$ 0,00
                </dd>
              </div>
            </div>

            {/* Card de Ação Rápida */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
                  + Novo Agendamento
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}