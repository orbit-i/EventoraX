import Sidebar from "../components/custom/Sidebar";
import Topbar from "../components/custom/Topbar";
import SearchBar from "../components/custom/SearchBar";
import Pagination from "../components/custom/Pagination";
import LoadingSpinner from "../components/custom/LoadingSpinner";
import Toast from "../components/custom/Toast";

export default function ComponentTest() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <Topbar />

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Component Playground
              </h1>

              <p className="mt-2 text-gray-500">
                Test and preview the EventoraX UI components.
              </p>
            </div>

            {/* Search Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Search
              </h2>

              <SearchBar />
            </section>

            {/* Pagination Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Pagination
              </h2>

              <Pagination />
            </section>

            {/* Loading Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Loading State
              </h2>

              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            </section>

            {/* Toast Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Toast Notification
              </h2>

              <Toast />
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}