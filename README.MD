# API de Laboratórios

## Descrição
Esta API permite gerenciar laboratórios, autenticar usuários, e gerar relatórios em PDF dos laboratórios cadastrados. É uma solução simples para controle de informações relacionadas a laboratórios, incluindo fotos, descrições e capacidades. A API funciona somente em dias úteis (segunda a sexta).

## Sumário
- [Funcionalidades](#funcionalidades)
- [Exemplos](#exemplos)
- [Requisitos](#requisitos)

## Funcionalidades

### Autenticação de Usuários
- Endpoint: `POST /logar`
- Recebe um email e senha, valida as credenciais e retorna um token JWT para autenticação.

### Cadastro de Laboratórios
- Endpoint: `POST /laboratorio/novo`
- Permite cadastrar um novo laboratório com os seguintes dados:
  - Nome
  - Descrição
  - Capacidade
  - Fotos (opcional, suporta múltiplas imagens)

### Geração de Relatórios
- Endpoint: `GET /laboratorio/relatorio`
- Gera um arquivo PDF contendo a lista de laboratórios cadastrados, incluindo seus nomes, descrições, capacidades e fotos (quando disponíveis). A rota só está acessível de segunda a sexta-feira.

## Exemplos

### Autenticação de Usuários
**Requisição:**
```json
{
  "email": "usuario@example.com",
  "senha": "minhasenha"
}
```
**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Cadastro de Laboratórios
**Requisição Multipart (Exemplo cURL):**
```bash
curl -X POST -F "nome=Laboratório A" -F "descricao=Descrição do laboratório" -F "capacidade=30" -F "fotos=@foto1.jpg" -F "fotos=@foto2.jpg" http://localhost:3000/laboratorio/novo
```
**Resposta:**
```
Laboratory created successfully.
```

### Geração de Relatório
**Requisição:**
```bash
GET http://localhost:3000/laboratorio/relatorio
```
**Resposta:**
Um arquivo PDF será baixado automaticamente com os detalhes dos laboratórios.

## Requisitos

### Tecnologias Necessárias
- Node.js (v14 ou superior)
- MongoDB Atlas

### Dependências da API
Instale todas as dependências usando o comando:
```bash
npm install express mongodb dotenv jsonwebtoken crypto multer pdf-lib axios
```

### Configuração do Banco de Dados
Adicione a URL do MongoDB Atlas no arquivo `.env`:
```
MONGODB_URI=<sua-string-de-conexão>
```

### Execução
1. Inicie o servidor local:
   ```bash
   node src/api/index.js
   ```
2. Acesse a API via `http://localhost:3000`. Caso tenha implantado na Vercel ou outro serviço em nuvem, use o URL apropriado.

