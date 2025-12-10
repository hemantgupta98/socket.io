import express from "expres";
import User from "../../../../../../websocket/backend/models/user";
import Chat from "../../../../../../websocket/backend/models/chat";

const router = express.Router();

// get all users (with online status)
router.get("/user", async (req, res) => {
  const user = await User.find({}, "-__v").sort({ username: 1 });
  res.json(user);
});

// fetch messages by room id
router.get("/chat/:room", async (req, res) => {
  const { room } = req.params;
  const chat = await Chat.find({ room }).sort({ createdAT: 1 }).limit(200);
  res.json(chat);
});

module.exports = router;
