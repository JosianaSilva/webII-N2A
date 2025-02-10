const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Carregar variáveis de ambiente
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

// Função para gerar o hash SHA-256 de uma string.
async function hashString(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Função de conexão com o MongoDB
async function connectToDatabase() {
  await client.connect();
  return client.db(dbName);
}

const router = express.Router();

router.post('/logar', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).send('Email e senha são obrigatórios.');

  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ email });

  if (!user || user.passwordHash !== await hashString(senha)) return res.status(401).send('Credenciais inválidas.');

  const token = jwt.sign({ email }, 'secretKey', { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;
