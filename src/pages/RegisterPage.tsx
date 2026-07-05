import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      localStorage.setItem("token", "demo-token")
      setIsLoading(false)
      navigate("/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-[#e9e4ff] shadow-xl shadow-[#7c3aed]/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-[#7c3aed] rounded-xl flex items-center justify-center mb-2">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#0f172a]">Create Account</CardTitle>
          <CardDescription className="text-[#475569]">Join EventoraX to manage your events</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">First Name</Label>
                <Input placeholder="John" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0f172a] font-semibold">Last Name</Label>
                <Input placeholder="Doe" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold">Email</Label>
              <Input type="email" placeholder="john@company.com" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0f172a] font-semibold">Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#7c3aed]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-xl shadow-lg shadow-[#7c3aed]/25" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[#475569]">
            Already have an account? <a href="/login" className="text-[#7c3aed] font-semibold hover:underline">Sign in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}