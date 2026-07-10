import { Delete, Download, Edit, Eye, RotateCcw, RotateCw, User, View } from 'lucide-react'
import '../styles/TenantTable.css'
import tenants from './tenantsData'
import { FaEye, FaEdit, FaTrash, FaUser, FaPen, FaPenSquare } from "react-icons/fa"

function TenantTable() {
  return (
    <div>
      <div className='tenant-table-container'>
        <div className='plan-options-container'>
          <div className='filter-group first-filter-group'>
            <label htmlFor="Plan">Plan:</label>
            <select name="Plan" id="Plan">
              <option value="All">All</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Pro">Pro</option>
              <option value="Startup">Startup</option>
              <option value="Trial">Trial</option>
            </select>
          </div>
          <div className='filter-group'>
            <label htmlFor="Status">Status:</label>
            <select name="Status" id="Status">
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
              <option value="Suspended">Suspended</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div className='tenants-count-container'>
            <p>| Showing 1 to 10 of 1,284 tenants</p>
          </div>
          <div className='tenants-icons-container'>
            <div>
              <Download className='tenants-download-icon' />
            </div>
            <div>
              <RotateCw className='rotate-cw-icon' />
            </div>
          </div>
        </div>
        {/* second line */}
        <table className='tenant-table'>
          <thead>
            <tr>
              <th>ORG NAME</th>
              <th>PLAN</th>
              <th>STATUS</th>
              <th>TRIAL END DATE</th>
              <th>DATE CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <div className='org-info-container'>
                    <img src={tenant.logo} alt={tenant.orgName} className='org-logo' />
                    <div className='org-text-container'>
                      <h4 className='org-name'>{tenant.orgName}</h4>
                      <p className='org-email'>{tenant.email}</p>
                    </div>
                  </div>
                </td>
                <td>{tenant.plan}</td>
                <td>{tenant.status}</td>
                <td>{tenant.trialEndDate}</td>
                <td>{tenant.createdAt}</td>
                <td className="actions">
                  <button>
                    <FaEye color='#3b82f6' />
                  </button>
                  <button>
                    <FaPen color='#10b981' />
                  </button>
                  <button>
                    <FaUser color='#8b5cf6' />
                  </button>
                  <button>
                    <FaTrash color='#ef4444' />
                  </button>
                </td>
              </tr>
            ))
            }
            <div className='pagination-container'>
              <button className='previous-btn'>Previous</button>
              <div>
                <p><span className='first-page'>1</span> 2 3 ...128</p>
              </div>
              <button className='next-btn'>Next</button>
            </div>
          </tbody>
        </table>

      </div>
      <footer>
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

export default TenantTable