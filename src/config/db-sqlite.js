/**
 * CONFIGURAÇÃO DE BANCO DE DADOS - VERSÃO SQLITE (DESENVOLVIMENTO)
 * Para produção, usar PostgreSQL
 */

const Database = require("better-sqlite3");
const path = require("path");

// Caminho do banco SQLite
const dbPath = path.join(__dirname, "../../database.sqlite");

// Criar conexão
const db = new Database(dbPath);

// Habilitar WAL mode para melhor performance
db.pragma("journal_mode = WAL");

// Criar tabelas se não existirem
const createTables = () => {
  // Tabela de leads
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      last_message TEXT,
      status TEXT DEFAULT 'new',
      qualification_score INTEGER DEFAULT 0,
      is_hot_lead BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_interaction_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  `);

  // Tabela de conversas
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      message TEXT NOT NULL,
      response TEXT,
      direction TEXT CHECK(direction IN ('incoming', 'outgoing')) NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
  `);

  console.log("✅ Tabelas criadas/verficadas no SQLite");
};

// Inicializar banco
createTables();

/**
 * Testa conexão com banco de dados
 */
async function testConnection() {
  try {
    const result = db.prepare("SELECT COUNT(*) as count FROM leads").get();
    console.log("✅ Conectado ao banco de dados SQLite");
    return true;
  } catch (error) {
    console.error("❌ Erro na conexão SQLite:", error.message);
    return false;
  }
}

/**
 * Executa query preparada
 */
function prepare(sql) {
  return db.prepare(sql);
}

/**
 * Fecha conexão
 */
function close() {
  db.close();
}

module.exports = {
  db,
  prepare,
  testConnection,
  close,
};
