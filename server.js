const http = require('http');
const app = require('./app');

const port = Number(process.env.PORT || 3000);
const server = http.createServer(app).listen(port, () => {
  console.log(`Azent berjalan di http://localhost:${port}`);
  console.log(`SMTP inquiry: ${process.env.SMTP_USER && process.env.SMTP_PASS && process.env.INQUIRY_TO ? 'configured' : 'not configured'}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);