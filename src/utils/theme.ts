// src/utils/theme.ts

export const TEMAS: any = {
  SALAO_BELEZA: {
    icons: {
      servico: '💅',
      profissional: '💇‍♀️',
      agenda: '📅',
      cliente: '👩',
      dinheiro: '💰'
    },
    labels: {
      profissional: 'Profissional',
      cliente: 'Cliente',
      servico: 'Serviço',
      novoAgendamento: 'Novo Agendamento'
    }
  },
  BARBEARIA: {
    icons: {
      servico: '✂️',
      profissional: '💈',
      agenda: '📅',
      cliente: '🧔',
      dinheiro: '💵'
    },
    labels: {
      profissional: 'Barbeiro',
      cliente: 'Cliente',
      servico: 'Corte/Barba',
      novoAgendamento: 'Novo Corte'
    }
  },
  CLINICA: {
    icons: {
      servico: '🩺',
      profissional: '👨‍⚕️',
      agenda: '🏥',
      cliente: '🤕',
      dinheiro: '💳'
    },
    labels: {
      profissional: 'Especialista',
      cliente: 'Paciente',
      servico: 'Procedimento',
      novoAgendamento: 'Nova Consulta'
    }
  },
  ESTETICA: {
    icons: {
      servico: '✨',
      profissional: '🧖‍♀️',
      agenda: '📅',
      cliente: '👩',
      dinheiro: '💎'
    },
    labels: {
      profissional: 'Esteticista',
      cliente: 'Cliente',
      servico: 'Procedimento',
      novoAgendamento: 'Agendar'
    }
  },
  PETSHOP: {
    icons: {
      servico: '🛁',
      profissional: '✂️',
      agenda: '🐾',
      cliente: '🐶',
      dinheiro: '🦴'
    },
    labels: {
      profissional: 'Atendente',
      cliente: 'Tutor/Pet',
      servico: 'Banho/Tosa',
      novoAgendamento: 'Agendar Pet'
    }
  },
  ESTUDIO_TATTOO: {
    icons: {
      servico: '🎨',
      profissional: '💉',
      agenda: '🤘',
      cliente: '😎',
      dinheiro: '💸'
    },
    labels: {
      profissional: 'Tatuador',
      cliente: 'Cliente',
      servico: 'Tattoo/Piercing',
      novoAgendamento: 'Novo Rabisco'
    }
  },
  SERVICOS_GERAIS: {
    icons: {
      servico: '📝',
      profissional: '👔',
      agenda: '📅',
      cliente: '👤',
      dinheiro: '💲'
    },
    labels: {
      profissional: 'Consultor',
      cliente: 'Cliente',
      servico: 'Serviço',
      novoAgendamento: 'Agendar'
    }
  }
};

// Função auxiliar para pegar o tema com segurança (se vier nulo, usa Salão)
export const getTheme = (segmento: string) => {
  return TEMAS[segmento] || TEMAS['SALAO_BELEZA'];
};