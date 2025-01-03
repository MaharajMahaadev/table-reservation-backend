const cors = require("cors");
const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,
});

app.post("/reservations", async (req, res) => {
  const { date, time } = req.body;

  if (!date || !time) {
    return res.status(400).json({ error: "Date and time are required." });
  }

  try {
    await pool.query(
      `INSERT INTO reservedslots (date, time) 
       VALUES ($1, ARRAY[$2]::TEXT[]) 
       ON CONFLICT (date) 
       DO UPDATE SET time = array_append(reservedslots.time, $2)`,
      [date, time]
    );
    res.status(201).json({ message: "Reservation added successfully." });
  } catch (error) {
    console.error("Error adding reservation:", error);
    res.status(500).json({ error: "Failed to add reservation." });
  }
});

app.get("/reservations", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(200).json([]);
  }

  try {
    const result = await pool.query(
      `SELECT time FROM reservedslots WHERE date = $1`,
      [date]
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(result.rows[0].time);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations." });
  }
});

app.listen(PORT, async (error) => {
  if (!error) {
    console.log(`Server is Successfully Running, 
                   and App is listening on port`);
  } else console.log("Error occurred, server can't start", error);
});
