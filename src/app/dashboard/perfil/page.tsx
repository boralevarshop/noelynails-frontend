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

  // --- NOVO: CONTROLE DO MODAL DE AVATAR ---
  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);
  // -----------------------------------------

  const [formData, setFormData] = useState({
    nome: '', telefone: '', bio: '', instagram: '', avatarUrl: '',
    aparecerNoSite: true, servicosIds: [] as string[], horarios: {} as any
  });

  const [formTenant, setFormTenant] = useState({
    nome: '', slug: '', telefone: '',
    corPrimaria: '#4F46E5', corSecundaria: '#F3F4F6', corTerciaria: '#FFFFFF', corTexto: '#FFFFFF',
    agendamentoOnline: true, segmento: 'SALAO_BELEZA'
  });

  const [formSenha, setFormSenha] = useState({ nova: '', confirmacao: '' });

  const diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const nomesDias: any = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };
  
  const segmentos = [
    { id: 'SALAO_BELEZA', label: '💇‍♀️ Salão de Beleza' }, 
    { id: 'BARBEARIA', label: '💈 Barbearia' },
    { id: 'CLINICA', label: '🏥 Clínica' }, 
    { id: 'ESTETICA', label: '✨ Estética' },
    { id: 'PETSHOP', label: '🐶 Petshop' }, 
    { id: 'ESTUDIO_TATTOO', label: '🎨 Tattoo' },
    { id: 'SERVICOS_GERAIS', label: '🏢 Geral' }
  ];

  // --- LISTA DE AVATARES (LINKS PRONTOS) ---
  const AVATARES: any = {
      SALAO_BELEZA: [
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388610/avatar_099_i8dixo.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388607/avatar_098_zemerc.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388605/avatar_097_szfiq6.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388605/avatar_096_ol9amp.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388602/avatar_095_lcujro.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388599/avatar_092_ovm9r1.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388595/avatar_090_slwxw4.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388597/avatar_091_iq7sks.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388600/avatar_094_oayiqo.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388600/avatar_093_mplttc.png'
      ],
      BARBEARIA: [
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388594/avatar_089_bzeyam.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388593/avatar_088_aiz8no.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388591/avatar_087_m3g20s.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388590/avatar_086_ohio4a.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388588/avatar_085_wtwvvb.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388588/avatar_084_dro0ms.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388586/avatar_083_uxajgt.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388584/avatar_082_ta35qk.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388583/avatar_081_e69gyv.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388582/avatar_080_mwtwnw.png'
      ],
      CLINICA: [
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388580/avatar_079_fvykcy.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388579/avatar_078_ecndml.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388577/avatar_077_tfbwrg.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388577/avatar_076_jyupaq.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388574/avatar_075_bvessy.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388573/avatar_074_gfv7zr.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388572/avatar_073_yx7xjh.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388569/avatar_072_lek44m.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388568/avatar_071_zoqv8g.png'
      ],
      ESTETICA: [
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388535/avatar_045_nv70ef.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388536/avatar_046_wg8x8r.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388539/avatar_048_ip9b4e.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388540/avatar_049_jewrml.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388546/avatar_053_wrgrz8.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388546/avatar_054_jhavlx.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388552/avatar_058_mmr5m1.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388531/avatar_042_ogfzja.png'
      ],
      PETSHOP: [
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388528/avatar_039_zzuyim.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388524/avatar_037_sbw3s8.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388524/avatar_038_z8sdbc.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388523/avatar_036_m3vdfq.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388519/avatar_034_j5uwqn.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388519/avatar_033_s4zzdt.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388522/avatar_035_mfph2z.png'
      ],
      ESTUDIO_TATTOO: [
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388418/avatar_024_qkgzzq.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388419/avatar_026_goddq7.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388413/avatar_020_okznue.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388414/avatar_021_kqjmrb.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388406/avatar_016_fbp6qn.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388401/avatar_013_l3bss3.png'
      ],
      SERVICOS_GERAIS: [
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388397/avatar_009_fwhxir.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388396/avatar_008_iduz8a.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388395/avatar_007_aa7pxl.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388394/avatar_006_ojxb2h.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388393/avatar_005_mwznbr.png',
          'https://res.cloudinary.com/datzd5c3w/image/upload/v1764388392/avatar_002_epvu4b.png'
      ]
  };

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
            nome: dadosUser.nome || '', telefone: dadosUser.telefone || '',
            bio: dadosUser.bio || '', instagram: dadosUser.instagram || '',
            avatarUrl: dadosUser.avatarUrl || '',
            aparecerNoSite: dadosUser.aparecerNoSite !== false,
            servicosIds: dadosUser.servicosQueAtende ? dadosUser.servicosQueAtende.map((s: any) => s.id) : [],
            horarios: dadosUser.horarios || criarHorarioPadrao()
        });

        setFormTenant({
            nome: dadosTenant.nome, slug: dadosTenant.slug, telefone: dadosTenant.telefone || '',
            corPrimaria: dadosTenant.corPrimaria || '#4F46E5', 
            corSecundaria: dadosTenant.corSecundaria || '#F3F4F6',
            corTerciaria: dadosTenant.corTerciaria || '#FFFFFF',
            corTexto: dadosTenant.corTexto || '#FFFFFF',
            agendamentoOnline: dadosTenant.agendamentoOnline !== false, 
            segmento: dadosTenant.segmento || 'SALAO_BELEZA'
        });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const criarHorarioPadrao = () => {
      const padrao: any = {}; diasSemana.forEach(dia => { padrao[dia] = { ativo: dia !== 'dom', inicio: '09:00', fim: '18:00' }; }); return padrao;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/users/${usuario.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            alert('Perfil atualizado!');
            const userLocal = JSON.parse(localStorage.getItem('usuario_saas') || '{}');
            userLocal.nome = formData.nome;
            if (formData.avatarUrl) userLocal.avatarUrl = formData.avatarUrl; 
            localStorage.setItem('usuario_saas', JSON.stringify(userLocal));
            window.location.reload();
        } else alert('Erro.');
    } catch (error) { alert('Erro de conexão.'); } finally { setSaving(false); }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/tenants/${tenant.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formTenant)
        });
        if (res.ok) {
            alert('Layout salvo!');
            const userLocal = JSON.parse(localStorage.getItem('usuario_saas') || '{}');
            userLocal.tenant.nome = formTenant.nome; userLocal.tenant.slug = formTenant.slug;
            localStorage.setItem('usuario_saas', JSON.stringify(userLocal));
            window.location.reload();
        } else { const erro = await res.json(); alert(erro.message); }
    } catch (error) { alert('Erro de conexão.'); } finally { setSaving(false); }
  };

  const toggleServico = (id: string) => {
      setFormData(prev => {
          const jaTem = prev.servicosIds.includes(id);
          if (jaTem) return { ...prev, servicosIds: prev.servicosIds.filter(s => s !== id) };
          else return { ...prev, servicosIds: [...prev.servicosIds, id] };
      });
  };

  const updateHorario = (dia: string, campo: string, valor: any) => {
      setFormData(prev => ({ ...prev, horarios: { ...prev.horarios, [dia]: { ...prev.horarios[dia], [campo]: valor } } }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSenha.nova.length < 3) { alert('Senha curta.'); return; }
    if (formSenha.nova !== formSenha.confirmacao) { alert('Senhas diferentes.'); return; }
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/users/${usuario.id}/password`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha: formSenha.nova })
        });
        if (res.ok) { alert('Senha alterada!'); setFormSenha({ nova: '', confirmacao: '' }); } 
        else alert('Erro.');
    } catch (error) { alert('Erro de conexão.'); }
  };

  // Seleciona qual lista de avatares mostrar
  const getListaAvatares = () => {
      const seg = formTenant.segmento;
      if (seg === 'SALAO_BELEZA' || seg === 'ESTETICA') return AVATARES.SALAO_BELEZA;
      if (seg === 'BARBEARIA' || seg === 'ESTUDIO_TATTOO') return AVATARES.BARBEARIA;
      return AVATARES.GERAL;
  };

  if (loading) return <div className="p-10 text-center">Carregando perfil...</div>;
  const isDono = usuario.role === 'DONO_SALAO' || usuario.role === 'ADMIN_GLOBAL';

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: tenant?.corSecundaria || '#F3F4F6' }}>
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <button 
                onClick={() => router.push('/dashboard')} 
                className="px-4 py-2 rounded-lg font-bold border-2 transition-colors flex items-center gap-2 hover:bg-gray-50"
                style={{ backgroundColor: formTenant.corPrimaria, borderColor: "#fff", color: "#fff"}}
             >
                <span>←</span> Voltar
             </button>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
            
            {/* CABEÇALHO COM SELETOR DE AVATAR */}
            <div className="p-6 flex items-center gap-6" style={{ backgroundColor: tenant?.corPrimaria || '#4F46E5', color: tenant?.corTexto || '#FFFFFF' }}>
                
                <div 
                    className="h-20 w-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-3xl font-bold cursor-pointer overflow-hidden relative group"
                    onClick={() => setModalAvatarAberto(true)}
                    title="Clique para escolher um avatar"
                >
                    {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span>{usuario.nome.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center">
                        <span className="text-xs font-bold text-white">EDITAR</span>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold">{usuario.nome}</h2>
                    <p className="opacity-90">{usuario.email}</p>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded mt-2 inline-block uppercase tracking-wider">{usuario.role.replace('_', ' ')}</span>
                </div>
            </div>

            <div className="flex border-b border-gray-200 overflow-x-auto">
                {['dados', 'servicos', 'horarios', 'senha'].map(aba => (
                    <button key={aba} onClick={() => setAbaAtiva(aba)} className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${abaAtiva === aba ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {aba === 'dados' && '📝 Dados Pessoais'} {aba === 'servicos' && '💅 Meus Serviços'} {aba === 'horarios' && '⏰ Meus Horários'} {aba === 'senha' && '🔒 Senha'}
                    </button>
                ))}
                {isDono && <button onClick={() => setAbaAtiva('salao')} className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${abaAtiva === 'salao' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>🏪 Meu Salão</button>}
            </div>
            <div className="p-6">
                
                {abaAtiva === 'dados' && (
                    <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label><input type="text" required className="w-full border rounded-lg p-2.5" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label><input type="text" required className="w-full border rounded-lg p-2.5" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instagram</label><input type="text" className="w-full border rounded-lg p-2.5" placeholder="@seu.perfil" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} /></div>
                        <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <input type="checkbox" id="aparecerNoSite" className="w-5 h-5 rounded" checked={formData.aparecerNoSite} onChange={e => setFormData({...formData, aparecerNoSite: e.target.checked})} />
                            <label htmlFor="aparecerNoSite" className="text-sm text-gray-700 font-medium cursor-pointer">Permitir que clientes agendem comigo pelo site</label>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio</label><textarea className="w-full border rounded-lg p-2.5 h-24 resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /></div>
                        <button type="submit" disabled={saving} className="w-full py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: formTenant.corPrimaria, color: formTenant.corTexto }}>Salvar Dados</button>
                    </form>
                )}

                {abaAtiva === 'salao' && isDono && (
                    <form onSubmit={handleSaveTenant} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div><h3 className="text-lg font-bold text-gray-800">Identidade Visual</h3><p className="text-sm text-gray-500">Defina as cores da sua marca.</p></div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Primária (Botões)</label>
                                        <div className="flex gap-2"><input type="color" className="h-10 w-10 rounded cursor-pointer border-0" value={formTenant.corPrimaria} onChange={e => setFormTenant({...formTenant, corPrimaria: e.target.value})} /><input type="text" className="w-full border rounded-lg p-2.5 uppercase text-sm" value={formTenant.corPrimaria} onChange={e => setFormTenant({...formTenant, corPrimaria: e.target.value})} /></div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Texto (Contraste)</label>
                                        <div className="flex gap-2"><input type="color" className="h-10 w-10 rounded cursor-pointer border-0" value={formTenant.corTexto} onChange={e => setFormTenant({...formTenant, corTexto: e.target.value})} /><input type="text" className="w-full border rounded-lg p-2.5 uppercase text-sm" value={formTenant.corTexto} onChange={e => setFormTenant({...formTenant, corTexto: e.target.value})} /></div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Secundária (Fundo)</label>
                                        <div className="flex gap-2"><input type="color" className="h-10 w-10 rounded cursor-pointer border-0" value={formTenant.corSecundaria} onChange={e => setFormTenant({...formTenant, corSecundaria: e.target.value})} /><input type="text" className="w-full border rounded-lg p-2.5 uppercase text-sm" value={formTenant.corSecundaria} onChange={e => setFormTenant({...formTenant, corSecundaria: e.target.value})} /></div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Terciária (Cards)</label>
                                        <div className="flex gap-2"><input type="color" className="h-10 w-10 rounded cursor-pointer border-0" value={formTenant.corTerciaria} onChange={e => setFormTenant({...formTenant, corTerciaria: e.target.value})} /><input type="text" className="w-full border rounded-lg p-2.5 uppercase text-sm" value={formTenant.corTerciaria} onChange={e => setFormTenant({...formTenant, corTerciaria: e.target.value})} /></div>
                                    </div>
                                </div>

                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Segmento / Tipo</label><select className="w-full border rounded-lg p-2.5 bg-white" value={formTenant.segmento} onChange={e => setFormTenant({...formTenant, segmento: e.target.value})}>{segmentos.map(seg => (<option key={seg.id} value={seg.id}>{seg.label}</option>))}</select></div>
                                <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg border border-green-100"><input type="checkbox" id="agendamentoOnline" className="w-5 h-5 rounded" checked={formTenant.agendamentoOnline} onChange={e => setFormTenant({...formTenant, agendamentoOnline: e.target.checked})} /><div><label htmlFor="agendamentoOnline" className="text-sm font-bold text-gray-800 cursor-pointer block">Site de Agendamento Ativo</label><p className="text-xs text-gray-500">Se desmarcar, seu link público mostrará "Fechado".</p></div></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Salão</label><input type="text" required className="w-full border rounded-lg p-2.5" value={formTenant.nome} onChange={e => setFormTenant({...formTenant, nome: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link (Slug)</label><div className="flex items-center border rounded-lg bg-gray-50 px-3"><span className="text-gray-500 text-sm">agendar.../</span><input type="text" required className="w-full p-2.5 bg-transparent outline-none font-bold" style={{ color: formTenant.corPrimaria }} value={formTenant.slug} onChange={e => setFormTenant({...formTenant, slug: e.target.value})} /></div></div>
                                
                                <button type="submit" disabled={saving} className="w-full py-3 rounded-lg font-bold transition-colors disabled:opacity-50" style={{ backgroundColor: formTenant.corPrimaria, color: formTenant.corTexto }}>Salvar Aparência</button>
                            </div>

                            {/* LIVE PREVIEW */}
                            <div className="border-4 border-gray-800 rounded-[30px] overflow-hidden shadow-2xl bg-black h-[500px] w-[280px] mx-auto relative">
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-32 bg-black rounded-b-xl z-20"></div>
                                <div className="h-full w-full flex flex-col overflow-y-auto" style={{ backgroundColor: formTenant.corSecundaria }}>
                                    <div className="p-6 text-center pt-10" style={{ backgroundColor: formTenant.corPrimaria, color: formTenant.corTexto }}>
                                        <h3 className="font-bold text-lg">{formTenant.nome || 'Seu Salão'}</h3>
                                        <p className="text-xs opacity-80">Agendamento Online</p>
                                    </div>
                                    <div className="p-4 flex-1 space-y-3">
                                        <p className="text-xs font-bold opacity-50" style={{ color: '#000' }}>ESCOLHA O SERVIÇO</p>
                                        <div className="p-3 rounded-lg shadow-sm flex justify-between items-center border border-gray-100" style={{ backgroundColor: formTenant.corTerciaria }}>
                                            <div><p className="text-xs font-bold text-gray-800">Corte</p><p className="text-[10px] text-gray-500">30 min</p></div>
                                            <p className="text-xs font-bold" style={{ color: formTenant.corPrimaria }}>R$ 50,00</p>
                                        </div>
                                        <div className="p-3 rounded-lg shadow-sm flex justify-between items-center border border-gray-100" style={{ backgroundColor: formTenant.corTerciaria }}>
                                            <div><p className="text-xs font-bold text-gray-800">Barba</p><p className="text-[10px] text-gray-500">20 min</p></div>
                                            <p className="text-xs font-bold" style={{ color: formTenant.corPrimaria }}>R$ 35,00</p>
                                        </div>
                                    </div>
                                    <div className="p-4 mt-auto">
                                         <div className="w-full py-3 rounded-lg text-center text-xs font-bold shadow" style={{ backgroundColor: formTenant.corPrimaria, color: formTenant.corTexto }}>Confirmar</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* OUTRAS ABAS... (Serviços, Horários, Senha - Manter o código anterior) */}
                {/* Vou repetir o bloco de serviços/horários/senha para não quebrar o arquivo */}
                {abaAtiva === 'servicos' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{todosServicos.map(serv => (<div key={serv.id} onClick={() => toggleServico(serv.id)} className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${formData.servicosIds.includes(serv.id) ? 'bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`} style={formData.servicosIds.includes(serv.id) ? { borderColor: tenant?.corPrimaria } : {}}><div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.servicosIds.includes(serv.id) ? '' : 'bg-white border-gray-400'}`} style={formData.servicosIds.includes(serv.id) ? { backgroundColor: tenant?.corPrimaria, borderColor: tenant?.corPrimaria } : {}}>{formData.servicosIds.includes(serv.id) && <span className="text-white text-xs">✓</span>}</div><div><p className="font-bold text-gray-800">{serv.nome}</p></div></div>))}</div>
                        <button onClick={handleSaveProfile} disabled={saving} className="w-full py-3 rounded-lg font-bold hover:opacity-90" style={{ backgroundColor: tenant?.corPrimaria || '#4F46E5', color: tenant?.corTexto || '#FFFFFF' }}>Salvar Serviços</button>
                    </div>
                )}
                {abaAtiva === 'horarios' && (
                    <div className="space-y-6">
                        <div className="space-y-3">{diasSemana.map(dia => (<div key={dia} className={`flex items-center justify-between p-3 rounded-lg border ${formData.horarios[dia]?.ativo ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}><div className="flex items-center gap-3"><input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: tenant?.corPrimaria }} checked={formData.horarios[dia]?.ativo} onChange={(e) => updateHorario(dia, 'ativo', e.target.checked)} /><span className={`font-bold w-20 capitalize ${formData.horarios[dia]?.ativo ? 'text-gray-800' : 'text-gray-400'}`}>{nomesDias[dia]}</span></div>{formData.horarios[dia]?.ativo ? (<div className="flex items-center gap-2"><input type="time" className="border rounded p-1 text-sm" value={formData.horarios[dia]?.inicio} onChange={(e) => updateHorario(dia, 'inicio', e.target.value)} /><span className="text-gray-400">-</span><input type="time" className="border rounded p-1 text-sm" value={formData.horarios[dia]?.fim} onChange={(e) => updateHorario(dia, 'fim', e.target.value)} /></div>) : (<span className="text-xs text-gray-400 uppercase font-bold px-4">Folga</span>)}</div>))}</div>
                        <button onClick={handleSaveProfile} disabled={saving} className="w-full py-3 rounded-lg font-bold hover:opacity-90" style={{ backgroundColor: tenant?.corPrimaria || '#4F46E5', color: tenant?.corTexto || '#FFFFFF' }}>Salvar Horários</button>
                    </div>
                )}
                {abaAtiva === 'senha' && (
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md mx-auto py-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label><input type="password" required className="w-full border rounded-lg p-2.5" value={formSenha.nova} onChange={e => setFormSenha({...formSenha, nova: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar</label><input type="password" required className="w-full border rounded-lg p-2.5" value={formSenha.confirmacao} onChange={e => setFormSenha({...formSenha, confirmacao: e.target.value})} /></div>
                        <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black">Atualizar Senha</button>
                    </form>
                )}
            </div>
        </div>

        {/* --- MODAL DE SELEÇÃO DE AVATAR --- */}
        {modalAvatarAberto && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Escolha seu Avatar</h3>
                        <button onClick={() => setModalAvatarAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                        {getListaAvatares().map((url: string, i: number) => (
                            <div 
                                key={i} 
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, avatarUrl: url }));
                                    setModalAvatarAberto(false);
                                }}
                                className={`rounded-full border-4 cursor-pointer hover:scale-105 transition-transform ${formData.avatarUrl === url ? 'border-green-500' : 'border-transparent hover:border-gray-200'}`}
                            >
                                <img src={url} alt={`Avatar ${i}`} className="w-full h-full rounded-full bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}