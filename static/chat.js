const socket = new WebSocket('ws://localhost:3000');
let currentRoom = '';
let nickname = '';

document.getElementById('set-nickname').addEventListener('click', () => {
    nickname = document.getElementById('nickname-input').value.trim();
    if (nickname) {
        document.getElementById('nickname-section').style.display = 'none';
        document.getElementById('room-selection').style.display = 'block';
        socket.send(JSON.stringify({ type: 'list_rooms' }));
    }
});

document.getElementById('join-room').addEventListener('click', () => {
    const room = document.getElementById('room-input').value.trim();
    if (room) {
        joinRoom(room);
    }
});

document.getElementById('send-message').addEventListener('click', () => {
    const message = document.getElementById('message-input').value.trim();
    if (message && currentRoom) {
        const data = {
            type: 'message',
            room: currentRoom,
            nickname: nickname,
            message: message,
        };
        socket.send(JSON.stringify(data));
        document.getElementById('message-input').value = '';
    }
});

document.getElementById('leave-room').addEventListener('click', leaveRoom);

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'message') {
        displayMessage(`${data.nickname} [${data.timestamp}]: ${data.message}`);
    } else if (data.type === 'room_list') {
        updateRoomList(data.rooms);
    } else if (data.type === 'user_list') {
        updateUserList(data.users);
    } else if (data.type === 'join_confirmed') {
        document.getElementById('room-selection').style.display = 'none';
        document.getElementById('chat-room').style.display = 'block';
        document.getElementById('room-title').innerText = `Room: ${currentRoom}`;
        displayMessage(`Joined ${currentRoom}`);
    } else if (data.type === 'private_message') {
        displayMessage(`Private from ${data.nickname} [${data.timestamp}]: ${data.message}`);
    }
};

function joinRoom(room) {
    if (currentRoom) leaveRoom();
    currentRoom = room;
    const data = { type: 'join', room: room, nickname: nickname };
    socket.send(JSON.stringify(data));
}

function leaveRoom() {
    if (currentRoom) {
        const data = { type: 'leave', room: currentRoom, nickname: nickname };
        socket.send(JSON.stringify(data));
        displayMessage(`Left ${currentRoom}`);
        currentRoom = '';
        document.getElementById('room-selection').style.display = 'block';
        document.getElementById('chat-room').style.display = 'none';
        document.getElementById('messages').innerHTML = '';
    }
}

function displayMessage(message) {
    const messages = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerText = message;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

function updateRoomList(rooms) {
    const roomList = document.getElementById('room-list');
    roomList.innerHTML = '';
    rooms.forEach(room => {
        const roomElement = document.createElement('li');
        roomElement.innerText = room;
        roomElement.addEventListener('click', () => joinRoom(room));
        roomList.appendChild(roomElement);
    });
}

function updateUserList(users) {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(user => {
        const userElement = document.createElement('li');
        userElement.innerText = user;
        userList.appendChild(userElement);
    });
}
