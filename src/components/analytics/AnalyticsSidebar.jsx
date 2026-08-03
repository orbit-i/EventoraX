import './AnalyticsSidebar.css'
import '../styles/Sidebar.css';
import { Calendar, ChartColumnDecreasing, CircleQuestionMark, CircleStar, Download, LayoutDashboard, LogOut, Plus, Settings, Star, Stars, Users, Banknote, MessageCircle, Mail } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import AnalyticsHeader from './AnalyticsHeader';

function AnalyticsSidebar({ header }) {
    return (
        <div className='analytics-sidebar-main-container'>
            <aside>
                <div>
                    <p className='eventorax-admin-para'>EventoraX Admin</p>
                    <p className='enterprise-tier-para'>ENTERPRISE TIER</p>
                    <div className='sidebar-menu-items-container'>
                        {/* item 1 */}
                        <NavLink
                            to="/tenants"
                            className={({ isActive }) =>
                                isActive ? "menu-item active-menu-item" : "menu-item"
                            }>
                            <Users className='menu-item-icon' />
                            <p>Tenants</p>
                        </NavLink>
                        {/* item 2 */}
                        <NavLink
                            to="/analytics"
                            className={({ isActive }) =>
                                isActive ? "menu-item active-menu-item" : "menu-item"
                            }>
                            <ChartColumnDecreasing className='menu-item-icon' />
                            <p>Analytics</p>
                        </NavLink>
                        {/* item 3 */}
                        <NavLink
                            to="/email-templates"
                            className={({ isActive }) =>
                                isActive ? "menu-item active-menu-item" : "menu-item"
                            }>
                            <Mail className='menu-item-icon' />
                            <p>Email Templates</p>
                        </NavLink>
                    </div>
                </div>
            </aside>
            {header ?? <AnalyticsHeader />}
        </div>
    )
}

export default AnalyticsSidebar
