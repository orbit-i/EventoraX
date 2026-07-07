import { Download, RotateCcw, RotateCw } from 'lucide-react'
import '../styles/TenantTable.css'
import tenants from './tenantsData'

function TenantTable() {
  return (
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
      <table>
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
                  <h4>{tenant.orgName}</h4>
                  <p>{tenant.email}</p>
                </td>
                <td>{tenant.plan}</td>
                <td>{tenant.status}</td>
                <td>{tenant.trialEndDate}</td>
                <td>{tenant.createdAt}</td>
                <td>
                  <button>View</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

export default TenantTable