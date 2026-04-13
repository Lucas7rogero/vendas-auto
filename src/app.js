const express = require('express');
require('dotenv').config();

const whatsappWebhook = require('./webhooks/whatsapp.webhook');

const app = express();
app.use(express.json());

app.use('/', whatsappWebhook);

app.get('/', (req, res) => {
  res.send('API rodando 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});