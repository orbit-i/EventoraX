import { Menu } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-gray-100">
          <Menu size={22} />
        </button>

        <h1 className="text-xl font-semibold">
          EventoraX
        </h1>
      </div>

      {/* Right Side */}
      <nav className="flex items-center gap-8">
        <a href="#" className="hover:text-violet-600">
          Features
        </a>

        <a href="#" className="hover:text-violet-600">
          Pricing
        </a>

        <a href="#" className="hover:text-violet-600">
          About
        </a>

        <a href="#" className="hover:text-violet-600">
          Contact
        </a>
      </nav>
    </header>
  );
}