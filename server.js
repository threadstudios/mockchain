const http = require('http');
const WebSocket = require('ws');
const chain = require('./blockchain');

const server = new http.createServer();
const ws = new WebSocket.Server({ server });

ws.on('connection', function connection(ws) {
    ws.send(JSON.stringify(chain.chain));
});

server.listen(process.env.PORT || 3000);