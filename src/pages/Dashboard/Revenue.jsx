import RevenueHeader from "../../components/superadmin/RevenueHeader"
import SuperAdminLayout from "../../layouts/SuperAdminLayout"
import '../../../src/components/styles/Revenue.css'
import { BookSearch, TrendingUp } from "lucide-react"
import RevenueGrowth from "../../components/revenue/RevenueGrowth"

function Revenue() {
    return (
        <SuperAdminLayout customHeader={<RevenueHeader />}>
            <div className="revenue-main-container">
                <div className="revenue-upper-container">
                    <div className="revenue-upper-first-container">
                        <div>
                            <p className="total-revenue-para">TOTAL REVENUE (PKR)</p>
                            <p className="pkr-para">PKR 12,450,000</p>
                            <div className="treding-up-main-icon-container">
                                <TrendingUp size={14} />
                                +14.2% from last month
                            </div>
                        </div>
                        <div>
                            <BookSearch size={50} style={{ color: 'lightgray' }} />
                        </div>
                    </div>
                    <div className="revenue-upper-second-container">
                        <p className="outstanding-para">OUTSTANDING</p>
                        <p className="pkr-amount-para">PKR 840,200</p>
                        <p className="pending-para">12 pending bank transfers</p>
                    </div>
                    <div className="revenue-upper-third-container">
                        <p className="monthly-recurring-para">MONTHLY RECURRING</p>
                        <p className="pkr-amount-third-para">PKR 840,200</p>
                        <p className="pending-para"><span className="active-subscription">45</span> Active Subscriptions</p>
                    </div>
                </div>
                {/* Revenue Growth component */}
                <RevenueGrowth />
            </div>

        </SuperAdminLayout>
    )
}

export default Revenue
