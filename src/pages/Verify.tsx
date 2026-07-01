import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, CheckCircle, XCircle, Hash } from "lucide-react";

export default function Verify() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    valid: boolean;
    cert: { name: string; eventName: string; organizationName: string; issueDate: string; category: string | null; sha256Hash: string; status: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);

    // Mock verification - in real app, this would call the API
    setTimeout(() => {
      if (code.length >= 8) {
        setResult({
          valid: true,
          cert: {
            name: "Sample Certificate Holder",
            eventName: "International Tech Conference 2025",
            organizationName: "FAST University",
            issueDate: "2025-06-15",
            category: "Participant",
            sha256Hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
            status: "active",
          },
        });
      } else {
        setResult({ valid: false, cert: null });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <div className="text-center mb-10">
            <ShieldCheck className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Certificate Verification</h1>
            <p className="text-slate-600">
              Enter the verify code to check certificate authenticity. No login required.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex gap-3 mb-8">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verify code (e.g., a1b2c3d4...)"
              className="flex-1 text-lg"
            />
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-6" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </form>

          {result && (
            <div className={`p-6 rounded-xl border-2 ${result.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              {result.valid && result.cert ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-lg font-bold text-green-700">VERIFIED</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Name</div>
                        <div className="font-medium text-slate-800">{result.cert.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Event</div>
                        <div className="font-medium text-slate-800">{result.cert.eventName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Organization</div>
                        <div className="font-medium text-slate-800">{result.cert.organizationName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Date</div>
                        <div className="font-medium text-slate-800">{result.cert.issueDate}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Category</div>
                        <div className="font-medium text-slate-800">{result.cert.category || "N/A"}</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-green-200">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Hash className="h-3 w-3" />
                        SHA-256: {result.cert.sha256Hash}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="text-lg font-bold text-red-700">INVALID CERTIFICATE</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
