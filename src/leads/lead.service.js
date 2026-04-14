/**
 * SERVIÇO DE LEADS
 * Responsável por CRUD de leads no banco de dados
 */

// ⚠️ IMPORTANTE: Será implementado com banco de dados real (PostgreSQL)
// Para agora, usando simulação em memória para testes

let leadsDatabase = {}; // Simulação de banco (será substituído por PostgreSQL)

const { LEAD_STATUSES, formatLead, validateLead } = require("./lead.model");

/**
 * Cria ou atualiza um lead (upsert)
 *
 * @param {object} leadData - Dados do lead
 * @param {string} leadData.phone - Telefone (obrigatório)
 * @param {string} leadData.name - Nome
 * @param {string} leadData.lastMessage - Última mensagem
 * @param {string} leadData.status - Status do lead
 * @param {Date} leadData.lastInteractionAt - Data da última interação
 * @returns {Promise<object>} - Lead criado/atualizado
 */
async function upsertLead(leadData) {
  try {
    // Validar dados
    const validation = validateLead(leadData);
    if (!validation.valid) {
      throw new Error(`Lead inválido: ${validation.errors.join(", ")}`);
    }

    const phone = leadData.phone;
    const now = new Date();

    if (leadsDatabase[phone]) {
      // Atualizar lead existente
      const existingLead = leadsDatabase[phone];

      leadsDatabase[phone] = {
        ...existingLead,
        name: leadData.name || existingLead.name,
        lastMessage: leadData.lastMessage || existingLead.lastMessage,
        status: leadData.status || existingLead.status,
        lastInteractionAt: leadData.lastInteractionAt || now,
        updatedAt: now,
      };

      console.log(`📝 Lead atualizado: ${phone}`);
    } else {
      // Criar novo lead
      leadsDatabase[phone] = {
        id: Object.keys(leadsDatabase).length + 1,
        phone: phone,
        name: leadData.name || null,
        lastMessage: leadData.lastMessage || null,
        status: leadData.status || LEAD_STATUSES.NOVO,
        score: 0,
        createdAt: now,
        lastInteractionAt: leadData.lastInteractionAt || now,
        updatedAt: now,
        metadata: leadData.metadata || {},
      };

      console.log(`✨ Novo lead criado: ${phone}`);
    }

    return leadsDatabase[phone];
  } catch (error) {
    console.error("❌ Erro ao fazer upsert de lead:", error.message);
    throw error;
  }
}

/**
 * Busca um lead pelo telefone
 * @param {string} phone - Telefone do lead
 * @returns {Promise<object|null>}
 */
async function getLeadByPhone(phone) {
  return leadsDatabase[phone] || null;
}

/**
 * Atualiza o status de um lead
 * @param {string} phone - Telefone
 * @param {string} newStatus - Novo status
 * @returns {Promise<object>}
 */
async function updateLeadStatus(phone, newStatus) {
  if (!Object.values(LEAD_STATUSES).includes(newStatus)) {
    throw new Error(`Status inválido: ${newStatus}`);
  }

  if (!leadsDatabase[phone]) {
    throw new Error(`Lead não encontrado: ${phone}`);
  }

  leadsDatabase[phone].status = newStatus;
  leadsDatabase[phone].updatedAt = new Date();

  console.log(`🏷️  Status do lead atualizado: ${phone} → ${newStatus}`);
  return leadsDatabase[phone];
}

/**
 * Atualiza o score de um lead
 * @param {string} phone - Telefone
 * @param {number} scoreIncrease - Pontos a adicionar
 * @returns {Promise<object>}
 */
async function updateLeadScore(phone, scoreIncrease) {
  if (!leadsDatabase[phone]) {
    throw new Error(`Lead não encontrado: ${phone}`);
  }

  leadsDatabase[phone].score += scoreIncrease;
  leadsDatabase[phone].updatedAt = new Date();

  console.log(
    `📊 Score do lead atualizado: ${phone} (${scoreIncrease > 0 ? "+" : ""}${scoreIncrease})`,
  );
  return leadsDatabase[phone];
}

/**
 * Lista todos os leads com filtros opcionais
 * @param {object} filters - Filtros
 * @param {string} filters.status - Filtrar por status
 * @param {number} filters.limit - Limite de resultados
 * @param {number} filters.offset - Offset para paginação
 * @returns {Promise<object[]>}
 */
async function listLeads(filters = {}) {
  let leads = Object.values(leadsDatabase);

  if (filters.status) {
    leads = leads.filter((lead) => lead.status === filters.status);
  }

  // Ordenar por última interação (mais recentes primeiro)
  leads.sort(
    (a, b) => new Date(b.lastInteractionAt) - new Date(a.lastInteractionAt),
  );

  const offset = filters.offset || 0;
  const limit = filters.limit || 50;

  return leads.slice(offset, offset + limit);
}

/**
 * Obtém estatísticas dos leads
 * @returns {Promise<object>}
 */
async function getLeadsStats() {
  const leads = Object.values(leadsDatabase);
  const stats = {
    total: leads.length,
    byStatus: {},
  };

  Object.values(LEAD_STATUSES).forEach((status) => {
    stats.byStatus[status] = leads.filter((l) => l.status === status).length;
  });

  return stats;
}

/**
 * Deleta um lead (somente para testes)
 * @param {string} phone - Telefone
 * @returns {Promise<boolean>}
 */
async function deleteLead(phone) {
  if (leadsDatabase[phone]) {
    delete leadsDatabase[phone];
    console.log(`🗑️  Lead deletado: ${phone}`);
    return true;
  }
  return false;
}

/**
 * Limpa todos os leads (somente para testes)
 */
async function clearAllLeads() {
  leadsDatabase = {};
  console.log("🧹 Todos os leads foram limpos");
}

module.exports = {
  upsertLead,
  getLeadByPhone,
  updateLeadStatus,
  updateLeadScore,
  listLeads,
  getLeadsStats,
  deleteLead,
  clearAllLeads,
};
