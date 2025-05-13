// Import required dependencies
const express = require('express');
const { Kafka } = require('kafkajs');
const WebSocket = require('ws');
const cors = require('cors');

// Initialize Express application and middleware
const app = express();
app.use(express.json());
app.use(cors());

// Configure Kafka client
const kafka = new Kafka({
    clientId: 'server_a',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

// Initialize Kafka consumer and WebSocket server
const consumer = kafka.consumer({ groupId: 'server_a_group' });
const wss = new WebSocket.Server({ noServer: true });

// Store connected clients and recent moments
let clients = [];
let recentMoments = [];  // Store recent moments for new connections

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    clients.push(ws);
    
    // Send historical data to new clients
    if (recentMoments.length > 0) {
        ws.send(JSON.stringify({ type: 'history', moments: recentMoments }));
    }

    // Clean up on client disconnect
    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
    });
});

// Utility function to send data to all connected clients
const broadcast = (data) => {
    const message = JSON.stringify({ type: 'moment', data });
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// Main Kafka consumer logic
const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'aggregated-emote-data', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const emoteData = JSON.parse(message.value.toString());
            
            // Maintain rolling window of recent moments
            recentMoments.push(emoteData);
            if (recentMoments.length > 10) {
                recentMoments.shift();
            }
            console.log('Emote Data Received:', emoteData);
            broadcast(emoteData);
        }
    });
};

// Start HTTP server
const server = app.listen(3000, () => {
    console.log('Server A is running on port 3000');
});

// Configure WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Initialize Kafka consumer
run().catch(console.error);

