const socketAuth = require('./middlewares/socketAuth');
const {Message, Room} = require('./connect')

module.exports = (server) => {
  const socketIo = require('socket.io');
  const io = socketIo(server);

  const users = {};

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log('a user connected');

    const username = socket.user.company_name;
    users[username] = socket.id; 


    socket.on('join room', async ({ roomName }) => {
        try{
            let room = await Room.findOne({ where: { name: roomName } });
            if (!room) {
            room = await Room.create({ name: roomName });
            }
        }
        catch(e){
            console.log(e)
            return
        }
        socket.join(roomName);
        socket.roomName = roomName;
    
        io.to(roomName).emit('user joined', `${username} has joined the room ${roomName}.`);
        console.log(`${username} has joined the room ${roomName}.`)
      });

      socket.on('chat message', async (msg) => {
        const roomName = socket.roomName;
    
        if (!msg || !roomName || !username) {
          return;
        }
    
        try{
            const room = await Room.findOne({ where: { name: roomName } });
            if (!room) {
            return;
            }
        
            await Message.create({
            from: username,
            message: msg,
            roomId: room.id
            });
        }
        catch(e){
            console.log(e)
            return
        }
    
        socket.broadcast.to(roomName).emit('chat message', { user: username, message: msg });
      });

      socket.on('private message', async ({ recipient, message }) => {
        const sender = username;
        const roomName = [sender, recipient].sort().join('_'); // Create a unique and consistent room name for the two users
      
        if (!message || !recipient || !sender) {
          return;
        }
      
        try {
          // Find or create the room for the two users
          let room = await Room.findOne({ where: { name: roomName } });
          if (!room) {
            room = await Room.create({ name: roomName });
          }
      
          // Save the message in the database
          await Message.create({
            from: sender,
            to: recipient,
            message: message,
            roomId: room.id
          });
      
          // Join the sender to the room
          socket.join(roomName);

          // Check if recipient is connected
          const recipientSocketId = users[recipient];
          console.log(`Recipient: ${recipient}, Socket ID: ${recipientSocketId}`);
      
          if (recipientSocketId) {
            const recipientSocket = io.sockets.sockets.get(recipientSocketId);
            const rooms = recipientSocket.rooms;
      
            // Check if recipient is already in the room
            if (!rooms.has(roomName)) {
              // Join the recipient to the room and notify about the private message
              io.to(recipientSocketId).emit('private message notification', { from: sender, roomName, message });
            }
          } else {
            console.log(`Recipient ${recipient} is not connected.`);
          }
        } catch (e) {
          console.log(e);
          return;
        }
      
        // Send the private message to the room, excluding the sender
        socket.broadcast.to(roomName).emit('private message', { user: sender, message });
      });

      socket.on('disconnect', () => {
        const roomName = socket.roomName;
        if (roomName) {
          io.to(roomName).emit('user left', `${username} has left the room ${roomName}.`);
        }
      });

    
  });
};
