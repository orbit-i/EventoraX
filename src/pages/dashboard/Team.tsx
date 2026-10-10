import Header from "@/components/ui/dashboard/header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MoreHorizontal, Mail, UserPlus } from "lucide-react"

const teamMembers = [
  { name: "Sarah Chen", role: "Event Director", email: "sarah@company.com", status: "active", initials: "SC" },
  { name: "Michael Torres", role: "Tech Lead", email: "michael@company.com", status: "active", initials: "MT" },
  { name: "Emily Watson", role: "Operations", email: "emily@company.com", status: "away", initials: "EW" },
  { name: "James Park", role: "Marketing", email: "james@company.com", status: "offline", initials: "JP" },
  { name: "Lisa Wong", role: "Designer", email: "lisa@company.com", status: "active", initials: "LW" },
]

const statusColors = {
  active: "bg-green-100 text-green-700 border-green-200",
  away: "bg-amber-100 text-amber-700 border-amber-200",
  offline: "bg-gray-100 text-gray-600 border-gray-200",
}

export default function Team() {
  return (
    <div>
      <Header title="Team Management" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Team Members</h2>
            <p className="text-sm text-[#475569]">Manage your team and their permissions</p>
          </div>
          <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-lg shadow-[#7c3aed]/25">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <Card className="border-[#e9e4ff] shadow-sm">
          <CardContent className="p-0">
            {teamMembers.map((member, index) => (
              <div 
                key={member.email} 
                className={`flex items-center gap-4 p-4 ${index !== teamMembers.length - 1 ? 'border-b border-[#e9e4ff]' : ''}`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white font-bold">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a]">{member.name}</p>
                  <p className="text-xs text-[#94a3b8]">{member.email}</p>
                </div>

                <Badge 
                  variant="outline" 
                  className={`${statusColors[member.status as keyof typeof statusColors]} capitalize text-xs`}
                >
                  {member.status}
                </Badge>

                <p className="text-sm text-[#475569] hidden sm:block w-24">{member.role}</p>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-lg hover:bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed]">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-lg hover:bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed]">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}