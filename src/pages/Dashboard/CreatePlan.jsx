import { Cross, DollarSign, Plus, X } from 'lucide-react'
import '../../components/styles/CreatePlan.css'
import { useState } from 'react'

function CreatePlan({ setShowCreatePlan }) {

  const [selectedTier, setSelectedTier] = useState("startup");

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
          <div>
            <div>
              <label htmlFor="">Monthly Price *</label>
              <div className='number-input-container'>
                <DollarSign />
                <input type="number" placeholder='0' />
              </div>
            </div>
            <div>
              <label htmlFor="">Yearly Price *</label>
              <div className='number-input-container'>
                <DollarSign />
                <input type="number" placeholder='0' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePlan