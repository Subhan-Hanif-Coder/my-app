import React, { useState } from 'react'
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import { Routes,Route } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Yahan aap apna pasandeeda password rakh sakte hain
    if (passwordInput === "SubhanHaneef123@!..") {
      setIsAuthenticated(true);
    } else {
      alert("Ghalat password!");
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <form onSubmit={handleLogin} style={{ padding: '30px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h2>Admin Panel Login</h2>
          <input 
            type="password" 
            placeholder="Password enter karein" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            style={{ padding: '10px', margin: '15px 0', width: '200px', display: 'block', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', background: '#ff4c24', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer />
      <Navbar/>
      <hr />
      <div className="app-content">
        <Sidebar/>
        <Routes>
          <Route path="/add" element={<Add url="http://localhost:4000" />} />
          <Route path="/list" element={<List url="http://localhost:4000" />} />
          <Route path="/orders" element={<Orders url="http://localhost:4000" />} />
        </Routes>
      </div>
    </div>
  )
}

export default App