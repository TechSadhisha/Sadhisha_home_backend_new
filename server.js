import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "https://sadhishaworldwide.in",  // your live site
      "http://localhost:3000"          // dev testing
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.send("Sadhisha Backend is running successfully!");
});

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // MUST be false for Brevo 587
  auth: {
    user: process.env.SMTP_USER, // smtp login
    pass: process.env.SMTP_PASS,
  },
});

// Test SMTP connection
transporter.verify((error) => {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP CONNECTED");
  }
});

// FORM SUBMISSION ROUTE
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, message, enquiryFor } = req.body;

    await db.query(
      "INSERT INTO leads (name, email, phone, enquiryFor, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, enquiryFor, message]
    );

    // SEND EMAIL
    console.log("Trying to send email...");
    await transporter.sendMail({
      from: "Sadhisha <tech.sadhisha@gmail.com>", // << YOUR REAL SENDER EMAIL
      to: "vignesh.sadhisha@gmail.com", // receiver
      subject: "New Lead Submitted",
      html: `
        <h2>New Lead Details</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Enquiry For:</b> ${enquiryFor}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    });
    console.log("EMAIL SENT SUCCESSFULLY");

    res.json({ success: true, message: "Lead saved & email sent!" });
  } catch (err) {
    console.error("MAIL ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// **MANUAL TEST EMAIL ROUTE**
app.get("/test-email", async (req, res) => {
  console.log("TEST EMAIL ROUTE HIT");

  try {
    console.log("Trying to send TEST email...");

    await transporter.sendMail({
      from: "Sadhisha <tech.sadhisha@gmail.com>", // sender
      to: "vignesh.sadhisha@gmail.com", // receiver
      subject: "Manual Test Email",
      html: `<h2>This is a manual test email</h2>`,
    });

    console.log("TEST EMAIL SENT");
    res.send("Test email sent!");
  } catch (error) {
    console.log("TEST MAIL ERROR:", error);
    res.status(500).send("Email failed");
  }
});

// Start server
app.listen(process.env.PORT || 5001, () =>
  console.log(`Server running on port ${process.env.PORT || 5001}`)
);
