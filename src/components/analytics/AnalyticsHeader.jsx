import { Bell, ChevronRight, Command, Search } from 'lucide-react'
import './AnalyticsHeader.css'


function AnalyticsHeader() {
    return (
        <div className='analytics-header'>
            <div className='analytics-header-left-content-container'>
                <p>Dashboard</p>
                <ChevronRight size={16} />
                <p>Analytics</p>
            </div>
            {/* second container */}
            <div className='analytics-header-right-content-layout-container'>
                <div className='analytics-header-right-content-container'>
                    <Search size={18} style={{ color: 'gray' }} />
                    <input type="text" placeholder='Search events,users...' />
                </div>
                <Bell size={20} />
            </div>
        </div>
    )
}

export default AnalyticsHeader
