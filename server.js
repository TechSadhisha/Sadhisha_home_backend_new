import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MYSQL CONNECTION POOL
const pool = mysql.createPool({
  host: process.env.DB_HOST,        // chir203.greengeeks.net
  user: process.env.DB_USER,        // zommcart_sadhisha_user
  password: process.env.DB_PASSWORD, // your password
  database: process.env.DB_NAME,     // zommcart_sadhisha_leads
  connectionLimit: 10,
});

// Test Route
app.get("/", (req, res) => {
  res.send("Backend working fine!");
});

// Insert Form Data
app.post("/api/leads", async (req, res) => {
  const { name, email, phone, message, enquiryFor } = req.body;

  try {
    const query = `
      INSERT INTO leads (name, email, phone, message, enquiryFor)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      name,
      email,
      phone,
      message,
      enquiryFor,
    ]);

    res.json({
      success: true,
      id: result.insertId,
    });

  } catch (error) {
    console.error("DB ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 5001, () =>
  console.log(`Server running on port ${process.env.PORT || 5001}`)
);
