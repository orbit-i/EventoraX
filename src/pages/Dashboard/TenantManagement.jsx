import Header from "../../components/superadmin/Header";
import Sidebar from "../../components/superadmin/Sidebar";
import React from 'react'
import StatsCards from "../../components/superadmin/StatsCards";

function TenantManagement() {
  return (
    <div>
      <Header />
      <Sidebar />
      <StatsCards />
    </div>
  )
}

export default TenantManagement