/**
 * MODELO DE DADOS - LEAD
 * Define a estrutura e schema do lead
 */

/**
 * Schema do Lead
 *
 * @typedef {object} Lead
 * @property {string} id - ID único do lead (gerado)
 * @property {string} phone - Número de telefone do lead (chave única)
 * @property {string} name - Nome do lead
 * @property {string} lastMessage - Última mensagem recebida
 * @property {string} status - Status do lead ("novo", "engajado", "quente", "fechado", "frio")
 * @property {number} score - Score total do lead (qualificação)
 * @property {Date} createdAt - Data de criação
 * @property {Date} lastInteractionAt - Data da última interação
 * @property {Date} updatedAt - Data da última atualização
 * @property {object} metadata - Dados adicionais (origem, campanha, etc.)
 */

const LEAD_STATUSES = {
  NOVO: "novo",
  ENGAJADO: "engajado",
  QUENTE: "quente",
  AGENDADO: "agendado",
  FECHADO: "fechado",
  FRIO: "frio",
};

const LEAD_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    last_message TEXT,
    status VARCHAR(50) DEFAULT 'novo',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
  );
  
  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
`;

/**
 * Mapeia dados brutos para o modelo de Lead
 * @param {object} rawData - Dados brutos da API
 * @returns {object} - Lead formatado
 */
function formatLead(rawData) {
  return {
    id: rawData.id,
    phone: rawData.phone,
    name: rawData.name || null,
    lastMessage: rawData.last_message || null,
    status: rawData.status || LEAD_STATUSES.NOVO,
    score: rawData.score || 0,
    createdAt: new Date(rawData.created_at),
    lastInteractionAt: new Date(rawData.last_interaction_at),
    updatedAt: new Date(rawData.updated_at),
    metadata: rawData.metadata || {},
  };
}

/**
 * Valida dados de um lead
 * @param {object} leadData - Dados do lead
 * @returns {object} - { valid: boolean, errors: [] }
 */
function validateLead(leadData) {
  const errors = [];

  if (!leadData.phone) errors.push("phone é obrigatório");
  if (leadData.phone && !/^[0-9\-\+\s\(\)]+$/.test(leadData.phone)) {
    errors.push("phone inválido");
  }
  if (
    leadData.status &&
    !Object.values(LEAD_STATUSES).includes(leadData.status)
  ) {
    errors.push(
      `status inválido. Deve ser um de: ${Object.values(LEAD_STATUSES).join(", ")}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  LEAD_STATUSES,
  LEAD_TABLE_SCHEMA,
  formatLead,
  validateLead,
};
