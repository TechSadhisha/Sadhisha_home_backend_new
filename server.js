import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
  port: process.env.SMTP_PORT,
  secure: false, // TLS, NOT SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP CONNECTED");
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, message, enquiryFor } = req.body;

    // Insert into MySQL
    await db.query(
      "INSERT INTO leads (name, email, phone, enquiryFor, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, enquiryFor, message]
    );

    // Send email

    try {
      const mailResponse = await transporter.sendMail({
        from: `"New Lead" <${process.env.SMTP_USER}>`,
        to: "vignesh.sadhisha@gmail.com",
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

      console.log("MAIL SENT:", mailResponse);
    } catch (mailErr) {
      console.log("MAIL SEND ERROR:", mailErr);
    }

    res.json({ success: true, message: "Lead saved & email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(process.env.PORT || 5001, () =>
  console.log(`Server running on port ${process.env.PORT || 5001}`)
);
