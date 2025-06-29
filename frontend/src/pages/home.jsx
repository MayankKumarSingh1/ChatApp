import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        jwtDecode(token);
        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleChatClick = () => {
    if (isLoggedIn) {
      navigate('/chat');
    } else {
      alert('Please login first to enter chat.');
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen text-white">
      <img
        src="./ChatApp.webp"
        alt="Chat App"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />

      <div className="absolute inset-0 bg-black opacity-40 -z-10" />

      <header className="w-full flex justify-between items-center px-8 py-6">
        <h1 className="text-2xl font-bold">ChatNet 💬</h1>
        <div className="flex space-x-6 text-lg">
          <button
            onClick={handleChatClick}
            className={`p-2 rounded hover:bg-pink-600 transition ${
              isLoggedIn ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            {isLoggedIn ? 'Enter Chat' : 'Login to Chat'}
          </button>
          <a href="/register" className="hover:bg-pink-600 p-2 rounded transition">
            Register
          </a>
          <a href="/login" className="hover:bg-pink-600 p-2 rounded transition">
            Login
          </a>
        </div>
      </header>
    </div>
  );
}

export default Home;
