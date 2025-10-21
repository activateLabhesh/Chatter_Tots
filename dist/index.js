import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { Server } from 'socket.io';
const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicpath = join(__dirname, "../public");
app.get('/', (req, res) => {
    res.sendFile(join(publicpath, 'index.html'));
});
const users = new Map();
io.on('connection', (socket) => {
    socket.on('user joined', (data) => {
        users.set(socket.id, data);
        socket.join(data.currentChannel);
        socket.to(data.currentChannel).emit(`${data.userName} joined the channel`, {
            userName: data.userName,
            channel: data.currentChannel
        });
        socket.broadcast.emit('user joined!');
        console.log(`${data.userName} joined the chat`);
    });
    console.log(`${socket.id} user connected`);
    socket.on('chat message', (msg) => {
        const userName = users.get(socket.id);
        if (userName) {
            io.to(userName.currentChannel).emit('chat message', {
                msg,
                userName: userName.userName,
                socketId: socket.id,
                channel: userName.currentChannel
            });
            console.log(`${userName.userName} messaged ${msg}`);
        }
    });
    socket.on('switch channel', (newChannel) => {
        const user = users.get(socket.id);
        if (user) {
            const oldChannel = user.currentChannel;
            socket.leave(oldChannel);
            socket.to(oldChannel).emit('user left', {
                userName: user.userName,
                channel: newChannel
            });
            socket.join(newChannel);
            user.currentChannel = newChannel;
            users.set(socket.id, user);
            socket.to(newChannel).emit('user joined', {
                userName: user.userName,
                channel: newChannel
            });
            socket.emit('channel switched', { channel: newChannel });
            console.log(`${user.userName} switched to channel: ${newChannel}`);
        }
    });
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            socket.to(username.currentChannel).emit('user disconnected', {
                userName: username.userName,
                channel: username.currentChannel
            });
            users.delete(socket.id);
            console.log(`${username.userName} switched to ${username.currentChannel}`);
        }
        console.log(`${socket.id} user disconnected`);
    });
});
server.listen(7000, () => {
    console.log("Working on localhost 7000");
});
