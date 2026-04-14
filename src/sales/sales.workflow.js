/**
 * WORKFLOW PRINCIPAL DE VENDAS
 * Orquestra toda a lógica de recebimento e resposta de mensagens
 */

const { generateResponse } = require("../ai/gemini.service");
const { buildSalesPrompt, buildHotLeadPrompt } = require("./sales.prompts");
const { qualifyLead, getLeadStatus } = require("./lead.qualifier");
const { upsertLead, updateLeadStatus } = require("../leads/lead.service");

/**
 * Processa mensagem recebida no WhatsApp
 *
 * FLUXO:
 * 1. Valida mensagem
 * 2. Qualifica lead (verifica se é quente)
 * 3. Prepara prompt dinâmico
 * 4. Chama IA (Gemini)
 * 5. Salva lead no banco
 * 6. Retorna resposta formatada
 *
 * @param {object} messageData - Dados da mensagem recebida
 * @param {string} messageData.phone - Telefone do cliente
 * @param {string} messageData.message - Texto da mensagem
 * @param {string} messageData.senderName - Nome do cliente (opcional)
 * @param {string} messageData.timestamp - Timestamp da mensagem
 * @returns {Promise<object>} - { success, response, leadStatus, leadQualification }
 */
async function handleIncomingMessage(messageData) {
  try {
    const { phone, message, senderName, timestamp } = messageData;

    // Validação básica
    if (!phone || !message) {
      return {
        success: false,
        error: "Dados incompletos: phone e message são obrigatórios",
        response: null,
      };
    }

    console.log(`\n📨 Mensagem recebida de ${senderName || phone}`);
    console.log(`   Texto: "${message}"`);

    // 1️⃣ QUALIFICAR LEAD
    const qualification = qualifyLead(message);
    const leadStatus = getLeadStatus(qualification);
    const isHotLead = qualification.isHot;

    console.log(
      `🔥 Qualificação: ${leadStatus} (score: ${qualification.score})`,
    );
    console.log(`   Motivo: ${qualification.reason}`);

    // 2️⃣ PREPARAR PROMPT DINÂMICO
    let prompt;
    if (isHotLead) {
      console.log("⚡ Lead QUENTE detectado! Usando prompt agressivo...");
      prompt = buildHotLeadPrompt(message, senderName);
    } else {
      prompt = buildSalesPrompt(message, senderName);
    }

    // 3️⃣ CHAMAR IA
    console.log("🤖 Chamando Gemini...");
    const aiResponse = await generateResponse(prompt);

    if (!aiResponse || aiResponse.includes("Erro")) {
      throw new Error("IA retornou erro ou resposta vazia");
    }

    console.log(`✅ Resposta gerada:\n   "${aiResponse}"`);

    // 4️⃣ SALVAR LEAD NO BANCO
    const leadData = {
      phone,
      name: senderName || null,
      lastMessage: message,
      status: leadStatus,
      lastInteractionAt: new Date(timestamp * 1000 || Date.now()),
    };

    const savedLead = await upsertLead(leadData);
    console.log(`💾 Lead salvo: ${savedLead.id || phone}`);

    // 5️⃣ RETORNAR RESPOSTA FORMATADA
    return {
      success: true,
      response: aiResponse,
      leadStatus,
      leadId: savedLead.id,
      qualification: {
        isHot: isHotLead,
        score: qualification.score,
        reason: qualification.reason,
      },
      metadata: {
        clientPhone: phone,
        clientName: senderName,
        timestamp: new Date(timestamp * 1000 || Date.now()),
      },
    };
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error.message);
    return {
      success: false,
      error: error.message,
      response: "Desculpe, tive um problema técnico. Pode tentar novamente?",
      leadStatus: "novo",
    };
  }
}

/**
 * Extrai dados da mensagem do webhook da Meta WhatsApp
 *
 * @param {object} webhookBody - Body do webhook da Meta
 * @returns {object|null} - { phone, message, senderName, timestamp } ou null se inválido
 */
function extractMessageData(webhookBody) {
  try {
    const entry = webhookBody.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message || !contact) {
      return null;
    }

    const phoneNumber = message.from;
    const messageText = message.text?.body;
    const senderName = contact.profile?.name;
    const timestamp = message.timestamp;

    return {
      phone: phoneNumber,
      message: messageText,
      senderName: senderName,
      timestamp: parseInt(timestamp),
    };
  } catch (error) {
    console.error("Erro ao extrair dados do webhook:", error.message);
    return null;
  }
}

/**
 * Simula um teste de mensagem (para testes sem WhatsApp)
 *
 * @param {string} message - Mensagem de teste
 * @param {string} senderName - Nome do cliente
 * @param {string} phone - Telefone (opcional, gera aleatório)
 * @returns {Promise<object>}
 */
async function handleTestMessage(
  message,
  senderName = "Cliente Teste",
  phone = null,
) {
  const testPhone = phone || `5585${Math.random().toString().slice(2, 10)}`;

  return handleIncomingMessage({
    phone: testPhone,
    message,
    senderName,
    timestamp: Math.floor(Date.now() / 1000),
  });
}

module.exports = {
  handleIncomingMessage,
  extractMessageData,
  handleTestMessage,
};
