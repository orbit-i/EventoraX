import '../styles/Sidebar.css';
import { Calendar, ChartColumnDecreasing, CircleQuestionMark, CircleStar, Download, LayoutDashboard, LogOut, Plus, Settings, Users } from 'lucide-react';

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
          <div className='menu-item'>
            <LayoutDashboard className='menu-item-icon' />
            <p>Dashboard</p>
          </div>
          {/* item 2 */}
          <div className='menu-item'>
            <Calendar className='menu-item-icon' />
            <p>Events</p>
          </div>
          {/* item 3 */}
          <div className='menu-item'>
            <Users className='menu-item-icon' />
            <p>Tenants</p>
          </div>
          {/* item 4 */}
          <div className='menu-item'>
            <CircleStar className='menu-item-icon' />
            <p>Certificates</p>
          </div>
          {/* item 5 */}
          <div className='menu-item'>
            <ChartColumnDecreasing className='menu-item-icon' />
            <p>Analytics</p>
          </div>
          {/* item 6 */}
          <div className='menu-item'>
            <Settings className='menu-item-icon' />
            <p>Settings</p>
          </div>
          {/* item 7 */}
          <div className='menu-item'>
            <Plus className='menu-item-icon' />
            <p>Add Tenant</p>
          </div>
          {/* item 8 */}
          <div className='menu-item'>
            <CircleQuestionMark className='menu-item-icon' />
            <p>Support</p>
          </div>
          {/* item 9 */}
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