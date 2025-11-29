'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfToday 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTheme } from '../../../utils/theme';

export default function CalendarioPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Dados
  const [todosAgendamentos, setTodosAgendamentos] = useState<any[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  const [usuario, setUsuario] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null); // CORES
  const [tema, setTema] = useState(getTheme('SALAO_BELEZA'));

  // Filtros
  const [filtroId, setFiltroId] = useState('todos');
  
  // Formulário Rápido
  const [novoAgendamento, setNovoAgendamento] = useState({
    nomeCliente: '', telefoneCliente: '', serviceId: '', professionalId: '', horario: ''
  });

  const horariosDisponiveis = (() => {
    const h = []; let hora = 8; let minuto = 0;
    while (hora <= 23) { h.push(`${hora.toString().padStart(2,'0')}:${minuto.toString().padStart(2,'0')}`); minuto += 30; if (minuto === 60) { minuto = 0; hora++; } }
    return h;
  })();

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('usuario_saas');
    if (!dadosSalvos) { router.push('/login'); return; }
    const user = JSON.parse(dadosSalvos);
    setUsuario(user);
    
    // Pré-seleção: Se for profissional, trava nele. Se for dono, começa em 'todos' ou nele mesmo.
    if (user.role === 'PROFISSIONAL') {
        setFiltroId(user.id);
        setNovoAgendamento(prev => ({ ...prev, professionalId: user.id }));
    }

    carregarDados(user.tenant.id);
  }, []);

  // Filtro Dinâmico (Sempre que mudar o filtro ou os dados)
  useEffect(() => {
    if (filtroId === 'todos') {
        setAgendamentosFiltrados(todosAgendamentos);
    } else {
        setAgendamentosFiltrados(todosAgendamentos.filter(ag => ag.profissional.id === filtroId));
    }
  }, [filtroId, todosAgendamentos]);

  const carregarDados = async (tenantId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
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
      
      if (resTenant.ok) {
          const t = await resTenant.json();
          setTenant(t);
          setTema(getTheme(t.segmento || 'SALAO_BELEZA'));
      }

      if (resAgenda.ok) {
        const dados = await resAgenda.json();
        // Filtra cancelados para não poluir
        setTodosAgendamentos(Array.isArray(dados) ? dados.filter((a:any) => a.status !== 'CANCELADO') : []);
      }
    } catch (error) { console.error(error); }
  };

  // --- Lógica do Calendário ---
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow border border-gray-100">
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
          <div key={i} className="text-center font-bold text-gray-400 text-xs uppercase tracking-wider">
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

    return (
      <div className="grid grid-cols-7 gap-2">
        {dayList.map((dayItem, idx) => {
          // Filtra agendamentos do dia (usando a lista FILTRADA pelo select)
          const agendamentosDoDia = agendamentosFiltrados.filter(a => 
            new Date(a.dataHora).toDateString() === dayItem.toDateString()
          );

          const isTodayItem = isSameDay(dayItem, new Date());
          const isCurrentMonth = isSameMonth(dayItem, monthStart);
          
          // Verifica se é passado (para estilo visual)
          const isPast = isBefore(dayItem, startOfToday());

          return (
            <div 
              key={idx}
              className={`min-h-[100px] border rounded-lg p-2 flex flex-col transition-all
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-300' : 'bg-white text-gray-700 hover:shadow-md cursor-pointer'}
                ${isTodayItem ? 'ring-2 ring-offset-1' : 'border-gray-200'}
                ${isPast && isCurrentMonth ? 'bg-gray-50' : ''}
              `}
              style={isTodayItem ? { '--tw-ring-color': corPrincipal } as any : {}}
              onClick={() => {
                setSelectedDate(dayItem);
                setNovoAgendamento(prev => ({ ...prev, horario: '' })); 
              }}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-bold ${isTodayItem ? '' : ''}`} style={isTodayItem ? { color: corPrincipal } : {}}>
                  {format(dayItem, dateFormat)}
                </span>
                {agendamentosDoDia.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: corPrincipal }}>
                    {agendamentosDoDia.length}
                  </span>
                )}
              </div>
              
              {/* Bolinhas de Agendamento */}
              <div className="flex flex-col gap-1 overflow-hidden">
                {agendamentosDoDia.slice(0, 3).map((ag: any, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] truncate">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ag.status === 'CONCLUIDO' ? '#10B981' : corPrincipal }}></div>
                    <span className="truncate text-gray-500">{format(new Date(ag.dataHora), 'HH:mm')} {ag.cliente.nome.split(' ')[0]}</span>
                  </div>
                ))}
                {agendamentosDoDia.length > 3 && (
                  <span className="text-[9px] text-gray-400 text-center">+{agendamentosDoDia.length - 3} mais</span>
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
          dataHora: dataHoraCombinada.toISOString(),
          isInternal: true // Dono pode agendar a qualquer hora
        })
      });

      if (res.ok) {
        alert('Agendamento criado! ' + tema.icons.agenda);
        setNovoAgendamento({ 
            nomeCliente: '', telefoneCliente: '', serviceId: '', 
            professionalId: filtroId !== 'todos' ? filtroId : '', 
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

  // Cores Dinâmicas
  const corPrincipal = tenant?.corPrimaria || '#4F46E5';
  const corFundo = tenant?.corSecundaria || '#F3F4F6';
  
  const isProfissional = usuario?.role === 'PROFISSIONAL';
  const isPastDate = selectedDate ? isBefore(selectedDate, startOfToday()) : false;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: corFundo }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header com Filtro */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
              <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg font-bold border-2 transition-colors shadow-sm hover:opacity-90 text-sm" style={{ backgroundColor: corPrincipal, borderColor: "#fff", color: "#fff" }}>
                  ← Voltar
              </button>
              
              {/* FILTRO DE PROFISSIONAL */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xl ml-2">{tema.icons.profissional}</span>
                  <select 
                    value={filtroId} 
                    onChange={(e) => setFiltroId(e.target.value)} 
                    disabled={isProfissional} 
                    className={`p-2 text-sm bg-transparent outline-none font-bold text-gray-700 ${isProfissional ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                      {!isProfissional && <option value="todos">Ver Todos</option>}
                      {profissionais.map(prof => (
                          <option key={prof.id} value={prof.id}>
                              {prof.id === usuario?.id ? 'Minha Agenda' : prof.nome}
                          </option>
                      ))}
                  </select>
              </div>
          </div>
        </div>

        {renderHeader()}
        {renderDays()}
        {renderCells()}

        {/* MODAL */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="p-5 border-b flex justify-between items-center" style={{ backgroundColor: corPrincipal }}>
                <h3 className="text-xl font-bold text-white">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-white/80 hover:text-white font-bold text-2xl">✕</button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                
                {/* Lista do Dia (Respeitando Filtro) */}
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">
                    Agenda do Dia {filtroId !== 'todos' ? `(${profissionais.find(p => p.id === filtroId)?.nome})` : ''}
                  </h4>
                  
                  <div className="space-y-2">
                    {agendamentosFiltrados.filter(a => new Date(a.dataHora).toDateString() === selectedDate.toDateString()).length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg">
                        <p className="text-gray-400 italic text-sm">Nenhum agendamento para este filtro.</p>
                      </div>
                    ) : (
                        agendamentosFiltrados
                        .filter(a => new Date(a.dataHora).toDateString() === selectedDate.toDateString())
                        .sort((a,b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
                        .map((ag: any) => (
                          <div key={ag.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border-l-4 hover:bg-white hover:shadow-sm transition-all" style={{ borderLeftColor: corPrincipal }}>
                            <div>
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800">
                                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                  </span>
                                  <span className={`text-[9px] px-1.5 rounded font-bold uppercase ${ag.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {ag.status}
                                  </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="font-medium text-gray-700 text-sm">{ag.cliente.nome}</span>
                                <span className="text-xs text-gray-400">• {ag.servico.nome}</span>
                              </div>
                              {filtroId === 'todos' && <p className="text-[10px] text-gray-400 mt-0.5">{tema.icons.profissional} {ag.profissional.nome}</p>}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <hr />

                {/* FORMULÁRIO RÁPIDO (SÓ SE NÃO FOR PASSADO) */}
                {!isPastDate ? (
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">{tema.labels.novoAgendamento}</h4>
                      <form onSubmit={handleQuickCreate} className="space-y-3">
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600">{tema.labels.cliente}</label>
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
                              placeholder="11..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1">
                             <label className="text-xs font-bold text-gray-600">Hora</label>
                             <select required className="w-full mt-1 border rounded p-2 text-sm outline-none focus:ring-2" 
                                style={{ '--tw-ring-color': corPrincipal } as any}
                                value={novoAgendamento.horario} 
                                onChange={e => setNovoAgendamento({...novoAgendamento, horario: e.target.value})}>
                                <option value="">...</option>
                                {horariosDisponiveis.map(h => (<option key={h} value={h}>{h}</option>))}
                             </select>
                          </div>
                          <div className="col-span-2">
                             <label className="text-xs font-bold text-gray-600">{tema.labels.servico}</label>
                             <select required className="w-full mt-1 border rounded p-2 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.serviceId} onChange={e => setNovoAgendamento({...novoAgendamento, serviceId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                             </select>
                          </div>
                        </div>

                        {/* Se for "Todos", obriga a escolher profissional. Se já filtrou, usa o filtro. */}
                        {filtroId === 'todos' && (
                            <div>
                                <label className="text-xs font-bold text-gray-600">{tema.labels.profissional}</label>
                                <select required className="w-full mt-1 border rounded p-2 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': corPrincipal } as any} value={novoAgendamento.professionalId} onChange={e => setNovoAgendamento({...novoAgendamento, professionalId: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>
                        )}

                        <button type="submit" className="w-full text-white py-3 rounded-lg font-bold shadow transition-transform active:scale-95 mt-2" style={{ backgroundColor: corPrincipal }}>
                          Agendar para {format(selectedDate, "dd/MM", { locale: ptBR })}
                        </button>
                      </form>
                    </div>
                ) : (
                    <div className="bg-gray-100 p-4 rounded text-center text-gray-500 text-sm">
                        🚫 Não é possível criar agendamentos em datas passadas.
                    </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}