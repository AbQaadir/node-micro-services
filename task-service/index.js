const express = require("express");
const mongoose = require("mongoose");
const rabbitmqService = require("./rabbitmq");

const app = express();
const port = 3002;

app.use(express.json());

const mongoURI = "mongodb://admin:secret@mongodb:27017/tasks?authSource=admin";

const TaskSchema = new mongoose.Schema({
    title: String,
    description : String,
    userId : String,
    createdAt : {
        type: Date,
        default: Date.now
    }
});

// Best practice to name models with a capital letter
const Task = mongoose.model("Task", TaskSchema);

// --- Connect to the database ---
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// GET / - Root endpoint for basic server status check
app.get('/', (req, res) => {
  res.send('Hello World! This is the Node.js Task service.');
});

// POST /tasks - Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const newTask = new Task({
      title: req.body.title,
      description: req.body.description,
      userId: req.body.userId
    });

    await newTask.save();

    const channel = rabbitmqService.getChannel();

    if (!channel) {
        return res.status(503).json({error: "RabbitMQ is not connected."});
    }

    channel.sendToQueue(
        "TaskCreated",
        Buffer.from(JSON.stringify(newTask))
    );

    console.log("Sent 'TaskCreated' message to RabbitMQ");
    res.status(201).send(newTask);

  } catch (error) {
    res.status(400).send({ message: "Error creating task", error: error.message });
  }
});


// GET /tasks - Get all the tasks
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).send(tasks);
    } catch (error) {
        res.status(500).send({ message: "Error fetching tasks", error: error.message });
    }
});

// --- Start the server ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Node.js Task Service app listening on port ${port}`);
  rabbitmqService.connect();
});