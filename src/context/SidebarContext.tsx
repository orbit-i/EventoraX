import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // On desktop default to open, on mobile default to closed
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [isCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isCollapsed,
        toggleSidebar,
        openSidebar,
        closeSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      isOpen: false,
      isCollapsed: false,
      toggleSidebar: () => {},
      openSidebar: () => {},
      closeSidebar: () => {},
    };
  }
  return context;
}
