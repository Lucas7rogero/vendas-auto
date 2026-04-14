/**
 * SERVIÇO DE IA - GEMINI (MOCK PARA DEMONSTRAÇÃO)
 * Simula respostas da IA para testes
 */

const axios = require("axios");

/**
 * Gera resposta a partir de um prompt (MOCK PARA DEMONSTRAÇÃO)
 *
 * @param {string} prompt - Prompt/mensagem para enviar à IA
 * @param {object} options - Opções avançadas
 * @returns {Promise<string>} - Resposta gerada pela IA
 */
async function generateResponse(prompt, options = {}) {
  try {
    console.log("🤖 [MOCK] Processando prompt...");

    // Simular delay da API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Respostas mock baseadas no tipo de prompt
    if (prompt.includes("VERSÃO PRA LEAD QUENTE")) {
      return "Consigo te explicar em 15 minutos. Tenho amanhã às 14h ou 16h, qual funciona melhor?";
    }

    if (prompt.includes("tráfego pago") || prompt.includes("preço")) {
      // Para leads normais, não mencionar preços diretamente
      return "Trabalho com tráfego pago profissional para clínicas de estética. Geramos novos clientes todos os dias através de anúncios direcionados. Posso te explicar melhor em uma ligação rápida. Tenho disponibilidade amanhã, funciona pra você?";
    }

    if (prompt.includes("como funciona")) {
      return "Funciona assim: criamos anúncios direcionados para pessoas procurando clínicas de estética na sua região. Cada lead qualificado recebe sua mensagem automaticamente. Interessado em saber mais detalhes?";
    }

    // Resposta padrão - nunca mencionar preços
    return "Oi! Trabalho com geração de clientes para clínicas de estética através de tráfego pago. Temos soluções que trazem leads qualificados diariamente. Qual seria seu maior desafio hoje com captação de clientes?";
  } catch (error) {
    console.error("❌ Erro no mock da IA:", error);
    throw error;
  }
}

module.exports = {
  generateResponse,
};
