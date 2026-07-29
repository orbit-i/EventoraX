import { Bell, ChevronRight, Command, Search } from 'lucide-react'
import './CertificatesHeader.css'

function CertificatesHeader() {
    return (
        <div className='certificates-header'>
            <div className='certificates-header-left-content-container'>
                <p>Infrastructure</p>
                <ChevronRight size={16} />
                <p>Certificates</p>
                <ChevronRight size={16} />
                <p className='manager-para'>Manager</p>
            </div>
            {/* second container */}
            <div className='certificates-header-right-content-layout-container'>
                <div className='certificates-header-right-content-container'>
                    <Search size={18} style={{ color: 'gray' }} />
                    <input type="text" placeholder='Search System...' />
                    <Command size={18} style={{ color: 'gray' }} />
                </div>
                <Bell size={20} />
            </div>
        </div>
    )
}

export default CertificatesHeader
