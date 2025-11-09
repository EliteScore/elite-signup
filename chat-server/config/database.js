// Enhanced database connection pool
const { Pool } = require('pg');

// Database configuration - supports both DATABASE_URL and individual credentials
let dbConfig;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (common for Heroku, Railway, Supabase, etc.)
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // Use individual credentials from environment variables
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    // Enable SSL for remote databases (required for most cloud databases)
    ssl: process.env.DB_SSL === 'false' ? false : {
      rejectUnauthorized: false
    }
  };
}

// Add connection pool settings
const dbPool = new Pool({
  ...dbConfig,
  // Connection pool settings - optimized for high concurrency
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 200, // Increased from 50 to 200 (4x improvement)
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 10,  // Increased from 5 to 10 (2x improvement)
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  maxUses: parseInt(process.env.DB_MAX_USES) || 7500,
  allowExitOnIdle: true,
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000
});

// Initialize database pool
let dbConnected = false;

async function initializeDatabase() {
  try {
    const client = await dbPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    dbConnected = true;
    
    // Create private messaging tables if they don't exist
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Load and execute private messaging tables SQL
      const sqlFile = fs.readFileSync(path.join(__dirname, '..', 'docs', 'private_messaging_tables.sql'), 'utf8');
      
      // Better SQL parsing that handles functions with semicolons
      const statements = [];
      let currentStatement = '';
      let inFunction = false;
      let dollarQuoteLevel = 0;
      
      const lines = sqlFile.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip comments and empty lines
        if (trimmedLine.startsWith('--') || trimmedLine === '') {
          continue;
        }
        
        // Check for dollar quoting ($$)
        const dollarQuotes = (line.match(/\$\$/g) || []).length;
        if (dollarQuotes > 0) {
          dollarQuoteLevel += dollarQuotes;
          inFunction = dollarQuoteLevel % 2 === 1;
        }
        
        currentStatement += line + '\n';
        
        // Only split on semicolons if we're not inside a function
        if (line.includes(';') && !inFunction) {
          const cleanStatement = currentStatement.trim();
          if (cleanStatement) {
            statements.push(cleanStatement);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await dbPool.query(statement);
          } catch (sqlError) {
            console.warn(`SQL statement failed (might already exist): ${sqlError.message}`);
          }
        }
      }
      
      console.log('Private messaging tables and indexes setup completed');
      
      // Load and execute group chat tables SQL
      try {
        const groupChatSqlFile = fs.readFileSync(path.join(__dirname, '..', 'docs', 'group_chat_tables.sql'), 'utf8');
        const groupStatements = [];
        let currentStmt = '';
        
        const groupLines = groupChatSqlFile.split('\n');
        for (const line of groupLines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('--') || trimmed === '') continue;
          
          currentStmt += line + '\n';
          if (line.includes(';')) {
            if (currentStmt.trim()) {
              groupStatements.push(currentStmt.trim());
            }
            currentStmt = '';
          }
        }
        
        if (currentStmt.trim()) {
          groupStatements.push(currentStmt.trim());
        }
        
        for (const stmt of groupStatements) {
          if (stmt.trim()) {
            try {
              await dbPool.query(stmt);
            } catch (sqlError) {
              console.warn(`Group chat SQL statement failed (might already exist): ${sqlError.message}`);
            }
          }
        }
        
      console.log('Group chat tables and indexes setup completed');
      } catch (groupError) {
        console.warn('Group chat SQL file not found or error loading:', groupError.message);
      }
      
      // Load and execute community tables SQL
      try {
        const communitySqlFile = fs.readFileSync(path.join(__dirname, '..', 'docs', 'community_tables.sql'), 'utf8');
        const communityStatements = [];
        let currentCommunityStmt = '';
        
        const communityLines = communitySqlFile.split('\n');
        for (const line of communityLines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('--') || trimmed === '') continue;
          
          currentCommunityStmt += line + '\n';
          if (line.includes(';')) {
            if (currentCommunityStmt.trim()) {
              communityStatements.push(currentCommunityStmt.trim());
            }
            currentCommunityStmt = '';
          }
        }
        
        if (currentCommunityStmt.trim()) {
          communityStatements.push(currentCommunityStmt.trim());
        }
        
        for (const stmt of communityStatements) {
          if (stmt.trim()) {
            try {
              await dbPool.query(stmt);
            } catch (sqlError) {
              console.warn(`Community SQL statement failed (might already exist): ${sqlError.message}`);
            }
          }
        }
        
        console.log('Community tables and indexes setup completed');
      } catch (communityError) {
        console.warn('Community SQL file not found or error loading:', communityError.message);
      }
      
    } catch (error) {
      console.error('Error reading SQL file:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Database pool test failed:', error.message);
    dbConnected = false;
    return false;
  }
}

// Function to get current database connection status
function getDbConnected() {
  return dbConnected;
}

module.exports = {
  dbPool,
  dbConnected,
  initializeDatabase,
  getDbConnected
};
