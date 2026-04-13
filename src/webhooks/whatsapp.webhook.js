const express = require('express');
const router = express.Router();

// webhook de verificação (Meta exige isso)
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook verificado');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// webhook de mensagens
router.post('/webhook', (req, res) => {
  console.log('Mensagem recebida:', JSON.stringify(req.body, null, 2));

  // aqui depois vamos processar com IA
  res.sendStatus(200);
});

module.exports = router;