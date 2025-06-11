import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from  "react-router-dom";
import Home from "./pages/home"
import Register from "./pages/register"
import Login from "./pages/login"
import Chat from "./pages/chat"


function App(){
   const [user, setUser] = useState(null);
  return (
    <Router>
      <Routes>

      <Route path="/home" element={<Home />} />

      <Route path="/register" element={<Register />} />

      <Route path="/chat" element={<Chat />} />

       <Route path="/login" element={<Login />} />

      </Routes>
    </Router>

  );


}

export default App