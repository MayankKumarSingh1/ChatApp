import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import EmojiPicker from 'emoji-picker-react';
import {Link} from 'react-router-dom';
const socket = io(import.meta.env.VITE_BACKEND_URL, {
  withCredentials: true,
});

function Chat({ activeFriend: propActiveFriend }) {
  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.userId;
  const [activeFriend, setActiveFriend] = useState(propActiveFriend || null);

  useEffect(() => {
    setActiveFriend(propActiveFriend);
  }, [propActiveFriend]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const onEmojiClick = (emojiData) => {
    setInput((prevInput) => prevInput + emojiData.emoji);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [chat, setChat] = useState([]);

  const sendToBot = async () => {
    if (!input.trim()) return;

    const newChat = [...chat, { from: 'user', text: input }];
    setChat(newChat);
    setInput('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ask`, {
        message: input,
      });

      setChat([...newChat, { from: 'bot', text: res.data.reply }]);
    } catch (error) {
      setChat([...newChat, { from: 'bot', text: 'Error talking to bot 😓' }]);
    }
  };

  const sendFriendRequest = async () => {
    if (!newFriendUsername.trim()) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/send`,
        { toUsername: newFriendUsername.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true
        }
      );
      setRequestStatus("Friend request sent!");
      setNewFriendUsername("");
    } catch (err) {
      setRequestStatus(err.response?.data?.message || "Error sending request");
    }
  };

  const fetchFriendData = async () => {
    try {
      const [friendsRes, sentRes, receivedRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/friends/${userId}`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/sent/${userId}`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/received/${userId}`)
      ]);
      setFriends(friendsRes.data);
      setSentRequests(sentRes.data);
      setReceivedRequests(receivedRes.data);
    } catch (err) {
      console.error("Error loading friend data:", err);
    }
  };

  useEffect(() => {
    if (userId) fetchFriendData();
  }, [userId]);

  useEffect(() => {
    if (!activeFriend || !userId || activeFriend === "bot") return;
    const roomId = [userId, activeFriend].sort().join('-');
    socket.emit('join_room', roomId);

    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/chat/${userId}/${activeFriend}`)
      .then(res => {
        const msgs = Array.isArray(res.data) ? res.data : res.data.messages;
        setMessages(msgs || []);
      })
      .catch(err => console.error("Error loading messages:", err));

    const handleReceive = (message) => {
      const msgRoomId = [message.from, message.to].sort().join('-');
      if (msgRoomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [activeFriend, userId]);

  const sendMessage = async () => {
    if (!input.trim() || !activeFriend) return;

    if (activeFriend === "bot") {
      sendToBot();
      return;
    }

    const room = [userId, activeFriend].sort().join('-');
    const message = { sender: userId, to: activeFriend, text: input };
    socket.emit('send_message', { room, sender: userId, message });
    setMessages(prev => [...prev, message]);
    setInput("");

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/chat/${userId}/${activeFriend}`,
        { text: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to store message in DB:", err);
    }
  };

  const acceptRequest = async (fromUserId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/accept`,
        { from: fromUserId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
      fetchFriendData();
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const rejectRequest = async (fromUserId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/reject`,
        { from: fromUserId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
      fetchFriendData();
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/chat/${messageId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto flex flex-col justify-between">

      <div className='flex-grow'>
         <Link to="/home" className="flex items-center mb-4 text-blue-600 hover:text-blue-800 font-semibold">
          ← Back
        </Link>

        <h2 className="text-xl font-bold mb-4">ChatApp</h2>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Friends</h3>
          {friends.length === 0 ? <p>No friends yet</p> : friends.map(friend => (
            <div key={friend._id} onClick={() => setActiveFriend(friend._id)}
              className={`cursor-pointer px-3 py-2 rounded-lg ${activeFriend === friend._id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
              {friend.username}
            </div>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Requests</h3>
          {receivedRequests.map(req => (
            <div key={req._id} className="flex items-center justify-between mb-2">
              <span>{req.username}</span>
              <div className="flex gap-1">
                <button onClick={() => acceptRequest(req.from)} className="text-xs bg-green-500 text-white px-2 py-1 rounded">✓</button>
                <button onClick={() => rejectRequest(req.from)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Add a friend"
            value={newFriendUsername}
            onChange={e => setNewFriendUsername(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <button onClick={sendFriendRequest} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Send Request
          </button>
          {requestStatus && <p className="text-sm text-green-600 mt-1">{requestStatus}</p>}
        </div>
        </div>

        <div className="mt-4 flex justify-center">
          <img
            src="./ai_bot.png"
            alt="AI Bot"
            className={`w-24 h-24 cursor-pointer hover:scale-105 transition-transform duration-200 ${activeFriend === "bot" || !activeFriend ? "animate-bounce" : ""}`}
            onClick={() => setActiveFriend("bot")}
          />
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeFriend ? (
            activeFriend === "bot" ? chat.map((msg, i) => (
              <div key={i} className={`max-w-md ${msg.from === 'user' ? 'ml-auto text-right' : ''}`}>
                <p className="text-xs text-gray-500 mb-1">{msg.from === 'user' ? 'You' : 'AI'}</p>
                <div className={`inline-block px-4 py-2 rounded-lg ${msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
                  {msg.text}
                </div>
              </div>
            )) : messages.map((msg, i) => {
              const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
              const isSent = senderId === userId;
              const name = isSent ? 'You' : (typeof msg.sender === 'object' ? msg.sender.username : friends.find(f => f._id === msg.sender)?.username || 'Friend');
              return (
                <div key={msg._id || i} onContextMenu={(e) => {
                  e.preventDefault();
                  if (isSent && window.confirm("Delete this message?")) deleteMessage(msg._id);
                }} className={`max-w-md ${isSent ? 'ml-auto text-right' : ''}`}>
                  <p className="text-xs text-gray-500 mb-1">{name}</p>
                  <div className={`inline-block px-4 py-2 rounded-lg ${isSent ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
                    <div>{msg.text}</div>
                    {msg.time && (
                      <div className='text-[10px] text-gray-600 text-right mt-1'> {formatTime(msg.time)} </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : <p className="text-center text-gray-500">Select a friend to start chatting</p>}
        </div>

        {activeFriend && (
          <div className="p-4 border-t relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 p-2 border rounded"
              placeholder="Type a message..."
            />
            <button onClick={() => setShowEmojiPicker(val => !val)} className="text-2xl">😊</button>
            {showEmojiPicker && (
              <div className="absolute bottom-16 right-20 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
            <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
