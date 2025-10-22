import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { initializeChatSockets } from './sockets/chatsockets.js';
const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicpath = join(__dirname, "../public");
app.get('/', (req, res) => {
    res.sendFile(join(publicpath, 'index.html'));
});
initializeChatSockets(io);
server.listen(7000, () => {
    console.log("Working on localhost 7000");
});
