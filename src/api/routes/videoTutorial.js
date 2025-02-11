const express = require('express');
const fs = require('fs');
const path = require('path');
const authenticateToken = require('../middleware/authToken');

const router = express.Router();

router.get('/videoTutorial', authenticateToken, (req, res) => {
  const range = req.headers.range;
  if (!range) {
    return res.status(416).send('Range header is required'); // 416 é o status para "Range Not Satisfiable"
  }

  const videoPath = path.join(__dirname, '..', '..', 'videos', 'teste.mp4');
  const videoSize = fs.statSync(videoPath).size;

  const chunkSize = 1 * 1e6; // 1MB
  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : Math.min(start + chunkSize, videoSize - 1);

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

  // Tratamento de erros no stream
  stream.on('error', (err) => {
    res.status(500).send('Error streaming video');
  });
});

module.exports = router;



