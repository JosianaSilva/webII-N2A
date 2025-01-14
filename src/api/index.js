const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const upload = multer({ dest: 'uploads/' });
const uri = dotenv.config().parsed.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const dbName = 'classDatabase';

app.use(express.json());

/**
 * Função para gerar o hash SHA-256 de uma string.
 * @param {string} input - A string de entrada a ser hashada.
 * @returns {Promise<string>} Retorna o hash SHA-256 da string.
 */
async function hashString(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Middleware que verifica se a requisição foi feita em um dia da semana (segunda a sexta-feira).
 * Responde com erro 403 se a requisição for feita em um sábado ou domingo.
 * @param {Request} req - Objeto da requisição.
 * @param {Response} res - Objeto da resposta.
 * @param {Function} next - Função que passa o controle para o próximo middleware.
 */
function weekDayMiddleware(req, res, next) {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return res.status(403).send('Acesso permitido apenas de segunda a sexta-feira.');
  next();
}

/**
 * Conecta-se ao banco de dados MongoDB.
 * @returns {Promise<Db>} Retorna uma instância do banco de dados MongoDB.
 */
async function connectToDatabase() {
  await client.connect();
  return client.db(dbName);
}

/**
 * Rota para realizar o login de um usuário. Gera e retorna um token JWT se as credenciais forem válidas.
 * @param {Request} req - Objeto da requisição.
 * @param {Response} res - Objeto da resposta.
 * @returns {Promise<void>} Retorna um token JWT em caso de sucesso, ou um erro em caso de falha.
 */
app.post('/logar', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).send('Email e senha são obrigatórios.');

  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ email });

  if (!user || user.passwordHash !== await hashString(senha)) return res.status(401).send('Credenciais inválidas.');

  const token = jwt.sign({ email }, 'secretKey', { expiresIn: '1h' });
  res.json({ token });
});

/**
 * Rota para criar um novo laboratório. Faz o upload das imagens e salva as URLs no banco de dados.
 * @param {Request} req - Objeto da requisição, contendo os dados do laboratório e as imagens.
 * @param {Response} res - Objeto da resposta.
 * @returns {Promise<void>} Retorna uma mensagem de sucesso ou erro ao criar o laboratório.
 */
app.post('/laboratorio/novo', upload.array('fotos', 10), async (req, res) => {
  const { nome, descricao, capacidade, fotos } = req.body;
  if (!nome || !descricao || !capacidade || !fotos) return res.status(400).send('Campos obrigatórios ausentes.');

  const db = await connectToDatabase();
  const labsCollection = db.collection('laboratorios');

  await labsCollection.insertOne({ nome, descricao, capacidade: parseInt(capacidade), fotos });
  res.status(201).send('Laboratório criado com sucesso.');
});

/**
 * Rota para gerar um relatório em PDF com as informações de todos os laboratórios.
 * As imagens são baixadas das URLs fornecidas e inseridas no PDF.
 * @param {Request} req - Objeto da requisição.
 * @param {Response} res - Objeto da resposta.
 * @returns {Promise<void>} Retorna o arquivo PDF contendo as informações dos laboratórios.
 */
app.get('/laboratorio/relatorio', weekDayMiddleware, async (req, res) => {
  const db = await connectToDatabase();
  const labsCollection = db.collection('laboratorios');
  const labs = await labsCollection.find().toArray();

  const pdfDoc = await PDFDocument.create();

  for (let lab of labs) {
      let page = pdfDoc.addPage();
      let y = page.getHeight() - 50;

      page.drawText(lab.nome, { size: 18, x: 50, y });
      y -= 30;

      page.drawText(`Descrição: ${lab.descricao}`, { size: 12, x: 50, y });
      y -= 20;

      page.drawText(`Capacidade: ${lab.capacidade}`, { size: 12, x: 50, y });
      y -= 40;

      if (lab.fotos.length > 0) {
          page.drawText('Fotos:', { size: 12, x: 50, y });
          y -= 20;

          for (let url of lab.fotos) {
              try {
                  const imageBuffer = await axios.get(url, { responseType: 'arraybuffer' });
                  const image = await pdfDoc.embedJpg(imageBuffer.data);
                  const imageDims = image.scale(0.5);

                  if (y < imageDims.height + 50) {
                      page = pdfDoc.addPage();
                      y = page.getHeight() - 50;
                  }

                  page.drawImage(image, {
                      x: 50,
                      y: y - imageDims.height,
                      width: imageDims.width,
                      height: imageDims.height,
                  });

                  y -= imageDims.height + 20;
              } catch (error) {
                  console.error(`Erro ao baixar imagem de ${url}:`, error);
              }
          }
      }

      if (y < 50) {
          page = pdfDoc.addPage();
          y = page.getHeight() - 50;
      }

      y -= 40;
  }

  const pdfBytes = await pdfDoc.save();
  const pdfPath = path.join(__dirname, 'relatorio.pdf');
  fs.writeFileSync(pdfPath, pdfBytes);
  res.download(pdfPath);
});

  
  

app.listen(3000, () => console.log('API rodando em http://localhost:3000'));
