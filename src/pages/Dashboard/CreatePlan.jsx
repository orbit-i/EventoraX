import { Cross, DollarSign, Plus, X } from 'lucide-react'
import '../../components/styles/CreatePlan.css'
import { useState } from 'react'

function CreatePlan({ setShowCreatePlan }) {

  const [selectedTier, setSelectedTier] = useState("startup");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [markUnlimited, setMarkUnlimited] = useState(false);

  return (
    <div className="create-plan-overlay-container">
      <div className="create-plan-container">
        <div className='create-plan-header'>
          <div className='create-plan-left-header-container'>
            <div className='create-plan-plus-icon-container'>
              <Plus className='create-plan-plus-icon' />
            </div>
            <div>
              <p style={{
                fontWeight: 600,
                fontSize: 15
              }}>Create new plan</p>
              <p style={{
                color: 'gray',
                fontSize: 13
              }}>Configure a new pricing tier</p>
            </div>
          </div>
          <div
            onClick={() =>
              setShowCreatePlan(false)
            }
            className='x-container'>
            <X className='x-icon' />
          </div>
        </div>
        <div className='plan-detail-container'>
          <div className='plan-name-container'>
            <label className='plan-name-label' htmlFor="plan-name">Plan Name <span style={{
              color: 'red'
            }}>*</span></label>
            <input type="text" name='plan-name' placeholder='e.g. Professional' />
          </div>
          {/* plan tier container */}
          <div className='plan-tier-container'>
            <p className='plan-tier-name'>Plan Tier</p>
            <div className='plan-tiers-btns'>
              <button
                className={
                  selectedTier === "startup" ? "startup-active" : ""
                }
                onClick={() =>
                  setSelectedTier("startup")
                }
              >Startup</button>
              <button
                className={
                  selectedTier === "pro" ? "pro-active" : ""
                }
                onClick={() =>
                  setSelectedTier("pro")
                }
              >Pro</button>
              <button
                className={
                  selectedTier === "enterprise" ? "enterprise-active" : ""
                }
                onClick={() =>
                  setSelectedTier("enterprise")
                }
              >Enterprise</button>
            </div>
          </div>
          {/* monthly, yearly price */}
          <div className='monthly-yearly-price-container'>
            <div>
              <label htmlFor="number"><span style={{
                color: 'gray',
                fontSize: 15
              }}>Monthly Price</span> <span style={{ color: 'red' }}>*</span></label>
              <div className='number-input-container'>
                <DollarSign className='dollar-sign-icon' size={16} />
                <input type="number" name='number' placeholder='0' />
              </div>
            </div>
            <div>
              <label htmlFor="number"><span style={{
                color: 'gray',
                fontSize: 15
              }}>Yearly Price</span> <span style={{ color: 'red' }}>*</span></label>
              <div className='number-input-container'>
                <DollarSign className='dollar-sign-icon' size={16} />
                <input type="number" name='number' placeholder='0' />
              </div>
            </div>
          </div>
          {/* Billing cycle container */}
          <div className='billing-cycle-container'>
            <p>Billing Cycle</p>
            <div className='billing-cycle-btns-container'>
              <button
                className={billingCycle === "monthly" ? "monthly-btn" : ""}
                onClick={() =>
                  setBillingCycle("monthly")
                }
              >Monthly</button>
              <button
                className={billingCycle === "yearly" ? "yearly-btn" : ""}
                onClick={() =>
                  setBillingCycle("yearly")
                }
              >Yearly</button>
              <button
                className={billingCycle === "both" ? "both-btn" : ""}
                onClick={() =>
                  setBillingCycle("both")
                }
              >Both</button>
            </div>
          </div>
          {/* description container */}
          <div className='description-container'>
            <p><span className='description-para'>Description</span> <span style={{ color: 'red' }}>*</span></p>
            <textarea name="description" id="description" placeholder='Brief description of this plan and its ideal use case...'>
            </textarea>
          </div>
          {/* feature container */}
          <div className='features-container'>
            <p className='features-list-para'>Features List</p>
            <p className='feature-line-para'>One feature per line</p>
            <textarea name="features-list" id="features-list" cols="30" rows="5" placeholder={"Up to 10 users\n10 GB storage\nAPI access\nEmail support"}>
            </textarea>
          </div>
          {/* max users storage limit container */}
          <div className='max-users-storage-limit-container'>
            <div className='max-users-container'>
              <p className='max-users-para'>Max Users</p>
              <input type="number" placeholder='e.g. 50' />
            </div>
            <div className='storage-limit-container'>
              <p className='storage-limit-para'>Storage Limit <span style={{ color: 'red' }}>*</span></p>
              <input type="text" placeholder='e.g. 100 GB' />
            </div>
          </div>
          {/* toggle container */}
          <div className='unlimited-container'>
            <button
              className={`toggle-switch ${isUnlimited ? "toggle-on" : ""}`}
              onClick={() =>
                setIsUnlimited(!isUnlimited)
              }
            >
              <span className='toggle-circle'></span>
            </button>
            <p className='unlimited-para'>Unlimited</p>
          </div>
          {/* status container */}
          <div className='status-container'>
            <p className='status-para'>Status</p>
            <div className='status-btns-container'>
              <button
                className={
                  selectedStatus === "active" ? "active-btn" : ""
                }
                onClick={() =>
                  setSelectedStatus("active")
                }
              >Active</button>
              <button
                className={
                  selectedStatus === "inactive" ? "inactive-btn" : ""
                }
                onClick={() =>
                  setSelectedStatus("inactive")
                }
              >Inactive</button>
              <button
                className={
                  selectedStatus === "draft" ? "draft-btn" : ""
                }
                onClick={() =>
                  setSelectedStatus("draft")
                }
              >Draft</button>
            </div>
          </div>
          {/* mark as popular */}
          <div className='mark-as-popular-container'>
            <div>
              <p className='mark-as-popular-para'>Mark as Popular</p>
              <p className='shows-popular-para'>Shows a "POPULAR" badge on this plan</p>
            </div>
            {/* toggle container */}
          <div className='mark-as-popular-unlimited-container'>
            <button
              className={`mark-toggle-switch ${markUnlimited ? "mark-toggle-on" : ""}`}
              onClick={() =>
                setMarkUnlimited(!markUnlimited)
              }
            >
              <span className='mark-toggle-circle'></span>
            </button>
          </div>
          </div>
          {/* cancel save plan btns */}
          <div className='cancel-save-plan-btns-container'>
            <button className='cancel-btn'>Cancel</button>
            <button className='save-plan-btn'>Save Plan</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePlan