'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgendamentosPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // NOVO: Controle para mostrar/esconder cancelados
  const [mostrarCancelados, setMostrarCancelados] = useState(false);

  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');

  const [novoAgendamento, setNovoAgendamento] = useState({
    nomeCliente: '',
    telefoneCliente: '',
    serviceId: '',
    professionalId: ''
  });

  const horariosDisponiveis = (() => {
    const horarios = [];
    let hora = 8;
    let minuto = 0;
    while (hora < 20) {
      const h = hora.toString().padStart(2, '0');
      const m = minuto.toString().padStart(2, '0');
      horarios.push(`${h}:${m}`);
      minuto += 30;
      if (minuto === 60) { minuto = 0; hora++; }
    }
    return horarios;
  })();

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    carregarDados(user.tenant.id);
  }, []);

  const carregarDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const resServicos = await fetch(`${apiUrl}/services/tenant/${tenantId}`);
      setServicos(await resServicos.json());
      const resProf = await fetch(`${apiUrl}/professionals/tenant/${tenantId}`);
      setProfissionais(await resProf.json());
      const resAgenda = await fetch(`${apiUrl}/appointments/tenant/${tenantId}`);
      setAgendamentos(await resAgenda.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    try {
      const dataHoraCombinada = new Date(`${dataSelecionada}T${horarioSelecionado}:00`);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoAgendamento,
          tenantId: usuario.tenant.id,
          dataHora: dataHoraCombinada.toISOString()
        })
      });

      if (res.ok) {
        alert('Agendamento realizado! 📅');
        setNovoAgendamento({ nomeCliente: '', telefoneCliente: '', serviceId: '', professionalId: '' });
        setDataSelecionada(''); setHorarioSelecionado('');
        carregarDados(usuario.tenant.id);
      } else { 
        const erro = await res.json();
        const msg = Array.isArray(erro.message) ? erro.message[0] : erro.message;
        alert(`Atenção: ${msg || 'Erro ao agendar'}`);
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/appointments/${id}/cancel`, { method: 'PATCH' });
      if (res.ok) {
        alert('Agendamento cancelado.');
        carregarDados(usuario.tenant.id);
      } else { alert('Erro ao cancelar'); }
    } catch (error) { alert('Erro de conexão'); }
  };

  // Lógica do Filtro
  const agendamentosFiltrados = agendamentos.filter(agenda => {
    if (mostrarCancelados) return true; // Se marcado, mostra tudo
    return agenda.status !== 'CANCELADO'; // Se desmarcado, esconde cancelados
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Agenda Inteligente</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4 text-indigo-600">Novo Agendamento</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2" value={novoAgendamento.nomeCliente} onChange={e => setNovoAgendamento({...novoAgendamento, nomeCliente: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2" placeholder="11999999999" value={novoAgendamento.telefoneCliente} onChange={e => setNovoAgendamento({...novoAgendamento, telefoneCliente: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serviço</label>
                  <select required className="mt-1 block w-full rounded border-gray-300 border p-2" value={novoAgendamento.serviceId} onChange={e => setNovoAgendamento({...novoAgendamento, serviceId: e.target.value})}>
                    <option value="">Selecione...</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profissional</label>
                  <select required className="mt-1 block w-full rounded border-gray-300 border p-2" value={novoAgendamento.professionalId} onChange={e => setNovoAgendamento({...novoAgendamento, professionalId: e.target.value})}>
                    <option value="">Selecione...</option>
                    {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dia</label>
                  <input type="date" required className="mt-1 block w-full rounded border-gray-300 border p-2" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horário</label>
                  <select required className="mt-1 block w-full rounded border-gray-300 border p-2" value={horarioSelecionado} onChange={e => setHorarioSelecionado(e.target.value)}>
                    <option value="">Selecione...</option>
                    {horariosDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-4 rounded font-bold hover:bg-indigo-700">Confirmar</button>
            </form>
          </div>

          {/* Lista */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Próximos Horários</h2>
              
              {/* CHECKBOX PARA MOSTRAR CANCELADOS */}
              <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={mostrarCancelados}
                  onChange={e => setMostrarCancelados(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Mostrar cancelados</span>
              </label>
            </div>

            {loading ? <p>Carregando...</p> : agendamentosFiltrados.length === 0 ? <p className="text-gray-500">Nenhum agendamento encontrado.</p> : (
              <ul className="space-y-3">
                {agendamentosFiltrados.map((agenda) => (
                  <li key={agenda.id} className={`p-4 rounded-lg shadow border-l-4 flex justify-between items-center ${agenda.status === 'CANCELADO' ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-indigo-500'}`}>
                    <div>
                      <p className={`text-lg font-bold ${agenda.status === 'CANCELADO' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {new Date(agenda.dataHora).toLocaleDateString('pt-BR')} às {new Date(agenda.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-gray-600">{agenda.cliente.nome} - {agenda.servico.nome}</p>
                      <p className="text-xs text-gray-400">Prof: {agenda.profissional.nome}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${agenda.status === 'CONFIRMADO' ? 'bg-green-100 text-green-800' : agenda.status === 'CANCELADO' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {agenda.status}
                        </span>
                        
                        {agenda.status !== 'CANCELADO' && (
                            <button 
                                onClick={() => handleCancel(agenda.id)}
                                className="text-red-600 text-sm hover:underline font-semibold"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}