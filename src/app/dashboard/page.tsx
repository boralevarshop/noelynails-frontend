'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [todosServicos, setTodosServicos] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState('dados');

  // Form Usuário
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    bio: '',
    instagram: '',
    avatarUrl: '',
    aparecerNoSite: true,
    servicosIds: [] as string[],
    horarios: {} as any
  });

  // Form Salão (Com Segmento)
  const [formTenant, setFormTenant] = useState({
    nome: '',
    slug: '',
    telefone: '',
    corPrimaria: '#4F46E5',
    corSecundaria: '#F3F4F6',
    agendamentoOnline: true,
    segmento: 'SALAO_BELEZA' // <--- NOVO CAMPO
  });

  const [formSenha, setFormSenha] = useState({ nova: '', confirmacao: '' });

  const diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const nomesDias: any = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };

  const segmentos = [
    { id: 'SALAO_BELEZA', label: '💇‍♀️ Salão de Beleza / Manicure' },
    { id: 'BARBEARIA', label: '💈 Barbearia' },
    { id: 'CLINICA', label: '🏥 Clínica / Saúde' },
    { id: 'ESTETICA', label: '✨ Estética / Spa' },
    { id: 'PETSHOP', label: '🐶 Petshop' },
    { id: 'ESTUDIO_TATTOO', label: '🎨 Estúdio de Tatuagem' },
    { id: 'SERVICOS_GERAIS', label: '🏢 Escritório / Serviços Gerais' },
  ];

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const userLocal = JSON.parse(dadosSalvos);
    carregarDados(userLocal);
  }, []);

  const carregarDados = async (userLocal: any) => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const resUser = await fetch(`${apiUrl}/users/${userLocal.id}`);
        const dadosUser = await resUser.json();
        setUsuario(dadosUser);

        const resTenant = await fetch(`${apiUrl}/tenants/${userLocal.tenant.id}`);
        const dadosTenant = await resTenant.json();
        setTenant(dadosTenant);

        const resServicos = await fetch(`${apiUrl}/services/tenant/${userLocal.tenant.id}`);
        const dadosServicos = await resServicos.json();
        setTodosServicos(dadosServicos);

        setFormData({
            nome: dadosUser.nome || '',
            telefone: dadosUser.telefone || '',
            bio: dadosUser.bio || '',
            instagram: dadosUser.instagram || '',
            avatarUrl: dadosUser.avatarUrl || '',
            aparecerNoSite: dadosUser.aparecerNoSite !== false, 
            servicosIds: dadosUser.servicosQueAtende ? dadosUser.servicosQueAtende.map((s: any) => s.id) : [],
            horarios: dadosUser.horarios || criarHorarioPadrao()
        });

        setFormTenant({
            nome: dadosTenant.nome,
            slug: dadosTenant.slug,
            telefone: dadosTenant.telefone || '',
            corPrimaria: dadosTenant.corPrimaria || '#4F46E5',
            corSecundaria: dadosTenant.corSecundaria || '#F3F4F6',
            agendamentoOnline: dadosTenant.agendamentoOnline !== false,
            segmento: dadosTenant.segmento || 'SALAO_BELEZA' // Carrega o segmento
        });

    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const criarHorarioPadrao = () => {
      const padrao: any = {};
      diasSemana.forEach(dia => {
          padrao[dia] = { ativo: dia !== 'dom', inicio: '09:00', fim: '18:00' };
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
            alert('Perfil atualizado!');
            const userLocal = JSON.parse(localStorage.getItem('usuario_saas') || '{}');
            userLocal.nome = formData.nome;
            localStorage.setItem('usuario_saas', JSON.stringify(userLocal));
            window.location.reload();
        } else { alert('Erro ao atualizar.'); }
    } catch (error) { alert('Erro de conexão.'); } 
    finally { setSaving(false); }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/tenants/${tenant.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formTenant)
        });

        if (res.ok) {
            alert('Dados do salão atualizados!');
            const userLocal = JSON.parse(localStorage.getItem('usuario_saas') || '{}');
            userLocal.tenant.nome = formTenant.nome;
            userLocal.tenant.slug = formTenant.slug;
            localStorage.setItem('usuario_saas', JSON.stringify(userLocal));
            window.location.reload();
        } else {
            const erro = await res.json();
            alert(erro.message || 'Erro ao atualizar salão.');
        }
    } catch (error) { alert('Erro de conexão.'); }
    finally { setSaving(false); }
  };

  const toggleServico = (id: string) => {
      setFormData(prev => {
          const jaTem = prev.servicosIds.includes(id);
          if (jaTem) return { ...prev, servicosIds: prev.servicosIds.filter(s => s !== id) };
          else return { ...prev, servicosIds: [...prev.servicosIds, id] };
      });
  };

  const updateHorario = (dia: string, campo: string, valor: any) => {
      setFormData(prev => ({
          ...prev,
          horarios: { ...prev.horarios, [dia]: { ...prev.horarios[dia], [campo]: valor } }
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
        if (res.ok) { alert('Senha alterada!'); setFormSenha({ nova: '', confirmacao: '' }); } 
        else { alert('Erro ao alterar senha.'); }
    } catch (error) { alert('Erro de conexão.'); }
  };

  if (loading) return <div className="p-10 text-center">Carregando perfil...</div>;

  const isDono = usuario.role === 'DONO_SALAO' || usuario.role === 'ADMIN_GLOBAL';
  
  // Cores Dinâmicas
  const corPrincipal = formTenant.corPrimaria || '#4F46E5';
  const corFundo = formTenant.corSecundaria || '#F3F4F6';

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: tenant?.corSecundaria || '#F3F4F6' }}>
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
            
            {/* Cabeçalho */}
            <div className="p-6 text-white flex items-center gap-6" style={{ backgroundColor: tenant?.corPrimaria || '#4F46E5' }}>
                <div className="h-20 w-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-3xl font-bold">
                    {usuario.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{usuario.nome}</h2>
                    <p className="opacity-90">{usuario.email}</p>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded mt-2 inline-block uppercase tracking-wider">
                        {usuario.role.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Menu de Abas */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {['dados', 'servicos', 'horarios', 'senha'].map(aba => (
                    <button key={aba} onClick={() => setAbaAtiva(aba)} className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${abaAtiva === aba ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {aba === 'dados' && '📝 Dados Pessoais'}
                        {aba === 'servicos' && '💅 Meus Serviços'}
                        {aba === 'horarios' && '⏰ Meus Horários'}
                        {aba === 'senha' && '🔒 Senha'}
                    </button>
                ))}
                {isDono && (
                    <button onClick={() => setAbaAtiva('salao')} className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${abaAtiva === 'salao' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        🏪 Meu Salão
                    </button>
                )}
            </div>

            <div className="p-6">
                
                {/* ABA DADOS */}
                {abaAtiva === 'dados' && (
                    <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label><input type="text" required className="w-full border rounded-lg p-2.5" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label><input type="text" required className="w-full border rounded-lg p-2.5" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instagram</label><input type="text" className="w-full border rounded-lg p-2.5" placeholder="@seu.perfil" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} /></div>
                        
                        <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <input type="checkbox" id="aparecerNoSite" className="w-5 h-5 text-indigo-600 rounded cursor-pointer" checked={formData.aparecerNoSite} onChange={e => setFormData({...formData, aparecerNoSite: e.target.checked})} />
                            <label htmlFor="aparecerNoSite" className="text-sm text-gray-700 font-medium cursor-pointer">Permitir que clientes agendem comigo pelo site</label>
                        </div>

                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio</label><textarea className="w-full border rounded-lg p-2.5 h-24 resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /></div>
                        <button type="submit" disabled={saving} className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: tenant?.corPrimaria || '#4F46E5' }}>Salvar Dados</button>
                    </form>
                )}

                {/* ABA SALÃO (SÓ DONO) */}
                {abaAtiva === 'salao' && isDono && (
                    <form onSubmit={handleSaveTenant} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div><h3 className="text-lg font-bold text-gray-800">Configurações do Salão</h3><p className="text-sm text-gray-500">Personalize sua página pública.</p></div>

                                {/* SELETOR DE SEGMENTO (NOVO) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Segmento / Tipo</label>
                                    <select 
                                        className="w-full border rounded-lg p-2.5 bg-white outline-none focus:ring-2"
                                        style={{ '--tw-ring-color': corPrincipal } as any}
                                        value={formTenant.segmento}
                                        onChange={e => setFormTenant({...formTenant, segmento: e.target.value})}
                                    >
                                        {segmentos.map(seg => (
                                            <option key={seg.id} value={seg.id}>{seg.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">Isso muda os ícones e termos usados no sistema.</p>
                                </div>

                                <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg border border-green-100">
                                    <input type="checkbox" id="agendamentoOnline" className="w-5 h-5 text-green-600 rounded cursor-pointer" checked={formTenant.agendamentoOnline} onChange={e => setFormTenant({...formTenant, agendamentoOnline: e.target.checked})} />
                                    <div><label htmlFor="agendamentoOnline" className="text-sm font-bold text-gray-800 cursor-pointer block">Site de Agendamento Ativo</label><p className="text-xs text-gray-500">Se desmarcar, seu link público mostrará "Fechado".</p></div>
                                </div>

                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Salão</label><input type="text" required className="w-full border rounded-lg p-2.5" value={formTenant.nome} onChange={e => setFormTenant({...formTenant, nome: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link (Slug)</label><div className="flex items-center border rounded-lg bg-gray-50 px-3"><span className="text-gray-500 text-sm">agendar.../</span><input type="text" required className="w-full p-2.5 bg-transparent outline-none font-bold" style={{ color: corPrincipal }} value={formTenant.slug} onChange={e => setFormTenant({...formTenant, slug: e.target.value})} /></div></div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cor Principal</label><div className="flex gap-2"><input type="color" className="h-10 w-10 rounded cursor-pointer border-0" value={formTenant.corPrimaria} onChange={e => setFormTenant({...formTenant, corPrimaria: e.target.value})} /><input type="text" className="w-full border rounded-lg p-2.5 uppercase text-sm" value={formTenant.corPrimaria} onChange={e => setFormTenant({...formTenant, corPrimaria: e.target.value})} /></div></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cor de Fundo</label><div className="flex gap-2"><input type="color" className="h-10 w-10 rounded cursor-pointer border-0" value={formTenant.corSecundaria} onChange={e => setFormTenant({...formTenant, corSecundaria: e.target.value})} /><input type="text" className="w-full border rounded-lg p-2.5 uppercase text-sm" value={formTenant.corSecundaria} onChange={e => setFormTenant({...formTenant, corSecundaria: e.target.value})} /></div></div>
                                </div>
                                
                                <button type="submit" disabled={saving} className="w-full text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50" style={{ backgroundColor: corPrincipal }}>Salvar Alterações</button>
                            </div>

                            <div className="border rounded-xl overflow-hidden shadow-lg flex flex-col h-80">
                                <div className="bg-gray-100 p-2 text-xs text-center font-bold text-gray-500 border-b">PRÉ-VISUALIZAÇÃO</div>
                                <div className="flex-1 flex flex-col" style={{ backgroundColor: corFundo }}>
                                    <div className="h-12 flex items-center justify-between px-4 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                                        <div className="font-bold text-sm" style={{ color: corPrincipal }}>{formTenant.nome || 'Seu Salão'}</div>
                                        <div className="flex gap-2"><div className="h-2 w-8 rounded bg-gray-200"></div><div className="h-2 w-8 rounded bg-gray-200"></div></div>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <div className="bg-white p-3 rounded-lg shadow-sm mb-3"><div className="h-2 w-20 bg-gray-200 rounded mb-2"></div><div className="text-2xl font-bold text-gray-800">R$ 1.250,00</div></div>
                                        <button className="w-full py-2 rounded text-white text-xs font-bold shadow-sm" style={{ backgroundColor: corPrincipal }}>+ Novo Agendamento</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* ABA SERVIÇOS */}
                {abaAtiva === 'servicos' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {todosServicos.map(serv => (
                                <div key={serv.id} onClick={() => toggleServico(serv.id)} className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${formData.servicosIds.includes(serv.id) ? 'bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`} style={formData.servicosIds.includes(serv.id) ? { borderColor: tenant?.corPrimaria } : {}}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.servicosIds.includes(serv.id) ? '' : 'bg-white border-gray-400'}`} style={formData.servicosIds.includes(serv.id) ? { backgroundColor: tenant?.corPrimaria, borderColor: tenant?.corPrimaria } : {}}>{formData.servicosIds.includes(serv.id) && <span className="text-white text-xs">✓</span>}</div>
                                    <div><p className="font-bold text-gray-800">{serv.nome}</p></div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveProfile} disabled={saving} className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90" style={{ backgroundColor: tenant?.corPrimaria || '#4F46E5' }}>Salvar Serviços</button>
                    </div>
                )}

                {/* ABA HORÁRIOS */}
                {abaAtiva === 'horarios' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {diasSemana.map(dia => (
                                <div key={dia} className={`flex items-center justify-between p-3 rounded-lg border ${formData.horarios[dia]?.ativo ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
                                    <div className="flex items-center gap-3"><input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: tenant?.corPrimaria }} checked={formData.horarios[dia]?.ativo} onChange={(e) => updateHorario(dia, 'ativo', e.target.checked)} /><span className={`font-bold w-20 capitalize ${formData.horarios[dia]?.ativo ? 'text-gray-800' : 'text-gray-400'}`}>{nomesDias[dia]}</span></div>
                                    {formData.horarios[dia]?.ativo ? (<div className="flex items-center gap-2"><input type="time" className="border rounded p-1 text-sm" value={formData.horarios[dia]?.inicio} onChange={(e) => updateHorario(dia, 'inicio', e.target.value)} /><span className="text-gray-400">-</span><input type="time" className="border rounded p-1 text-sm" value={formData.horarios[dia]?.fim} onChange={(e) => updateHorario(dia, 'fim', e.target.value)} /></div>) : (<span className="text-xs text-gray-400 uppercase font-bold px-4">Folga</span>)}
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveProfile} disabled={saving} className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90" style={{ backgroundColor: tenant?.corPrimaria || '#4F46E5' }}>Salvar Horários</button>
                    </div>
                )}

                {/* ABA SENHA */}
                {abaAtiva === 'senha' && (
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md mx-auto py-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label><input type="password" required className="w-full border rounded-lg p-2.5" value={formSenha.nova} onChange={e => setFormSenha({...formSenha, nova: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar</label><input type="password" required className="w-full border rounded-lg p-2.5" value={formSenha.confirmacao} onChange={e => setFormSenha({...formSenha, confirmacao: e.target.value})} /></div>
                        <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black">Atualizar Senha</button>
                    </form>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}