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
      localStorage.setItem("token",res.token);
      setMessage("Login Successful");
      navigate("/chat");
    } else {
      setMessage(res.message || "Login failed");
    }
  };

  return (
    <div className="bg-gray-200 dark:bg-gray-900 h-screen w-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-96">
        <section className="bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto">
            <div className="w-full bg-white rounded-lg shadow-md border-2 sm:max-w-md xl:p-0 dark:bg-gray-900">
              <div className="p-6 space-y-4 sm:p-8">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                  Sign in to your account
                </h1>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Sign In
                  </button>
                </div>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Don’t have an account?{' '}
                  <a href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Sign up
                  </a>
                </p>
                {message && <p className="text-green-500 text-center">{message}</p>}
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default Login;
