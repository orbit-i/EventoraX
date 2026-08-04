import AnalyticsSidebar from "../analytics/AnalyticsSidebar"
import AnalyticsHeader from "../analytics/AnalyticsHeader"
import EmailHeader from "./EmailHeader"
import { ChevronRight, Eye, Plus } from "lucide-react"
import './EmailTemplates.css'
import TemplatesList from "./components/TemplatesList/TemplatesList"
import EmailEditor from "./components/EmailEditor/EmailEditor"
import { useNavigate } from "react-router"

function EmailTemplates() {
    const navigate = useNavigate();
    return (
        <div>
            <AnalyticsSidebar header={<EmailHeader />} />
            <main>
                <div className="email-templates-main-upper-content-container">
                    <div className="email-templates-left-content-container">
                        <p>Super Admin</p>
                        <ChevronRight className="email-templates-chevron-right-icon" size={15} />
                        <p>Email Templates</p>
                    </div>
                    <div className="email-templates-right-content-container">
                        <button 
                        onClick={() => (
                            navigate("/email-preview")
                        )}
                        className="email-preview-icon-container">
                            <Eye size={14} />
                            Preview
                        </button>
                        <button className="create-template-icon-container">
                            <Plus size={14} />
                            Create templates
                        </button>
                    </div>
                </div>
                <div className="email-editor-layout">
                    <TemplatesList />
                    <EmailEditor />
                </div>
            </main>
        </div>
    )
}

export default EmailTemplates
