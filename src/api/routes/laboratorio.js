const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');
const { PDFDocument, rgb } = require('pdf-lib');
const multer = require('multer');
const axios = require('axios');
const authenticateToken = require('../middleware/authToken');
const weekDayMiddleware = require('../middleware/weekDay');
const { broadcast } = require('../socket');

dotenv.config();
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Erro: URI de conexão com o MongoDB não encontrada.");
  throw new Error("URI de conexão com o MongoDB não encontrada.");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbName = 'classDatabase';
const connectToDatabase = async () => {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }
    return client.db(dbName);
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    throw new Error("Falha na conexão com o banco de dados");
  }
};

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rota para criar um laboratório
router.post('/laboratorio/novo', authenticateToken, upload.array('fotos', 10), async (req, res) => {
  const { nome, descricao, capacidade, fotos } = req.body;
  if (!nome || !descricao || !capacidade || !fotos) {
    return res.status(400).send('Campos obrigatórios ausentes.');
  }

  const db = await connectToDatabase();
  const labsCollection = db.collection('laboratorios');
  await labsCollection.insertOne({ nome, descricao, capacidade: parseInt(capacidade), fotos });
  res.status(200).send('Laboratório criado com sucesso.');
});

// Rota para gerar o relatório
router.get('/laboratorio/relatorio', authenticateToken, weekDayMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const labsCollection = db.collection('laboratorios');
    const labs = await labsCollection.find().toArray();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    let y = 750;

    page.drawText('Relatório de Laboratórios', { size: 20, x: 50, y, color: rgb(0, 0, 0) });
    y -= 40;

    for (let lab of labs) {
      page.drawText(`Nome: ${lab.nome}`, { size: 14, x: 50, y, color: rgb(0, 0, 0) });
      y -= 20;
      page.drawText(`Descrição: ${lab.descricao}`, { size: 12, x: 50, y, color: rgb(0, 0, 0) });
      y -= 20;
      page.drawText(`Capacidade: ${lab.capacidade}`, { size: 12, x: 50, y, color: rgb(0, 0, 0) });
      y -= 40;

      if (y < 100) {
        page = pdfDoc.addPage([600, 800]);
        y = 750;
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio.pdf');
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    res.status(500).json({ erro: 'Erro ao gerar o relatório.' });
  }
});

// Endpoint para bloquear um laboratório
router.post('/bloquear/:lab', (req, res) => {
  const lab = req.params.lab;
  const message = { type: 'bloquear', lab, text: `⚠️ Laboratório ${lab} foi bloqueado.` };

  console.log("Bloqueio enviado:", message); // Debug
  broadcast(message);

  res.status(200).json({ success: true, message: message.text });
});

module.exports = router;
