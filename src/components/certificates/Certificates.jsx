import { Check, ChevronLeft, ChevronRight, CircleCheck, Clock, Download, File, FileText, Info, RotateCcw, Search, ShieldAlert, ShieldCheck, Upload } from 'lucide-react'
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
                        <tbody>
                            {/* row 1 */}
                            <tr>
                                <td>
                                    <p>api.production.nexus.io</p>
                                    <p>ID : 1</p>
                                </td>
                                <td>
                                    <p>SSL/TLS</p>
                                </td>
                                <td>
                                    <p>DigiCert High Assurance</p>
                                </td>
                                <td>
                                    <p>0A:45:9B:21:F0</p>
                                </td>
                                <td className='certificate-status-data-container'>
                                    <div className='certificate-active-status-container'>
                                        <CircleCheck size={12} />
                                    <p>Active</p>
                                    </div>
                                </td>
                                <td>
                                    <p>2025-12-14</p>
                                </td>
                            </tr>
                            {/* row 2 */}
                            <tr>
                                <td>
                                    <p>auth.service.client-01</p>
                                    <p>ID : 2</p>
                                </td>
                                <td>
                                    <p>Client Auth</p>
                                </td>
                                <td>
                                    <p>Internal Root CA</p>
                                </td>
                                <td>
                                    <p>4C:32:88:AA:11</p>
                                </td>
                                <td className='certificate-status-data-container'>
                                    <div className='certificate-active-status-container'>
                                        <CircleCheck size={12} />
                                    <p>Active</p>
                                    </div>
                                </td>
                                <td>
                                    <p>2026-01-20</p>
                                </td>
                            </tr>
                            {/* row 3 */}
                            <tr>
                                <td>
                                    <p>gateway.nexus.internal</p>
                                    <p>ID : 3</p>
                                </td>
                                <td>
                                    <p>SSL/TLS</p>
                                </td>
                                <td>
                                    <p>Let's encrypt E1</p>
                                </td>
                                <td>
                                    <p>FE:90:11:BC:DD</p>
                                </td>
                                <td className='certificate-status-data-container'>
                                    <div className='certificate-expiring-status-container'>
                                        <Clock size={12} />
                                    <p>Expiring</p>
                                    </div>
                                </td>
                                <td>
                                    <p>2024-05-15</p>
                                </td>
                            </tr>
                            {/* row 4 */}
                            <tr>
                                <td>
                                    <p>nexus-app-v2.exe</p>
                                    <p>ID : 4</p>
                                </td>
                                <td>
                                    <p>Code Signing</p>
                                </td>
                                <td>
                                    <p>Sectigo Public CA</p>
                                </td>
                                <td>
                                    <p>11:22:33:44:55</p>
                                </td>
                                <td className='certificate-status-data-container'>
                                    <div className='certificate-expired-icon-container'>
                                        <Info size={12} />
                                    <p>Expired</p>
                                    </div>
                                </td>
                                <td>
                                    <p>2023-11-02</p>
                                </td>
                            </tr>
                            {/* row 5 */}
                            <tr>
                                <td>
                                    <p>legacy-portal.nexus.io</p>
                                    <p>ID : 5</p>
                                </td>
                                <td>
                                    <p>SSL/TLS</p>
                                </td>
                                <td>
                                    <p>Internal Root CA</p>
                                </td>
                                <td>
                                    <p>99:88:77:66:55</p>
                                </td>
                                <td className='certificate-status-data-container'>
                                    <div className='certificate-rotate-ccw-icon-container'>
                                        <RotateCcw size={12} />
                                    <p>Revoked</p>
                                    </div>
                                </td>
                                <td>
                                    <p>2024-08-30</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className='certificates-table-lower-section'>
                        <p style={{ color: 'gray'}}>Showing page 1 of 1</p>
                        <div className='certificates-table-lower-right-section'>
                            <div className='certificates-table-chevron-icon-container'>
                                <ChevronLeft size={16} />
                            </div>
                            <p className='page-number-container'>1</p>
                            <div className='certificates-table-chevron-icon-container'>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>
                {/* policy enforcement warning container */}
                <div className='policy-enforcement-container'>
                    <div className='policy-enforcement-shield-icon-container'>
                        <ShieldAlert />
                    </div>
                    <div className='policy-enforcement-content-container'>
                        <p>Policy Enforcement Warning</p>
                        <p>Per the Enterprise Security Mandate (v4.2), all self-signed internal certificates must be rotated every 90 days. Certificates marked as <span>Expiring</span> will automatically trigger a ticket in the System Opeartions queue if not manually rotated within 14 days of expiration.</p>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    )
}

export default Certificates
