const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

const authenticateToken = require('../middleware/authToken');
const weekDayMiddleware = require('../middleware/weekDay');
const e = require('express');


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

router.post("/temperatura", authenticateToken, weekDayMiddleware, async (req, res) => {
    const { temperatura } = req.body;
    if (!temperatura) {
      return res.status(400).send('Temperatura ausente.');
    }
  
    const db = await connectToDatabase();
    const temperaturaCollection = db.collection('temperatura');
    await temperaturaCollection.insertOne({ temperatura: parseInt(temperatura), data: new Date() });
    res.status(200).send('Temperatura registrada com sucesso.');
    });

router.get('/temperaturaAtual', authenticateToken, weekDayMiddleware, async (req, res) => {
    const db = await connectToDatabase();
    const temperaturaCollection = db.collection('temperatura');
    const temperatura = await temperaturaCollection.find().sort({ data: -1 }).limit(1).toArray();
    res.status(200).send(temperatura);
  });
  

module.exports = router;