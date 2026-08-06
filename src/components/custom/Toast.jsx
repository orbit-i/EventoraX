import { CheckCircle } from "lucide-react";

export default function Toast() {
  return (
    <div className="fixed top-5 right-5 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2">
      <CheckCircle size={20} />
      <span>Operation completed successfully!</span>
    </div>
  );
}