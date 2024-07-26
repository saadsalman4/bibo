const socketAuth = require('./middlewares/socketAuth');
const {sequelize ,Message, Room, Owner, UserRoom} = require('./connect')
const { Op } = require('sequelize');


module.exports = (server) => {
  const socketIo = require('socket.io');
  const io = socketIo(server);

  const users = {};

  io.use(socketAuth);

  io.on('connection', async (socket) => {
    console.log('a user connected');

    const username = socket.user.company_name;
    users[username] = socket.id;

    try {
        // Find all rooms associated with the user
        const userRooms = await UserRoom.findAll({
            where: { username }, 
        });

        // Join the user to each room by its ID
        userRooms.forEach(userRoom => {
            socket.join(userRoom.roomId);  // Join room by ID
        });

        console.log(`User ${username} joined ${userRooms.length} rooms.`);
        } catch (e) {
            console.error(`Error fetching rooms for user ${username}: ${e}`);
            socket.emit('error', 'Error fetching rooms.');
        }


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
            else{
                if(senderInRoom.blocked==true){
                    socket.emit('error', 'You have blocked this user, please unblock to send a message.');
                    console.log('Recipient has blocked the sender');
                    return;
                }
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

    socket.on('chat history', async ({ otherUser }) => {
        const loggedInUser = username
    

        if (!otherUser || !loggedInUser) {
            socket.emit('error', 'Invalid request. User or otherUser missing.');
            return;
        }

        try{
            const roomName = [loggedInUser, otherUser].sort().join('_');

            const room = await Room.findOne({ where: { name: roomName } });
            console.log(roomName)
            if (!room) {
                socket.emit('chat history', {});
                return;
            }
            const messages = await Message.findAll({
                where: {
                    to: room.id,
                    from: {
                        [Op.in]: [loggedInUser, otherUser]
                    },
                    isDeleted: false
                },
                order: [['createdAt', 'ASC']]
            });
            socket.emit('chat history', messages);
        }
        catch(e){
            console.error(`Error fetching chat history: ${e.message}`);
            socket.emit('error', 'Error fetching chat history.');
        }
    });

    socket.on('block user', async ({usernameToBlock}) => {
        const loggedInUser = username;
    
        if (!usernameToBlock || !loggedInUser) {
            socket.emit('error', 'Invalid request. Username or logged-in user missing.');
            return;
        }

        if(usernameToBlock == loggedInUser){
            socket.emit('error', 'Invalid request. Cannot block itself.');
            return;
        }
    
        try {

            const blocking = await Owner.findOne({where: {company_name: usernameToBlock}})

            if(!blocking){
                socket.emit('error', 'User not found');
                return
            }

            const roomName = [loggedInUser, usernameToBlock].sort().join('_');

            let room = await Room.findOne({ where: { name: roomName } });
            if (!room) {
                room = await Room.create({ name: roomName });
            }

            let blocking_user = await UserRoom.findOne({where: {username: loggedInUser, roomId: room.id}})

            if(blocking_user){
                if(blocking_user.blocked==true){
                    socket.emit('block status', 'User already blocked');
                    return
                }
                else{
                    blocking_user.blocked=true;
                    await blocking_user.save()
                    socket.emit('block status', { success: true, message: `User ${usernameToBlock} has been blocked.` });
                    return
                }
            }
            else{
                await UserRoom.create({
                    username: usernameToBlock,
                    roomId: room.id,
                    blocked: true
                })
            }
    
            socket.emit('block status', { success: true, message: `User ${usernameToBlock} has been blocked.` });
        } catch (e) {
            console.error(`Error blocking user: ${e}`);
            socket.emit('error', 'Error blocking user.');
        }
    });

    socket.on('unblock user', async ({ usernameToUnblock }) => {
        const loggedInUser = username;
    
        if (!usernameToUnblock || !loggedInUser) {
            socket.emit('error', 'Invalid request. Username or logged-in user missing.');
            return;
        }
    
        if (usernameToUnblock === loggedInUser) {
            socket.emit('error', 'Invalid request. Cannot unblock itself.');
            return;
        }
    
        try {
            const userToUnblock = await Owner.findOne({ where: { company_name: usernameToUnblock } });
    
            if (!userToUnblock) {
                socket.emit('error', 'User not found');
                return;
            }
    
            const roomName = [loggedInUser, usernameToUnblock].sort().join('_');
    
            let room = await Room.findOne({ where: { name: roomName } });
            if (!room) {
                socket.emit('error', 'Room not found');
                return;
            }
    
            let blockingUser = await UserRoom.findOne({ where: { username: loggedInUser, roomId: room.id } });
    
            if (blockingUser) {
                if (!blockingUser.blocked) {
                    socket.emit('block status', 'User is not blocked');
                    return;
                } else {
                    blockingUser.blocked = false;
                    await blockingUser.save();
                    socket.emit('block status', { success: true, message: `User ${usernameToUnblock} has been unblocked.` });
                    return;
                }
            } else {
                socket.emit('block status', 'No blocking relationship found');
                return;
            }
        } catch (e) {
            console.error(`Error unblocking user: ${e}`);
            socket.emit('error', 'Error unblocking user.');
        }
    });

    socket.on('chat list', async () => {
        const loggedInUser = username;

        if (!loggedInUser) {
            socket.emit('error', 'Invalid request. Logged-in user missing.');
            return;
        }

        try {
            const queryResults = await sequelize.query(
                `SELECT m.*, r.name as roomName, ur.username as participant
                FROM messages m
                JOIN rooms r ON r.id = m.to
                JOIN userrooms ur ON ur.roomId = r.id
                WHERE ur.roomId IN (
                    SELECT roomId FROM userrooms WHERE username = '${loggedInUser}'
                ) AND m.isDeleted = FALSE
                ORDER BY m.createdAt DESC`
            );
            
            const chatHistoryMap = new Map();
            queryResults[0].forEach((result) => {
                const roomId = result.to;
                const roomName = result.roomName;
            
                if (!chatHistoryMap.has(roomId)) {
                    let participants = '';
                    
                    if (roomName.includes('_')) { // Private message
                        const users = roomName.split('_');
                        participants = users.find(user => user !== loggedInUser);
                    }
                    
                    chatHistoryMap.set(roomId, {
                        roomName,
                        participants: participants || '',
                        lastMessage: {
                            from: result.from,
                            message: result.message,
                            timestamp: result.createdAt
                        }
                    });
                }
            });
            
            // Convert the map to an array
            const chatHistory = Array.from(chatHistoryMap.values());
            

            socket.emit('chat list', chatHistory);
    }

    
    catch (e) {
        console.error(`Error fetching chat list: ${e}`);
        socket.emit('error', 'Error fetching chat list.');
    }
    });

    socket.on('delete message for everyone', async ({ messageId }) => {
        const loggedInUser = username;
    
        if (!messageId || !loggedInUser) {
            socket.emit('error', 'Invalid request. Message ID or logged-in user missing.');
            return;
        }
    
        try {
            // Find the message by ID
            const message = await Message.findOne({ where: { id: messageId } });
    
            if (!message) {
                socket.emit('error', 'Message not found.');
                return;
            }
    
            // Check if the logged-in user is the sender of the message
            if (message.from !== loggedInUser) {
                socket.emit('error', 'You can only delete your own messages.');
                return;
            }
            if(message.isDeleted==true){
                socket.emit('error', 'Message doesnt exists.');
                return;
            }
    
            // Soft delete the message
            message.isDeleted = true;
            await message.save();
    
            socket.emit('delete status', { success: true, message: 'Message deleted successfully.' });

        } catch (e) {
            console.error(`Error deleting message: ${e}`);
            socket.emit('error', 'Error deleting message.');
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
