import { useState } from "react"
import Header from "@/components/ui/dashboard/header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { MoreHorizontal, Mail, UserPlus, Search } from "lucide-react"

// ─── Data ──────────────────────────────────────────────────────────────────────

type StatusKey = "active" | "away" | "offline"

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  status: StatusKey
  initials: string
  joined: string
  events: number
}

const ALL_MEMBERS: TeamMember[] = [
  { id: "1",  name: "Sarah Chen",       role: "Event Director",  email: "sarah@company.com",    status: "active",  initials: "SC", joined: "Jan 2023", events: 42 },
  { id: "2",  name: "Michael Torres",   role: "Tech Lead",       email: "michael@company.com",  status: "active",  initials: "MT", joined: "Mar 2023", events: 38 },
  { id: "3",  name: "Emily Watson",     role: "Operations",      email: "emily@company.com",    status: "away",    initials: "EW", joined: "Jun 2023", events: 29 },
  { id: "4",  name: "James Park",       role: "Marketing",       email: "james@company.com",    status: "offline", initials: "JP", joined: "Aug 2023", events: 17 },
  { id: "5",  name: "Lisa Wong",        role: "Designer",        email: "lisa@company.com",     status: "active",  initials: "LW", joined: "Sep 2023", events: 24 },
  { id: "6",  name: "Omar Farooq",      role: "Developer",       email: "omar@company.com",     status: "active",  initials: "OF", joined: "Oct 2023", events: 31 },
  { id: "7",  name: "Priya Sharma",     role: "Coordinator",     email: "priya@company.com",    status: "active",  initials: "PS", joined: "Nov 2023", events: 19 },
  { id: "8",  name: "Carlos Mendez",    role: "Sales",           email: "carlos@company.com",   status: "away",    initials: "CM", joined: "Dec 2023", events: 11 },
  { id: "9",  name: "Aisha Nkosi",      role: "Content Writer",  email: "aisha@company.com",    status: "active",  initials: "AN", joined: "Jan 2024", events: 8  },
  { id: "10", name: "David Kim",        role: "Analytics Lead",  email: "david@company.com",    status: "offline", initials: "DK", joined: "Jan 2024", events: 14 },
  { id: "11", name: "Sophie Laurent",   role: "UX Researcher",   email: "sophie@company.com",   status: "active",  initials: "SL", joined: "Feb 2024", events: 7  },
  { id: "12", name: "Arjun Patel",      role: "Backend Dev",     email: "arjun@company.com",    status: "active",  initials: "AP", joined: "Feb 2024", events: 22 },
  { id: "13", name: "Nina Reyes",       role: "HR Manager",      email: "nina@company.com",     status: "away",    initials: "NR", joined: "Mar 2024", events: 5  },
  { id: "14", name: "Tom Okafor",       role: "Finance",         email: "tom@company.com",      status: "offline", initials: "TO", joined: "Apr 2024", events: 3  },
  { id: "15", name: "Yuki Tanaka",      role: "Event Director",  email: "yuki@company.com",     status: "active",  initials: "YT", joined: "May 2024", events: 16 },
]

// ─── Status badge styling ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<StatusKey, string> = {
  active:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  away:    "bg-amber-50  text-amber-700  border-amber-200",
  offline: "bg-slate-100 text-slate-500  border-slate-200",
}

const STATUS_DOT: Record<StatusKey, string> = {
  active:  "bg-emerald-500",
  away:    "bg-amber-400",
  offline: "bg-slate-400",
}

// ─── Column definitions ─────────────────────────────────────────────────────────

const columns: ColumnDef<TeamMember>[] = [
  {
    key: "name",
    label: "Member",
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white text-xs font-bold">
            {row.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0f172a] truncate">{row.name}</p>
          <p className="text-xs text-[#94a3b8] truncate">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    render: (row) => (
      <span className="text-sm text-[#475569]">{row.role}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row) => (
      <Badge
        variant="outline"
        className={`${STATUS_STYLES[row.status]} capitalize text-xs inline-flex items-center gap-1.5`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[row.status]}`} />
        {row.status}
      </Badge>
    ),
  },
  {
    key: "events",
    label: "Events",
    sortable: true,
    hideOnMobile: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        {/* Mini sparkline bar */}
        <div className="w-16 h-1.5 rounded-full bg-[#e9e4ff] overflow-hidden hidden md:block">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]"
            style={{ width: `${Math.min(100, (row.events / 42) * 100)}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-[#7c3aed] tabular-nums w-6 text-right">
          {row.events}
        </span>
      </div>
    ),
  },
  {
    key: "joined",
    label: "Joined",
    sortable: false,
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-[#94a3b8]">{row.joined}</span>
    ),
  },
  {
    key: "actions",
    label: "",
    sortable: false,
    className: "w-20 text-right",
    render: (row) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Email ${row.name}`}
          className="rounded-lg w-8 h-8 hover:bg-[#f5f3ff] text-[#94a3b8] hover:text-[#7c3aed]"
        >
          <Mail className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`More options for ${row.name}`}
          className="rounded-lg w-8 h-8 hover:bg-[#f5f3ff] text-[#94a3b8] hover:text-[#7c3aed]"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </div>
    ),
  },
]

// ─── Page component ─────────────────────────────────────────────────────────────

export default function Team() {
  const [search, setSearch] = useState("")
  const [loading] = useState(false)

  // Client-side search filter — runs before DataTable receives data
  const filtered = ALL_MEMBERS.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  // Summary counts for the stat pills
  const activeCount  = ALL_MEMBERS.filter((m) => m.status === "active").length
  const awayCount    = ALL_MEMBERS.filter((m) => m.status === "away").length
  const offlineCount = ALL_MEMBERS.filter((m) => m.status === "offline").length

  return (
    <div>
      <Header title="Team Management" />

      <div className="p-6 space-y-6">

        {/* ── Top bar ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Team Members</h2>
            <p className="text-sm text-[#475569]">
              Manage your team and their permissions
            </p>
          </div>
          <Button variant="default">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* ── Status summary pills ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Total",   count: ALL_MEMBERS.length, dot: "bg-[#7c3aed]",    text: "text-[#7c3aed]",    bg: "bg-[#f5f3ff] border-[#e9e4ff]" },
            { label: "Active",  count: activeCount,        dot: "bg-emerald-500",  text: "text-emerald-700",  bg: "bg-emerald-50 border-emerald-200" },
            { label: "Away",    count: awayCount,          dot: "bg-amber-400",    text: "text-amber-700",    bg: "bg-amber-50 border-amber-200" },
            { label: "Offline", count: offlineCount,       dot: "bg-slate-400",    text: "text-slate-600",    bg: "bg-slate-50 border-slate-200" },
          ].map((pill) => (
            <div
              key={pill.label}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${pill.bg} ${pill.text}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${pill.dot}`} />
              {pill.label}
              <span className="font-bold">{pill.count}</span>
            </div>
          ))}
        </div>

        {/* ── DataTable ─────────────────────────────────────────────────────── */}
        <DataTable<TeamMember>
          columns={columns}
          data={filtered}
          rowKey={(row) => row.id}
          loading={loading}
          skeletonRows={5}
          pageSizeOptions={[5, 10, 15]}
          defaultPageSize={5}
          emptyTitle="No members found"
          emptyDescription={
            search
              ? `No results for "${search}". Try a different name, role, or email.`
              : "Your team is empty. Invite a member to get started."
          }
          toolbar={
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search members…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full sm:w-56 pl-9 pr-4 rounded-xl border border-[#e9e4ff] bg-gradient-to-b from-white to-[#faf8ff] text-sm text-[#0f172a] placeholder:text-[#94a3b8] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all duration-200"
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-[#94a3b8] hover:text-[#7c3aed] transition-colors duration-200 whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          }
        />

      </div>
    </div>
  )
}
