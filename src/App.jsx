import { BrowserRouter } from 'react-router-dom';
import TenantManagement from './pages/Dashboard/TenantManagement'
import PlansPricing from './pages/Dashboard/PlansPricing'
import { Routes, Route } from 'react-router-dom';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/tenants' element={<TenantManagement />} />
        <Route path='/plans-pricing' element={<PlansPricing />} />
      </Routes>
    </BrowserRouter>
  );
}