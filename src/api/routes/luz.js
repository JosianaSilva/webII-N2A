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

let statusLuz = "Desligado";

router.get("/ligarLuz", authenticateToken, weekDayMiddleware, async (req, res) => {
    if (statusLuz === "Ligado") {
        res.status(400).json({error: "A luz já está ligada."});
        return;
    }
    statusLuz = "Ligado";
    res.status(200).json({status: statusLuz});

});

router.get("/desligarLuz", authenticateToken, weekDayMiddleware, async (req, res) => {
    if (statusLuz === "Desligado") {
        res.status(400).json({error: "A luz já está desligada."});
        return;
    }
    statusLuz = "Desligado";
    res.status(200).json({status: statusLuz});
});

router.get("/statusLuz", authenticateToken, async (req, res) => {
    res.status(200).send(statusLuz);
});

module.exports = router;