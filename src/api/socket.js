const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log("Cliente conectado ao WebSocket");
    clients.add(ws);

    ws.on('close', () => {
        clients.delete(ws);
        console.log("Cliente desconectado");
    });
});

// Função para enviar mensagens para todos os clientes conectados
const broadcast = (message) => {
    clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
};

module.exports = { wss, broadcast };
