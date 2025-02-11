const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const laboratorioRoutes = require('./routes/laboratorio');
const videoTutorialRoutes = require('./routes/videoTutorial');
const temperaturaRoutes = require('./routes/temperatura');
const luzRoutes = require('./routes/luz');
const path = require('path'); // Para lidar com caminhos de arquivos

// Carregar variáveis de ambiente
dotenv.config();

// Criando a instância do Express
const app = express();

// Middleware para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'front')));

// Middleware para análise de corpo JSON
app.use(express.json());

// Definindo rotas
app.use('', authRoutes);
app.use('', laboratorioRoutes);
app.use('', videoTutorialRoutes);
app.use('', temperaturaRoutes);
app.use('', luzRoutes);

// Definir a porta a partir das variáveis de ambiente ou usar uma porta padrão
const PORT = process.env.PORT || 3000;

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});

module.exports = app;

