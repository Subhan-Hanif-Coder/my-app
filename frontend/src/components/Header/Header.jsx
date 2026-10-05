import React from 'react'
import  "./Header.css"
const Header = () => {
  return (
    <div className='header'>
     <div className="header-contents">
        <span className="header-eyebrow"><span /> FRESHLY MADE, RIGHT TO YOU</span>
        <h2>Good food.<br />Good mood.</h2>
        <p>Discover your next favourite from our kitchen. Made fresh, packed with care, and delivered to your door.</p>
        <a className="header-cta" href="#food-display">
          Explore the menu <span aria-hidden="true">↗</span>
        </a>
        <div className="header-promise">
          <span><b>✦</b> Fresh ingredients</span>
          <span><b>◷</b> Fast delivery</span>
        </div>
     </div>
    </div>
  )
}

export default Header