const amqp = require("amqplib");

let channel; // The channel is now private to this module

async function connect() {
    // The retry logic stays the same
    let retries = 5;
    while (retries) {
        try {
            const connection = await amqp.connect("amqp://rabbitmq");
            channel = await connection.createChannel();
            await channel.assertQueue("TaskCreated");
            console.log("Connected to RabbitMQ");
            return;
        } catch (error) {
            console.error("RabbitMQ connection error: ", error.message);
            retries--;
            if (retries > 0) {
              console.error("Retrying in 3 seconds...");
              await new Promise(res => setTimeout(res, 3000));
            }
        }
    }
}

function getChannel() {
    return channel;
}

// Export the functions we want other files to be able to use
module.exports = { connect, getChannel };