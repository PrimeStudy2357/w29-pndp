const http = require('http');
const SocketIO = require('socket.io');

const httpServer = http.createServer();
const wsServer = new SocketIO.Server(httpServer, {
    cors: {
        origin: 'http://localhost:5500',
        methods: ['GET', 'POST'],
    },
});
const port = 3000;

wsServer.on('connection', (socket) => {
    socket.on('join', (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit('welcome');
    });

    socket.on('offer', (offer, roomName) => {
        console.log(offer);
        socket.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName) => {
        console.log(answer);
        socket.to(roomName).emit('answer', answer);
    });

    socket.on('ice', (ice, roomName) => {
        console.log(ice);
        socket.to(roomName).emit('ice', ice);
    });
});

httpServer.listen(port, () =>
    console.log(`Listening on http://localhost:${port}`),
);