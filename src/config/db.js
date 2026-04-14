/**
 * CONFIGURAÇÃO DE BANCO DE DADOS
 * Conexão PostgreSQL e inicialização do schema
 */

const { Pool } = require("pg");

// Configurar pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "vendas_auto",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Testa conexão com banco de dados
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Conectado ao banco de dados PostgreSQL");
    return true;
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error.message);
    return false;
  }
}

/**
 * Inicializa as tabelas do banco de dados
 */
async function initializeDatabase() {
  try {
    console.log("📊 Inicializando banco de dados...");

    // Criar tabela de leads
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255),
        last_message TEXT,
        status VARCHAR(50) DEFAULT 'novo',
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      );
      
      CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    `);

    // Criar tabela de mensagens (opcional, para histórico)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        direction VARCHAR(50), -- 'inbound' ou 'outbound'
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);

    // Criar tabela de interações (engagement tracking)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        type VARCHAR(100), -- 'message', 'call', 'meeting', etc.
        value VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON interactions(lead_id);
    `);

    console.log("✅ Tabelas criadas/verificadas com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar banco de dados:", error.message);
    return false;
  }
}

/**
 * Executa query no banco
 * @param {string} query - SQL query
 * @param {array} values - Valores para prepared statement
 * @returns {Promise<object>}
 */
async function query(queryString, values = []) {
  try {
    const result = await pool.query(queryString, values);
    return result;
  } catch (error) {
    console.error("❌ Erro na query:", error.message);
    throw error;
  }
}

/**
 * Fecha a conexão com banco de dados
 */
async function closeConnection() {
  try {
    await pool.end();
    console.log("✅ Conexão com banco de dados fechada");
  } catch (error) {
    console.error("❌ Erro ao fechar conexão:", error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  query,
  closeConnection,
};
