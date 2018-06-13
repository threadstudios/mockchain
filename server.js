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

const actionParser = (msg, ws) => {
    msg = JSON.parse(msg);
    const channel = msg.G;
    switch(msg.A) {
        case 'ping':
            ws.send(JSON.stringify({ A : 'pong' }))
        break;
        case 'startwork':
            let jobs = Array.from(channels[channel].chain.state.data.jobs);
            jobs = jobs.map((job) => {
                if (job.id == msg.D.job.id) {
                    job = Object.assign({}, job, msg.D.job);
                }
                return job;
            })      
            channels[channel].chain.add({jobs}, msg.L)
            .then((res) => {
                Object.values(channels[channel].sockets).forEach((socket) => {
                    actionEmitter(socket, {
                        G : channel,
                        A : 'blockupdate',
                        D : {
                            state : channels[channel].chain.state.data,
                            last : channels[channel].chain.chain.getLatest().hash
                        }
                    })
                })
            })
            .catch((err) => {
                console.log(err);
            })
        break;
        case 'getstatefrom':
            const lastHash = channels[channel].chain.chain.getHash(msg.D.from);
            if(msg.D.from && lastHash) {
                actionEmitter(ws, {
                    A : 'partialstateupdate',
                    D : {
                        state : channels[channel].chain.state.data,
                        last : channels[channel].chain.chain.getLatest().hash
                    },
                    G : msg.G
                })
            } else {
                actionEmitter(ws, {
                    A : 'stateinvalidupdate',
                    D : {
                        state : channels[channel].chain.state.data,
                        last : channels[channel].chain.chain.getLatest().hash
                    },
                    G : msg.G
                })
            }
        break;
        case 'getstate':
            actionEmitter(ws, {
                A : 'stateupdate',
                D : {
                    state : channels[channel].chain.state.data,
                    last : channels[channel].chain.chain.getLatest().hash
                },
                G : msg.G
            })
        break;
    }
}

const actionEmitter = (ws, a) => {
    ws.send(JSON.stringify(a));
}


const initMessageHandler = (ws) => {
    ws.on('message', (msg) => {
        actionParser(msg, ws);

        /*
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
        */
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
    if(!channels[channelId]) {
        const mockData = channelId.indexOf(':E') !== -1 ? {
            jobs : [{
                id: 14564,
                desc : "Doris has a broken boiler",
                status : "awaiting"
            }]
        } : {};
        channels[channelId] = new Channel(channelId, mockData);
    };
    const channel = channels[channelId];
    channel.sockets[ra] = ws;
    console.log(ra);
    ws.send(welcomePacket(channel));
}

ws.on('connection', function connection(ws, req) {
    const { patch, eng, device } = qs.parse(req.url);
    const rA = `${req.client.remoteAddress}|${device}`;
    joinChannel('BG', rA, ws);
    if (patch) joinChannel(`BG:${patch}`, rA, ws);
    if (patch && eng) joinChannel(`BG:${patch}:${eng}`, rA, ws)
    initMessageHandler(ws);
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