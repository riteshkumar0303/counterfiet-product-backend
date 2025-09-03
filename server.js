
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const mongoURL = 'mongodb+srv://productAuth:productAuth@cluster0.1guti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
    seedDatabase();
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    mobile: String,
    role: String,
});

const User = mongoose.model('User', userSchema, 'loginusers');

const otpStore = {};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function seedDatabase() {
    const users = [
        { username: 'demoIdA', password: '1234', role: 'admin', email: 'riteshkumar3320032@gmail.com', mobile: '9005780654' },
        { username: 'demoIdM', password: '1234', role: 'manufacturer', email: 'riteshkumar332003@gmail.com', mobile: '9005780653' },
        { username: 'demoIdr', password: '1234', role: 'retailer', email: 'anuragc.it21-25@recabn.ac.in', mobile: '8299461864' },
        { username: 'demoIds', password: '1234', role: 'supplier', email: 'hritik.it21-25@recabn.ac.in', mobile: '7007012586' },
    ];

    for (const user of users) {
        const exists = await User.findOne({ username: user.username, role: user.role });
        if (!exists) {
            await User.create(user);
            console.log(`Created user for role: ${user.role}`);
        }
    }
}

// Step 1: Login -> Send OTP
app.post('/auth', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username, password });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const otp = generateOTP();
        otpStore[otp] = username;

        console.log(`OTP for ${user.email} ${otp}`); // Replace with email/SMS in production

        res.status(200).json({ message: 'OTP sent to registered email/mobile', otpRequired: true, otp }); // Sending OTP in response for testing
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Step 2: Verify only OTP
app.post('/verify-otp', async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
    }

    const username = otpStore[otp];

    if (!username) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        delete otpStore[otp]; // OTP used, remove it

        return res.json({ username: user.username, role: user.role, message: 'Login successful' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
