require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./portfolio-13ed0-firebase-adminsdk-vzjz8-9871a56611.json'); // Update the path
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Initialize express and setup middleware
const app = express();
app.use(express.json()); // Body parsing middleware
app.use(cors());

// Email sending function modified for asynchronous operation and better error handling
async function sendEmailNotification(name, userEmail, message) {
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
    to: 'robertjguzman15@gmail.com',
    subject: 'New Portfolio Message',
    text: `You have received a new message from ${name} (${userEmail}): ${message}`,
  };

  // Email to the user
  const userMailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: userEmail,
    subject: 'Your Message Has Been Received',
    text: `Hello ${name},\n\nWe have received your message and will get back to you soon. Here's what you sent us:\n\n${message}`,
  };

  // Send emails without awaiting them
  transporter.sendMail(ownerMailOptions).catch(error => {
    console.error('Error sending email to owner:', error);
  });
  console.log('Email to owner sent (asynchronously).');

  transporter.sendMail(userMailOptions).catch(error => {
    console.error('Error sending confirmation email to user:', error);
  });
  console.log('Confirmation email to user sent (asynchronously).');
}

// POST endpoint to receive messages
app.post('/api/messages', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    console.log('Adding message to Firestore...');
    // Add message to Firestore
    const newMessageRef = db.collection('messages').doc();
    await newMessageRef.set({ name, email, message });
    console.log('Message added to Firestore successfully.');

    console.log('Sending email notifications...');
    // Send email notification (asynchronously)
    sendEmailNotification(name, email, message);

    // If everything above succeeds, this line sends a 200 OK response with JSON data
    res.status(200).json({ id: newMessageRef.id, name, email, message });
    console.log('POST /api/messages - Completed successfully.');
  } catch (err) {
    console.error('Error in POST /api/messages:', err.message);
    res.status(500).send('Server error');
  }
});

// Other endpoints remain unchanged

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
