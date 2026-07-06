import { Search } from 'lucide-react';
import '../styles/Header.css';

function Header() {
  return (
    <header>
      <div className='header-container'>
        {/* first div */}
        <div className='header-upper-left-container'>
          <span className='header-left-span'>Tenant Ecosystem</span> | <span className='header-right-span'>Superadmin control panel</span>
        </div>
        {/* second div */}
        <div className='header-upper-right-main-container'>
          <div className='header-upper-right-container'>
            <Search className='search-icon' />
            <input type="email" placeholder='Search org name or email' />
          </div>
          <div>
            <p>SA</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header