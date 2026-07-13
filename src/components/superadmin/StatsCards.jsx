import { Boxes, Sparkle, Sparkles, Timer, BanknoteArrowUp } from 'lucide-react'
import '../styles/StatsCards.css'
import TenantTable from './TenantTable'

function StatsCards({ showModal, setShowModal, selectedTenant, setSelectedTenant }) {
  return (
    <main>
      <div className='stats-cards-container'>
        {/* first card */}
        <div className='stats-card'>
          <div className='stats-card-upper-container'>
            <div className='stats-box-icon-container'>
              <Boxes />
            </div>
            <div className='stats-para-container'>
              <p>+12% vs last month</p>
            </div>
          </div>
          <div>Total tenants</div>
          <div className='total-tenants'>
            <h1>1,284</h1>
          </div>
        </div>
        {/* second card */}
        <div className='stats-card'>
          <div className='stats-card-upper-container'>
            <div className='stats-box-icon-container sparkle-icon-container'>
              <Sparkle className='sparkle-icon' />
            </div>
            <div className='stats-para-container stats-retention-para'>
              <p>84% Retention</p>
            </div>
          </div>
          <div>
            <p>Enterprise Plans</p>
          </div>
          <div className='total-tenants'>
            <h1>312</h1>
          </div>
        </div>
        {/* third card */}
        <div className='stats-card'>
          <div className='stats-card-upper-container'>
            <div className='stats-box-icon-container timer-icon-container'>
              <Timer className='timer-icon' />
            </div>
            <div className='stats-para-container stats-expiring-para'>
              <p>48 Expiring soon</p>
            </div>
          </div>
          <div>Active Trials</div>
          <div className='total-tenants'>
            <h1>156</h1>
          </div>
        </div>
        {/* fourth card */}
        <div className='stats-card'>
          <div className='stats-card-upper-container'>
            <div className='stats-box-icon-container stats-bank-note-arrow-up-container'>
              <BanknoteArrowUp className='bank-note-arrow-up' />
            </div>
            <div className='stats-para-container stats-target-para'>
              <p>Target: +5%</p>
            </div>
          </div>
          {/* second container */}
          <div>MRR Growth</div>
          {/* third container */}
          <div className='total-tenants'>
            <h1>$42.8k</h1>
          </div>
        </div>
      </div>
      {/* tenant Table */}
      <TenantTable
        showModal={showModal}
        setShowModal={setShowModal}
        selectedTenant={selectedTenant}
        setSelectedTenant={setSelectedTenant}
      />
    </main>
  )
}

export default StatsCards