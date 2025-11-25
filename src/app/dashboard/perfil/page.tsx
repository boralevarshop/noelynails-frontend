'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Abas: 'dados' ou 'senha'
  const [abaAtiva, setAbaAtiva] = useState('dados');

  // Formulário de Dados Pessoais
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    bio: '',
    instagram: '',
    avatarUrl: ''
  });

  // Formulário de Senha
  const [formSenha, setFormSenha] = useState({
    nova: '',
    confirmacao: ''
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }
    const userLocal = JSON.parse(dadosSalvos);
    
    // Busca dados frescos do banco (para pegar bio e instagram atualizados)
    fetchUsuarioCompleto(userLocal.id);
  }, []);

  const fetchUsuarioCompleto = async (id: string) => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/users/${id}`);
        if (res.ok) {
            const dados = await res.json();
            setUsuario(dados);
            // Preenche formulário
            setFormData({
                nome: dados.nome || '',
                telefone: dados.telefone || '',
                bio: dados.bio || '',
                instagram: dados.instagram || '',
                avatarUrl: dados.avatarUrl || ''
            });
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/users/${usuario.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert('Perfil atualizado com sucesso!');
            // Atualiza localStorage para refletir nome novo no topo
            const userLocal = JSON.parse(localStorage.getItem('usuario_saas') || '{}');
            userLocal.nome = formData.nome;
            localStorage.setItem('usuario_saas', JSON.stringify(userLocal));
            window.location.reload(); // Recarrega para atualizar topo
        } else {
            alert('Erro ao atualizar perfil.');
        }
    } catch (error) {
        alert('Erro de conexão.');
    } finally {
        setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSenha.nova.length < 3) {
        alert('A senha deve ter pelo menos 3 caracteres.');
        return;
    }
    if (formSenha.nova !== formSenha.confirmacao) {
        alert('As senhas não coincidem!');
        return;
    }

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/users/${usuario.id}/password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha: formSenha.nova })
        });

        if (res.ok) {
            alert('Senha alterada com sucesso! 🎉');
            setFormSenha({ nova: '', confirmacao: '' });
        } else {
            alert('Erro ao alterar senha.');
        }
    } catch (error) { alert('Erro de conexão.'); }
  };

  if (loading) return <div className="p-10 text-center">Carregando perfil...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
            
            {/* Cabeçalho do Perfil */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex items-center gap-6">
                <div className="relative">
                    {usuario.avatarUrl ? (
                        <img src={usuario.avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full border-4 border-white object-cover bg-gray-300" />
                    ) : (
                        <div className="h-24 w-24 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-4xl font-bold">
                            {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{usuario.nome}</h2>
                    <p className="text-indigo-100">{usuario.email}</p>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded mt-2 inline-block uppercase tracking-wider">
                        {usuario.role.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Navegação de Abas */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setAbaAtiva('dados')}
                    className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${abaAtiva === 'dados' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    📝 Dados Pessoais
                </button>
                <button 
                    onClick={() => setAbaAtiva('senha')}
                    className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${abaAtiva === 'senha' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    🔒 Segurança
                </button>
            </div>

            <div className="p-6">
                
                {/* ABA DADOS PESSOAIS */}
                {abaAtiva === 'dados' && (
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                <input 
                                    type="text" required 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.nome}
                                    onChange={e => setFormData({...formData, nome: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
                                <input 
                                    type="text" required 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.telefone}
                                    onChange={e => setFormData({...formData, telefone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link da Foto (Avatar)</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://..."
                                value={formData.avatarUrl}
                                onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Cole o link de uma imagem sua (ex: Instagram, LinkedIn).</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instagram</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400">@</span>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="seu.instagram"
                                    value={formData.instagram}
                                    onChange={e => setFormData({...formData, instagram: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio / Especialidades</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                placeholder="Ex: Especialista em Mega Hair e Colorimetria..."
                                value={formData.bio}
                                onChange={e => setFormData({...formData, bio: e.target.value})}
                            />
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ABA SENHA */}
                {abaAtiva === 'senha' && (
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md mx-auto py-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
                            <input 
                                type="password" required 
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formSenha.nova}
                                onChange={e => setFormSenha({...formSenha, nova: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Nova Senha</label>
                            <input 
                                type="password" required 
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formSenha.confirmacao}
                                onChange={e => setFormSenha({...formSenha, confirmacao: e.target.value})}
                            />
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black transition-colors">
                                Atualizar Senha
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}