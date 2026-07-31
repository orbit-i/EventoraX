import { ArrowUpRight, Award, Calendar, DollarSign, Download, Users } from 'lucide-react'
import './Analytics.css'
import AnalyticsSidebar from './AnalyticsSidebar'
import AnalyticsCharts from './AnalyticsCharts'
import AnalyticsUsers from './AnalyticsUsers'

function Analytics() {
  return (
    <>
      <AnalyticsSidebar />
     <main>
        <div className='analytics-main-container'>
            <section className='analytics-upper-content-section'>
                <div className='analytics-upper-left-content-section'>
                    <p className='sa-analytics-para'>SA Analytics</p>
                    <p className='comprehensive-system-para'>Comprehensive system - wide performance and engagement metrics.</p>
                </div>
                <div className='analytics-upper-right-content-section'>
                    <button className='days-btn-container'>
                        <Calendar size={15} />
                        Last 30 days
                    </button>
                    <button className='filters-btn-container'>
                        Filters
                    </button>
                    <button className='export-report-btn-container export-report-btn'>
                        <Download size={15} />
                        Export Report
                    </button>
                </div>
            </section>
            <section className='sa-analytics-stats-cards-container'>
                {/* card 1 */}
                <div className='analytics-card'>
                    <div className='analytics-card-upper-content'>
                        <div className='analytics-card-users-icon-container'>
                            <Users size={16} />
                        </div>
                        <p><ArrowUpRight size={12} /> +12.5%</p>
                    </div>
                    <div className='analytics-card-total-users-container'>
                        <p>TOTAL USERS</p>
                        <p>124,892</p>
                        <p>Active platform participants</p>
                    </div>
                </div>
                {/* card 2 */}
                <div className='analytics-card'>
                    <div className='analytics-card-upper-content'>
                        <div className='analytics-card-users-icon-container'>
                            <Calendar size={16} />
                        </div>
                        <p><ArrowUpRight size={12} /> +5.2%</p>
                    </div>
                    <div className='analytics-card-total-users-container'>
                        <p>TOTAL EVENTS</p>
                        <p>3,421</p>
                        <p>Successfully hosted events</p>
                    </div>
                </div>
                {/* card 3 */}
                <div className='analytics-card'>
                    <div className='analytics-card-upper-content'>
                        <div className='analytics-card-users-icon-container'>
                            <DollarSign size={16} />
                        </div>
                        <p><ArrowUpRight size={12} /> +18.7%</p>
                    </div>
                    <div className='analytics-card-total-users-container'>
                        <p>TOTAL REVENUE</p>
                        <p>$1.24M</p>
                        <p>Gross transaction volume</p>
                    </div>
                </div>
                {/* card 4 */}
                <div className='analytics-card'>
                    <div className='analytics-card-upper-content'>
                        <div className='analytics-card-users-icon-container'>
                            <Award size={16} />
                        </div>
                        <p><ArrowUpRight size={12} /> +8.1%</p>
                    </div>
                    <div className='analytics-card-total-users-container'>
                        <p>TOTAL CERTIFICATES</p>
                        <p>45,201</p>
                        <p>Verified events completion</p>
                    </div>
                </div>
            </section>
            <AnalyticsCharts />
            <AnalyticsUsers />
        </div>
     </main>
    </>
  )
}

export default Analytics
