import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.logo} alt="" />
          <p>Thoughtful meals, made fresh in our kitchen and delivered with care. Find a new favourite or bring back an old one.</p>
          <div className="footer-social-icons">
            <img src={assets.facebook_icon} alt="" />
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
          </div>
        </div>
        <div className="footer-content-center">
          <h2>EXPLORE</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><a href="/#explore-menu">Our menu</a></li>
            <li><a href="/#table-reservation">Book a table</a></li>
            <li><Link to="/myorders">Your orders</Link></li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>HERE TO HELP</h2>
          <ul>
            <li><a href="mailto:hello@tomato.com">hello@tomato.com</a></li>
            <li><a href="/#food-display">Browse today's menu</a></li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">© {new Date().getFullYear()} Tomato. Made with care.</p>
    </div>
  )
}

export default Footer