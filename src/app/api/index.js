import dotenv from "dotenv";
dotenv.config();
// Utility to build a deterministic one-to-one room id between two users
function oneToOneRoom(a, b) {
  return [a, b].sort().join("#");
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // when a user joins and provides username
  socket.on("user:join", async ({ username, displayName }) => {
    socket.username = username;
    // save or update user
    let user = await User.findOne({ username });
    if (!user)
      user = new User({
        username,
        displayName,
        socketId: socket.id,
        online: true,
      });
    else {
      user.socketId = socket.id;
      user.online = true;
      user.displayName = displayName || user.displayName;
    }
    await user.save();

    // join personal room (for private emits)
    socket.join(username);

    // emit updated user list
    const users = await User.find({}, "-__v");
    io.emit("users:list", users);
  });

  // create or join a room
  socket.on("room:join", async ({ room }) => {
    socket.join(room);
    console.log(socket.username, "joined room", room);

    // optional: send recent messages in room
    const messages = await Message.find({ room })
      .sort({ createdAt: 1 })
      .limit(200);
    socket.emit("room:messages", messages);
  });

  // send message
  socket.on("message:send", async ({ room, from, to, text }) => {
    const msg = new Message({ room, from, to, text });
    await msg.save();

    // emit to room
    io.to(room).emit("message:new", msg);
  });

  // typing indicator
  socket.on("typing", ({ room, username, typing }) => {
    socket.to(room).emit("typing", { username, typing });
  });

  // handle one-to-one request (helper event to create room name)
  socket.on("private:init", ({ to, from }) => {
    const room = oneToOneRoom(to, from);
    socket.join(room);
    // notify the recipient to join
    socket.to(to).emit("private:invite", { room, from });
  });

  socket.on("disconnect", async () => {
    console.log("socket disconnected", socket.id);
    if (socket.username) {
      await User.findOneAndUpdate(
        { username: socket.username },
        { online: false, socketId: null }
      );
      const users = await User.find({}, "-__v");
      io.emit("users:list", users);
    }
  });
});

server.listen(PORT, () => console.log("Server running on", PORT));
