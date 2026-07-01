import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Mail, Clock, BookOpen } from "lucide-react";

export default function ContactSupport() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Contact Us</h1>
        <p className="text-slate-500">Need help? We&apos;re here for you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-blue-100">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 mb-1">WhatsApp Support</h3>
            <p className="text-sm text-slate-500 mb-3">Fastest response</p>
            <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-500 hover:bg-green-600 text-white w-full">Chat on WhatsApp</Button>
            </a>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardContent className="p-6 text-center">
            <Mail className="h-10 w-10 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 mb-1">Email Support</h3>
            <p className="text-sm text-slate-500 mb-3">support@eventorax.com</p>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = "mailto:support@eventorax.com"}>Send Email</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Support Hours</h3>
              <p className="text-sm text-slate-500">Monday - Saturday: 9:00 AM - 6:00 PM (PKT)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Documentation</h3>
              <p className="text-sm text-slate-500">Check our docs for guides and tutorials.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
