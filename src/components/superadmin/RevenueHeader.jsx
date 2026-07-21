import { Download, Search } from "lucide-react"
import '../styles/RevenueHeader.css'

function RevenueHeader() {
    return (
        <div className="revenue-header">
            <p className="financial-para">Financial Overview</p>
            <div className="revenue-header-actions">
                <div className="transactions-search">
                    <Search className="financial-search-icon" size={18} />
                    <input type="text" placeholder="Search transactions..." />
                </div>
                <button className="export-csv-button">
                    <Download size={19} />
                    Export CSV
                </button>
            </div>
        </div>
    )
}

export default RevenueHeader
