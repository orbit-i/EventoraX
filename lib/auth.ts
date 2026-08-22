import { NextRequest } from "next/server";

// Placeholder tenant resolver. Every API route imports this instead of
// defining its own copy. Once real auth exists, this is the ONLY function
// that needs to change — swap the body to decode a session/JWT and return
// the real tenantId (throw/return null for unauthenticated requests, and
// have callers handle a 401 at that point).
export async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}