const socketAuth = require('./middlewares/socketAuth');
const {Message, Room, Owner, UserRoom} = require('./connect')

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
        if(!roomName){
            return
        }
        try{
            let room = await Room.findOne({ where: { name: roomName } });
            if (!room) {
                room = await Room.create({ name: roomName });
            }

            const roomId = room.id;

            // Add user to the UserRoom table
            await UserRoom.findOrCreate({ where: { username, roomId } });

            // Join the socket.io room
            socket.join(roomName);
            socket.roomName = roomName;
            io.to(roomName).emit('message', `${username} has joined the room`);
        }
        catch(e){
            console.log(e)
            return
        }
    });

    socket.on('chat message', async (msg) => {
    const roomName = socket.roomName;
    const sender = username;

    if (!msg || !roomName || !sender) {
        console.log('Message, roomName, or sender is missing');
        return;
    }

    try {
        console.log(`Room Name: ${roomName}`);

        // Ensure the room exists
        const room = await Room.findOne({ where: { name: roomName } });
        if (!room) {
            console.log('Room does not exist');
            return;
        }

        // Check if the sender is in the room
        const senderInRoom = await UserRoom.findOne({ 
            where: { username: sender, roomId: room.id }
        });
        if (!senderInRoom) {
            socket.emit('error', 'You are not in this room.');
            console.log('Sender is not in the room');
            return;
        }

        // Save the message in the database
        const message = await Message.create({
            from: sender,
            to: room.id,  // This will be used to identify the group
            message: msg,
            roomId: room.id
        });
        console.log(`Message Stored: ${JSON.stringify(message)}`);

        // Broadcast the message to all users in the room, including the sender
        console.log(`Broadcasting message to room: ${roomName}`);
        io.to(roomName).emit('chat message', { user: sender, message: msg });

    } catch (e) {
        console.error(`Error handling chat message: ${e.message}`);
    }
    });
    
    

    socket.on('private message', async ({ recipient, message }) => {
        const sender = username;
        const roomName = [sender, recipient].sort().join('_');
      
        if (!message || !recipient || !sender) {
          return;
        }
      
        try {
          // Find or create the room for the two users
          let room = await Room.findOne({ where: { name: roomName } });
          if (!room) {
            room = await Room.create({ name: roomName });
          }

          let senderInRoom = await UserRoom.findOne({
            where: { username: sender, roomId: room.id }
            });
            if (!senderInRoom) {
                senderInRoom = await UserRoom.create({
                    username: sender,
                    roomId: room.id,
                    blocked: false // Assuming default value
                });
            }
            let recipientInRoom = await UserRoom.findOne({
                where: { username: recipient, roomId: room.id }
            });
            if(recipientInRoom){
                if(recipientInRoom.blocked==true){
                    socket.emit('error', 'You are blocked by this user.');
                    console.log('Recipient has blocked the sender');
                    return;
                }
            }
            else{
                recipientInRoom = await UserRoom.create({
                    username: recipient,
                    roomId: room.id,
                    blocked: false // Assuming default value
                });
            }
      
            await Message.create({
                from: sender,
                to: room.id,
                message: message
            });
      
          // Join the sender to the room
          socket.join(roomName);

          // Check if recipient is connected
          const recipientSocketId = users[recipient];
      
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

      socket.on('chat history', async ({ id }) => {
        const user = socket.user; // Get the authenticated user from the socket object
    
        try {
          const owner = await Owner.findOne({ where: { id } });
          if (!owner) {
            return socket.emit('chat history', { error: "User not found" });
          }
    
          const chats = await Message.findAll({
            where: {
              from: user.company_name,
              to: owner.company_name
            }
          });
    
          socket.emit('chat history', { chats });
        } catch (e) {
          console.log(e);
          socket.emit('chat history', { error: "Error retrieving chat history" });
        }
      });

      socket.on('disconnect', () => {
        const roomName = socket.roomName;
        if (roomName) {
          io.to(roomName).emit('user left', `${username} has left the room ${roomName}.`);
        }
      });

    
  });
};
