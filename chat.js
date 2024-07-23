const socketAuth = require('./middlewares/socketAuth');
const {Message} = require('./connect')

module.exports = (server) => {
  const socketIo = require('socket.io');
  const io = socketIo(server);

  let users = {};

  io.use(socketAuth);

  io.on('connection', (socket) => {
    // Access user info from middleware
    const userInfo = socket.user;
    const username = userInfo.company_name; // Or any other field you need

    // Store the user's nickname in the users object
    users[socket.id] = username;
    io.emit('user list', Object.values(users));
    io.emit('user connected', username);

    socket.on('new user', (nickname) => {
      if (Object.values(users).includes(nickname)) {
        socket.emit('nickname taken', 'This nickname is already taken. Please choose another one.');
      } else {
        users[socket.id] = nickname;
        socket.broadcast.emit('user list', Object.values(users));
        socket.broadcast.emit('user connected', nickname);
      }
    });

    socket.on('disconnect', () => {
      if (users[socket.id]) {
        socket.broadcast.emit('user disconnected', users[socket.id]);
        delete users[socket.id];
        socket.broadcast.emit('user list', Object.values(users));
      }
    });

    socket.on('chat message', async (msg) => {
        if(!msg){
            return
        }
      const user = users[socket.id] || "Anonymous";
      try {
        await Message.create({
          from: user,
          to: null,
          message: msg
        }); 
      socket.broadcast.emit('chat message', { user, message: msg });
    } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to save message.' });
      }
    });

    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('typing', { user: users[socket.id], isTyping });
    });

    socket.on('private message', async ({ recipient, message }) => {
      const recipientId = Object.keys(users).find(key => users[key] === recipient);
      if (recipientId) {
        try {
            await Message.create({
              from: users[socket.id],
              to: recipient,
              message: message
            });
        io.to(recipientId).emit('private message', { user: users[socket.id], message });
    } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to save message.' });
      }
      
      }
     else {
        socket.emit('error', { message: 'Recipient not found.' });
      }
    });
  });
};
