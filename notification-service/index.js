const express = require("express");
const amqp = require("amqplib");

const app = express();
const port = 3003; // A new port for the new service

app.use(express.json());

let channel;

// This is the same robust connection function
async function connectRabbitMQWithRetry(retries = 5, delay = 3000) {
    while (retries) {
        try {
            const connection = await amqp.connect("amqp://rabbitmq");
            channel = await connection.createChannel();
            
            // We assert the queue to make sure it exists before we try to listen to it
            await channel.assertQueue("TaskCreated");
            
            console.log("Connected to RabbitMQ and listening for messages.");

            // --- THIS IS THE CONSUMER LOGIC ---
            channel.consume("TaskCreated", (msg) => {
                if (msg !== null) {
                    // The message content is a Buffer, so we parse it
                    const task = JSON.parse(msg.content.toString());
                    console.log("-----------------------------------------");
                    console.log("✅ Received TaskCreated message:");
                    console.log(`Simulating notification for new task: "${task.title}"`);
                    console.log(`Assigned to User ID: ${task.userId}`);
                    console.log("-----------------------------------------");

                    // In a real app, you would send an email, a push notification, etc. here.
                }
            }, {
                // noAck: true means we don't need to manually acknowledge the message.
                // The broker will "fire and forget". For critical tasks, you'd set this to false
                // and manually send channel.ack(msg) after you've successfully processed it.
                noAck: true 
            });

            return; // Exit the loop on successful connection

        } catch (error) {
            console.error("RabbitMQ connection error: ", error.message);
            retries--;
            if (retries > 0) {
                console.log(`Retrying connection... ${retries} attempts left.`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
}

// Root endpoint for a simple health check
app.get('/', (req, res) => {
    res.send('Hello World! This is the Node.js Notification service.');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Node.js Notification Service app listening on port ${port}`);
    // Start the RabbitMQ connection and consumer process
    connectRabbitMQWithRetry();
});