const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Chat, Message} = require('../models/user.model');
const verifyToken=require('../middlewares/verifytoken');
const axios= require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

console.log("api key: ", GEMINI_API_KEY);


router.post('/register',
  body('username').trim().isLength({ min: 5 }),
  body('password').trim().isLength({ min: 8 }),
  body('number')
    .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits')
    .matches(/^\d+$/).withMessage('Mobile number must contain only digits'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) 
        return res.status(400).json({ errors: errors.array(), message: 'Invalid data' });

      const { username, number , password } = req.body;

      if (!username?.trim() || !number?.trim() || !password?.trim()) {return res.status(400).json({ message: "All fields are required." });
    }

      
      const existingUser = await User.findOne({ $or: [{ username }, { number }] });
      if (existingUser) 
         return res.status(400).json({ message: 'Username or number already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({ username, password: hashedPassword, number });

      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);
      res.status(201).json({ message: "Registration successful", token });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post('/login',
  body('username').trim().isLength({ min: 5 }),
  body('password').trim().isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid data' });

    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Username or password is incorrect' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.json({ message: 'Login successful', token, user });

  }
);

router.post('/friendrequest/send',verifyToken, async (req, res) => {
  const {toUsername } = req.body;
  const from = req.user.userId;

  if (!toUsername || !from) return res.status(400).json({ message: 'Missing data' });

  const fromUser = await User.findById(from);
  
  const toUser = await User.findOne({ username: toUsername });

 if (!fromUser || !toUser) return res.status(404).json({ message: 'User not found' });

 if (from === toUser._id.toString()) return res.status(400).json({ message: 'Cannot send request to self' });

if (
  fromUser.friends.some(id => id.toString() === toUser._id.toString()) ||
  fromUser.sentRequests.some(id => id.toString() === toUser._id.toString()) ||
  fromUser.friendRequests.some(id => id.toString() === toUser._id.toString())
)
return res.status(400).json({ message: 'Already connected or request pending' });

  fromUser.sentRequests.push(toUser._id);
  toUser.friendRequests.push(fromUser._id);

  await Promise.all([fromUser.save(), toUser.save()]);

  res.status(201).json({ message: "Friend request sent" });
});

router.post('/friendrequest/accept', verifyToken, async (req, res) => {
  try {
    const { from } = req.body;
    const to = req.user.userId;

     if (!from || !to) return res.status(400).json({ message: "Missing data" });

    const fromUser = await User.findById(from);
    const toUser = await User.findById(to);

    if (!fromUser || !toUser)
      return res.status(404).json({ message: "User not found" });

    if (!toUser.friendRequests.some(id => id.toString() === from.toString())) {
      return res.status(400).json({ message: "No friend request from this user" });
    }

    if (!fromUser.friends.some(id => id.toString() === toUser._id.toString())) {
      fromUser.friends.push(toUser._id);
    }
    if (!toUser.friends.some(id => id.toString() === fromUser._id.toString())) {
      toUser.friends.push(fromUser._id);
    }

    fromUser.sentRequests = fromUser.sentRequests.filter(id => id.toString() !== toUser._id.toString());
    toUser.friendRequests = toUser.friendRequests.filter(id => id.toString() !== fromUser._id.toString());

    await Promise.all([fromUser.save(), toUser.save()]);

    const existingChat = await Chat.findOne({ members: { $all: [from, to], $size: 2 } });
    if (!existingChat) await new Chat({ members: [from, to], messages: [] }).save();

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Error in /friendrequest/accept:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get('/friendrequest/sent/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).populate('sentRequests', 'username');
  if (!user) return res.status(404).json({ message: "User not found" });

  const sent = user.sentRequests.map(u => ({ to: u._id, username: u.username }));
  res.json(sent);
});

router.get('/friendrequest/received/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).populate('friendRequests', 'username');
  if (!user) return res.status(404).json({ message: "User not found" });

  const received = user.friendRequests.map(u => ({ from: u._id, username: u.username }));
  res.json(received);
});


router.post('/friendrequest/reject', verifyToken, async (req, res) => {
  const { from: requesterId } = req.body;
  const to = req.user.userId;

  if (!requesterId) return res.status(400).json({ message: "Requester ID required" });

  const [user, requester] = await Promise.all([
    User.findById(to),
    User.findById(requesterId),
  ]);

  if (!user || !requester) return res.status(404).json({ message: "User(s) not found" });

  if (!user.friendRequests.includes(requesterId)) {
    return res.status(400).json({ message: "No friend request found from this user" });
  }

  user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
  requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== to);

  await Promise.all([user.save(), requester.save()]);

  res.json({ message: "Friend request rejected" });
});

router.get('/friends/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).populate('friends', 'username');
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.friends);
});

router.get('/chat/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;

  try {
    let chat = await Chat.findOne({ members: { $all: [userId, friendId], $size: 2 } });

    if (!chat) {
      chat = new Chat({ members: [userId, friendId], messages: [] });
      await chat.save();
    }

    res.status(200).json(chat.messages); 
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/chat/:userId/:friendId', verifyToken, async (req, res) => {

  const { text } = req.body;
  const from = req.user.userId;
  const to = req.params.friendId;

  let chat = await Chat.findOne({ members: { $all: [from, to], $size: 2 } });

  if (!chat) {
    chat = new Chat({ members: [from, to], messages: [] });
  }

  chat.messages.push({ sender: from , text });
  await chat.save();

  res.status(200).json({ message: "Message sent" });
});

router.delete('/chat/:messageId', verifyToken, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  try {
    const chat = await Chat.findOne({
      "messages._id": messageId,
      "messages.sender": userId
    });

    if (!chat) {
      return res.status(404).json({ message: "Message not found or unauthorized" });
    }
    chat.messages = chat.messages.filter(
      (msg) => msg._id.toString() !== messageId
    );

    await chat.save();

    res.status(200).json({ message: "Message deleted" });
  } catch (err) {
    console.error("Server error during message deletion:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get('/user/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post('/ask', async (req, res) => {
  const { message } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ],
    });
    
    const response = await result.response;

    const text = result.response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error('Gemini error:', error.message || error);
    res.status(500).json({
      reply: 'Error talking to Gemini 🤖',
      error: error.message || 'Unknown error',
    });
  }
});


module.exports = router;
