# emoteAnalyst
This is a real-time emote analysis system that monitors and analyzes emote usage  patterns to identify significant moments based on emote frequency. The system uses a microservices architecture with event-driven communication. 

Architecture 
System Components 
1. Emote Generator (Producer) 
a. Simulates user emote activity 
b. Generates random emotes with timestamps 
c. Publishes raw emote data to Kafka 
2. Server B (Analyzer) 
a. Processes raw emote data 
b. Analyzes emote patterns for significant moments 
c. Manages system settings via REST API 
d. Publishes analyzed data to Kafka 
3. Server A (WebSocket Server) 
a. Consumes analyzed data from Kafka 
b. Maintains WebSocket connections with clients 
c. Broadcasts significant moments to connected clients 
4. Frontend (React Application) 
a. Displays real-time significant moments 
b. Provides settings configuration interface 
c. Connects via WebSocket for real-time updates 
5. Kafka (Message Broker) 
a. Handles message queuing between components 
b. Manages two topics: 'raw-emote-data' and 'aggregated-emote-data' 
Communication Patterns 
• Event-Driven Communication via Kafka 
• WebSocket for real-time client updates 
• REST API for settings management

Technologies Used 
1. Node.js 
a. Used for all backend services 
2. Apache Kafka 
a. Message broker for event streaming 
b. Handles message processing 
3. WebSocket 
a. Real-time two-directional communication 
b. Low-latency updates to clients 
4. React 
a. Frontend UI framework 
b. State management and component-based architecture 
5. Docker & Docker Compose 
a. Container orchestration 
b. Service isolation and deployment

Deployment Instructions 
1. Prerequisites 
git clone https://course-gitlab.tuni.fi/compcs510-spring2025/vn.git
cd vn 
Docker has to be open 
2. Start the System 
docker-compose up –build 
Or optionally 
docker-compose up –build -d 
3. Access the Application 
• Open browser: http://localhost:80

