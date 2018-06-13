const http = require('http');
const WebSocket = require('ws');
const StateChain = require('./blockchain/statechain');
const qs = require('qs');

const server = new http.createServer();
const ws = new WebSocket.Server({ server });

const channels = {};

class Channel {
    constructor(name, initialState = {}) {
        this.name = name;
        this.chain = new StateChain(name, initialState);
        this.sockets = {};
    }
}

channels.BG = new Channel('BG', {
    catalog : [],
    parts : [{
        id : 543566,
        amount : 12,
    }, {
        id : 111,
        amount: 24
    }]
});

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
                    const data =  { 
                        hash : chain.chain.getLatest().hash,
                        state : chain.state.data
                    }
                    socket.send(JSON.stringify(data))
                }
            })

        })
        .catch((err) => {
            console.log(err);
        });
    })
}

const welcomePacket = (channel) => {
    return JSON.stringify({
        G : channel.name,
        A : 'handshake',
        D : { last : channel.chain.chain.getLatest().hash }
    })
}

const joinChannel = (channelId, ra, ws) => {
    if(!channels[channelId]) channels[channelId] = new Channel(channelId);
    const channel = channels[channelId];
    channel.sockets[ra] = ws;
    ws.send(welcomePacket(channel));
}

ws.on('connection', function connection(ws, req) {
    const rA = req.client.remoteAddress;
    joinChannel('BG', rA, ws);
    const { patch, eng } = qs.parse(req.url);
    if (patch) joinChannel(`BG:${patch}`, rA, ws);
    if (patch && eng) joinChannel(`BG:${patch}:${eng}`, rA, ws)
});

ws.on('close', (ws, req) => {
    console.log(req);
})

const cleanSockets = () => {
    for(var c in channels) {
        if(channels[c] && channels[c].sockets){
            for(var x in channels[c].sockets) {
                if(channels[c].sockets[x].readyState === 3) {
                    console.log('Cleaning socket ', x);
                    delete channels[c].sockets[x];
                }
            }
        }
    }
    setTimeout(() => {
        cleanSockets();
    }, 10000);
}

cleanSockets();

server.listen(process.env.PORT || 3000);