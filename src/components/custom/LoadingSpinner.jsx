export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-violet-600 rounded-full animate-spin"></div>
    </div>
  );
}