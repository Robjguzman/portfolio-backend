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

// Email sending function
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

    try {
      // Send email to the website owner
      await transporter.sendMail(ownerMailOptions);
      console.log('Notification email sent to owner successfully');

      // Send confirmation email to the user
      await transporter.sendMail(userMailOptions);
      console.log('Confirmation email sent to user successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      // Add more error details if available
      if (error.response) {
        console.error('SMTP Server responded with:', error.response);
      }
    }
}

// POST endpoint to receive messages
app.post('/api/messages', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Add message to Firestore
    const newMessageRef = db.collection('messages').doc();
    await newMessageRef.set({ name, email, message });
    
    // Send email notification
    sendEmailNotification(name, email, message);

    res.status(200).json({ id: newMessageRef.id, name, email, message });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET endpoint to retrieve all messages
app.get('/api/messages', async (req, res) => {
  try {
    const messagesRef = db.collection('messages');
    const snapshot = await messagesRef.get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
