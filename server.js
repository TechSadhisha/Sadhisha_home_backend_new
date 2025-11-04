import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const { Pool } = pkg;

// ✅ PostgreSQL (AWS RDS) connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend working fine with AWS RDS!");
});

// ✅ POST route for leads
app.post("/api/leads", async (req, res) => {
  const { name, email, phone, message, enquiryFor } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO leads (name, email, phone, message, enquiryfor) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, phone, message, enquiryFor]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("❌ Database error details:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
