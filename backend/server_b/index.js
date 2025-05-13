// Import required dependencies
const express = require('express');
const { Kafka } = require('kafkajs');
const cors = require('cors');

// Initialize Express application and middleware
const app = express();
app.use(express.json());
app.use(cors());

// System configuration defaults
let settings = {
    interval: 100,  // Message batch size for analysis
    threshold: 0.3, // Minimum ratio for significant moments
    allowedEmotes: ['❤️', '👍', '😢', '😡']  // Supported emotes
};

// Runtime data storage
let messages = [];
let emoteCounts = {};

// Configure Kafka client
const kafka = new Kafka({
    clientId: 'server-b',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// Initialize Kafka consumer and producer
const consumer = kafka.consumer({ groupId: 'server-b-group' });
const producer = kafka.producer();

// Core analysis logic for detecting significant moments
const analyzeMessages = () => {
    const significantMoments = [];
    emoteCounts = {};

    // Group messages by minute
    messages.forEach(msg => {
        const minute = msg.timestamp.slice(0, 16); // Format: YYYY-MM-DDTHH:mm
        if (!emoteCounts[minute]) {
            emoteCounts[minute] = { total: 0 };
            settings.allowedEmotes.forEach(emote => emoteCounts[minute][emote] = 0);
        }
        
        if (settings.allowedEmotes.includes(msg.emote)) {
            emoteCounts[minute][msg.emote]++;
            emoteCounts[minute].total++;
        }
    });

    // Find significant moments
    Object.entries(emoteCounts).forEach(([minute, counts]) => {
        settings.allowedEmotes.forEach(emote => {
            if (counts[emote] / counts.total > settings.threshold) {
                significantMoments.push({
                    timestamp: minute,
                    emote: emote,
                    count: counts[emote],
                    total: counts.total,
                    percentage: (counts[emote] / counts.total * 100).toFixed(2)
                });
            }
        });
    });

    return significantMoments;
};

// API Endpoints for settings management
app.get('/settings/interval', (req, res) => {
    res.json({ interval: settings.interval });
});

app.post('/settings/interval', (req, res) => {
    const { interval } = req.body;
    if (typeof interval !== 'number' || interval < 1) {
        return res.status(400).json({ error: 'Invalid interval value' });
    }
    settings.interval = interval;
    res.json({ interval: settings.interval });
});

app.get('/settings/threshold', (req, res) => {
    res.json({ threshold: settings.threshold });
});

app.post('/settings/threshold', (req, res) => {
    const { threshold } = req.body;
    if (typeof threshold !== 'number' || threshold <= 0 || threshold >= 1) {
        return res.status(400).json({ error: 'Threshold must be between 0 and 1' });
    }
    settings.threshold = threshold;
    res.json({ threshold: settings.threshold });
});

app.get('/settings/allowed-emotes', (req, res) => {
    res.json({ allowedEmotes: settings.allowedEmotes });
});

app.post('/settings/allowed-emotes', (req, res) => {
    const { allowedEmotes } = req.body;
    if (!Array.isArray(allowedEmotes) || !allowedEmotes.every(emote => ['❤️', '👍', '😢', '😡'].includes(emote))) {
        return res.status(400).json({ error: 'Invalid emotes list' });
    }
    settings.allowedEmotes = allowedEmotes;
    res.json({ allowedEmotes: settings.allowedEmotes });
});

// Main Kafka consumer logic
const run = async () => {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: 'raw-emote-data', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const data = JSON.parse(message.value.toString());
            messages.push(data);
            
            // Process batch when threshold reached
            if (messages.length >= settings.interval) {
                const significantMoments = analyzeMessages();
                
                // Publish significant moments if found
                if (significantMoments.length > 0) {
                    await producer.send({
                        topic: 'aggregated-emote-data',
                        messages: significantMoments.map(moment => ({
                            value: JSON.stringify(moment)
                        }))
                    });
                }
                
                messages = []; // Reset batch
            }
        },
    });
};

// Application startup sequence
const startServer = async () => {
    try {
        const server = app.listen(4000, () => {
            console.log('Server B is running on port 4000');
        });

        await run().catch(error => {
            console.error('Kafka connection error:', error);
        });
    } catch (error) {
        console.error('Server startup error:', error);
    }
};

startServer();