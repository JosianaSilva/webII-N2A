const jwt = require('jsonwebtoken');
// Middleware de autenticação
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Token não fornecido.');

  jwt.verify(token.split(' ')[1], 'secretKey', (err, user) => {
    if (err) return res.status(403).send('Token inválido.');
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
