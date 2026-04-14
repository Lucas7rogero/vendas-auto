/**
 * SERVIÇO DE LEADS - VERSÃO SQLITE
 * Responsável por CRUD de leads no banco de dados
 */

const { db, prepare } = require("../config/db-sqlite");
const { LEAD_STATUSES, formatLead, validateLead } = require("./lead.model");

/**
 * Cria ou atualiza um lead (upsert)
 */
async function upsertLead(leadData) {
  try {
    console.log(
      "🔍 Dados recebidos no upsertLead:",
      JSON.stringify(leadData, null, 2),
    );

    const validation = validateLead(leadData);
    if (!validation.valid) {
      throw new Error(`Lead inválido: ${validation.errors.join(", ")}`);
    }

    const phone = leadData.phone;
    const now = new Date().toISOString();
    console.log("📅 Now:", now, typeof now);

    const existingLead = prepare("SELECT * FROM leads WHERE phone = ?").get(
      phone,
    );

    if (existingLead) {
      const updateStmt = prepare(`
        UPDATE leads
        SET name = ?, last_message = ?, status = ?, last_interaction_at = ?, updated_at = ?
        WHERE phone = ?
      `);

      updateStmt.run(
        leadData.name || existingLead.name,
        leadData.lastMessage || existingLead.last_message,
        leadData.status || existingLead.status,
        now,
        now,
        phone,
      );

      console.log(`📝 Lead atualizado: ${phone}`);
      return getLeadByPhone(phone);
    } else {
      const insertStmt = prepare(`
        INSERT INTO leads (phone, name, last_message, status, qualification_score, is_hot_lead, created_at, updated_at, last_interaction_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(
        phone,
        leadData.name || null,
        leadData.lastMessage || null,
        leadData.status || "new",
        0,
        0, // is_hot_lead como 0 em vez de false
        now,
        now,
        now,
      );

      console.log("✅ Insert executado com sucesso");

      console.log(`✨ Novo lead criado: ${phone}`);
      return getLeadById(result.lastInsertRowid);
    }
  } catch (error) {
    console.error("❌ Erro ao salvar lead:", error);
    throw error;
  }
}

/**
 * Busca lead por telefone
 */
function getLeadByPhone(phone) {
  try {
    const stmt = prepare("SELECT * FROM leads WHERE phone = ?");
    const lead = stmt.get(phone);
    return lead ? formatLead(lead) : null;
  } catch (error) {
    console.error("❌ Erro ao buscar lead por telefone:", error);
    throw error;
  }
}

/**
 * Busca lead por ID
 */
function getLeadById(id) {
  try {
    const stmt = prepare("SELECT * FROM leads WHERE id = ?");
    const lead = stmt.get(id);
    return lead ? formatLead(lead) : null;
  } catch (error) {
    console.error("❌ Erro ao buscar lead por ID:", error);
    throw error;
  }
}

/**
 * Lista todos os leads
 */
async function getAllLeads() {
  try {
    const stmt = prepare(
      "SELECT * FROM leads ORDER BY last_interaction_at DESC",
    );
    const leads = stmt.all();
    return leads.map(formatLead);
  } catch (error) {
    console.error("❌ Erro ao listar leads:", error);
    throw error;
  }
}

/**
 * Atualiza status do lead
 */
async function updateLeadStatus(phone, status) {
  try {
    if (!Object.values(LEAD_STATUSES).includes(status)) {
      throw new Error(`Status inválido: ${status}`);
    }

    const stmt = prepare(
      "UPDATE leads SET status = ?, updated_at = ? WHERE phone = ?",
    );
    const result = stmt.run(status, new Date().toISOString(), phone);

    if (result.changes === 0) {
      throw new Error(`Lead não encontrado: ${phone}`);
    }

    console.log(`📊 Status do lead ${phone} atualizado para: ${status}`);
    return getLeadByPhone(phone);
  } catch (error) {
    console.error("❌ Erro ao atualizar status do lead:", error);
    throw error;
  }
}

/**
 * Deleta lead
 */
async function deleteLead(phone) {
  try {
    const stmt = prepare("DELETE FROM leads WHERE phone = ?");
    const result = stmt.run(phone);

    if (result.changes === 0) {
      throw new Error(`Lead não encontrado: ${phone}`);
    }

    console.log(`🗑️ Lead deletado: ${phone}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao deletar lead:", error);
    throw error;
  }
}

/**
 * Salva uma conversa (mensagem + resposta)
 */
async function saveConversation(phone, message, response) {
  try {
    const lead = await getLeadByPhone(phone);
    if (!lead) {
      throw new Error(`Lead não encontrado: ${phone}`);
    }

    const insertStmt = prepare(`
      INSERT INTO conversations (lead_id, message, response, direction, timestamp)
      VALUES (?, ?, ?, 'incoming', ?)
    `);

    insertStmt.run(lead.id, message, response, new Date().toISOString());

    console.log(`💬 Conversa salva para lead: ${phone}`);
  } catch (error) {
    console.error("❌ Erro ao salvar conversa:", error);
    throw error;
  }
}

/**
 * Obtém histórico de conversas de um lead
 */
async function getConversationHistory(phone, limit = 10) {
  try {
    console.log(`📚 Buscando histórico para ${phone}`);
    const lead = await getLeadByPhone(phone);
    if (!lead) {
      console.log(`📚 Lead não encontrado, retornando histórico vazio`);
      return "";
    }

    console.log(`📚 Lead encontrado: ${lead.id}, buscando conversas...`);
    const stmt = prepare(`
      SELECT message, response, timestamp
      FROM conversations
      WHERE lead_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const conversations = stmt.all(lead.id, limit);
    console.log(`📚 Encontradas ${conversations.length} conversas`);

    // Formatar histórico como string
    const history = conversations
      .reverse()
      .map((conv) => `Cliente: ${conv.message}\nResposta: ${conv.response}`)
      .join("\n\n");

    console.log(`📚 Histórico formatado: ${history.length} caracteres`);
    return history;
  } catch (error) {
    console.error("❌ Erro ao obter histórico de conversas:", error);
    console.error("Stack:", error.stack);
    return "";
  }
}

module.exports = {
  upsertLead,
  getLeadByPhone,
  getLeadById,
  getAllLeads,
  updateLeadStatus,
  deleteLead,
  saveConversation,
  getConversationHistory,
};
