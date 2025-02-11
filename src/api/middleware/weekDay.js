// Função middleware para verificar se é dia de semana
function weekDayMiddleware(req, res, next) {
    const day = new Date().getDay();
    // 0 = domingo, 6 = sábado
    if (day === 0 || day === 6) {
        return res.status(403).send('Acesso permitido apenas de segunda a sexta-feira.');
    }
    next();
}

module.exports = weekDayMiddleware;
