import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Test route
app.get("/", (req, res) => {
  res.send("Backend working fine!");
});

app.post("/api/leads", async (req, res) => {
  const { name, email, phone, message, source } = req.body;
  const { data, error } = await supabase
    .from("leads")
    .insert([{ name, email, phone, message, source }])
    .select();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data });
});

app.listen(process.env.PORT || 5001, () =>
  console.log(`Server running on port ${process.env.PORT || 5001}`)
);
