import { Clock, Download, File, FileText, Info, RotateCcw, Search, ShieldCheck, Upload } from 'lucide-react'
import SuperAdminLayout from '../../layouts/SuperAdminLayout'
import './Certificates.css'
import CertificatesHeader from './CertificatesHeader'

function Certificates() {
    return (
        <SuperAdminLayout certificateHeader={<CertificatesHeader />}>
            <div className='main-layout-container'>
                <div className='certificates-main-upper-content-container'>
                    <div>
                        <p className='upper-content-certificates-para'>Certificates</p>
                        <p style={{
                            color: 'gray',
                            fontSize: 14
                        }}>Manage and audi SSL/TLS,code signig and client authentication certificates across the infrastructure.</p>
                    </div>
                    <div className='export-infrastructure-btns-container'>
                        <button className='export-report-btn-container'>
                            <Download size={18} />
                            <p>Export Report</p>
                        </button>
                        <button className='re-scan-btn-container'>
                            <RotateCcw size={16} />
                            <p>Re-scan Infrastructure</p>
                        </button>
                    </div>
                </div>
                <div className='certificates-credentials-container'>
                    {/* first certificate container */}
                    <div className='certificates-credentials'>
                        <div className='shield-check-container'>
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <p className='total-active-para'>Total Active</p>
                            <p className='certificates-number-para'>1,248</p>
                        </div>
                    </div>
                    {/* second certificate container */}
                    <div className='certificates-credentials'>
                        <div className='shield-check-container certificates-second-credential-shield-icon-container'>
                            <Clock size={22} />
                        </div>
                        <div>
                            <p className='total-active-para'>Expiring Soon</p>
                            <p className='certificates-number-para'>12</p>
                        </div>
                    </div>
                    {/* three certificate container */}
                    <div className='certificates-credentials'>
                        <div className='shield-check-container certificates-third-credential-shield-icon-container'>
                            <Info size={22} />
                        </div>
                        <div>
                            <p className='total-active-para'>Expired</p>
                            <p className='certificates-number-para'>4</p>
                        </div>
                    </div>
                    {/* fourth certificate container */}
                    <div className='certificates-credentials'>
                        <div className='shield-check-container certificates-fourth-credential-shield-icon-container'>
                            <RotateCcw size={22} />
                        </div>
                        <div>
                            <p className='total-active-para'>Revoked(30d)</p>
                            <p className='certificates-number-para'>28</p>
                        </div>
                    </div>
                </div>
                {/* table container */}
                <div className='certificates-main-table-container'>
                    <div className='certificates-table-upper-section'>
                        <div className='certificates-table-upper-left-section-container'>
                            <Search size={16} style={{ color: 'gray' }} />
                            <input type="text" placeholder='Search by name or serial...' />
                        </div>
                        <div className='certificates-table-upper-left-bottom-section-container'>
                            <select name="certificate-status" id="certificate-status">
                                <option value="Active">Active</option>
                                <option value="Expiring">Expiring</option>
                                <option value="Expired">Expired</option>
                                <option value="Revoked">Revoked</option>
                            </select>
                        </div>
                        <div className='certificates-table-upper-right-section-container'>
                            <p>Showing 5 of 5 results</p>
                            <FileText size={15} />
                        </div>
                    </div>
                    <table className='certificate-table'>
                        <thead>
                            <tr>
                                <th>COMMON NAME/SUBJECT</th>
                                <th>TYPE</th>
                                <th>ISSUER</th>
                                <th>SERIAL NUMBER</th>
                                <th>STATUS</th>
                                <th>EXPIRATION DATE</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </SuperAdminLayout>
    )
}

export default Certificates
