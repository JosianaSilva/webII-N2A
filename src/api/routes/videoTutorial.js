const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/videoTutorial', (req, res) => {
  const range = req.headers.range;
  const videoPath = path.join(__dirname, '..', '..', 'videos', 'teste.mp4'); 
  const videoSize = fs.statSync(videoPath).size;

  if (!range) {
    // Se não houver o cabeçalho "Range", envia o vídeo completo
    const headers = {
      "Content-Length": videoSize,
      "Content-Type": "video/mp4"
    };
    
    res.writeHead(200, headers);
    const stream = fs.createReadStream(videoPath);
    stream.pipe(res);
  } else {
    // Caso contrário, envia o vídeo em partes (range)
    const chunkSize = 1 * 1e6; // 1MB
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + chunkSize, videoSize - 1);

    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4"
    };

    res.writeHead(206, headers);

    const stream = fs.createReadStream(videoPath, { start, end });
    stream.pipe(res);
  }
});

module.exports = router;

