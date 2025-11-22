'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  
  const [senhas, setSenhas] = useState({
    nova: '',
    confirmacao: ''
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    setUsuario(JSON.parse(dadosSalvos));
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (senhas.nova.length < 3) {
        alert('A senha deve ter pelo menos 3 caracteres.');
        return;
    }

    if (senhas.nova !== senhas.confirmacao) {
        alert('As senhas não coincidem!');
        return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/users/${usuario.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhas.nova })
      });

      if (res.ok) {
        alert('Senha alterada com sucesso! 🎉');
        setSenhas({ nova: '', confirmacao: '' });
      } else {
        alert('Erro ao alterar senha.');
      }
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  if (!usuario) return <p className="p-10">Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
            
            <div className="mb-8 flex items-center gap-4 border-b pb-6">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                    {usuario.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{usuario.nome}</h2>
                    <p className="text-gray-500">{usuario.email}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                        {usuario.role}
                    </span>
                </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-indigo-600">Alterar Senha</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                    <input 
                        type="password" 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-3"
                        placeholder="Digite a nova senha"
                        value={senhas.nova}
                        onChange={e => setSenhas({...senhas, nova: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                    <input 
                        type="password" 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-3"
                        placeholder="Digite novamente"
                        value={senhas.confirmacao}
                        onChange={e => setSenhas({...senhas, confirmacao: e.target.value})}
                    />
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 font-bold transition-colors">
                    Salvar Nova Senha
                </button>
            </form>

        </div>
      </div>
    </div>
  );
}