const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const app = require('../api/index');

jest.mock('mongodb');
jest.mock('jsonwebtoken');

const mockDatabase = {
    collection: jest.fn().mockReturnThis(),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
};

MongoClient.prototype.connect = jest.fn().mockResolvedValue();
MongoClient.prototype.db = jest.fn(() => mockDatabase);

const token = 'test_token';
jwt.sign = jest.fn(() => token);

const testUser = {
    email: 'test@example.com',
    passwordHash: 'hashed_password',
};

const mockLabs = [
    {
        nome: 'Lab 1',
        descricao: 'Descrição do Lab 1',
        capacidade: 20,
        fotos: ['http://example.com/foto1.jpg'],
    },
    {
        nome: 'Lab 2',
        descricao: 'Descrição do Lab 2',
        capacidade: 30,
        fotos: [],
    },
];

describe('API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /logar', () => {
        it('deve retornar um token JWT para credenciais válidas', async () => {
            mockDatabase.findOne.mockResolvedValue(testUser);

            const response = await request(app)
                .post('/logar')
                .send({ email: 'aluno@ifce.com', senha: '12345678' });

            expect(response.status).toBe(200);
            expect(response.body.token).toBe(token);
        });

        it('deve retornar 401 para credenciais inválidas', async () => {
            mockDatabase.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post('/logar')
                .send({ email: 'wrong@example.com', senha: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.text).toBe('Credenciais inválidas.');
        });
    });

    describe('POST /laboratorio/novo', () => {
        it('deve criar um novo laboratório e retornar status 201', async () => {
            mockDatabase.insertOne.mockResolvedValue();

            const response = await request(app)
                .post('/laboratorio/novo')
                .field('nome', 'Lab Test')
                .field('descricao', 'Descrição do laboratório teste')
                .field('capacidade', 10)
                .field('fotos', ['http://example.com/test.jpg']);

            expect(response.status).toBe(201);
            expect(response.text).toBe('Laboratório criado com sucesso.');
        });

        it('deve retornar 400 se campos obrigatórios estiverem ausentes', async () => {
            const response = await request(app)
                .post('/laboratorio/novo')
                .send({});

            expect(response.status).toBe(400);
            expect(response.text).toBe('Campos obrigatórios ausentes.');
        });
    });

    describe('GET /laboratorio/relatorio', () => {
        it('deve retornar um PDF com informações dos laboratórios', async () => {
            mockDatabase.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue(mockLabs) });

            const response = await request(app)
                .get('/laboratorio/relatorio');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        it('deve retornar 403 se a requisição for feita no fim de semana', async () => {
            jest.spyOn(global.Date.prototype, 'getDay').mockReturnValue(0); // Domingo

            const response = await request(app)
                .get('/laboratorio/relatorio');

            expect(response.status).toBe(403);
            expect(response.text).toBe('Acesso permitido apenas de segunda a sexta-feira.');
        });
    });
});
