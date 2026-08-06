import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination() {
  const totalPages = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow w-fit">

      <button
        onClick={previousPage}
        disabled={currentPage === 1}
        className="p-2 border rounded disabled:opacity-50"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="font-medium">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={nextPage}
        disabled={currentPage === totalPages}
        className="p-2 border rounded disabled:opacity-50"
      >
        <ChevronRight size={18} />
      </button>

    </div>
  );
}