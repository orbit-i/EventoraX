import { Outlet } from "react-router-dom";
import Sidebar from "@/components/ui/dashboard/sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import ActivationPendingGatekeeper from "@/components/ActivationPendingGatekeeper";

function DashboardContent() {
  const { isOpen, closeSidebar } = useSidebar();
  const { user, currentTenant } = useAuth();

  // If client organization has pending approval status, enforce activation gatekeeper
  if (user?.role !== 'admin' && currentTenant?.status === 'pending_approval') {
    return <ActivationPendingGatekeeper />;
  }

  return (
    <div className="min-h-screen bg-[#f3f0ff] relative flex">
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main 
        className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}