const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let rooms = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'join':
                if (!rooms[data.room]) rooms[data.room] = [];
                rooms[data.room].push({ ws, nickname: data.nickname });
                broadcastToRoom(data.room, {
                    type: 'user_list',
                    users: rooms[data.room].map(client => client.nickname),
                });
                ws.send(JSON.stringify({ type: 'join_confirmed' }));
                break;

            case 'leave':
                leaveRoom(data.room, ws);
                break;

            case 'message':
                broadcastToRoom(data.room, {
                    type: 'message',
                    nickname: data.nickname,
                    message: data.message,
                    timestamp: new Date().toLocaleTimeString(),
                });
                break;

            case 'list_rooms':
                ws.send(JSON.stringify({
                    type: 'room_list',
                    rooms: Object.keys(rooms),
                }));
                break;

            case 'private_message':
                sendPrivateMessage(data.to, {
                    type: 'private_message',
                    nickname: data.nickname,
                    message: data.message,
                    timestamp: new Date().toLocaleTimeString(),
                });
                break;
        }
    });

    ws.on('close', () => {
        for (let room in rooms) {
            leaveRoom(room, ws);
        }
    });
});

function broadcastToRoom(room, message) {
    rooms[room].forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });
}

function leaveRoom(room, ws) {
    if (rooms[room]) {
        rooms[room] = rooms[room].filter(client => client.ws !== ws);
        if (rooms[room].length === 0) {
            delete rooms[room];
        } else {
            broadcastToRoom(room, {
                type: 'user_list',
                users: rooms[room].map(client => client.nickname),
            });
        }
    }
}

function sendPrivateMessage(toNickname, message) {
    for (let room in rooms) {
        const client = rooms[room].find(client => client.nickname === toNickname);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
            break;
        }
    }
}

app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
