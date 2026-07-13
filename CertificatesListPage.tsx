import { useMemo, useState } from "react";
import { Search, Download, Send, Ban, Eye, MoreVertical, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Certificate, CertificateStatus } from "@/lib/certificate-types";

const DUMMY_CERTIFICATES: Certificate[] = [
  { id: "CERT-1042", recipientName: "Ayesha Khan", recipientEmail: "ayesha@mail.com", eventName: "React Summit 2026", templateName: "Classic Gold", issueDate: "2026-07-01", status: "issued" },
  { id: "CERT-1043", recipientName: "Bilal Ahmed", recipientEmail: "bilal@mail.com", eventName: "React Summit 2026", templateName: "Classic Gold", issueDate: "2026-07-01", status: "issued" },
  { id: "CERT-1044", recipientName: "Sara Malik", recipientEmail: "sara@mail.com", eventName: "UX Conf Lahore", templateName: "Minimal Blue", issueDate: "2026-07-05", status: "pending" },
  { id: "CERT-1045", recipientName: "Hamza Raza", recipientEmail: "hamza@mail.com", eventName: "UX Conf Lahore", templateName: "Minimal Blue", issueDate: "2026-07-05", status: "pending" },
  { id: "CERT-1046", recipientName: "Zainab Tariq", recipientEmail: "zainab@mail.com", eventName: "DevOps Meetup", templateName: "Bold Navy", issueDate: "2026-06-28", status: "revoked" },
  { id: "CERT-1047", recipientName: "Usman Farooq", recipientEmail: "usman@mail.com", eventName: "DevOps Meetup", templateName: "Bold Navy", issueDate: "2026-06-28", status: "issued" },
];

const STATUS_STYLES: Record<CertificateStatus, string> = {
  issued: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  revoked: "bg-rose-100 text-rose-700 hover:bg-rose-100",
};

const STATUS_LABEL: Record<CertificateStatus, string> = {
  issued: "Issued",
  pending: "Pending",
  revoked: "Revoked",
};

type StatusFilter = "all" | CertificateStatus;

export default function CertificatesListPage() {
  const [certificates, setCertificates] = useState<Certificate[]>(DUMMY_CERTIFICATES);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);

  const filtered = useMemo(() => {
    return certificates.filter((c) => {
      const matchesQuery =
        c.recipientName.toLowerCase().includes(query.toLowerCase()) ||
        c.eventName.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [certificates, query, statusFilter]);

  function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setCertificates((prev) =>
      prev.map((c) => (c.id === revokeTarget.id ? { ...c, status: "revoked" as const } : c))
    );
    setRevokeTarget(null);
  }

  function handleResend(cert: Certificate) {
    console.log("Resend email for", cert.id);
  }

  function handleDownload(cert: Certificate) {
    console.log("Download PDF for", cert.id);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Certificates</h1>
            <p className="text-sm text-slate-500">Manage and track all issued event certificates</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, event, or ID"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {(["all", "issued", "pending", "revoked"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Certificate ID</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">
                    No certificates match your search.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{cert.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{cert.recipientName}</div>
                    <div className="text-xs text-slate-400">{cert.recipientEmail}</div>
                  </TableCell>
                  <TableCell className="text-slate-600">{cert.eventName}</TableCell>
                  <TableCell className="text-slate-600">{cert.templateName}</TableCell>
                  <TableCell className="text-slate-600">{cert.issueDate}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[cert.status]}>{STATUS_LABEL[cert.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => console.log("view", cert.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(cert)}>
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResend(cert)}>
                          <Send className="mr-2 h-4 w-4" /> Resend Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600"
                          disabled={cert.status === "revoked"}
                          onClick={() => setRevokeTarget(cert)}
                        >
                          <Ban className="mr-2 h-4 w-4" /> Revoke
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Showing {filtered.length} of {certificates.length} certificates
        </p>
      </div>

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this certificate?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget
                ? `${revokeTarget.recipientName}'s certificate (${revokeTarget.id}) will be marked as revoked and the verify page will show it as invalid.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleRevokeConfirm}>
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}