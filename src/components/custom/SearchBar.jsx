import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [search, setSearch] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm">
        <Search size={18} className="text-gray-500" />

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-2 w-full outline-none"
        />
      </div>

      <p className="mt-2 text-sm text-gray-600">
        You typed: <strong>{search}</strong>
      </p>
    </div>
  );
}