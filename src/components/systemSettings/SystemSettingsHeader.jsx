import './SystemSettingsHeader.css'
import { Bell, Command, Search } from "lucide-react"

function SystemSettingsHeader() {
  return (
     <div className='system-settings-header'>
            <div className='system-settings-header-left-content-layout-container'>
                <div className='system-settings-header-left-content-container'>
                    <Search size={18} style={{ color: 'gray' }} />
                    <input type="text" placeholder='Search anything...' />
                    <Command size={1} style={{ color: 'gray' }} />
                </div>
                <div className='system-settings-bell-icon-container'>
                    <Bell size={16} />
                    <div className='notification-icon'></div>
                </div>
            </div>
        </div>
  )
}

export default SystemSettingsHeader
