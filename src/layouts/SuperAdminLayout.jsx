import Header from "../components/superadmin/Header";
import Sidebar from "../components/superadmin/Sidebar";

function SuperAdminLayout({ children, customHeader }) {
  return (
    <>
      {customHeader || <Header />}
      <Sidebar />

      <main>
        {children}
      </main>
    </>
  )
}

export default SuperAdminLayout