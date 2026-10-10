import Header from "@/components/ui/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  UserPlus, 
  Calendar, 
  CreditCard, 
  Settings, 
  LogIn,
  Mail,
  Trash2,
  FileText,
  Shield
} from "lucide-react"

const activities = [
  { 
    type: "user", 
    action: "New team member added", 
    detail: "Sarah Chen joined as Event Director", 
    time: "2 min ago", 
    icon: UserPlus,
    user: "You"
  },
  { 
    type: "event", 
    action: "Event created", 
    detail: "Tech Conference 2024 scheduled for Aug 15", 
    time: "1 hour ago", 
    icon: Calendar,
    user: "John Doe"
  },
  { 
    type: "billing", 
    action: "Plan upgraded", 
    detail: "Upgraded to Professional plan ($99/month)", 
    time: "3 hours ago", 
    icon: CreditCard,
    user: "You"
  },
  { 
    type: "settings", 
    action: "Profile updated", 
    detail: "Changed profile picture and timezone", 
    time: "5 hours ago", 
    icon: Settings,
    user: "John Doe"
  },
  { 
    type: "login", 
    action: "New login detected", 
    detail: "Login from Chrome on Windows • IP: 192.168.1.1", 
    time: "1 day ago", 
    icon: LogIn,
    user: "You"
  },
  { 
    type: "email", 
    action: "Invitation sent", 
    detail: "Sent invite to michael@company.com for Marketing role", 
    time: "2 days ago", 
    icon: Mail,
    user: "Sarah Chen"
  },
  { 
    type: "security", 
    action: "Two-factor enabled", 
    detail: "2FA activated for account security", 
    time: "3 days ago", 
    icon: Shield,
    user: "You"
  },
  { 
    type: "event", 
    action: "Event deleted", 
    detail: "Removed 'Old Workshop' from calendar", 
    time: "5 days ago", 
    icon: Trash2,
    user: "Emily Watson"
  },
  { 
    type: "billing", 
    action: "Invoice generated", 
    detail: "Invoice #INV-2024-001 for $299.00", 
    time: "1 week ago", 
    icon: FileText,
    user: "System"
  },
]

const typeColors = {
  user: "bg-blue-100 text-blue-600 border-blue-200",
  event: "bg-purple-100 text-purple-600 border-purple-200",
  billing: "bg-green-100 text-green-600 border-green-200",
  settings: "bg-amber-100 text-amber-600 border-amber-200",
  login: "bg-gray-100 text-gray-600 border-gray-200",
  email: "bg-pink-100 text-pink-600 border-pink-200",
  security: "bg-emerald-100 text-emerald-600 border-emerald-200",
}

const typeLabels = {
  user: "Team",
  event: "Event",
  billing: "Billing",
  settings: "Settings",
  login: "Security",
  email: "Email",
  security: "Security",
}

export default function Activity() {
  return (
    <div>
      <Header title="Activity Logs" />
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] cursor-pointer px-3 py-1">All</Badge>
          <Badge variant="outline" className="bg-white text-[#475569] border-[#e9e4ff] hover:bg-[#f5f3ff] hover:text-[#7c3aed] cursor-pointer px-3 py-1">Team</Badge>
          <Badge variant="outline" className="bg-white text-[#475569] border-[#e9e4ff] hover:bg-[#f5f3ff] hover:text-[#7c3aed] cursor-pointer px-3 py-1">Events</Badge>
          <Badge variant="outline" className="bg-white text-[#475569] border-[#e9e4ff] hover:bg-[#f5f3ff] hover:text-[#7c3aed] cursor-pointer px-3 py-1">Billing</Badge>
          <Badge variant="outline" className="bg-white text-[#475569] border-[#e9e4ff] hover:bg-[#f5f3ff] hover:text-[#7c3aed] cursor-pointer px-3 py-1">Security</Badge>
        </div>

        {/* Activity List */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardContent className="p-0">
            {activities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div 
                  key={index} 
                  className={`flex items-start gap-4 p-5 ${index !== activities.length - 1 ? 'border-b border-[#e9e4ff]' : ''} hover:bg-[#faf8ff] transition-colors duration-150`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 ${typeColors[activity.type as keyof typeof typeColors]}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-[#0f172a]">{activity.action}</p>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe] font-medium"
                      >
                        {typeLabels[activity.type as keyof typeof typeLabels]}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#475569] leading-relaxed">{activity.detail}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#94a3b8] font-medium">by {activity.user}</span>
                      <span className="w-1 h-1 rounded-full bg-[#ddd6fe]" />
                      <span className="text-xs text-[#94a3b8] font-medium">{activity.time}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-[#94a3b8] font-semibold shrink-0 bg-[#f5f3ff] px-2.5 py-1 rounded-lg">
                    {activity.time}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Load More */}
        <div className="text-center">
          <button className="text-sm font-semibold text-[#7c3aed] hover:text-[#6d28d9] transition-colors px-6 py-2.5 rounded-xl hover:bg-[#f5f3ff]">
            Load More Activity
          </button>
        </div>
      </div>
    </div>
  )
}