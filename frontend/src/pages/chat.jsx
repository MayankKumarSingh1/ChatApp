import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import EmojiPicker from 'emoji-picker-react';
import { Link } from 'react-router-dom';

const socket = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });

function Chat({ activeFriend: propActiveFriend }) {
  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.userId;

  const [activeFriend, setActiveFriend] = useState(propActiveFriend || null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [chat, setChat] = useState([]);

  useEffect(() => setActiveFriend(propActiveFriend), [propActiveFriend]);

  const onEmojiClick = (emojiData) => setInput((prev) => prev + emojiData.emoji);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const sendToBot = async () => {
    if (!input.trim()) return;
    const newChat = [...chat, { from: 'user', text: input }];
    setChat(newChat);
    setInput('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ask`, { message: input });
      setChat([...newChat, { from: 'bot', text: res.data.reply }]);
    } catch {
      setChat([...newChat, { from: 'bot', text: 'Error talking to bot 😓' }]);
    }
  };

  const sendFriendRequest = async () => {
    if (!newFriendUsername.trim()) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/send`,
        { toUsername: newFriendUsername.trim() },
        { headers: { 'Authorization': `Bearer ${token}` }, withCredentials: true }
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
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/received/${userId}`),
      ]);
      setFriends(friendsRes.data);
      setSentRequests(sentRes.data);
      setReceivedRequests(receivedRes.data);
    } catch (err) {
      console.error("Error loading friend data:", err);
    }
  };

  useEffect(() => { if (userId) fetchFriendData(); }, [userId]);

  useEffect(() => {
    if (!activeFriend || !userId || activeFriend === "bot") return;

    const roomId = [userId, activeFriend].sort().join('-');
    socket.emit('join_room', roomId);

    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/chat/${userId}/${activeFriend}`)
      .then(res => setMessages(Array.isArray(res.data) ? res.data : res.data.messages))
      .catch(err => console.error("Error loading messages:", err));

    const handleReceive = (message) => {
      const msgRoomId = [message.from, message.to].sort().join('-');
      if (msgRoomId === roomId) setMessages(prev => [...prev, message]);
    };

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [activeFriend, userId]);

  const sendMessage = async () => {
    if (!input.trim() || !activeFriend) return;
    if (activeFriend === "bot") return sendToBot();

    const room = [userId, activeFriend].sort().join('-');
    const message = { sender: userId, to: activeFriend, text: input };
    socket.emit('send_message', { room, sender: userId, message });
    setMessages(prev => [...prev, message]);
    setInput("");

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/chat/${userId}/${activeFriend}`, { text: input }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to store message in DB:", err);
    }
  };

  const acceptRequest = async (fromUserId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/accept`,
        { from: fromUserId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchFriendData();
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const rejectRequest = async (fromUserId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/friendrequest/reject`,
        { from: fromUserId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchFriendData();
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/chat/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-white via-gray-100 to-indigo-50 font-sans">
      <header className="px-6 py-4 bg-white shadow-md flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">✨ ChatNet</h1>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r p-4 flex flex-col justify-between shadow-inner">
          <div>
            <Link to="/home" className="text-indigo-600 hover:underline mb-4 block text-sm">← Back to Home</Link>

            <section className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">👥 Friends</h3>
              {friends.length === 0 ? <p className="text-gray-500 text-sm">No friends yet</p> : friends.map(friend => (
                <div
                  key={friend._id}
                  onClick={() => setActiveFriend(friend._id)}
                  className={`cursor-pointer px-3 py-2 mb-1 rounded-lg transition-all duration-150 ${activeFriend === friend._id
                    ? 'bg-indigo-100 text-indigo-800 font-semibold shadow'
                    : 'hover:bg-gray-100'
                  }`}
                >
                  {friend.username}
                </div>
              ))}
            </section>

            <section className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">📨 Requests</h3>
              {receivedRequests.length === 0 ? <p className="text-sm text-gray-500">No requests</p> : receivedRequests.map(req => (
                <div key={req._id} className="flex justify-between items-center mb-2 bg-gray-100 p-2 rounded-lg shadow-sm">
                  <span className="text-sm">{req.username}</span>
                  <div className="flex gap-1">
                    <button onClick={() => acceptRequest(req.from)} className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">✓</button>
                    <button onClick={() => rejectRequest(req.from)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">✕</button>
                  </div>
                </div>
              ))}
            </section>

            <section>
              <input
                value={newFriendUsername}
                onChange={(e) => setNewFriendUsername(e.target.value)}
                placeholder="Add a friend"
                className="w-full mb-2 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 transition-all"
              />
              <button onClick={sendFriendRequest} className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600">Send Request</button>
              {requestStatus && <p className="mt-1 text-sm text-green-600">{requestStatus}</p>}
            </section>
          </div>

          <div className="flex justify-center mt-6">
            <img
              src="./ai_bot.png"
              alt="AI Bot"
              className={`w-16 h-16 rounded-full hover:scale-110 transition-transform cursor-pointer ${activeFriend === "bot" ? "ring-4 ring-indigo-300" : ""}`}
              onClick={() => setActiveFriend("bot")}
            />
          </div>
        </aside>
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeFriend ? (
              activeFriend === "bot" ? chat.map((msg, i) => (
                <div key={i} className={`max-w-lg ${msg.from === 'user' ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                  <p className="text-xs text-gray-500 mb-1">{msg.from === 'user' ? 'You' : 'AI'}</p>
                  <div className={`inline-block px-4 py-2 rounded-xl shadow ${msg.from === 'user' ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}>{msg.text}</div>
                </div>
              )) : messages.map((msg, i) => {
                const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                const isSent = senderId === userId;
                const name = isSent ? 'You' : (typeof msg.sender === 'object' ? msg.sender.username : friends.find(f => f._id === msg.sender)?.username || 'Friend');
                return (
                  <div key={msg._id || i} onContextMenu={(e) => {
                    e.preventDefault();
                    if (isSent && window.confirm("Delete this message?")) deleteMessage(msg._id);
                  }} className={`max-w-lg ${isSent ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                    <p className="text-xs text-gray-500 mb-1">{name}</p>
                    <div className={`inline-block px-4 py-2 rounded-xl shadow-sm ${isSent ? 'bg-indigo-500 text-white' : 'bg-white text-black border border-gray-200'}`}>
                      <div>{msg.text}</div>
                      {msg.time && <div className='text-[10px] text-gray-600 text-right mt-1'>{formatTime(msg.time)}</div>}
                    </div>
                  </div>
                );
              })
            ) : <p className="text-center text-gray-500 mt-10">Select a friend to start chatting</p>}
          </div>

          {activeFriend && (
            <div className="p-4 bg-white border-t flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all"
              />
              <button onClick={() => setShowEmojiPicker(prev => !prev)} className="text-2xl">😊</button>
              {showEmojiPicker && (
                <div className="absolute bottom-20 right-28 z-50 shadow-xl">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
              <button onClick={sendMessage} className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-all">Send</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Chat;
