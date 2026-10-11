# 8. Frontend components

Paths are relative to `src/components/`. Three layers, from generic to specific:

1. `ui/`: visual primitives (shadcn/ui on Radix, restyled to the EventoraX look). No app logic.
2. `app/`: app-wide building blocks that know about our conventions (server pagination, URL filters, statuses, roles).
3. `layout/` and feature folders: the dashboard frame and pieces used by one area.

**Before writing a new component, look here first.** Most pages are composed almost entirely from `app/`.
`/dev/components` (development only) shows the shared components live (`pages/dev/ComponentGallery.tsx`).

## `ui/` (primitives)

| File | What |
|---|---|
| `button.tsx` | `Button` (+ `buttonVariants`): variants `default`/`primary` (purple), `destructive`/`danger`, `outline`, `secondary`, `ghost`, `link`…, sizes incl. `icon` / `icon-sm`; `asChild` to render a `Link`. |
| `form-fields.tsx` | **Use these in forms**: `TextField`, `PasswordField` (show/hide), `SelectField` (options array), `TextareaField`. Each renders label, required star, helper text and the error message under the field, and works with `register()` from react-hook-form. |
| `input.tsx`, `select.tsx`, `checkbox.tsx`, `switch.tsx`, `tabs.tsx` | Raw inputs (Radix Select, Checkbox, Switch, Tabs). |
| `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx` | Overlays (modal dialog, confirmation dialog, side sheet, popover, menus, tooltips). |
| `card.tsx` | `Card` (variants) with header/title/description/content/footer/action parts. |
| `table.tsx` | Table parts used by `ServerTable`. |
| `skeleton.tsx`, `spinner.tsx` | Loading placeholders. |
| `sonner.tsx` | The `Toaster` (toasts via `toast.success/error(..., { action: { label: "Undo", onClick } })`). |

Unused extra exports of these files are allowed (knip ignores exports in `ui/`). Add new primitives with
`npx shadcn add <name>` (configured by `components.json`), then restyle to match.

## `app/` (building blocks)

### Page structure

| Component | Use |
|---|---|
| `PageHeader({ title, description?, breadcrumbs, actions?, badge? })` | Top of every dashboard page: breadcrumbs, title, one-line description (list pages only), actions on the right. |
| `EventPicker` | Chooses the event for event-scoped pages (with `useSelectedEvent`). Archived events listed last. |
| `StatsRow({ items, loading })`, `StatCard` | 2–4 stat cards with icon, accent colour and hint; skeletons while loading. |
| `SegmentedTabs({ value, onChange, options })` | Main filter as tabs, with counts and optional dot (unsaved). |
| `Panel({ title, description?, action? })`, `PanelLink` | White titled card for overview/analytics pages. |
| `PageLoader` | Spinner while a lazy page loads. |

### Lists

| Component | Use |
|---|---|
| `Toolbar({ children, end })` | Row above a list. |
| `SearchInput({ value, onChange })` | Debounced (300 ms) search box. |
| `FilterSelect({ value, onChange, options, allLabel })` | Dropdown filter; empty value = "All". |
| `FilterChips({ filters, onClearAll })` + `ActiveFilter` | Active filters as removable chips. |
| `ViewToggle({ value: "table" \| "grid", onChange })` | List / card view switch. |
| `DateRangeFilter` + `dayStart` / `dayEnd` | From–to dates; converts days to exact ISO start/end in the viewer's time zone. |
| `ServerTable<T>({ columns, rows, rowKey, loading, selectedIds?, onToggleRow?, onToggleAll?, onRowClick? })` + `Column<T>` | Table for server-paginated data: columns with `cell`, `align`, `hideBelow` (responsive), optional checkbox selection for bulk actions. |
| `CardGrid` | Responsive grid with skeletons (card view). |
| `PaginationBar({ page, limit, total, onPageChange, onLimitChange })` | "Showing 21–40 of 132", rows per page, previous/next. |
| `BulkActionBar({ count, onClear, children })` | Appears when rows are selected. |
| `RowActions({ actions })` + `RowAction` | The "⋯" menu: `label`, `icon`, `onClick`, `destructive`, `hidden`, `separatorBefore`. |
| `StatusBadge({ kind, value })` | Coloured pill from `lib/status.ts`. |
| `States.tsx`: `EmptyState`, `NoResults`, `ErrorState` | Nothing yet (with call to action), filters matched nothing (Clear), loading failed (Retry). |
| `Avatar({ name, src })` | Photo or initials. |
| `ReorderList<T>` | Drag-and-drop ordering (dnd-kit; mouse, touch, keyboard) with Move up/down buttons; used by the reorder pages. |

### Permissions and dialogs

| Component | Use |
|---|---|
| `RoleGate({ need: "write" \| "manage", fallback? })` | Renders children only for allowed roles (hides buttons from viewers). |
| `ConfirmDialog.tsx`: `ConfirmProvider`, `useConfirm()` | Promise-based confirmation (see chapter 7). |

### Forms (`app/form/`)

| Export | Use |
|---|---|
| `FormSection({ title, description })` | Titled card with a two-column field grid. |
| `FullWidth` | A field spanning both columns. |
| `SwitchField` | On/off setting with label and explanation. |
| `FormFooter({ submitting, onCancel, submitLabel?, dirty? })` | Cancel / Save row at the end of the form (not sticky). |
| `ImageUploadField({ label, kind, value, onChange, uploadUrl?, helper?, error? })` | Drag-and-drop or click to upload, preview, remove, or "Use a link instead"; respects the platform upload limit; uploads to `/uploads/image?kind=…` (or a custom `uploadUrl`) and stores the returned URL. |
| `applyServerErrors(err, setError)` | Puts the API's `fieldErrors` under the matching fields and returns a message for a toast. |

**Form page recipe** (used by every create/edit page):

```tsx
const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues })
const [goTo, setGoTo] = useState<string | null>(null)
useUnsavedChanges(form.formState.isDirty && goTo === null)
useEffect(() => { if (goTo) navigate(goTo) }, [goTo])           // navigate after the guard is off
async function onSubmit(values) {
  try { await api.post(...); toast.success("Saved"); setGoTo("/dashboard/...") }
  catch (err) { toast.error(applyServerErrors(err, form.setError)) }
}
```

## `layout/` (dashboard frame)

| File | What |
|---|---|
| `DashboardLayout.tsx` | Frame for `/dashboard/*`: fixed `Sidebar` (collapsible, remembered in `localStorage` `evx_sidebar_collapsed`), phone drawer, `Topbar`, `ImpersonationBanner`, `SiteBanner`, `AccountBanners`, then the page (`<Outlet/>`, padding `p-4 sm:p-6`). Shows `MaintenanceScreen` instead when maintenance is on (except while impersonating). |
| `nav.ts` | `NAV` (organization menu, groups Events / Credentials / Insights / Organization, items with `need: "write" \| "manage"`) and `SUPERADMIN_NAV`. **Add new pages here.** |
| `Sidebar.tsx` | Renders a nav (`variant="platform"` for superadmin), hides items the role can't use, plan card with time left at the bottom, collapse button. |
| `Topbar.tsx` | Phone menu button, `NotificationBell` (organizations), account menu (settings, log out). |
| `NotificationBell.tsx` | Unread count, latest 15, click to read/expand/open the link, Mark all as read; refreshes every minute. |
| `AccountBanners.tsx` | Trial running / plan ending soon / expired (with Billing link), and "verify your email" with Resend. |
| `ImpersonationBanner.tsx` | Dark strip "Viewing as … · Back to superadmin" during "log in as". |
| `SiteBanner.tsx` | The sitewide banner from System settings; dismissing hides that exact message (stored per message). |
| `MaintenanceScreen.tsx` | "We'll be right back" with the superadmin's message. |

`superadmin/SuperadminLayout.tsx` is the same frame with `SUPERADMIN_NAV` and an amber strip while maintenance mode is on.

## Feature folders

| Folder | Components |
|---|---|
| `events/` | `EventForm` (create/edit, 5 sections, certificate design picker, categories), `CategoriesEditor` (chips + suggestions; edits existing categories through the API when editing an event), `EventCard` (card view), `CapacityBar` (amber near full, red when full), `PublicLinkCard` (public URL, copy, poster QR PNG, open; explains drafts), `useEventActions` (duplicate / archive / restore / delete with confirmations and toasts, shared by the list and the hub). |
| `registrations/` | `RegistrationForm` (add/edit attendee), `StatusMenu` (badge that opens a status menu; read-only for viewers), `EmailAttendeesDialog` (subject + message to selected people). |
| `speakers/`, `sponsors/`, `sessions/` | `SpeakerForm`, `SponsorForm` (tier, logo), `SessionForm` (time range, speaker from the event, room). |
| `team/` | `InviteDialog` (email + role cards with seats left), `roles.ts` (`ROLE_INFO`, `seatsLeft`). |
| `settings/` | One component per Settings tab: `AccountTab` (profile, password, `TwoFactorSection`, sessions), `OrganizationTab`, `BrandingTab` (logo, colour pickers synced with hex inputs, preview, white label + domain), `CertificatesTab` (signatory + signature with preview), `NotificationsTab` (switches save immediately, with Undo), `DangerZoneTab` (typed name + password). `shared.tsx`: `useReportDirty` (tabs report unsaved state to the page's single guard), `SaveBar`, `saveOrg(fields)` (PATCH `/org/me` + refresh auth). `TwoFactorSection`: set-up flow (QR, code, recovery codes shown once with copy/download), turn off, new codes. |
| `billing/` | `PayDialog` (step 1 where to pay, step 2 plan/method/transaction ID/receipt/notes), `paymentInfo.tsx` (`METHOD_LABEL`, `FEATURE_LABELS`, `PaymentAccountsList`, `hasAccounts`). |
| `certificates/` | `TemplatePickerDialog` (10 layouts × colours with a live PDF preview), `IssueDialogs.tsx` (`IssueOneDialog` with attendee search, `BulkIssueDialog` with the eligible count, `RevokeDialog` with reason), `pdf.ts` (`usePdfUrl(path)` fetches an authenticated PDF into a blob URL for `<iframe>` previews; `openPdf(path)` opens one in a new tab without being blocked as a pop-up). |
| `tickets/` | `QrCode` (QR drawn in the browser with `qrcode`; `ticketQrValue` must match the backend prefix `EVXT:`), `TicketDialog` (big QR, PDF, email again, check in manually / undo). |
| `idcards/` | `DesignPanel` (template thumbnails, fields, logo, layout, live preview, full-page preview), `design.ts` (`useIdCardDesign` stored in `localStorage`, `designQuery` → query string for preview/PDF endpoints). |
| `superadmin/` | `SuperadminLayout`, `ActivityFeed`, `PaymentReviewDialog` (details, receipt, confirm with note + email switch, reject with reason), `TenantDialogs.tsx` (`CreateTenantDialog`, `ChangePlanDialog`, `ExtendDialog`, `SuspendDialog`, `OneTimeSecret` for temporary passwords), `WebsiteContentPanel` (live stats switch, testimonials, logos, social links), `useImpersonate` (confirm → `POST /tenants/:id/impersonate` → `impersonate(token)` → open the dashboard). |
| `public/` | `plans.tsx` (`usePublicPlans`, `useTrialDays`, `PlanCards`, `PlanComparison`, `PaymentBadges`), `PublicShell` + `brandColor` (organization-branded frame for `/e/` and `/o/` pages), `LegalPage` (Terms/Privacy layout with table of contents and the contact email), `SocialLinks`. |
| `home/` | Landing page sections used by `pages/Home.tsx`: `HeroSection` (loads `OceanCanvas` lazily), `TrustedBySection`, `StatsSection`, `HowItWorksSection`, `FeaturesSection`, `PricingSection`, `TestimonialsSection`, `FAQSection`, `CTASection`. Sections fed by System settings → Website hide themselves when empty. |
| `auth/` | `AuthShell` (centred card layout of login/register/reset pages), `RouteGuards` (chapter 7). |
| (root) | `Navbar` (public top menu, mobile menu, Login/Get Started or Dashboard when logged in), `Footer` (links, contact info and social links from settings, maintenance status dot, year), `OceanCanvas` (three.js animated waves for the hero; its own lazy chunk, ~500 kB). |
