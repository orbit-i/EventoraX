import { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "Statistics",
      icon: <BarChart3 size={20} />,
    },
    {
      title: "Team",
      icon: <Users size={20} />,
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
    },
  ];

  return (
    <aside
      className={`h-screen bg-white shadow-lg border-r transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2 px-3">
        {menuItems.map((item) => (
          <button
            key={item.title}
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-violet-100 transition"
          >
            {item.icon}

            {!collapsed && (
              <span className="font-medium">
                {item.title}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}