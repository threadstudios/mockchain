const http = require('http');
const WebSocket = require('ws');
const chain = require('./blockchain');

const server = new http.createServer();
const ws = new WebSocket.Server({ server });

const sockets = {};

const actions = {
    CREATE : (data) => {
        return chain.add(data);
    },
    PING : (data) => {
        return Promise.resolve('pong');
    }
}

const parseMessage = (msg) => {
    return JSON.parse(msg);
}

const initMessageHandler = (ws) => {
    ws.on('message', (msg) => {
        msg = parseMessage(msg);
        actions[msg.A] && actions[msg.A](msg.D)
        .then((block) => {

            if(msg.A === 'PING') return ws.send(JSON.stringify({ M : 'PONG' }));

            Object.values(sockets).forEach((socket) => { 
                if (socket.readyState === 1) {
                    socket.send(JSON.stringify(chain.getLatest()))
                }
            })

        })
        .catch((err) => {
            console.log(err);
        });
    })
}

ws.on('connection', function connection(ws, req) {
    sockets[req.client.remoteAddress] = ws;
    initMessageHandler(ws);
    ws.send(JSON.stringify(chain.chain));
});

ws.on('close', (ws, req) => {
    console.log(req);
})

const cleanSockets = () => {
    for(var x in sockets) {
        if(sockets[x].readyState === 3) {
            console.log('Cleaning socket ', x);
            delete sockets[x];
        }
    }
    setTimeout(() => {
        cleanSockets();
    }, 10000);
}

cleanSockets();

server.listen(process.env.PORT || 3000);