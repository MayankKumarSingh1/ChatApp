import React, { useState } from 'react';
import { registerUser } from '../api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", number: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await registerUser(formData);

    if (res.status === 200 || res.status === 201) {
      const userData = res.data;
      localStorage.setItem("user", JSON.stringify(userData.user || {}));
      localStorage.setItem("token", userData.token || "");
      navigate('/chat');
    } else {
      setMessage(res.error || "Registration failed");
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-blue-950 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Create Account</h2>

        {["username", "email", "password", "number"].map((field, idx) => (
          <div className="mb-4" key={idx}>
            <label htmlFor={field} className="block mb-1 text-sm font-medium text-gray-300 capitalize">
              {field === "number" ? "Mobile Number" : field}
            </label>
            <input
              type={field === "email" ? "email" : field === "password" ? "password" : "text"}
              name={field}
              id={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={`Enter your ${field}`}
              className="bg-slate-800 border border-slate-600 text-white text-sm rounded-md block w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-2.5 rounded-md transition duration-300"
        >
          Register
        </button>

        {message && (
          <p className="text-center mt-4 text-sm text-red-400">
            {message}
          </p>
        )}

        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-400 hover:underline font-medium">Login here</a>
        </p>
      </form>
    </div>
  );
};

export default Register;
