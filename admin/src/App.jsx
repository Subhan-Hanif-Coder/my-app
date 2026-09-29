import React from 'react'
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import { Routes,Route } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const App = () => {
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