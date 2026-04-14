/**
 * APLICAÇÃO PRINCIPAL - VENDAS AUTO
 * Sistema de prospecção e fechamento de clientes via WhatsApp com IA
 */

const express = require("express");
require("dotenv").config();

const whatsappWebhook = require("./webhooks/whatsapp.webhook");
const { handleTestMessage } = require("./sales/sales.workflow");
const {
  listLeads,
  getLeadsStats,
  clearAllLeads,
} = require("./leads/lead.service");

const app = express();
app.use(express.json());

// ==============================
// MIDDLEWARE - LOG SIMPLES
// ==============================

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ==============================
// ROUTES - WEBHOOK
// ==============================

app.use("/", whatsappWebhook);

// ==============================
// ROUTES - HEALTH CHECK
// ==============================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API rodando",
    version: "1.1.0",
    name: "VENDAS AUTO - IA Sales System",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "GET /",
      testMessage: "POST /test-message",
      leads: "GET /leads",
      leadStats: "GET /leads/stats",
      webhook: "POST /webhook (WhatsApp)",
      webhookTest: "POST /webhook/test",
    },
  });
});

// ==============================
// ROUTES - TESTES
// ==============================

app.post("/test-message", async (req, res) => {
  try {
    const { message, senderName, phone } = req.body;

    if (!message || !senderName) {
      return res.status(400).json({
        error: "message e senderName são obrigatórios",
        example: {
          message: "Qual é o preço do tráfego pago?",
          senderName: "Maria",
          phone: "5585999999999",
        },
      });
    }

    console.log("\n🧪 TESTE DE MENSAGEM");
    console.log(`Mensagem: "${message}"`);
    console.log(`Cliente: ${senderName}`);

    const result = await handleTestMessage(message, senderName, phone);

    res.json({
      success: result.success,
      qualification: result.qualification,
      leadStatus: result.leadStatus,
      response: result.response,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("❌ Erro ao testar mensagem:", error);

    res.status(500).json({
      error: "Erro ao processar mensagem",
      details: error.message,
    });
  }
});

// ==============================
// ROUTES - LEADS
// ==============================

app.get("/leads", async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const leads = await listLeads({
      status: status || undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("❌ Erro ao listar leads:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/leads/stats", async (req, res) => {
  try {
    const stats = await getLeadsStats();
    res.json(stats);
  } catch (error) {
    console.error("❌ Erro ao obter stats:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ROUTES - DEBUG
// ==============================

if (process.env.NODE_ENV !== "production") {
  app.delete("/debug/clear-leads", async (req, res) => {
    const password = req.query.password;

    if (password !== process.env.DEBUG_PASSWORD) {
      return res.status(403).json({ error: "Senha incorreta" });
    }

    await clearAllLeads();

    console.log("🧹 Leads apagados");

    res.json({ message: "Todos os leads foram limpos" });
  });

  app.post("/debug/simulate-conversations", async (req, res) => {
    try {
      const testConversations = [
        {
          message: "Olá, vocês trabalham com tráfego pago?",
          senderName: "Ana - Clínica Estética",
        },
        {
          message: "Qual é o preço do serviço?",
          senderName: "Bruno - Dermatologia",
        },
        {
          message: "Como funciona? Tenho interesse em agendar uma reunião",
          senderName: "Carol - Spa",
        },
        {
          message: "quero contratar",
          senderName: "David",
        },
      ];

      const results = [];

      for (const conversation of testConversations) {
        const result = await handleTestMessage(
          conversation.message,
          conversation.senderName
        );

        results.push({
          client: conversation.senderName,
          message: conversation.message,
          status: result.leadStatus,
          isHot: result.qualification?.isHot || false,
          response: result.response.substring(0, 80) + "...",
        });
      }

      res.json({
        message: "Simulação concluída",
        conversations: results,
      });
    } catch (error) {
      console.error("❌ Erro na simulação:", error.message);
      res.status(500).json({ error: error.message });
    }
  });
}

// ==============================
// ERROR HANDLING
// ==============================

app.use((err, req, res, next) => {
  console.error("❌ Erro não tratado:", err);

  res.status(500).json({
    error: "Erro interno do servidor",
    message: err.message,
  });
});

// ==============================
// INICIAR SERVIDOR
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("\n" + "═".repeat(60));
  console.log("🚀 VENDAS AUTO - IA SALES SYSTEM");
  console.log("═".repeat(60));
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`Modelo IA: ${process.env.GEMINI_MODEL || "gemini-pro"}`);
  console.log("\nEndpoints:");
  console.log("GET  /");
  console.log("POST /test-message");
  console.log("GET  /leads");
  console.log("GET  /leads/stats");
  console.log("POST /webhook");
  console.log("POST /webhook/test");
  console.log("═".repeat(60) + "\n");
});

module.exports = app;