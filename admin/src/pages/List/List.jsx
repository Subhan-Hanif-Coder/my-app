import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios';
import { toast } from 'react-toastify';

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Price editing state
  const [editingId, setEditingId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setList(response.data.data.reverse());
      } else {
        toast.error("Failed to fetch food items");
      }
    } catch (error) {
      toast.error("Server connection error");
    } finally {
      setLoading(false);
    }
  }

  const removeFood = async (foodId) => {
    const item = list.find((entry) => entry._id === foodId);
    if (!window.confirm(`Remove ${item?.name || "this dish"} from the menu? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error("Error deleting item");
      }
    } catch (error) {
      toast.error("Error deleting item");
    }
  }

  const updatePriceHandler = async (foodId) => {
    if (!newPrice || isNaN(newPrice)) {
      toast.error("Please enter a valid price");
      return;
    }
    
    try {
      const response = await axios.post(`${url}/api/food/update`, { 
        id: foodId, 
        price: Number(newPrice) 
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setEditingId(null);
        await fetchList(); // Refreshes the list from backend database
      } else {
        toast.error("Failed to update price");
      }
    } catch (error) {
      toast.error("Server connection error");
    }
  }

  useEffect(() => {
    fetchList();
  }, [])

  // Calculations for stats
  const totalItems = list.length;
  const avgPrice = totalItems > 0 ? (list.reduce((acc, item) => acc + item.price, 0) / totalItems).toFixed(2) : 0;

  const categories = ['All', ...new Set(list.map((item) => item.category).filter(Boolean))];

  const filteredList = list.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="order-loading-dark">
        <div className="spinner-dark"></div>
        <p>Loading inventory database...</p>
      </div>
    );
  }

  return (
    <div className='order-page-wrapper-dark list-page-light'>
      <div className="saas-header-dark">
        <div className="saas-title-group">
          <h3>Inventory Admin: <span>Food Catalog Workspace</span></h3>
          <p>Real-time inventory stream and price controls</p>
        </div>
        <button className="saas-btn-sync" onClick={fetchList}>🔄 Sync Inventory</button>
      </div>

      {/* Stats Summary Widgets */}
      <div className="analytics-grid-dark">
        <div className="widget-box-dark">
          <div className="widget-head">
            <span>Catalog Overview</span>
            <span className="live-dot"></span>
          </div>
          <div className="metric-flex">
            <div>
              <p className="metric-title">Total Active Dishes</p>
              <h2 className="metric-value text-emerald-glow">{totalItems} Items</h2>
            </div>
            <div>
              <p className="metric-title">Average Item Price</p>
              <h2 className="metric-value text-cyan-glow">${avgPrice}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="toolbar-box-dark" style={{ flexDirection: 'column', gap: '15px', alignItems: 'stretch' }}>
        <div className="search-input-wrap" style={{ width: '100%' }}>
          <input 
            type="text" 
            placeholder="🔍 Search food name or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs-dark" style={{ overflowX: 'auto', paddingBottom: '5px' }}>
          {categories.map((cat, idx) => (
            <button 
              key={idx} 
              className={`ft-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-list-dark">
        <div className="list-table-header-dark">
          <span>Image</span>
          <span>Dish Name & ID</span>
          <span>Category</span>
          <span>Price & Edit</span>
          <span>Action</span>
        </div>

        {filteredList.length === 0 ? (
          <div className="no-records-dark">
            <p>No food items found matching your criteria.</p>
          </div>
        ) : (
          filteredList.map((item, index) => (
            <div key={index} className='list-row-grid'>
              
              <div className="row-col-img">
                <img src={`${url}/images/` + item.image} alt={item.name} className="food-thumb-dark" />
              </div>

              <div className="row-col-main">
                <p className='customer-text' style={{ fontSize: '15px', fontWeight: '600', color: '#263747' }}>{item.name}</p>
                <span className="row-hash-tag">ID: #{item._id.slice(-5).toUpperCase()}</span>
              </div>

              <div className="row-col-category">
                <span className="food-pill-dark">{item.category}</span>
              </div>

              <div className="row-col-bill">
                {editingId === item._id ? (
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <input 
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newPrice} 
                      onChange={(e) => setNewPrice(e.target.value)} 
                      style={{ width: '70px', padding: '4px', background: '#0b0f19', border: '1px solid #38bdf8', color: '#fff', borderRadius: '4px' }}
                      placeholder={item.price}
                    />
                    <button onClick={() => updatePriceHandler(item._id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>X</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <p className="bill-val text-emerald-glow" style={{ fontSize: '16px', fontWeight: '700' }}>${item.price.toFixed(2)}</p>
                    <button 
                      onClick={() => { setEditingId(item._id); setNewPrice(String(item.price)); }}
                      style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      ✏️️ Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="row-col-action">
                <button 
                  className="saas-delete-btn" 
                  onClick={() => removeFood(item._id)}
                  title="Delete Item"
                >
                  🗑️ Remove
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default List