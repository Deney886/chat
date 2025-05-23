const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let messageHistory = [];
let clients = new Map(); // Map of WebSocket to username

// Broadcast data to all connected clients
function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// Update all clients with online users and count
function updateStatus() {
  const usernames = Array.from(clients.values());
  broadcast({
    type: 'status',
    count: wss.clients.size,
    users: usernames
  });
}

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  // Send previous chat messages to the newly connected client
  messageHistory.forEach(msg => {
    ws.send(JSON.stringify({ type: 'message', text: msg }));
  });

  updateStatus();

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);

      if (data.type === 'message') {
        // Save username associated with this socket if not saved already
        if (!clients.has(ws)) clients.set(ws, data.username);

        const fullMessage = `${data.username}: ${data.text}`;
        messageHistory.push(fullMessage);

        broadcast({ type: 'message', text: fullMessage });
        updateStatus();
      }
    } catch (err) {
      console.error('Invalid message', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    updateStatus();
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:8080');
