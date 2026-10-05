import { Outlet } from "react-router"

/** Page padding for the events-module pages (they don't render their own header bar). */
export default function ModuleLayout() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  )
}