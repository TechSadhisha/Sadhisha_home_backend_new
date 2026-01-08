import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import SibApiV3Sdk from "@getbrevo/brevo";

dotenv.config({ path: "./.env", override: true });

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

// Insert Form Data + Send Email using Brevo API
app.post("/api/leads", async (req, res) => {
  console.log("Received lead:", req.body);
  const { name, email, phone, message, enquiryFor } = req.body;

  try {
    // Save Lead to DB
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

    console.log("Database insert success:", result.insertId);

    // Send Email using Brevo API
    try {
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(
        SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );

      await apiInstance.sendTransacEmail({
        sender: {
          email: process.env.SEND_FROM,
          name: "Sadhisha Worldwide – New Enquiry",
        },
        to: [
          { email: process.env.SEND_TO_1 },
          { email: process.env.SEND_TO_2 },
          { email: process.env.SEND_TO_3 },
        ],
        subject: "New Lead From SadhishaWorldwide",
        htmlContent: `
          <h2>New Lead Details</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Enquiry For:</strong> ${enquiryFor}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
      });
      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // We do NOT throw here, so the client still gets a success response for the lead save
    }

    res.json({
      success: true,
      id: result.insertId,
      message: "Lead saved successfully!",
    });
  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 5001, () =>
  console.log(`Server running on port ${process.env.PORT || 5001}`)
);
