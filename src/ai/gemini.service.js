/**
 * SERVIÇO DE IA - GEMINI
 * Responsável por chamar a API do Google Gemini
 */

const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Valida se a API key está configurada
 */
function validateApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Por favor, defina a variável de ambiente GEMINI_API_KEY",
    );
  }
}

/**
 * Gera resposta a partir de um prompt
 *
 * @param {string} prompt - Prompt/mensagem para enviar à IA
 * @param {object} options - Opções avançadas
 * @param {number} options.temperature - Criatividade (0-2)
 * @param {number} options.maxTokens - Máximo de tokens
 * @param {number} options.topK - Top K sampling
 * @param {number} options.topP - Top P sampling
 * @returns {Promise<string>} - Resposta gerada pela IA
 * @throws {Error} - Se há erro na chamada à API
 */
async function generateResponse(prompt, options = {}) {
  try {
    validateApiKey();

    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt inválido ou vazio");
    }

    // Normalizar opções
    const temperature =
      options.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options.maxTokens || 500;
    const topK = options.topK || 40;
    const topP = options.topP || 0.95;

    console.log("🤖 Chamando Gemini API...");
    console.log(`   Model: ${GEMINI_MODEL}`);
    console.log(`   Temperature: ${temperature}`);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topK,
          topP,
        },
      },
      {
        timeout: 30000, // Timeout de 30 segundos
      },
    );

    // Validar resposta
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Resposta inválida da API Gemini");
    }

    const generatedText =
      response.data.candidates[0].content.parts[0].text.trim();

    if (!generatedText) {
      throw new Error("IA retornou resposta vazia");
    }

    console.log("✅ Resposta gerada com sucesso");
    return generatedText;
  } catch (error) {
    console.error("❌ Erro ao chamar Gemini:", error.message);

    // Behandelo específico de erros
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(
        "Erro de autenticação: GEMINI_API_KEY inválida ou sem permissões",
      );
    }

    if (error.response?.status === 429) {
      throw new Error(
        "Limite de requisições atingido. Tente novamente mais tarde",
      );
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("Timeout ao conectar com a API Gemini");
    }

    throw error;
  }
}

/**
 * Gera múltiplas variações de resposta
 *
 * @param {string} prompt - Prompt para gerar respostas
 * @param {number} count - Número de variações (máximo 5)
 * @returns {Promise<string[]>} - Array com respostas geradas
 */
async function generateMultipleResponses(prompt, count = 3) {
  if (count > 5) count = 5;
  if (count < 1) count = 1;

  const responses = [];

  for (let i = 0; i < count; i++) {
    try {
      const response = await generateResponse(prompt, { temperature: 0.9 });
      responses.push(response);
    } catch (error) {
      console.error(`Erro ao gerar variação ${i + 1}:`, error.message);
    }
  }

  return responses;
}

/**
 * Valida se um texto foi gerado por IA (simples heurística)
 * @param {string} text - Texto a validar
 * @returns {boolean}
 */
function isValidAiResponse(text) {
  if (!text || typeof text !== "string") return false;
  if (text.length < 5) return false;
  if (text.includes("Erro ao")) return false;
  return true;
}

module.exports = {
  generateResponse,
  generateMultipleResponses,
  isValidAiResponse,
  validateApiKey,
};
