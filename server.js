import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MYSQL CONNECTION POOL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

// Test Route
app.get("/", (req, res) => {
  res.send("Backend working fine!");
});

// Insert Form Data + Send Email using Brevo SMTP
app.post("/api/leads", async (req, res) => {
  const { name, email, phone, message, enquiryFor } = req.body;

  try {
    // 1. Save Lead to DB
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

    // 2. Send Email via Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SEND_FROM,
      to: process.env.SEND_TO,
      subject: "New Lead Received",
      html: `
        <h2>New Lead Details</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Enquiry For:</strong> ${enquiryFor}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    res.json({
      success: true,
      id: result.insertId,
      message: "Lead saved & email sent successfully!",
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 5001, () =>
  console.log(`Server running on port ${process.env.PORT || 5001}`)
);
