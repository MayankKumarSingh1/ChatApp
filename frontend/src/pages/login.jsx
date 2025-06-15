import React, { useState } from 'react';
import { loginUser } from '../api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await loginUser(formData);

    if (res.success && res.token) {
      localStorage.setItem("token", res.token);
      setMessage("Login Successful");
      navigate("/chat");
    } else {
      setMessage(res.message || "Login failed");
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-blue-950 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Welcome Back</h2>

        <div className="mb-4">
          <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-300">Username</label>
          <input
            type="text"
            name="username"
            id="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-md block w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-300">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-md block w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-2.5 rounded-md transition duration-300"
        >
          Sign In
        </button>

        {message && (
          <p className="text-center mt-4 text-sm text-red-400">
            {message}
          </p>
        )}

        <p className="mt-4 text-center text-sm text-gray-400">
          Don’t have an account?{" "}
          <a href="/register" className="text-indigo-400 hover:underline font-medium">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
