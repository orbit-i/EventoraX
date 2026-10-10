import { Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { TextField, PasswordField, SelectField, TextareaField } from "@/components/ui/form-fields"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import AppBlocksGallery from "./AppBlocksGallery"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-[#0f172a] border-b border-[#e9e4ff] pb-2">{title}</h2>
      {children}
    </section>
  )
}

/** Development-only page at /dev/components showing every shared component. */
export default function ComponentGallery() {
  return (
    <div className="min-h-screen bg-[#f3f0ff] p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-[#0f172a]">Component Gallery</h1>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Form fields">
          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} required />
            <TextField label="With error" defaultValue="not-an-email" error="Enter a valid email" />
            <PasswordField label="Password" placeholder="••••••••" helper="At least 8 characters" />
            <SelectField
              label="Role"
              placeholder="Choose a role"
              options={[
                { value: "admin", label: "Admin" },
                { value: "manager", label: "Manager" },
                { value: "viewer", label: "Viewer" },
              ]}
            />
            <TextareaField label="Message" placeholder="Write something..." className="md:col-span-2" />
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Default</CardTitle>
                <CardDescription>Forms and panels</CardDescription>
              </CardHeader>
              <CardContent>Content goes here.</CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated</CardTitle>
                <CardDescription>Stats and features</CardDescription>
              </CardHeader>
              <CardContent>Hover me.</CardContent>
            </Card>
            <Card variant="outlined" active>
              <CardHeader>
                <CardTitle>Outlined (active)</CardTitle>
                <CardDescription>Plan selection</CardDescription>
              </CardHeader>
              <CardContent>Selected state.</CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Toasts">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => toast.success("Saved successfully")}>
              Success toast
            </Button>
            <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
              Error toast
            </Button>
          </div>
        </Section>

        <AppBlocksGallery />
      </div>
    </div>
  )
}