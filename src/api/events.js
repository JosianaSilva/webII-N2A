export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.write(`data: ${JSON.stringify({ message: "Conexão estabelecida" })}\n\n`);
  
    const intervalId = setInterval(() => {
      res.write(`data: ${JSON.stringify({ message: "Atualização periódica" })}\n\n`);
    }, 5000);
  
    req.on('close', () => {
      clearInterval(intervalId);
      res.end();
    });
  }
  