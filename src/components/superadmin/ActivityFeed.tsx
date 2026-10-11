import { Link } from "react-router"
import { Avatar } from "@/components/app/Avatar"
import { describeActivity } from "@/lib/activityText"
import { formatRelative, formatDateTime } from "@/lib/format"
import type { PlatformActivity } from "@/types/superadmin"

/** Platform-wide activity list: who did what, in which organization, when. */
export function ActivityFeed({ items, showOrg = true }: { items: PlatformActivity[]; showOrg?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((a) => {
        const name = a.user?.name ?? "System"
        return (
          <li key={a.id} className="flex items-start gap-3">
            <Avatar name={a.user?.name ?? "System"} size="sm" />
            <div className="min-w-0 text-sm">
              <p className="text-[#334155]">
                <span className="font-semibold text-[#0f172a]">{name}</span> {describeActivity(a)}
                {a.metadata && "impersonatedBy" in a.metadata && <span className="ml-1 text-xs text-amber-700">(via log in as)</span>}
              </p>
              <p className="text-xs text-[#94a3b8]" title={formatDateTime(a.createdAt)}>
                {formatRelative(a.createdAt)}
                {showOrg && a.organization && (
                  <>
                    {" · "}
                    <Link to={`/superadmin/tenants/${a.organization.id}`} className="hover:text-[#7c3aed] hover:underline">
                      {a.organization.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
