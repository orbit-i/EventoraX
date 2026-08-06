import Sidebar from "../components/custom/Sidebar";
import Topbar from "../components/custom/Topbar";
import SearchBar from "../components/custom/SearchBar";
import Pagination from "../components/custom/Pagination";
import LoadingSpinner from "../components/custom/LoadingSpinner";
import Toast from "../components/custom/Toast";


export default function ComponentTest() {
  return (
    <div className="min-h-screen">
      <Topbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-6">
            Component Playground
          </h1>

          {/* Search Bar */}
          <SearchBar />

          {/* Pagination */}
          <div className="mt-8">
            <Pagination />
          </div>

          {/* Loading Spinner */}
          <div className="mt-8">
            <LoadingSpinner />
          </div>

          {/* Toast */}
          <Toast />

        

        </main>
      </div>
    </div>
  );
}