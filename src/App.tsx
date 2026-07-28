import { BrowserRouter, Routes, Route, Navigate,} from "react-router-dom";
import CertificatesListPage from "@/pages/Dashboard/certificates/CertificatesListPage";
import GenerateCertificatePage from "@/pages/Dashboard/certificates/GenerateCertificatePage";
import BulkGenerateCertificatesPage from "@/pages/Dashboard/certificates/BulkGenerateCertificatesPage";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/certificates" replace />} />
        <Route path="/dashboard/certificates" element={<CertificatesListPage />} />
        <Route path="/dashboard/certificates/generate" element={<GenerateCertificatePage />} />
        <Route path="/dashboard/certificates/bulk-generate" element={<BulkGenerateCertificatesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;