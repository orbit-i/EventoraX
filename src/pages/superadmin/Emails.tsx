import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Save, Send } from "lucide-react";
import { toast } from "sonner";

const templates = [
  { id: 1, name: "Welcome Email", slug: "welcome", subject: "Welcome to EventoraX!" },
  { id: 2, name: "Registration Confirmation", slug: "registration_confirm", subject: "Event Registration Confirmed" },
  { id: 3, name: "Certificate Issued", slug: "certificate_issued", subject: "Your Certificate is Ready!" },
];

export default function Emails() {
  const [selected, setSelected] = useState(templates[0]);
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState("<h1>Welcome!</h1><p>Thank you for joining EventoraX.</p>");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Templates</h1>
        <p className="text-slate-400">Manage system email templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {templates.map(t => (
              <button key={t.id} onClick={() => { setSelected(t); setSubject(t.subject); }} className={`w-full text-left p-3 rounded-lg transition-colors ${selected.id === t.id ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}>
                <Mail className="h-4 w-4 inline mr-2" />{t.name}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Edit: {selected.name}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">HTML Body</label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="bg-slate-700 border-slate-600 text-white font-mono text-sm" />
            </div>
            <div className="flex gap-2">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => toast.success("Template saved!")}><Save className="h-4 w-4 mr-2" />Save</Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => toast.info("Test email sent!")}><Send className="h-4 w-4 mr-2" />Send Test</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
