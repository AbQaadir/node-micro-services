const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3001;

app.use(express.json());

const mongoURI = "mongodb://admin:secret@mongodb:27017/users?authSource=admin";

const userSchema = new mongoose.Schema({
  username: String,
  email: { 
    type: String, 
    required: true, // Make email a required field
    unique: true    // Make email unique
  }
});

const User = mongoose.model('User', userSchema);

// --- Connect to the database ---
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));


// --- API Endpoints ---

// GET / - Root endpoint for basic server status check
app.get('/', (req, res) => {
  res.send('Hello World! This is the Node.js user service.');
});


// POST /users - Create a new user (Create)
app.post('/users', async (req, res) => {
  try {
    // Basic validation
    if (!req.body.email || !req.body.username) {
        return res.status(400).send({ message: 'Username and email are required.' });
    }

    const newUser = new User({
      username: req.body.username,
      email: req.body.email
    });

    await newUser.save();
    console.log('User saved successfully:', newUser);
    res.status(201).send({ message: 'User created successfully!', user: newUser });

  } catch (error) {
    console.error('Error saving user:', error.message);
    // Handle specific error for duplicate email
    if (error.code === 11000) {
        return res.status(409).send({ message: 'Error: Email already exists.' });
    }
    res.status(500).send({ message: 'Error creating user', error: error.message });
  }
});


// GET /users - Get all users (Read)
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).send({ message: 'Error fetching users', error: error.message });
    }
});


// GET /users/:id - Get a single user by their ID (Read)
app.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.status(200).send(user);
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).send({ message: 'Error fetching user', error: error.message });
    }
});


// PUT /users/:id - Update an existing user by ID (Update)
// Replaces the entire user document with the new data.
app.put('/users/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } // {new: true} returns the updated document
        );

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }
        console.log('User updated (PUT):', updatedUser);
        res.status(200).send({ message: 'User updated successfully!', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error.message);
        res.status(500).send({ message: 'Error updating user', error: error.message });
    }
});


// DELETE /users/:id - Delete a user by ID (Delete)
app.delete('/users/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).send({ message: 'User not found' });
        }
        console.log('User deleted:', deletedUser);
        res.status(200).send({ message: 'User deleted successfully!', user: deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).send({ message: 'Error deleting user', error: error.message });
    }
});



// --- Start the server ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Node.js app listening on port ${port}`);
});