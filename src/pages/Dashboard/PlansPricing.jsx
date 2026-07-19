import '../../components/styles/PlansPricing.css'
import { Activity, ChartLine, Check, CheckCheck, Delete, Dot, Edit, Euro, ListFilter, Plus, Star, TrendingDown, TrendingUp, View } from "lucide-react";
import SuperAdminLayout from "../../layouts/SuperAdminLayout";
import CreatePlan from "./CreatePlan"
import { useState } from 'react';

function PlansPricing() {
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  return (
    <SuperAdminLayout>
      <div className='plans-main-container'>
        <div className="plans-container">
          {/* Plan 1 */}
          <div className="plan">
            <div className="icon-container">
              <Star className="plan-star-icon" />
            </div>
            <div className='plan-content'>
              <h4>Total Plans</h4>
              <p className='total-plans'>3</p>
              <p className='plans-para'>1 Enterprise, 2 Standard</p>
            </div>
          </div>
          {/* Plan 2 */}
          <div className="plan">
            <div className="icon-container second-plan-icon-container">
              <Euro className="plan-star-icon second-plan-icon" />
            </div>
            <div className='plan-content'>
              <h4>Total Revenue (MRR)</h4>
              <p className='total-plans'>$124,800</p>
              <p className='plans-para'>+12.4% vs last month
              </p>
            </div>
          </div>
          {/* Plan 3 */}
          <div className="plan">
            <div className="icon-container third-plan-icon-container">
              <TrendingUp className="plan-star-icon third-plan-icon" />
            </div>
            <div className='plan-content'>
              <h4>Active Subscriptions</h4>
              <p className='total-plans'>847</p>
              <p className='plans-para'>638 monthly · 209 yearly</p>
            </div>
          </div>
          {/* Plan 4 */}
          <div className="plan">
            <div className="icon-container fourth-plan-icon-container">
              <TrendingDown className="plan-star-icon fourth-plan-icon" />
            </div>
            <div className='plan-content'>
              <h4>Churn Rate</h4>
              <p className='total-plans'>2.1%</p>
              <p className='plans-para'>-0.3% vs last month</p>
            </div>
          </div>
        </div>
        {/* plans second container */}
        <div className='plans-second-container'>
          <div>
            <p className='pricing-para'>Pricing Plans</p>
            <p className='configure-plans-para'>Configure plans, pricing tiers, and feature access for your platform tenants</p>
          </div>
          <div className='create-plan-btn-container'>
            <Plus className='plus-icon' />
            <button
              onClick={() => 
                 setShowCreatePlan(true)
              }
            >
              Create Plan
            </button>
          </div>
        </div>
        {/* filter plans container */}
        <div className='filter-plans-container'>
          <div className='filter-plans'>
            <div>
              <p style={{ fontWeight: 600 }}>Pricing Plans</p>
              <p style={{
                fontSize: 14,
                color: 'gray'
              }}>3 plans configured</p>
            </div>
            <div className='filters-btns-container'>
              <div className='filter-btn-container'>
                <ListFilter className='filter-icon' />
                <button>filter</button>
              </div>
              <div className='filter-btn-container export-btn-container'>
                <Activity className='filter-icon' />
                <button>Export</button>
              </div>
            </div>
          </div>
          <table className='tenant-table'>
            <thead>
              <tr>
                <th>PLAN NAME</th>
                <th>PRICE</th>
                <th>BILLING CYCLE</th>
                <th>ACTIVE TENANTS</th>
                <th>FEATURES</th>
                <th>MAX USERS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr className='plans-pricing-table-row'>
                <td>
                  <div className="plan-name-container">
                    <div className="plan-name-icon-container">
                      <Star className="plan-name-star-icon" />
                    </div>
                    <div className='plan-name-content'>
                      <h4>Startup</h4>
                      <p className='plans-name-para'>Perfect for small teams getting started</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p><span style={{ fontWeight: 600 }}>$29</span><span style={{ color: 'gray' }}>/mo</span></p>
                  <p style={{ color: 'gray' }}>$290/yr</p>
                </td>
                <td className='both-btn-container'>
                  <button className='both-btn'>Both</button>
                </td>
                <td>
                  <div className='active-tenant-container'>
                    <div className='active-tenant-outer-bar'>
                      <div className='active-tenant-inner-bar'></div>
                    </div>
                    <p>312</p>
                  </div>
                </td>
                <td className='features-data-container'>
                  <div>
                    <Check size={15} />
                  </div>
                  <div>
                    <p>8</p>
                    <p>features</p>
                  </div>
                </td>
                <td>
                  <p className='users-para'>10 users</p>
                </td>
                <td>
                  <div className='plans-pricing-status-container'>
                    <div>
                      <Dot className='plans-pricing-dot-icon' size={30} />
                    </div>
                    <div>
                      <p>Active</p>
                    </div>
                  </div>
                </td>
                <td>
                  <select className='plans-pricing-select-container' name="actions" id="actions" defaultValue="actions">
                    <option value="actions" disabled>
                      Actions
                    </option>
                    <option value="view">
                      View
                    </option>
                    <option value="edit">
                      Edit
                    </option>
                    <option value="delete">
                      Delete
                    </option>
                  </select>
                </td>
              </tr>
              <tr className='plans-pricing-table-row'>
                <td>
                  <div className="plan-name-container">
                    <div className="plan-name-icon-container plan-name-second-row-icon-container">
                      <Star className="plan-name-star-icon plan-name-second-row-star-icon" />
                    </div>
                    <div className='plan-name-content'>
                      <h4>Pro</h4>
                      <p className='plans-name-para'>For growing teams that need advan</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p><span style={{ fontWeight: 600 }}>$99</span><span style={{ color: 'gray' }}>/mo</span></p>
                  <p style={{ color: 'gray' }}>$990/yr</p>
                </td>
                <td className='both-btn-container'>
                  <button className='both-btn'>Both</button>
                </td>
                <td>
                  <div className='active-tenant-container'>
                    <div className='active-tenant-outer-bar active-tenant-outer-bar-row-two'>
                      <div className='active-tenant-inner-bar active-tenant-inner-bar-row-two'></div>
                    </div>
                    <p>487</p>
                  </div>
                </td>
                <td className='features-data-container second-row-features-data'>
                  <div>
                    <Check size={15} />
                  </div>
                  <div>
                    <p>15</p>
                    <p>features</p>
                  </div>
                </td>
                <td>
                  <p className='users-para'>50 users</p>
                </td>
                <td>
                  <div className='plans-pricing-status-container'>
                    <div>
                      <Dot className='plans-pricing-dot-icon' size={30} />
                    </div>
                    <div>
                      <p>Active</p>
                    </div>
                  </div>
                </td>
                <td>
                  <select className='plans-pricing-select-container' name="actions" id="actions" defaultValue="actions">
                    <option value="actions" disabled>
                      Actions
                    </option>
                    <option value="view">
                      View
                    </option>
                    <option value="edit">
                      Edit
                    </option>
                    <option value="delete">
                      Delete
                    </option>
                  </select>
                </td>
              </tr>
              <tr className='plans-pricing-table-row'>
                <td>
                  <div className="plan-name-container">
                    <div className="plan-name-icon-container plan-name-third-row-icon-container">
                      <Star className="plan-name-star-icon plan-name-third-row-star-icon" />
                    </div>
                    <div className='plan-name-content'>
                      <h4>Enterprise</h4>
                      <p className='plans-name-para'>Full-featured platform for large org</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p><span style={{ fontWeight: 600 }}>$399</span><span style={{ color: 'gray' }}>/mo</span></p>
                  <p style={{ color: 'gray' }}>$3990/yr</p>
                </td>
                <td className='both-btn-container'>
                  <button className='both-btn'>Both</button>
                </td>
                <td>
                  <div className='active-tenant-container'>
                    <div className='active-tenant-outer-bar'>
                      <div className='active-tenant-inner-bar active-tenant-third-row-inner-bar'></div>
                    </div>
                    <p>48</p>
                  </div>
                </td>
                <td className='features-data-container features-data-third-row-container'>
                  <div>
                    <Check size={15} />
                  </div>
                  <div>
                    <p>24</p>
                    <p>features</p>
                  </div>
                </td>
                <td>
                  <p className='users-para'>100 users</p>
                </td>
                <td>
                  <div className='plans-pricing-status-container'>
                    <div>
                      <Dot className='plans-pricing-dot-icon' size={30} />
                    </div>
                    <div>
                      <p>Active</p>
                    </div>
                  </div>
                </td>
                <td>
                  <select className='plans-pricing-select-container' name="actions" id="actions" defaultValue="actions">
                    <option value="actions" disabled>
                      Actions
                    </option>
                    <option value="view">
                      View
                    </option>
                    <option value="edit">
                      Edit
                    </option>
                    <option value="delete">
                      Delete
                    </option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* plan cards */}
        {/* card 1 */}
        <div className='plans-cards-container'>
          <p style={{
            fontWeight: 600,
            marginTop: 10
          }}>Public Pricing Preview</p>
          <div className='plans-cards'>
            <div className='card'>
              <div className="plan-name-container">
                <div className="plan-name-icon-container">
                  <Star className="plan-name-star-icon" />
                </div>
                <div className='plan-name-content'>
                  <p>Startup</p>
                </div>
              </div>
              <p><span style={
                {
                  fontWeight: 800,
                  fontSize: 24
                }}>$29</span>/month</p>
              <p style={
                {
                  fontSize: 14,
                  color: 'gray'
                }
              }>Perfect for small teams getting started with essential tools.</p>
              {/* plans list container */}
              <div className='plans-list-container'>
                {/* item 1 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>Up to 10 users</p>
                  </div>
                </div>
                {/* item 2 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>10 GB storage</p>
                  </div>
                </div>
                {/* item 3 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>Basic analytics</p>
                  </div>
                </div>
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 13,
                      color: 'gray'
                    }}>Email support</p>
                  </div>
                </div>
                <p style={{
                  fontSize: 14,
                  color: 'green'
                }}>+4 more features</p>
              </div>
              {/* active tenants */}
              <div className='active-tenants-container'>
                <p style={{
                  fontSize: 12,
                  color: 'gray'
                }}>312 active tenants</p>
                <button className='plans-pricing-edit-btn'>Edit</button>
              </div>
            </div>
            {/* card 2 */}
            <div className='card'>
              <div className="plan-name-container">
                <div className="plan-name-icon-container plan-name-second-row-icon-container">
                  <Star className="plan-name-star-icon plan-name-second-row-star-icon" />
                </div>
                <div className='plan-name-content'>
                  <p>Pro</p>
                </div>
              </div>
              <p><span style={
                {
                  fontWeight: 800,
                  fontSize: 24
                }}>$99</span>/month</p>
              <p style={
                {
                  fontSize: 14,
                  color: 'gray'
                }
              }>For growing teams that need advanced collaboration and integrations.</p>
              {/* plans list container */}
              <div className='plans-list-container'>
                {/* item 1 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container second-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>Up to 50 users</p>
                  </div>
                </div>
                {/* item 2 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container second-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>100 GB storage</p>
                  </div>
                </div>
                {/* item 3 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container second-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>Advanced analytics</p>
                  </div>
                </div>
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container second-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 13,
                      color: 'gray'
                    }}>Priority support</p>
                  </div>
                </div>
                <p style={{
                  fontSize: 14,
                  color: 'blue'
                }}>+11 more features</p>
              </div>
              {/* active tenants */}
              <div className='active-tenants-container'>
                <p style={{
                  fontSize: 12,
                  color: 'gray'
                }}>487 active tenants</p>
                <button className='plans-pricing-edit-btn'>Edit</button>
              </div>
            </div>
            {/* card 3 */}
            <div className='card'>
              <div className="plan-name-container">
                <div className="plan-name-icon-container plan-name-third-row-icon-container">
                  <Star className="plan-name-star-icon plan-name-third-row-star-icon" />
                </div>
                <div className='plan-name-content'>
                  <p>Enterprise</p>
                </div>
              </div>
              <p><span style={
                {
                  fontWeight: 800,
                  fontSize: 24
                }}>$399</span>/month</p>
              <p style={
                {
                  fontSize: 14,
                  color: 'gray'
                }
              }>Full-featured platform for large organizations with compliance needs</p>
              {/* plans list container */}
              <div className='plans-list-container'>
                {/* item 1 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container third-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>Unlimited users</p>
                  </div>
                </div>
                {/* item 2 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container third-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>1 TB storage</p>
                  </div>
                </div>
                {/* item 3 */}
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container third-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 12,
                      color: 'gray'
                    }}>Custom analytics & BI</p>
                  </div>
                </div>
                <div className='plan-list-item'>
                  <div className='plans-check-icon-container third-card-check-icon'>
                    <Check size={12} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 13,
                      color: 'gray'
                    }}>24/7 dedicated support</p>
                  </div>
                </div>
                <p style={{
                  fontSize: 14,
                  color: '#7b2cbf'
                }}>+20 more features</p>
              </div>
              {/* active tenants */}
              <div className='active-tenants-container'>
                <p style={{
                  fontSize: 12,
                  color: 'gray'
                }}>48 active tenants</p>
                <button className='plans-pricing-edit-btn'>Edit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        showCreatePlan && (
          <CreatePlan setShowCreatePlan={setShowCreatePlan} />
        )
      }
    </SuperAdminLayout>
  )
}

export default PlansPricing