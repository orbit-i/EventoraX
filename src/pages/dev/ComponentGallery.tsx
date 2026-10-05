import { useState } from "react"
import { Mail, Users, Calendar, Award } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { TextField, PasswordField, SelectField, TextareaField } from "@/components/ui/form-fields"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalActionButton,
  ModalCancelButton,
} from "@/components/ui/modal"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { SearchBar } from "@/components/ui/search-bar"
import StatCard from "@/components/ui/dashboard/StatCard"
import AppBlocksGallery from "./AppBlocksGallery"

type Attendee = {
  id: number
  name: string
  email: string
  status: string
}

const attendees: Attendee[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: `Attendee ${i + 1}`,
  email: `attendee${i + 1}@test.com`,
  status: i % 3 === 0 ? "ATTENDED" : "REGISTERED",
}))

const columns: ColumnDef<Attendee>[] = [
  { key: "id", label: "#", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true, hideOnMobile: true },
  { key: "status", label: "Status", sortable: true },
]

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
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const filtered = attendees.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

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

        <Section title="Stat cards">
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard title="Total Events" value="12" change="+2 this month" icon={Calendar} trend="up" />
            <StatCard title="Registrations" value="1,284" change="+18%" icon={Users} trend="up" />
            <StatCard title="Certificates" value="940" change="+5%" icon={Award} trend="up" />
            <StatCard title="No-shows" value="64" change="-3%" icon={Users} trend="down" />
          </div>
        </Section>

        <Section title="Modal + toast">
          <div className="flex gap-3">
            <Modal>
              <ModalTrigger asChild>
                <Button>Open modal</Button>
              </ModalTrigger>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Delete event?</ModalTitle>
                  <ModalDescription>This action cannot be undone.</ModalDescription>
                </ModalHeader>
                <ModalBody>Body content of the modal.</ModalBody>
                <ModalFooter>
                  <ModalClose asChild>
                    <ModalCancelButton />
                  </ModalClose>
                  <ModalClose asChild>
                    <ModalActionButton onClick={() => toast.success("Confirmed!")} />
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
            <Button variant="outline" onClick={() => toast.success("Saved successfully")}>
              Success toast
            </Button>
            <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
              Error toast
            </Button>
          </div>
        </Section>

        <Section title="Search bar + data table">
          <div className="flex gap-3 items-center">
            <SearchBar placeholder="Search attendees..." onSearch={setSearch} className="max-w-sm" />
            <Button variant="outline" size="sm" onClick={() => setLoading((v) => !v)}>
              Toggle loading
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row.id}
            loading={loading}
            defaultPageSize={5}
            emptyTitle="No attendees match your search"
          />
        </Section>
        <AppBlocksGallery />
      </div>
    </div>
  )
}