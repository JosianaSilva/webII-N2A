const express = require('express');
const cors = require('cors')
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const laboratorioRoutes = require('./routes/laboratorio');
const videoTutorialRoutes = require('./routes/videoTutorial');
const temperaturaRoutes = require('./routes/temperatura');
const luzRoutes = require('./routes/luz');
const path = require('path'); // Para lidar com caminhos de arquivos
const { wss } = require('./socket');
const http = require('http');

// Carregar variáveis de ambiente
dotenv.config();

// Criando a instância do Express
const app = express();
app.use(cors({
  origin: '*'
}))

// Middleware para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'front')));

// Middleware para análise de corpo JSON
app.use(express.json());


// Criando o servidor HTTP para o WebSocket
const server = http.createServer(app);

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});


// Definindo rotas
app.use('', authRoutes);
app.use('', laboratorioRoutes);
app.use('', videoTutorialRoutes);
app.use('', temperaturaRoutes);
app.use('', luzRoutes);

// Definir a porta a partir das variáveis de ambiente ou usar uma porta padrão
const PORT = process.env.PORT || 3000;

// Iniciando o servidor
server.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});

module.exports = app;

