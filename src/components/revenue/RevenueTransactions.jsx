import '../styles/RevenueTransactions.css';

function RevenueTransactions() {
    return (
        <div>
        <div className='revenue-transaction-container'>
            <div className='transaction-header-container'>
                <div>
                    <p className='transaction-history-para'>Transaction History</p>
                    <p className='real-time-settlement-para'>Real-time settlement data across all methods</p>
                </div>
                <div className='transactions-btns-container'>
                    <button className='transaction-all-btn'>All</button>
                    <button className='transaction-pending-btn'>Pending</button>
                    <button className='transaction-confirmed-btn'>Confirmed</button>
                </div>
            </div>
            {/* transaction table */}
            <table className='transaction-table'>
                <thead>
                    <tr>
                        <th>ORGANIZATION</th>
                        <th>AMOUNT</th>
                        <th>DATE</th>
                        <th>METHOD</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {/* row one */}
                    <tr>
                        <td className='organization-container'>
                            <div className='organization-left-container'>
                                <p>TI</p>
                            </div>
                            <div className='organization-right-container'>
                                <p className='techInnovate-para'>TechInnovate Ltd.</p>
                                <p className='ino-para'>INo-88210</p>
                            </div>
                        </td>
                        <td className='amount-container'>
                            <p>PKR 150,000</p>
                        </td>
                        <td className='date-container'>
                            <p>AUG 24,2024</p>
                        </td>
                        <td className='method-container'>
                            <span className='active-container first-active-container'></span>
                            <p>Bank Transfer</p>
                        </td>
                        <td className='transaction-status-container'>
                            <p>Pending</p>
                        </td>
                        <td className='transaction-action-container'>
                            <select name="transaction-action" id="transaction-action">
                                <option value="Verify">Verify</option>
                                <option value="View-details">View details</option>
                            </select>
                        </td>
                    </tr>
                    {/* row two */}
                    <tr>
                        <td className='organization-container'>
                            <div className='organization-left-container'>
                                <p>GS</p>
                            </div>
                            <div className='organization-right-container'>
                                <p className='techInnovate-para'>Global Solutions.</p>
                                <p className='ino-para'>INo-88209</p>
                            </div>
                        </td>
                        <td className='amount-container'>
                            <p>PKR 45,000</p>
                        </td>
                        <td className='date-container'>
                            <p>AUG 23,2024</p>
                        </td>
                        <td className='method-container'>
                            <span className='active-container second-active-container'></span>
                            <p>Jazz Cash</p>
                        </td>
                        <td className='transaction-status-container transaction-confirmed-container'>
                            <p>Confirmed</p>
                        </td>
                        <td className='transaction-action-container'>
                            <select name="transaction-action" id="transaction-action">
                                <option value="View Receipt">View Receipt</option>
                                <option value="View-details">View details</option>
                            </select>
                        </td>
                    </tr>
                    {/* row three */}
                    <tr>
                        <td className='organization-container'>
                            <div className='organization-left-container'>
                                <p>PE</p>
                            </div>
                            <div className='organization-right-container'>
                                <p className='techInnovate-para'>Pure Eveents</p>
                                <p className='ino-para'>INo-88208</p>
                            </div>
                        </td>
                        <td className='amount-container'>
                            <p>PKR 210,000</p>
                        </td>
                        <td className='date-container'>
                            <p>AUG 23,2024</p>
                        </td>
                        <td className='method-container'>
                            <span className='active-container third-active-container'></span>
                            <p>Easy Paisa</p>
                        </td>
                        <td className='transaction-status-container transaction-rejected-container'>
                            <p>Rejected</p>
                        </td>
                        <td className='transaction-action-container'>
                            <select name="transaction-action" id="transaction-action">
                                <option value="Rejected">Rejected</option>
                                <option value="View-details">View details</option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className='transaction-footer-container'>
                <p>Showing 1-3 of 45 transactions</p>
                <div className='transaction-footer-btns-container'>
                    <button>Previous</button>
                    <button>Next</button>
                </div>
            </div>
        </div>
        <footer className='revenue-footer-container'>
        <div className='footer-left-container'>
          <p>EventoraX</p>
          <p>2024 Eventora Global.All rights reserved.</p>
        </div>
        <div className='policies-container'>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
          <a href="#">Status</a>
        </div>
      </footer>
        </div>
    )
}

export default RevenueTransactions
