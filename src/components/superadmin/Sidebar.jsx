import '../styles/Sidebar.css';
import { Calendar, ChartColumnDecreasing, CircleQuestionMark, CircleStar, Download, LayoutDashboard, LogOut, Plus, Settings, Star, Stars, Users, Banknote } from 'lucide-react';
import { NavLink } from 'react-router-dom';


function Sidebar() {
  return (
    <div className='tenants-container'>
      <aside>
        <div className='sidebar-main-heading'>
          <h1>EventoraX Admin</h1>
          <p>ENTERPRISE TIER</p>
        </div>
        {/* sidebar Menu items */}
        <div className='sidebar-menu-items-container'>
          {/* item 1 */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "menu-item  active-menu-item" : "menu-item"
            }>
            <LayoutDashboard className='menu-item-icon' />
            <p>Dashboard</p>
          </NavLink>
          {/* item 2 */}
          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive ? " menu-item active-menu-item" : "menu-item"
            }>
            <Calendar className='menu-item-icon' />
            <p>Events</p>
          </NavLink>
          {/* item 3 */}
          <NavLink
            to="/tenants"
            className={({ isActive }) =>
              isActive ? "menu-item active-menu-item" : "menu-item"
            }>
            <Users className='menu-item-icon' />
            <p>Tenants</p>
          </NavLink>
          {/* item 4 */}
          <NavLink
            to="/plans-pricing"
            className={({ isActive }) =>
              isActive ? "menu-item active-menu-item" : "menu-item"
            }>
            <Star className='menu-item-icon' />
            <p>Plans & Pricing</p>
          </NavLink>
          {/* item 5 */}
          <NavLink
            to="/revenue"
            className={({ isActive }) =>
              isActive ? "menu-item active-menu-item" : "menu-item"
            }>
            <Banknote className='menu-item-icon' />
            <p>Revenue</p>
          </NavLink>
          {/* item 6 */}
          <NavLink
            to="/certificates"
            className={({ isActive }) =>
              isActive ? "menu-item active-menu-item" : "menu-item"
            }>
            <CircleStar className='menu-item-icon' />
            <p>Certificates</p>
          </NavLink>
          {/* item 7 */}
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? "menu-item active-menu-item" : "menu-item"
            }>
            <ChartColumnDecreasing className='menu-item-icon' />
            <p>Analytics</p>
          </NavLink>
          {/* item 8 */}
          <NavLink
            to="/settings"
            className={( { isActive } ) =>
              isActive ? "menu-item active-menu-item" : "menu-item"
            }>
            <Settings className='menu-item-icon' />
            <p>Settings</p>
          </NavLink>
          {/* item 9 */}
          <div className='menu-item'>
            <Plus className='menu-item-icon' />
            <p>Add Tenant</p>
          </div>
          {/* item 10 */}
          <div className='menu-item'>
            <CircleQuestionMark className='menu-item-icon' />
            <p>Support</p>
          </div>
          {/* item 11 */}
          <div className='menu-item'>
            <LogOut className='menu-item-icon' />
            <p>Sign Out</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default Sidebar