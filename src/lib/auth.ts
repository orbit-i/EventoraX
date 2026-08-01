// Central place for auth-related helpers.
// When a real backend is connected, `determineRole` should be replaced
// with the role returned directly in the login API response.

export type UserRole = "admin" | "organizer";

const USER_ROLE_KEY = "userRole";

/**
 * Simulates role detection based on email until a real backend exists.
 * Replace this with `response.data.role` from the login API.
 */
export function determineRole(email: string): UserRole {
  return email.toLowerCase().includes("admin") ? "admin" : "organizer";
}

export function saveUserRole(role: UserRole) {
  localStorage.setItem(USER_ROLE_KEY, role);
}

export function getUserRole(): UserRole | null {
  const role = localStorage.getItem(USER_ROLE_KEY);
  return role === "admin" || role === "organizer" ? role : null;
}

/**
 * Maps each role to where they should land right after logging in.
 * Add more roles/paths here as the product grows.
 */
export function getRedirectPathForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard/settings";
    case "organizer":
    default:
      return "/dashboard";
  }
}