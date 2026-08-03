import './EmailHeader.css'
import { Bell, Command, Search } from "lucide-react"


function EmailHeader() {
    return (
        <div className='email-header'>
            <div className='email-header-left-content-layout-container'>
                <div className='email-header-left-content-container'>
                    <Search size={18} style={{ color: 'gray' }} />
                    <input type="text" placeholder='Search anything...' />
                    <Command size={1} style={{ color: 'gray' }} />
                </div>
                <div className='email-bell-icon-container'>
                    <Bell size={16} />
                    <div className='notification-icon'></div>
                </div>
            </div>
        </div>
    )
}

export default EmailHeader
