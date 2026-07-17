import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { RegistrationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

// GET /api/v1/registrations/export?eventId=&format=csv|xlsx&status=&ids=id1,id2
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("eventId") || undefined;
    const format = (searchParams.get("format") || "csv").toLowerCase();
    const status = (searchParams.get("status") as RegistrationStatus) || undefined;
    const idsParam = searchParams.get("ids");
    const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "eventId query param is required." } },
        { status: 400 }
      );
    }

    const where: Prisma.RegistrationWhereInput = {
      tenantId,
      eventId,
      ...(status ? { status } : {}),
      ...(ids ? { id: { in: ids } } : {}),
    };

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { registrationDate: "desc" },
      include: { category: { select: { label: true } } },
    });

    const rows = registrations.map((r) => ({
      RefNo: r.refNo,
      Name: r.name,
      Email: r.email,
      Phone: r.phone || "",
      Department: r.department || "",
      RollNo: r.rollNo || "",
      Category: r.category?.label || "",
      Status: r.status,
      RegisteredVia: r.registeredVia,
      RegistrationDate: r.registrationDate.toISOString(),
    }));

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="registrations.xlsx"`,
        },
      });
    }

    // Default: CSV (hand-built, no package needed)
    const headers = Object.keys(rows[0] || { RefNo: "", Name: "", Email: "" });
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => `"${String((row as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const csv = csvLines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="registrations.csv"`,
      },
    });
  } catch (err) {
    console.error("GET /api/v1/registrations/export failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not export registrations." } },
      { status: 500 }
    );
  }
}