import React, { useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Add = ({ url }) => {
  const [image, setImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad"
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", data.name)
      formData.append("description", data.description)
      formData.append("price", Number(data.price))
      formData.append("category", data.category)
      formData.append("image", image)
      
      const response = await axios.post(`${url}/api/food/add`, formData);
      if (response.data.success) {
        setData({
          name: "",
          description: "",
          price: "",
          category: "Salad"
        })
        setImage(false)
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error("Error uploading food item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='order-page-wrapper-dark add-page-dark'>
      <div className="saas-header-dark">
        <div className="saas-title-group">
          <h3>Catalog Admin: <span>Add New Dish Workspace</span></h3>
          <p>Upload high-resolution assets and configure catalog pricing</p>
        </div>
      </div>

      <div className="orders-list-dark" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form className='saas-form-box' onSubmit={onSubmitHandler}>
          
          <div className='add-img-upload flex-col'>
            <p className="form-label-dark">Upload Dish Image</p>
            <label htmlFor="image" className="image-upload-wrapper-dark">
              <img 
                src={image ? URL.createObjectURL(image) : assets.upload_area} 
                alt="Upload preview" 
                className={image ? "preview-img-active" : "upload-placeholder-img"} 
              />
              {!image && <span className="upload-text-hint">Click to browse image</span>}
            </label>
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden required />
          </div>

          <div className='add-product-name flex-col'>
            <p className="form-label-dark">Product Name</p>
            <input 
              onChange={onChangeHandler} 
              value={data.name} 
              type="text" 
              name='name' 
              placeholder='e.g., Signature Cheese Burger' 
              className="saas-input-dark"
              required 
            />
          </div>

          <div className='add-product-description flex-col'>
            <p className="form-label-dark">Product Description</p>
            <textarea 
              onChange={onChangeHandler} 
              value={data.description} 
              name="description" 
              rows="5" 
              placeholder='Write ingredients, taste profile, and details here...' 
              className="saas-textarea-dark"
              required
            ></textarea>
          </div>

          <div className='add-category-price' style={{ display: 'flex', gap: '20px', width: '100%' }}>
            <div className='add-category flex-col' style={{ flex: 1 }}>
              <p className="form-label-dark">Product Category</p>
              <select onChange={onChangeHandler} name="category" className="saas-select-dark" value={data.category}>
                <option value="Salad">Salad</option>
                <option value="Rolls">Rolls</option>
                <option value="Deserts">Deserts</option>
                <option value="Sandwich">Sandwich</option>
                <option value="Cake">Cake</option>
                <option value="Pure Veg">Pure Veg</option>
                <option value="Pasta">Pasta</option>
                <option value="Noodles">Noodles</option>
              </select>
            </div>

            <div className='add-price flex-col' style={{ flex: 1 }}>
              <p className="form-label-dark">Product Price ($)</p>
              <input 
                onChange={onChangeHandler} 
                value={data.price} 
                type="Number" 
                name='price' 
                placeholder='20' 
                className="saas-input-dark"
                required 
              />
            </div>
          </div>

          <button type='submit' className='saas-submit-btn' disabled={loading}>
            {loading ? "Adding Product..." : "🚀 Add Product to Catalog"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Add