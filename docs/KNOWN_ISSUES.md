# Known Issues & Open Questions

## Open questions blocking full completion

1. Bulk-generate CSV structure — Saeed's newer mockup shows event/date
   per recipient row instead of one shared event. Waiting on his
   confirmation.

2. Certificate template list not yet sent to Hasan — his certTemplateId
   field is ready but stays null until we send him the list of 50
   template IDs and names.

3. Revoke reason field missing on certificate-preview.html's revoke
   modal, though present on the list page's modal.

4. Single-certificate-generate validation rule undecided — should it
   require a real attended registration, or accept free-text name/email?
   Needs confirmation from team/spec owner.

## Technical debt before production

- Data storage is a placeholder (JSON files), must migrate to MySQL
- No authentication on any endpoint in this module yet
- Email sending is a placeholder (console.log only)
- File storage is local disk, won't persist in most deployments
- Event/registration data is placeholder mock data, not live

## Package version pitfalls

- uuid must stay pinned to v9
- archiver must stay pinned to v6

## Fixed bugs, kept here for reference

- PDFKit default margins broke ID card PDFs on small page sizes, fixed
  with zero margins