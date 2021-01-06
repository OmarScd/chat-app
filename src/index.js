const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server)

const PORT = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');
const adminName = 'Room bot';

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  socket.on('join', ({ username, room }, acknowledgeCb) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return acknowledgeCb(error);
    }
    
    socket.join(user.room);

    socket.emit('message', generateMessage(adminName, 'Welcome, amiwo!'));
    socket.broadcast.to(user.room).emit('message', generateMessage(adminName, `${user.username} has joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    acknowledgeCb();
  });
  
  socket.on('sendMessage', (message, cb) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return cb('Profanity is not allowed!');
    }
    
    const user = getUser(socket.id);
    
    io.to(user.room).emit('message', generateMessage(user.username, message));
    cb();
  });

  socket.on('sendLocation', (coords, acknowledgeCb) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, coords.lat, coords.long));
    acknowledgeCb();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      socket.broadcast.to(user.room).emit('message', generateMessage(adminName, `${user.username} has left unu`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});
