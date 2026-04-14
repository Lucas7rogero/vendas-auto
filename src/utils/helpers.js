/**
 * FUNÇÕES AUXILIARES
 * Utilitários gerais para o sistema
 */

/**
 * Formata um número de telefone para padrão internacional
 * @param {string} phone - Telefone bruto
 * @returns {string} - Telefone formatado
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;

  // Remove tudo que não for número
  const cleaned = phone.replace(/\D/g, "");

  // Se não começar com 55 (Brasil), adiciona
  if (!cleaned.startsWith("55") && cleaned.length <= 11) {
    return "55" + cleaned;
  }

  return cleaned;
}

/**
 * Valida se um número de telefone é válido (Brasil)
 * @param {string} phone - Telefone
 * @returns {boolean}
 */
function isValidBrazilianPhone(phone) {
  if (!phone) return false;

  const formatted = formatPhoneNumber(phone);
  // Deve ter 55 (código Brasil) + 11 dígitos = 13 no total
  // Ou 55 + 10 dígitos = 12 (antigos)
  return formatted.length === 13 || formatted.length === 12;
}

/**
 * Trunca um texto a um tamanho máximo
 * @param {string} text - Texto
 * @param {number} maxLength - Tamanho máximo
 * @returns {string}
 */
function truncateText(text, maxLength = 100) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Pula linhas velhas/antigas (para eventos históricos)
 * @param {number} timestamp - Timestamp em segundos
 * @param {number} maxAgeMinutes - Idade máxima em minutos
 * @returns {boolean} - true se é antigo
 */
function isOldMessage(timestamp, maxAgeMinutes = 30) {
  if (!timestamp) return false;

  const now = Date.now();
  const messageTime = timestamp * 1000;
  const diffMinutes = (now - messageTime) / 1000 / 60;

  return diffMinutes > maxAgeMinutes;
}

/**
 * Gera um ID único (para leads sem ID no banco)
 * @returns {string}
 */
function generateUniqueId() {
  return `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calcula dias desde uma data
 * @param {Date} date - Data
 * @returns {number} - Dias desde então
 */
function daysSince(date) {
  if (!date) return 0;

  const now = new Date();
  const diff = now - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Log com timestamp formatado
 * @param {string} level - 'info', 'warn', 'error'
 * @param {string} message - Mensagem
 * @param {object} data - Dados adicionais (opcional)
 */
function logWithTimestamp(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString("pt-BR");
  const prefix =
    {
      info: "📝",
      warn: "⚠️",
      error: "❌",
      success: "✅",
    }[level] || "•";

  console.log(`${prefix} [${timestamp}] ${message}`);
  if (data) {
    console.log("   ", JSON.stringify(data, null, 2));
  }
}

/**
 * Compara similaridade entre dois textos (simples)
 * @param {string} text1
 * @param {string} text2
 * @returns {number} - Similaridade 0-1
 */
function textSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const str1 = text1.toLowerCase().split(" ");
  const str2 = text2.toLowerCase().split(" ");

  const matches = str1.filter((word) => str2.includes(word)).length;
  const total = Math.max(str1.length, str2.length);

  return matches / total;
}

/**
 * Sanitiza texto para segurança
 * @param {string} text - Texto
 * @returns {string}
 */
function sanitizeText(text) {
  if (!text) return "";

  return text
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();
}

module.exports = {
  formatPhoneNumber,
  isValidBrazilianPhone,
  truncateText,
  isOldMessage,
  generateUniqueId,
  daysSince,
  logWithTimestamp,
  textSimilarity,
  sanitizeText,
};
