/**
 * QUALIFICADOR DE LEADS
 * Responsável por identificar leads "quentes" baseado em sinais
 */

/**
 * Palavras-chave que indicam interesse/intenção de compra
 */
const HOT_LEAD_KEYWORDS = [
  // Interesse geral
  "interesse",
  "interessado",
  "interessante",
  "intrigado",

  // Perguntas sobre preço/valor
  "qual.*preço",
  "qual.*valor",
  "quanto custa",
  "quanto é",
  "qual o valor",
  "que valor",
  "tabela de preço",
  "preço",
  "valor",

  // Intenção de compra
  "quero",
  "preciso",
  "gostaria",
  "desejo",
  "vou",
  "comprar",
  "contratar",
  "começar",
  "iniciar",

  // Agendamento
  "quando",
  "qual horário",
  "agenda",
  "agendar",
  "reunião",
  "conversa",
  "chamada",
  "videochamada",

  // Objeções (tratável = interesse)
  "muito caro",
  "não posso agora",
  "deixa para depois",
  "quanto gasto",
  "vale a pena",
  "funciona mesmo",
  "prova",
  "teste",

  // Confirmação
  "sim",
  "claro",
  "beleza",
  "ok",
  "topa",
  "tá bom",
];

/**
 * Palavras-chave que indicam falta de interesse
 */
const COLD_LEAD_KEYWORDS = [
  "não interessado",
  "não tenho interesse",
  "não quero",
  "não preciso",
  "já temos",
  "usamos outro",
  "não me liga",
  "deixa em paz",
  "scam",
  "spam",
];

/**
 * Padrões que indicam lead muito quente
 */
const VERY_HOT_PATTERNS = [
  /qual.*preço|quanto custa|tabela de preço/i,
  /quero.*contratar|quero.*começar/i,
  /agendar.*reunião|marca.*reunião/i,
  /como.*fazer|passo a passo|tutorial/i,
  /vale a pena|retorno|ROI/i,
];

/**
 * Classifica o lead baseado na mensagem
 * @param {string} message - Mensagem do cliente
 * @returns {object} - { isHot: boolean, score: number, reason: string }
 */
function qualifyLead(message) {
  if (!message) {
    return { isHot: false, score: 0, reason: "Mensagem vazia" };
  }

  const messageLower = message.toLowerCase();
  let score = 0;
  let reasons = [];

  // Verificar palavras-chave de falta de interesse
  for (const keyword of COLD_LEAD_KEYWORDS) {
    if (new RegExp(keyword, "i").test(messageLower)) {
      return {
        isHot: false,
        score: -100,
        reason: `Lead frio - detectado: ${keyword}`,
      };
    }
  }

  // Verificar padrões muito quentes
  for (const pattern of VERY_HOT_PATTERNS) {
    if (pattern.test(messageLower)) {
      score += 40;
      reasons.push(`Padrão muito quente: ${pattern}`);
    }
  }

  // Verificar palavras-chave de interesse
  for (const keyword of HOT_LEAD_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(messageLower)) {
      score += 20;
      reasons.push(`Palavra-chave: ${keyword}`);
    }
  }

  // Bonus para mensagens mais longas (sinal de engajamento)
  if (messageLower.length > 50) {
    score += 10;
    reasons.push("Mensagem detalhada");
  }

  // Bonus para múltiplas linhas (sinal de real interesse)
  const lineCount = message.split("\n").length;
  if (lineCount > 2) {
    score += 15;
    reasons.push(`${lineCount} linhas - alta engajamento`);
  }

  return {
    isHot: score >= 30, // Threshold de 30 pontos
    score,
    reason: reasons.length > 0 ? reasons.join(" | ") : "Score baixo",
  };
}

/**
 * Função simplificada - apenas retorna boolean
 * @param {string} message - Mensagem do cliente
 * @returns {boolean}
 */
function isHotLead(message) {
  const qualification = qualifyLead(message);
  return qualification.isHot;
}

/**
 * Retorna o status do lead ("novo", "engajado", "quente", "frio")
 * @param {object} qualification - Resultado de qualifyLead
 * @returns {string}
 */
function getLeadStatus(qualification) {
  if (qualification.score < 0) return "frio";
  if (qualification.score >= 50) return "quente";
  if (qualification.score >= 30) return "engajado";
  return "novo";
}

module.exports = {
  qualifyLead,
  isHotLead,
  getLeadStatus,
  HOT_LEAD_KEYWORDS,
  COLD_LEAD_KEYWORDS,
};
