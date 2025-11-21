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

  const [novoAgendamento, setNovoAgendamento] = useState({
    nomeCliente: '',
    telefoneCliente: '',
    serviceId: '',
    professionalId: '',
    dataHora: ''
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    carregarDados(user.tenant.id);
  }, []);

  const carregarDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // 1. Busca Serviços
      const resServicos = await fetch(`${apiUrl}/services/tenant/${tenantId}`);
      setServicos(await resServicos.json());

      // 2. Busca Profissionais
      const resProf = await fetch(`${apiUrl}/professionals/tenant/${tenantId}`);
      setProfissionais(await resProf.json());

      // 3. Busca Agendamentos
      const resAgenda = await fetch(`${apiUrl}/appointments/tenant/${tenantId}`);
      setAgendamentos(await resAgenda.json());

    } catch (error) {
      console.error('Erro ao carregar dados', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const res = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoAgendamento,
          tenantId: usuario.tenant.id,
          // Garante formato ISO para o banco
          dataHora: new Date(novoAgendamento.dataHora).toISOString()
        })
      });

      if (res.ok) {
        alert('Agendamento realizado com sucesso! 📅');
        setNovoAgendamento({ nomeCliente: '', telefoneCliente: '', serviceId: '', professionalId: '', dataHora: '' });
        carregarDados(usuario.tenant.id);
      } else {
        const erro = await res.json();
        alert(erro.message || 'Erro ao agendar');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
            ← Voltar ao Painel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulário de Agendamento */}
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-semibold mb-4 text-indigo-600">Novo Agendamento</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente (Nome)</label>
                <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2"
                  value={novoAgendamento.nomeCliente}
                  onChange={e => setNovoAgendamento({...novoAgendamento, nomeCliente: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">WhatsApp Cliente</label>
                <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2"
                  placeholder="11999999999"
                  value={novoAgendamento.telefoneCliente}
                  onChange={e => setNovoAgendamento({...novoAgendamento, telefoneCliente: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serviço</label>
                  <select required className="mt-1 block w-full rounded border-gray-300 border p-2"
                    value={novoAgendamento.serviceId}
                    onChange={e => setNovoAgendamento({...novoAgendamento, serviceId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profissional</label>
                  <select required className="mt-1 block w-full rounded border-gray-300 border p-2"
                    value={novoAgendamento.professionalId}
                    onChange={e => setNovoAgendamento({...novoAgendamento, professionalId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Data e Hora</label>
                <input type="datetime-local" required className="mt-1 block w-full rounded border-gray-300 border p-2"
                  value={novoAgendamento.dataHora}
                  onChange={e => setNovoAgendamento({...novoAgendamento, dataHora: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-4 rounded font-bold hover:bg-indigo-700">
                Confirmar Agendamento
              </button>
            </form>
          </div>

          {/* Lista de Agendamentos (Histórico) */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Próximos Horários</h2>
            {loading ? <p>Carregando...</p> : agendamentos.length === 0 ? (
              <p className="text-gray-500">Nenhum agendamento encontrado.</p>
            ) : (
              <ul className="space-y-3">
                {agendamentos.map((agenda) => (
                  <li key={agenda.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-gray-800">
                        {new Date(agenda.dataHora).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-gray-600">{agenda.cliente.nome} - {agenda.servico.nome}</p>
                      <p className="text-xs text-gray-400">Prof: {agenda.profissional.nome}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                      {agenda.status}
                    </span>
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