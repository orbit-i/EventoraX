export function TableSkeletonRows({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="animate-pulse">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-3.5 rounded bg-slate-100" style={{ width: `${60 + ((c * 13) % 35)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[#e9e4ff] bg-white p-4 animate-pulse">
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-1/4 rounded bg-slate-100 mt-2" />
          <div className="h-3 w-1/2 rounded bg-slate-100 mt-2" />
        </div>
      ))}
    </div>
  );
}