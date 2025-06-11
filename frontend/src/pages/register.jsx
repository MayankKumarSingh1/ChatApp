import React, { useState } from 'react';
import { registerUser } from '../api';
import { useNavigate } from 'react-router-dom';
const Register = () => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "",number:"" });
    const [message, setMessage] = useState("");
    const navigate  = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

        const res = await registerUser(formData);

        if (res.status ===200 || res.status ===201) {
            
        const userData = res.data;

        localStorage.setItem("user", JSON.stringify(userData.user || {}));
        localStorage.setItem("token", userData.token || "");
            navigate('/chat');
        } else if (res.error){
            setMessage(res.error);
        }
        else{
            setMessage("Registration failed")
        }
};


    return (
        <div className="bg-gray-200 dark:bg-gray-900 h-screen w-screen flex items-center justify-center">
            <form onSubmit={handleSubmit} className="w-96">
                <section className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-700">
                    <div className="flex flex-col items-center justify-center px-6 py-6 mx-auto">
                        <div className="w-full bg-white rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-700 sm:max-w-md xl:p-0 dark:bg-gray-900">
                            <div className="p-6 space-y-4 sm:p-8">
                                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                                    Create an account
                                </h1>
                            
                                    <div>
                                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                                        <input 
                                            type="text" 
                                            name="username" 
                                            id="username" 
                                            value={formData.username} 
                                            onChange={handleChange} 
                                            className="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                            placeholder="Username" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            id="email" 
                                            value={formData.email} 
                                            onChange={handleChange} 
                                            className="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                            placeholder="Email" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                        <input 
                                            type="password" 
                                            name="password" 
                                            id="password" 
                                            value={formData.password} 
                                            onChange={handleChange} 
                                            placeholder="••••••••" 
                                            className="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="number" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Mobile Number</label>
                                        <input 
                                            type="text" 
                                            name="number" 
                                            id="number" 
                                              value={formData.number} 
                                            onChange={handleChange} 
                                            placeholder="Mobile Number" 
                                            className="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                            required 
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400">
                                            Register
                                        </button>
                                        {message && (
    <p className="text-center mt-2 text-sm text-red-600 dark:text-red-400">
        {message}
    </p>
)}

                                    </div>
                                    <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                                        Already have an account? <a href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">Login here</a>
                                    </p>
                            
                            </div>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
};

export default Register;
