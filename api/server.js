import server from '../build/server/index.js';

process.env.PORT = '0';

export default function handler(req, res) {
  server.emit('request', req, res);
}
