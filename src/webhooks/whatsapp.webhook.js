/**
 * WEBHOOK DO WHATSAPP
 * Recebe e processa mensagens da Meta WhatsApp Business API
 */

const express = require("express");
const router = express.Router();

const {
  handleIncomingMessage,
  extractMessageData,
} = require("../sales/sales.workflow");

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_aqui";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * WEBHOOK GET - Verificação da Meta
 * A Meta exige que seu servidor retorne o challenge para validar o webhook
 */
router.get("/webhook", (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("🔐 Tentativa de verificação do webhook");
    console.log(`   Mode: ${mode}`);
    console.log(
      `   Token recebido: ${token ? "***" + token.slice(-4) : "nenhum"}`,
    );

    // Verificar token
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verificado com sucesso!");
      return res.status(200).send(challenge);
    } else {
      console.error("❌ Token de verificação inválido");
      return res.sendStatus(403);
    }
  } catch (error) {
    console.error("❌ Erro ao verificar webhook:", error.message);
    return res.sendStatus(500);
  }
});

/**
 * WEBHOOK POST - Recebe mensagens do WhatsApp
 * Processa cada mensagem e gera resposta automática
 */
router.post("/webhook", async (req, res) => {
  try {
    const webhookBody = req.body;

    // A Meta requer resposta rápida (em menos de 5 segundos)
    // Por isso respondemos imediatamente e processamos em background
    res.sendStatus(200);

    console.log("\n" + "═".repeat(60));
    console.log("📨 WEBHOOK RECEBIDO DO WHATSAPP");
    console.log(JSON.stringify(webhookBody, null, 2));
    console.log("═".repeat(60));

    // Validar estrutura básica
    if (webhookBody.object !== "whatsapp_business_account") {
      console.log("⚠️  Não é mensagem do WhatsApp, ignorando");
      return;
    }

    // Extrair dados da mensagem
    const messageData = extractMessageData(webhookBody);

    if (!messageData) {
      console.log("⚠️  Não conseguiu extrair dados da mensagem");
      return;
    }

    // ⭐ PROCESSAR MENSAGEM EM BACKGROUND
    setImmediate(async () => {
      try {
        const result = await handleIncomingMessage(messageData);

        if (result.success) {
          console.log("\n✅ Processamento concluído com sucesso");
          console.log(`   Response: "${result.response.substring(0, 50)}..."`);
          console.log(`   Lead Status: ${result.leadStatus}`);
          console.log(`   Hot: ${result.qualification.isHot ? "🔥" : "❌"}`);

          // ⚠️ AQUI: Enviar resposta via WhatsApp API
          await sendWhatsAppMessage(
            messageData.phone,
            result.response,
            messageData.senderName,
          );
        } else {
          console.error("❌ Falha ao processar mensagem:", result.error);
          // Enviar mensagem de erro
          await sendWhatsAppMessage(
            messageData.phone,
            result.response || "Desculpe, tive um problema. Pode repetir?",
          );
        }
      } catch (error) {
        console.error(
          "❌ Erro ao processar mensagem em background:",
          error.message,
        );
      }
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error.message);
    res.sendStatus(500);
  }
});

/**
 * Envia mensagem resposta via WhatsApp API
 *
 * @param {string} recipientPhone - Número do destinatário (com country code)
 * @param {string} messageText - Texto da mensagem
 * @param {string} recipientName - Nome do destinatário (opcional, só para log)
 * @returns {Promise<void>}
 */
async function sendWhatsAppMessage(
  recipientPhone,
  messageText,
  recipientName = null,
) {
  try {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.warn("⚠️  ACCESS_TOKEN ou PHONE_NUMBER_ID não configurados");
      console.log(
        `   Mensagem que seria enviada para ${recipientName || recipientPhone}:`,
      );
      console.log(`   "${messageText}"`);
      return;
    }

    const axios = require("axios");

    console.log(
      `\n📤 Enviando mensagem para ${recipientName || recipientPhone}`,
    );

    const response = await axios.post(
      `https://graph.instagram.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "text",
        text: {
          preview_url: false,
          body: messageText,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Mensagem enviada com sucesso");
    console.log(`   Message ID: ${response.data.messages[0].id}`);
  } catch (error) {
    console.error(
      "❌ Erro ao enviar mensagem via WhatsApp:",
      error.response?.data || error.message,
    );
  }
}

/**
 * Endpoint para testar webhook localmente (debug)
 * POST /webhook/test
 */
router.post("/webhook/test", async (req, res) => {
  try {
    const { phone, message, senderName } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        error: "phone e message são obrigatórios",
        example: {
          phone: "558599999999",
          message: "Qual é o preço?",
          senderName: "João",
        },
      });
    }

    const result = await handleIncomingMessage({
      phone,
      message,
      senderName: senderName || "Cliente Teste",
      timestamp: Math.floor(Date.now() / 1000),
    });

    res.json(result);
  } catch (error) {
    console.error("Erro ao testar webhook:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
