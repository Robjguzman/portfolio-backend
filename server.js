// check if my code is fine
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");

// Initialize express and setup middleware
const app = express();
app.use(express.json()); // Body parsing middleware
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Email sending function modified for asynchronous operation and better error handling
async function sendEmailNotification(name, userEmail, message) {
  try {
    console.log("Setting up transporter...");
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email to the website owner
    const ownerMailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: "robertjguzman15@gmail.com",
      subject: "New Portfolio Message",
      text: `You have received a new message from ${name} (${userEmail}): ${message}`,
    };

    // Email to the user
    const userMailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: userEmail,
      subject: "Your Message Has Been Received",
      text: `Hello ${name},\n\nWe have received your message and will get back to you as soon as possible. Here's what you sent us:\n\n${message}`,
    };

    console.log("Sending email to owner...");
    await transporter.sendMail(ownerMailOptions);
    console.log("Email sent to owner successfully.");

    console.log("Sending confirmation email to user...");
    await transporter.sendMail(userMailOptions);
    console.log("Confirmation email sent to user successfully.");
  } catch (error) {
    console.error("Error occurred in sendEmailNotification:", error);
  }
}

// POST endpoint to receive messages
app.post("/api/messages", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO contacts(name, email, message) VALUES ($1, $2, $3) RETURNING ID",
      [name, email, message]
    );

    const savedMessage = result.rows[0];

    console.log(`Message saved to PostgreSQL with ID: ${savedMessage.id}`);

    // Send email notification
    await sendEmailNotification(name, email, message);

    console.log(`Successfully processed message from ${(name)}`);

    res.status(200).json({ id: savedMessage.id, name, email, message });
  } catch (err) {
    console.error("Error in POST /api/messages:", err);
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
