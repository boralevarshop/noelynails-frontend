'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Lista de todos os serviços do salão (para ele marcar quais faz)
  const [todosServicos, setTodosServicos] = useState<any[]>([]);

  // Abas: 'dados', 'servicos', 'horarios', 'senha'
  const [abaAtiva, setAbaAtiva] = useState('dados');

  // Formulário de Dados Pessoais
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    bio: '',
    instagram: '',
    avatarUrl: '',
    servicosIds: [] as string[], // IDs dos serviços que ele faz
    horarios: {} as any // JSON dos dias e horas
  });

  // Formulário de Senha
  const [formSenha, setFormSenha] = useState({
    nova: '',
    confirmacao: ''
  });

  // Configuração padrão de horários (se estiver vazio)
  const diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const nomesDias: any = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }
    const userLocal = JSON.parse(dadosSalvos);
    
    carregarDados(userLocal);
  }, []);

  const carregarDados = async (userLocal: any) => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // 1. Busca dados completos do usuário
        const resUser = await fetch(`${apiUrl}/users/${userLocal.id}`);
        const dadosUser = await resUser.json();
        setUsuario(dadosUser);

        // 2. Busca todos os serviços do salão (para a checklist)
        const resServicos = await fetch(`${apiUrl}/services/tenant/${userLocal.tenant.id}`);
        const dadosServicos = await resServicos.json();
        setTodosServicos(dadosServicos);

        // 3. Preenche o formulário
        setFormData({
            nome: dadosUser.nome || '',
            telefone: dadosUser.telefone || '',
            bio: dadosUser.bio || '',
            instagram: dadosUser.instagram || '',
            avatarUrl: dadosUser.avatarUrl || '',
            // Mapeia os serviços que ele já tem
            servicosIds: dadosUser.servicosQueAtende ? dadosUser.servicosQueAtende.map((s: any) => s.id) : [],
            // Se não tiver horário salvo, cria um padrão
            horarios: dadosUser.horarios || criarHorarioPadrao()
        });

    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const criarHorarioPadrao = () => {
      const padrao: any = {};
      diasSemana.forEach(dia => {
          padrao[dia] = {
              ativo: dia !== 'dom', // Domingo folga por padrão
              inicio: '09:00',
              fim: '18:00'
          };
      });
      return padrao;
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
            // Atualiza localStorage para nome
            const userLocal = JSON.parse(localStorage.getItem('usuario_saas') || '{}');
            userLocal.nome = formData.nome;
            localStorage.setItem('usuario_saas', JSON.stringify(userLocal));
            // window.location.reload(); // Opcional
        } else {
            alert('Erro ao atualizar perfil.');
        }
    } catch (error) {
        alert('Erro de conexão.');
    } finally {
        setSaving(false);
    }
  };

  const toggleServico = (id: string) => {
      setFormData(prev => {
          const jaTem = prev.servicosIds.includes(id);
          if (jaTem) {
              return { ...prev, servicosIds: prev.servicosIds.filter(s => s !== id) };
          } else {
              return { ...prev, servicosIds: [...prev.servicosIds, id] };
          }
      });
  };

  const updateHorario = (dia: string, campo: string, valor: any) => {
      setFormData(prev => ({
          ...prev,
          horarios: {
              ...prev.horarios,
              [dia]: {
                  ...prev.horarios[dia],
                  [campo]: valor
              }
          }
      }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSenha.nova.length < 3) { alert('Senha muito curta.'); return; }
    if (formSenha.nova !== formSenha.confirmacao) { alert('Senhas não conferem.'); return; }

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/users/${usuario.id}/password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha: formSenha.nova })
        });

        if (res.ok) {
            alert('Senha alterada!');
            setFormSenha({ nova: '', confirmacao: '' });
        } else { alert('Erro ao alterar senha.'); }
    } catch (error) { alert('Erro de conexão.'); }
  };

  if (loading) return <div className="p-10 text-center">Carregando perfil...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
            
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex items-center gap-6">
                <div className="relative">
                    {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full border-4 border-white object-cover bg-gray-300" />
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
                        {usuario.role}
                    </span>
                </div>
            </div>

            {/* Navegação */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {['dados', 'servicos', 'horarios', 'senha'].map(aba => (
                    <button 
                        key={aba}
                        onClick={() => setAbaAtiva(aba)}
                        className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${abaAtiva === aba ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {aba === 'dados' && '📝 Dados'}
                        {aba === 'servicos' && '💅 Serviços'}
                        {aba === 'horarios' && '⏰ Horários'}
                        {aba === 'senha' && '🔒 Senha'}
                    </button>
                ))}
            </div>

            <div className="p-6">
                
                {/* ABA DADOS */}
                {abaAtiva === 'dados' && (
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                                <input type="text" required className="w-full border rounded-lg p-2.5" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
                                <input type="text" required className="w-full border rounded-lg p-2.5" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link da Foto</label>
                            <input type="text" className="w-full border rounded-lg p-2.5" placeholder="https://..." value={formData.avatarUrl} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio</label>
                            <textarea className="w-full border rounded-lg p-2.5 h-24 resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                        </div>
                        <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar Dados'}
                        </button>
                    </form>
                )}

                {/* ABA SERVIÇOS */}
                {abaAtiva === 'servicos' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">O que você atende?</h3>
                            <p className="text-sm text-gray-500">Selecione os serviços que você realiza. Apenas estes aparecerão para o cliente.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {todosServicos.map(serv => (
                                <div key={serv.id} onClick={() => toggleServico(serv.id)} className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${formData.servicosIds.includes(serv.id) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.servicosIds.includes(serv.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-400'}`}>
                                        {formData.servicosIds.includes(serv.id) && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{serv.nome}</p>
                                        <p className="text-xs text-gray-500">{serv.duracaoMin} min • R$ {serv.preco}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveProfile} disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">Salvar Serviços</button>
                    </div>
                )}

                {/* ABA HORÁRIOS */}
                {abaAtiva === 'horarios' && (
                    <div className="space-y-6">
                         <div>
                            <h3 className="text-lg font-bold text-gray-800">Seus Turnos</h3>
                            <p className="text-sm text-gray-500">Defina os dias e horários que você trabalha.</p>
                        </div>
                        <div className="space-y-3">
                            {diasSemana.map(dia => (
                                <div key={dia} className={`flex items-center justify-between p-3 rounded-lg border ${formData.horarios[dia]?.ativo ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-indigo-600 rounded"
                                            checked={formData.horarios[dia]?.ativo}
                                            onChange={(e) => updateHorario(dia, 'ativo', e.target.checked)}
                                        />
                                        <span className={`font-bold w-20 ${formData.horarios[dia]?.ativo ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {nomesDias[dia]}
                                        </span>
                                    </div>
                                    {formData.horarios[dia]?.ativo ? (
                                        <div className="flex items-center gap-2">
                                            <input type="time" className="border rounded p-1 text-sm" value={formData.horarios[dia]?.inicio} onChange={(e) => updateHorario(dia, 'inicio', e.target.value)} />
                                            <span className="text-gray-400">-</span>
                                            <input type="time" className="border rounded p-1 text-sm" value={formData.horarios[dia]?.fim} onChange={(e) => updateHorario(dia, 'fim', e.target.value)} />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 uppercase font-bold px-4">Folga</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveProfile} disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">Salvar Horários</button>
                    </div>
                )}

                {/* ABA SENHA */}
                {abaAtiva === 'senha' && (
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md mx-auto py-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
                            <input type="password" required className="w-full border rounded-lg p-2.5" value={formSenha.nova} onChange={e => setFormSenha({...formSenha, nova: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar</label>
                            <input type="password" required className="w-full border rounded-lg p-2.5" value={formSenha.confirmacao} onChange={e => setFormSenha({...formSenha, confirmacao: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black">Atualizar Senha</button>
                    </form>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}