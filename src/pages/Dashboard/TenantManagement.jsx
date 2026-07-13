import Header from "../../components/superadmin/Header";
import Sidebar from "../../components/superadmin/Sidebar";
import React, { useState } from 'react'
import StatsCards from "../../components/superadmin/StatsCards";
import TenantTable from "../../components/superadmin/TenantTable";
import ImpersonateModal from "../../components/superadmin/ImpersonateModal";

function TenantManagement() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  return (
    <div>
      <Header />
      <Sidebar />
      <StatsCards
        showModal={showModal}
        setShowModal={setShowModal}
        setSelectedTenant={setSelectedTenant}
      />
      {
        showModal && (
          <ImpersonateModal
            setShowModal={setShowModal}
            selectedTenant={selectedTenant}
          />
        )
      }
    </div>
  )
}

export default TenantManagement