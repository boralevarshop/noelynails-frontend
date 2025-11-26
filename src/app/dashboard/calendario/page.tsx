'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarioPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Dados
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); // CORES
  
  // Estado do Modal de Novo Agendamento
  const [novoAgendamento, setNovoAgendamento] = useState({
    nomeCliente: '',
    telefoneCliente: '',
    serviceId: '',
    professionalId: '',
    horario: ''
  });

  // Horários disponíveis
  const horariosDisponiveis = (() => {
    const h = [];
    let hora = 8;
    let minuto = 0;
    while (hora <= 23) {
      h.push(`${hora.toString().padStart(2,'0')}:${minuto.toString().padStart(2,'0')}`);
      minuto += 30;
      if (minuto === 60) { minuto = 0; hora++; }
    }
    return h;
  })();

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    // Se for profissional, já fixa o ID dele
    if (user.role === 'PROFISSIONAL') {
        setNovoAgendamento(prev => ({ ...prev, professionalId: user.id }));
    }

    carregarDados(user.tenant.id);
  }, []);

  const carregarDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Busca tudo, incluindo as cores do Tenant
      const [resServ, resProf, resAgenda, resCli, resTenant] = await Promise.all([
        fetch(`${apiUrl}/services/tenant/${tenantId}`),
        fetch(`${apiUrl}/professionals/tenant/${tenantId}`),
        fetch(`${apiUrl}/appointments/tenant/${tenantId}`),
        fetch(`${apiUrl}/clients/tenant/${tenantId}`),
        fetch(`${apiUrl}/tenants/${tenantId}`)
      ]);

      if (resServ.ok) setServicos(await resServ.json());
      if (resProf.ok) setProfissionais(await resProf.json());
      if (resCli.ok) setClientes(await resCli.json());
      if (resTenant.ok) setTenant(await resTenant.json());
      
      if (resAgenda.ok) {
        const dados = await resAgenda.json();
        setAgendamentos(Array.isArray(dados) ? dados.filter((a:any) => a.status !== 'CANCELADO') : []);
      }
    } catch (error) { console.error(error); }
  };

  // Cores Dinâmicas
  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';

  // --- Lógica do Calendário ---
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-gray-600 hover:bg-gray-100 p-2 rounded">← Anterior</button>
        <h2 className="text-xl font-bold capitalize" style={{ color: corPrincipal }}>
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-gray-600 hover:bg-gray-100 p-2 rounded">Próximo →</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center font-bold text-gray-500 text-sm uppercase">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateFormat = "d";
    const dayList = eachDayOfInterval({ start: startDate, end: endDate });

    // Data de hoje zerada para comparação (bloquear passado)
    const hojeZerado = new Date();
    hojeZerado.setHours(0,0,0,0);

    return (
      <div className="grid grid-cols-7 gap-2">
        {dayList.map((dayItem, idx) => {
          const agendamentosDoDia = agendamentos.filter(a => 
            new Date(a.dataHora).toDateString() === dayItem.toDateString()
          );

          const isToday = isSameDay(dayItem, new Date());
          const isCurrentMonth = isSameMonth(dayItem, monthStart);
          const isPast = dayItem < hojeZerado;

          return (
            <div 
              key={idx}
              className={`h-24 md:h-32 border rounded-lg p-2 flex flex-col justify-between transition-colors
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : isPast ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'bg-white text-gray-700 cursor-pointer hover:border-gray-400'}
                ${isToday ? 'border-2 bg-indigo-50' : 'border-gray-200'}
              `}
              style={isToday ? { borderColor: corPrincipal } : {}}
              onClick={() => {
                if (isPast) return;
                setSelectedDate(dayItem);
                setNovoAgendamento(prev => ({ ...prev, horario: '' })); 
              }}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-bold ${isToday ? '' : ''}`} style={isToday ? { color: corPrincipal } : {}}>
                  {format(dayItem, dateFormat)}
                </span>
                {agendamentosDoDia.length > 0 && (
                  <span className="text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: corPrincipal }}>
                    {agendamentosDoDia.length}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mt-1 overflow-hidden">
                {agendamentosDoDia.slice(0, 4).map((ag: any, i) => (
                  <div key={i} className="w-full text-[10px] rounded px-1 truncate bg-gray-100 text-gray-600">
                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})} - {ag.cliente.nome.split(' ')[0]}
                  </div>
                ))}
                {agendamentosDoDia.length > 4 && (
                  <span className="text-[10px] text-gray-400">+{agendamentosDoDia.length - 4} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !selectedDate) return;

    try {
      const dataIso = format(selectedDate, 'yyyy-MM-dd');
      const dataHoraCombinada = new Date(`${dataIso}T${novoAgendamento.horario}:00`);

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
        alert('Agendamento criado! 📅');
        setNovoAgendamento({ 
            nomeCliente: '', telefoneCliente: '', serviceId: '', 
            professionalId: usuario.role === 'PROFISSIONAL' ? usuario.id : '', 
            horario: '' 
        });
        setSelectedDate(null); 
        carregarDados(usuario.tenant.id);
      } else {
        const erro = await res.json();
        alert(`Erro: ${erro.message}`);
      }
    } catch (error) { alert('Erro de conexão'); }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNovoAgendamento(prev => ({ ...prev, nomeCliente: val }));
    const cli = clientes.find(c => c.nome === val);
    if (cli) setNovoAgendamento(prev => ({ ...prev, nomeCliente: val, telefoneCliente: cli.telefone }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Calendário Geral</h1>
          <button 
                onClick={() => router.push('/dashboard')} 
                className="px-4 py-2 rounded-lg font-bold border-2 transition-colors flex items-center gap-2 hover:bg-gray-50"
                style={{ backgroundColor: corPrincipal }}
             >
                <span>←</span> Voltar ao Painel
             </button>
        </div>

        {renderHeader()}
        {renderDays()}
        {renderCells()}

        {/* MODAL DE DETALHES DO DIA */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-red-500 font-bold text-xl">✕</button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Lista de Agendamentos do Dia */}
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Agenda do Dia</h4>
                  <div className="space-y-2">
                    {agendamentos.filter(a => new Date(a.dataHora).toDateString() === selectedDate.toDateString()).length === 0 ? (
                      <p className="text-gray-400 italic">Nenhum agendamento.</p>
                    ) : (
                      agendamentos
                        .filter(a => new Date(a.dataHora).toDateString() === selectedDate.toDateString())
                        .sort((a,b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
                        .map((ag: any) => (
                          <div key={ag.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border-l-4" style={{ borderLeftColor: corPrincipal }}>
                            <div>
                              <span className="font-bold mr-2" style={{ color: corPrincipal }}>
                                {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                              </span>
                              <span className="font-medium text-gray-800">{ag.cliente.nome}</span>
                              <div className="text-xs text-gray-500">{ag.servico.nome} • {ag.profissional.nome}</div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <hr />

                {/* Formulário Rápido */}
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Novo Agendamento</h4>
                  <form onSubmit={handleQuickCreate} className="space-y-3">
                    
                    <div>
                      <label className="text-xs font-bold text-gray-600">Horário Livre</label>
                      <select required className="w-full mt-1 border rounded p-2 text-sm outline-none focus:ring-2" 
                        style={{ '--tw-ring-color': corPrincipal } as any}
                        value={novoAgendamento.horario} 
                        onChange={e => setNovoAgendamento({...novoAgendamento, horario: e.target.value})}>
                        <option value="">Escolha um horário...</option>
                        {horariosDisponiveis.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600">Cliente</label>
                        <input list="lista-cli-modal" required type="text" className="w-full mt-1 border rounded p-2 text-sm outline-none focus:ring-2" 
                           style={{ '--tw-ring-color': corPrincipal } as any}
                          value={novoAgendamento.nomeCliente} 
                          onChange={handleNomeChange}
                          placeholder="Nome"
                        />
                        <datalist id="lista-cli-modal">
                          {clientes.map(cli => (<option key={cli.id} value={cli.nome} />))}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600">WhatsApp</label>
                        <input required type="text" className="w-full mt-1 border rounded p-2 text-sm outline-none focus:ring-2" 
                           style={{ '--tw-ring-color': corPrincipal } as any}
                          value={novoAgendamento.telefoneCliente} 
                          onChange={e => setNovoAgendamento({...novoAgendamento, telefoneCliente: e.target.value})}
                          placeholder="11999..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <select required className="w-full border rounded p-2 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.serviceId} onChange={e => setNovoAgendamento({...novoAgendamento, serviceId: e.target.value})}>
                        <option value="">Serviço...</option>
                        {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                      <select required className="w-full border rounded p-2 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.professionalId} onChange={e => setNovoAgendamento({...novoAgendamento, professionalId: e.target.value})}>
                        <option value="">Profissional...</option>
                        {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>

                    <button type="submit" className="w-full text-white py-2 rounded font-bold shadow transition-transform active:scale-95" style={{ backgroundColor: corPrincipal }}>
                      Agendar para dia {format(selectedDate, "dd/MM", { locale: ptBR })}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}