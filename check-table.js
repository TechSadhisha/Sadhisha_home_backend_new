import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function checkTable() {
  console.log("Checking for 'leads' table...");
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.query("SHOW TABLES LIKE 'leads'");
    if (rows.length > 0) {
      console.log("Table 'leads' exists.");
      const [columns] = await connection.query("DESCRIBE leads");
      console.log("Columns:", columns.map((c) => c.Field).join(", "));
    } else {
      console.log("Table 'leads' DOES NOT exist.");
    }

    await connection.end();
  } catch (error) {
    console.error("Check failed:", error.message);
  }
}

checkTable();
