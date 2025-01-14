const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

const uri = dotenv.config().parsed.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = await client.db('classDatabase');

    const usersCollection = db.collection('users');
    const labsCollection = db.collection('labs');

    console.log("Coleções criadas ou existentes usadas!");

    await usersCollection.insertOne({
      email: "aluno@ifce.com",
      passwordHash: "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f", // Senha: 12345678
    });

    await labsCollection.insertOne({
      name: "Laboratório",
      description: "Descrição do laboratório",
      capacity: 30,
      photos: [
        "url da foto 1",
      ],
    });

    console.log("Dados inseridos com sucesso!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);