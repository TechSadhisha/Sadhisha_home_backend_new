import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function createTable() {
  console.log("Creating 'leads' table...");
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const query = `
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        message TEXT,
        enquiryFor VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await connection.query(query);
    console.log("Table 'leads' created successfully or already exists.");

    await connection.end();
  } catch (error) {
    console.error("Creation failed:", error.message);
  }
}

createTable();
