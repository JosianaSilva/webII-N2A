const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const authenticateToken = require('../middleware/authToken');
const weekDayMiddleware = require('../middleware/weekDay')

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const dbName = 'classDatabase';

async function connectToDatabase() {
  await client.connect();
  return client.db(dbName);
}

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Rota para criar um laboratório (requere autenticação)
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

// Rota para gerar o relatório (requere autenticação)
router.get('/laboratorio/relatorio', authenticateToken, weekDayMiddleware, async (req, res) => {
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

  // Criar diretório "relatorios" se não existir
  const reportsDir = path.join(__dirname, '..', '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    console.log('Pasta "relatorios" criada em:', reportsDir);
  } else {
    console.log('Pasta "relatorios" já existe:', reportsDir);
  }

  // Definir o caminho dentro do diretório "relatorios"
  const pdfPath = path.join(reportsDir, 'relatorio.pdf');
  console.log('Caminho do relatório:', pdfPath);

  try {
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
    console.log('PDF salvo com sucesso!');
    res.download(pdfPath);
  } catch (error) {
    console.error('Erro ao salvar o PDF:', error);
    res.status(500).send('Erro ao gerar o relatório.');
  }
});

module.exports = router;
