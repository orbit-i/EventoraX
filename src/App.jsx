import { BrowserRouter } from 'react-router-dom';
import TenantManagement from './pages/Dashboard/TenantManagement'
import PlansPricing from './pages/Dashboard/PlansPricing'
import { Routes, Route } from 'react-router-dom';
import Revenue from './pages/Dashboard/Revenue';
import Certificates from './components/certificates/Certificates';
import Analytics from './components/analytics/Analytics';
import EmailTemplates from './components/emailTemplates/EmailTemplates';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/tenants' element={<TenantManagement />} />
        <Route path='/plans-pricing' element={<PlansPricing />} />
        <Route path='/revenue' element={<Revenue />} />
        <Route path='/certificates' element={<Certificates />} />
        <Route path='/analytics' element={<Analytics />} />
        <Route path='/email-templates' element={<EmailTemplates />} />
      </Routes>
    </BrowserRouter>
  );
}