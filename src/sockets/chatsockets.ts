import {Server, Socket} from 'socket.io'
import {messagestore, retrievemessages} from '../controller/messagecontroller.js'

interface User{
  userName: string,
  currentChannel: string
}

const users = new Map<string, User>();
export function initializeChatSockets(io: Server){
io.on('connection', (socket) => {

  socket.on('user joined',async (data: {userName: string, currentChannel: string} )=>{
    users.set(socket.id, data);

    socket.join(data.currentChannel);


    const previousMessages = await retrievemessages(data.currentChannel);
      socket.emit('previous messages', previousMessages);
    
  
    socket.to(data.currentChannel).emit(`${data.userName} joined the channel`,{
      userName: data.userName,
      channel:data.currentChannel
    });

    socket.broadcast.emit('user joined!');
    console.log(`${data.userName} joined the chat`);
  })

  console.log(`${socket.id} user connected`);

    // receive chat messages and include channel + username when saving/broadcasting
    socket.on('chat message', async (msg: string) => {
      const user = users.get(socket.id);
      if (!user) return;

      const channel = user.currentChannel || 'general';

      // save message with username and channel
      try {
        await messagestore(user.userName, msg, channel);
      } catch (err) {
        console.error('Error storing message:', err);
      }

      // broadcast to the channel
      io.to(channel).emit('chat message', {
        msg,
        userName: user.userName,
        socketId: socket.id,
        channel,
      });

      console.log(`${user.userName} messaged ${msg} in ${channel}`);
    });


    socket.on('switch channel' ,async (newChannel: string) => {
      const user = users.get(socket.id);

      if(user) {
        const oldChannel = user.currentChannel;

        socket.leave(oldChannel);
        socket.to(oldChannel).emit('user left' ,{
          userName: user.userName,
          channel: newChannel
        });

        socket.join(newChannel);
        user.currentChannel = newChannel;
        users.set(socket.id, user);

        const previousMessages = await retrievemessages(newChannel);
        socket.emit('previous messages', previousMessages);


        socket.to(newChannel).emit('user joined', {
        userName: user.userName,
        channel: newChannel
    });

        socket.emit('channel switched' , {channel: newChannel});
       
        console.log(`${user.userName} switched to channel: ${newChannel}`);
      }
    })

    // create or join a custom channel by name
    socket.on('create channel', async (channelName: string) => {
      const user = users.get(socket.id);
      if (!user) return;

      // join the new channel
      socket.join(channelName);
      const old = user.currentChannel;
      if (old) {
        socket.leave(old);
        socket.to(old).emit('user left', { userName: user.userName, channel: old });
      }
      user.currentChannel = channelName;
      users.set(socket.id, user);

      // send previous messages (if any)
      const previousMessages = await retrievemessages(channelName);
      socket.emit('previous messages', previousMessages);

      socket.to(channelName).emit('user joined', { userName: user.userName, channel: channelName });
      socket.emit('channel created', { channel: channelName });
      console.log(`${user.userName} created/joined channel: ${channelName}`);
    });

    // join an existing channel by name
    socket.on('join channel', async (channelName: string) => {
      const user = users.get(socket.id);
      if (!user) return;

      const old = user.currentChannel;
      if (old === channelName) {
        socket.emit('channel switched', { channel: channelName });
        return;
      }

      if (old) {
        socket.leave(old);
        socket.to(old).emit('user left', { userName: user.userName, channel: old });
      }

      socket.join(channelName);
      user.currentChannel = channelName;
      users.set(socket.id, user);

      const previousMessages = await retrievemessages(channelName);
      socket.emit('previous messages', previousMessages);

      socket.to(channelName).emit('user joined', { userName: user.userName, channel: channelName });
      socket.emit('channel switched', { channel: channelName });
      console.log(`${user.userName} joined channel: ${channelName}`);
    });


  socket.on('disconnect', () => {
    const username = users.get(socket.id);

    if(username){
      socket.to(username.currentChannel).emit('user disconnected',{
        userName: username.userName,
        channel: username.currentChannel
      })
      users.delete(socket.id);
      console.log(`${username.userName} switched to ${username.currentChannel}`);
    }
    console.log(`${socket.id} user disconnected`);
  });
});
}



