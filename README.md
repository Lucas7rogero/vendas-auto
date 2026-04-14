# 🚀 VENDAS AUTO - Sistema de IA Sales via WhatsApp

> Sistema inteligente de prospecção e fechamento de clientes via WhatsApp com IA generativa (Google Gemini)

## 📋 Visão Geral

**VENDAS AUTO** é um sistema automatizado de resposta e qualificação de leads via WhatsApp, utilizando IA para:

✅ **Qualificação de Leads**: Detecta automaticamente leads "quentes" com interesse de compra
✅ **Resposta Inteligente**: Gera respostas consultivas de vendedor profissional
✅ **Armazenamento**: Salva leads no banco com status e histórico
✅ **Detecção de Hot Leads**: Identifica quando cliente tem alta intenção de compra
✅ **Estratégia de Vendas**: Força agendamento para leads quentes
✅ **Integração Meta**: Recebe/envia mensagens via WhatsApp Business API

---

## 🏗️ Arquitetura do Sistema

```
vendas-auto/
├── src/
│   ├── ai/                  # Camada de IA
│   │   └── gemini.service.js       # Integração Google Gemini
│   │
│   ├── config/              # Configurações
│   │   └── db.js                   # Banco de Dados PostgreSQL
│   │
│   ├── leads/               # Gestão de Leads
│   │   ├── lead.model.js           # Schema de dados
│   │   └── lead.service.js         # CRUD de leads
│   │
│   ├── sales/               # ⭐ NOVA CAMADA DE VENDAS
│   │   ├── sales.prompts.js        # Prompts dinâmicos de IA
│   │   ├── lead.qualifier.js       # Qualifica leads (hot/cold)
│   │   └── sales.workflow.js       # Orquestra fluxo de vendas
│   │
│   ├── messaging/           # Mensagens
│   │   └── whatsapp.service.js
│   │
│   ├── webhooks/            # Webhooks (Meta)
│   │   ├── whatsapp.webhook.js     # Recebe mensagens WhatsApp
│   │   └── payment.webhook.js
│   │
│   ├── utils/               # Utilitários
│   │   └── helpers.js              # Funções auxiliares
│   │
│   ├── workflows/           # Fluxos
│   │   └── conversation.workflow.js (legado)
│   │
│   ├── scheduler/           # Agendador (cron jobs)
│   ├── payments/            # Pagamentos
│   │
│   └── app.js               # Aplicação principal
│
├── .env.example             # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

### Fluxo de Mensagem

```
1. WhatsApp → 2. Webhook (POST /webhook)
   ↓
3. extractMessageData() → 4. handleIncomingMessage()
   ↓
5. qualifyLead() [detecta lead quente/frio]
   ↓
6. buildSalesPrompt() [monta prompt dinâmico]
   ↓
7. generateResponse() [chama Gemini IA]
   ↓
8. upsertLead() [salva/atualiza no banco]
   ↓
9. sendWhatsAppMessage() [responde ao cliente]
```

---

## ⚙️ Configuração

### 1️⃣ Pré-requisitos

- **Node.js** 16+
- **PostgreSQL** 12+
- **Google Gemini API Key** (obtém em https://makersuite.google.com/app/apikey)
- **Meta WhatsApp Business API** (obtém em https://developers.facebook.com)

### 2️⃣ Instalação

```bash
# Clonar/entrar no projeto
cd vendas-auto

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas credenciais
nano .env
```

### 3️⃣ Configurar Variáveis de Ambiente (.env)

```env
# SERVIDOR
NODE_ENV=development
PORT=3000

# WHATSAPP META BUSINESS
WHATSAPP_VERIFY_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=120XXXXX
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxx...

# GOOGLE GEMINI
GEMINI_API_KEY=AIzaXXX...
GEMINI_MODEL=gemini-pro

# BANCO DE DADOS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendas_auto
DB_USER=postgres
DB_PASSWORD=sua_senha
```

### 4️⃣ Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar database
CREATE DATABASE vendas_auto;
```

---

## 🚀 Iniciar Servidor

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

Saída esperada:

```
============================================================
🚀 VENDAS AUTO - IA SALES SYSTEM
============================================================
📍 Servidor rodando em: http://localhost:3000
🌍 Ambiente: development
🤖 Modelo Gemini: gemini-pro

📚 Endpoints disponíveis:
   GET  /                    - Health check
   POST /test-message        - Testar mensagem
   GET  /leads               - Listar leads
   GET  /leads/stats         - Estatísticas de leads
   GET  /webhook             - Webhook verificação (Meta)
   POST /webhook             - Webhook receber mensagens
   POST /webhook/test        - Teste do webhook
```

---

## 🧪 Testando o Sistema

### 1. Health Check

```bash
curl http://localhost:3000
```

### 2. Testar Mensagem Individual

```bash
curl -X POST http://localhost:3000/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual é o preço do tráfego pago?",
    "senderName": "João Silva",
    "phone": "558599999999"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "leadStatus": "quente",
  "response": "Oto! Para clínicas de estética, oferecemos tráfego pago especializado. R$1500/mês inclui...",
  "qualification": {
    "isHot": true,
    "score": 50,
    "reason": "Palavra-chave: preço | Padrão muito quente..."
  }
}
```

### 3. Listar Leads Cadastrados

```bash
curl http://localhost:3000/leads
```

### 4. Estatísticas de Leads

```bash
curl http://localhost:3000/leads/stats
```

### 5. Simular Múltiplas Conversas (Debug)

```bash
curl -X POST http://localhost:3000/debug/simulate-conversations
```

---

## 🔑 Principais Classes e Functions

### Sales Prompts (`src/sales/sales.prompts.js`)

```javascript
// Montar prompt consultivo
buildSalesPrompt(message, clientName, history);

// Prompt agressivo para leads quentes
buildHotLeadPrompt(message, clientName);

// Follow-up para leads que não responderam
buildFollowUpPrompt(clientName);
```

### Lead Qualifier (`src/sales/lead.qualifier.js`)

```javascript
// Qualificar lead (retorna score e status)
qualifyLead(message);
// Returns: { isHot, score, reason }

// Método simplificado (apenas boolean)
isHotLead(message);

// Obter status do lead
getLeadStatus(qualification);
// Returns: "novo" | "engajado" | "quente" | "frio"
```

### Sales Workflow (`src/sales/sales.workflow.js`)

```javascript
// PRINCIPAL: Recebe e processa mensagem
handleIncomingMessage(messageData);
// Retorna: { success, response, leadStatus, qualification }

// Extrai dados do webhook Meta
extractMessageData(webhookBody);

// Testa mensagem (sem WhatsApp)
handleTestMessage(message, senderName, phone);
```

### Lead Service (`src/leads/lead.service.js`)

```javascript
// Cria ou atualiza lead
upsertLead(leadData);

// Busca lead
getLeadByPhone(phone);

// Atualiza status
updateLeadStatus(phone, newStatus);

// Atualiza score
updateLeadScore(phone, scoreIncrease);

// Lista com filtros
listLeads(filters);

// Estatísticas
getLeadsStats();
```

### Gemini Service (`src/ai/gemini.service.js`)

```javascript
// Gera resposta com prompt dinâmico
generateResponse(prompt, options);

// Gera múltiplas variações
generateMultipleResponses(prompt, count);

// Valida resposta da IA
isValidAiResponse(text);
```

---

## 📊 Detecção de Leads Quentes

O sistema detecta automaticamente **leads quentes** através de análise de palavras-chave:

### Indicadores de Alta Intenção ✅

- `"preço"`, `"valor"`, `"quanto custa"`
- `"interesse"`, `"interessado"`
- `"quero"`, `"preciso"`, `"gostaria"`
- `"como funciona"`, `"passo a passo"`
- `"reunião"`, `"agendar"`, `"quando"`
- `"vale a pena"`, `"ROI"`, `"retorno"`

### Indicadores de Desinteresse ❌

- `"não interessado"`, `"não quero"`
- `"já temos outro"`, `"scam"`
- `"deixa em paz"`

### Classificação

- **Score ≥ 50**: 🔥 **QUENTE** (força agendamento)
- **Score 30-50**: 🟡 **ENGAJADO** (consultivo)
- **Score < 30**: 🔵 **NOVO** (qualificação)
- **Score < 0**: ⬜ **FRIO** (parou de responder)

---

## 💬 exemplo de Conversa

### Cliente envia:

```
Olá! Vocês trabalham com tráfego pago para clínica de estética?
```

### Sistema:

1. Qualifica como NOVO (score: 10)
2. Monta prompt consultivo
3. Gemini responde:

```
Olá! Sim, especialização em tráfego pago para clínicas de estética 😊

Trabalhamos com estratégias comprovadas que geram 5-10x leads qualificados.

Sua clínica já investe em tráfego pago? Qual é o principal desafio agora?
```

4. Salva lead no banco (status: "novo")

### Cliente responde:

```
Qual é o preço?
```

### Sistema:

1. **Qualifica como QUENTE** (score: 40 - mencionou preço)
2. Monta prompt agressivo
3. Gemini responde:

```
R$1500/mês, inclui:
✓ Gestão de tráfego pago
✓ Acompanhamento de resultados
✓ Otimizações diárias

Tenho agenda apertada, mas posso tirar 15min amanhã às 14h para mostrar caso de sucesso similar?
```

4. Atualiza lead (status: "quente")
5. IA força agendamento de reunião

---

## 🔗 Integração com WhatsApp Meta

### 1. Obter Credenciais Meta

1. Ir para https://developers.facebook.com
2. Criar App → Type: Business
3. Adicionar produto: WhatsApp Business
4. Configurar webhook:
   - **Callback URL**: `https://seu-dominio.com/webhook`
   - **Verify Token**: Qualquer string (coloca no `.env`)
5. Copiar:
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`

### 2. Configurar Webhook na Meta

Na dashboard Meta:

- **Callback URL**: `https://seu-dominio.com/webhook`
- **Verify Token**: (seu token do `.env`)
- **Subscribe to**: `messages`, `message_template_status_update`

### 3. Testar Webhook

```bash
# Meta vai fazer GET para verificar
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=123456"
```

### 4. Enviar Primeira Mensagem

Teste enviando mensagem do seu WhatsApp para o número configurado. O webhook deve receber e responder automaticamente.

---

## 🎯 Regras de Negócio

✅ **O que o sistema faz:**

- Responde mensagens recebidas (não envia frias)
- Qualifica leads automaticamente
- Tenta fechar SEMPRE
- Oferece agendamento de reunião como alternativa
- Faz upsell de automação com IA
- Salva histórico de leads

🚫 **O que o sistema NÃO faz:**

- Enviar mensagens frias sem consentimento
- Spam
- Responder com demora (< 5 segundos)
- Perder lead importantes

---

## 📈 Métricas e Monitoring

### Ver Estatísticas

```bash
curl http://localhost:3000/leads/stats
```

Retorna:

```json
{
  "total": 45,
  "byStatus": {
    "novo": 15,
    "engajado": 12,
    "quente": 10,
    "fechado": 5,
    "frio": 3
  }
}
```

### Filtrar Leads por Status

```bash
# Apenas leads quentes
curl "http://localhost:3000/leads?status=quente&limit=20"

# Apenas novos
curl "http://localhost:3000/leads?status=novo"
```

---

## 🔐 Segurança

### Variáveis Sensíveis

- Nunca commitar `.env` com credenciais reais
- Usar `.env.example` como template
- Rotar tokens regularmente

### Validação de Requisições

- Webhook valida `verify_token`
- Todas inputs são sanitizadas
- Rate limiting recomendado em produção

### Database

- Usar conexão SSL em produção
- Backups automáticos
- Não expor pool de conexões

---

## 🐛 Troubleshooting

### ❌ "GEMINI_API_KEY não configurada"

```bash
# Verificar .env
cat .env | grep GEMINI_API_KEY

# Obter key em: https://makersuite.google.com/app/apikey
```

### ❌ "Erro ao conectar ao banco"

```bash
# Verificar serviço PostgreSQL
sudo service postgresql status

# Verificar credenciais db
psql -h localhost -U postgres -d vendas_auto
```

### ❌ "Webhook não recebe mensagens"

```bash
# Verificar URL está acessível
curl -X GET https://seu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=test

# Verificar logs do servidor
# Deve aparecer mensagem de verificação
```

### ⚠️ "IA gera respostas genéricas"

- Aumentar `temperature` no Gemini (mais criativo)
- Melhorar prompts em `sales.prompts.js`
- Adicionar contexto do cliente ao prompt

---

## 📚 Estrutura de Dados

### Lead Schema

```javascript
{
  id: 1,
  phone: "558599999999",           // Telefone (chave única)
  name: "João Silva",               // Nome do cliente
  lastMessage: "Qual é o preço?",   // Última mensagem
  status: "quente",                 // "novo", "engajado", "quente", "fechado", "frio"
  score: 50,                        // Score de qualificação (0-100)
  createdAt: "2024-04-13T10:00Z",  // Data de criação
  lastInteractionAt: "2024-04-13T11:30Z", // Última ação
  updatedAt: "2024-04-13T11:30Z",  // Atualização
  metadata: {                       // Dados adicionais
    source: "whatsapp",
    campaign: "organic"
  }
}
```

---

## 🚀 Próximos Passos (Roadmap)

- [ ] Integração com CRM (Hubspot, Pipedrive)
- [ ] Dashboard de leads (React/Vue)
- [ ] Agendamento automático com Google Calendar
- [ ] Histórico de conversas persistente
- [ ] A/B testing de prompts
- [ ] Webhooks de pagamento integrados
- [ ] Chat em tempo real para supervisão
- [ ] Analytics avançado com Power BI

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do servidor
2. Consultar `.env.example` para validação
3. Testar endpoints com Postman/curl
4. Verificar documentação da Meta/Google

---

## 📄 Licença

MIT - Sinta-se livre para usar em projetos comerciais

---

**Desenvolvido com 💙 para automação de vendas**

_Última atualização: Abril 2024_
