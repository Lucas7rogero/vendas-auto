/**
 * WORKFLOW DE CONVERSA
 * Gerencia fluxo de conversa (legado/compatibilidade)
 *
 * ⚠️ NOTE: Este arquivo foi mantido para compatibilidade
 * O principal fluxo foi movido para: src/sales/sales.workflow.js
 */

const { generateResponse } = require("../ai/gemini.service");

/**
 * Processa uma mensagem de conversa (versão simplificada)
 *
 * ⚠️ DEPRECATED: Use src/sales/sales.workflow.js ::handleIncomingMessage() no lugar
 *
 * @param {object} messageData - Dados da mensagem
 * @returns {Promise<string>} - Resposta gerada
 */
async function processMessage(messageData) {
  const { text, timestamp } = messageData;

  // Verificar se mensagem é muito antiga
  if (isOldMessage(timestamp)) {
    console.log("⏰ Mensagem ignorada (muito antiga)");
    return null;
  }

  try {
    // Chamar IA com prompt simples
    const response = await generateResponse(text);
    return response;
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error.message);
    throw error;
  }
}

/**
 * Verifica se mensagem é muito antiga
 * @param {number} timestamp - Timestamp em segundos
 * @returns {boolean}
 */
function isOldMessage(timestamp) {
  const now = Date.now();
  const messageTime = timestamp * 1000;
  const diffMinutes = (now - messageTime) / 1000 / 60;

  return diffMinutes > 30;
}

module.exports = {
  processMessage,
  isOldMessage,
};
