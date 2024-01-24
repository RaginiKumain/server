const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./demodb');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

(async () => {
    try {
        await mongoose.connect('mongodb://localhost/demodb');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
})();

// Fetch user list
app.get('/myapp/userList', async (req, res) => {
    try {
        const users = await User.find({}, '_id username');
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/myapp/user/:_id/editInfo', async (req, res) => {
    try {
        const userId = req.params._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update user
app.put('/myapp/user/:_id', async (req, res) => {
    const userId = req.params._id;
    const { username, email, phoneNo } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, email, phoneNo },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete user
app.delete('/myapp/user/:_id', async (req, res) => {
    const userId = req.params._id;

    try {
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// User registration
app.post('/myapp/registration', async (req, res) => {
    console.log('Received registration request');

    try {
        const { username, email, password, phoneNo } = req.body;

        // Validate incoming data
        if (!username || !email || !password || !phoneNo) {
            return res.status(400).json({ error: 'Please fill all fields.' });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this username or email already exists.' });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user using the User model
        const newUser = await User({
            username,
            email,
            password: hashedPassword,
            phoneNo,
        });

        // Save the user to the database
        const savedUser = await newUser.save();

        res.status(201).json({ user: savedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User login
app.post('/myapp/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate incoming data
        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide both username and password.' });
        }

        // Check if the user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Authentication successful
        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Server is running!');
  });

app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});
