import { Link } from 'react-router';
import { LegalPage, type LegalSection } from '@/components/public/LegalPage';

const sections: LegalSection[] = [
  {
    title: 'What we collect',
    body: (
      <>
        <p><strong>Organizations and team members:</strong> name, email, phone, organization name, logo, signature image and brand colours, and your password (stored only as a secure hash — we can never see it).</p>
        <p><strong>Attendees</strong> (added by an organization or registering themselves): name, email, phone, department, roll number and registration category, plus check-in time and certificates issued.</p>
        <p><strong>Payments:</strong> the plan, amount, payment method, transaction ID and the receipt image you upload. We never receive card or bank login details.</p>
        <p><strong>Technical data:</strong> login attempts, IP address, browser type and an activity log of actions taken in the dashboard.</p>
      </>
    ),
  },
  {
    title: 'How we use it',
    body: (
      <ul>
        <li>to run the service: events, registrations, QR tickets, certificates, ID cards and analytics;</li>
        <li>to send emails you trigger (tickets, certificates, invites) and account emails (verification, password reset, payment confirmations, plan reminders);</li>
        <li>to confirm payments and keep billing records;</li>
        <li>to keep accounts secure — for example locking an account after repeated wrong passwords;</li>
        <li>to support you when you contact us.</li>
      </ul>
    ),
  },
  {
    title: 'Who controls attendee data',
    body: (
      <p>
        The organization running an event decides what attendee data to collect and how to use it; we process it on their behalf. If you are an attendee and want your details
        changed or removed, please contact the organizer first — we will help if they can&rsquo;t.
      </p>
    ),
  },
  {
    title: 'What is public',
    body: (
      <p>
        When someone checks a certificate code, the verification page shows the recipient&rsquo;s name, the event, the organization, the issue date and whether it is valid or
        revoked. Email addresses and phone numbers are never shown publicly.
      </p>
    ),
  },
  {
    title: 'Sharing',
    body: (
      <>
        <p>We do not sell personal data. We share it only with:</p>
        <ul>
          <li>the email provider that delivers our emails;</li>
          <li>our hosting provider, which stores the database and files;</li>
          <li>authorities, when the law requires it.</li>
        </ul>
        <p>Each organization&rsquo;s data is kept separate; other organizations cannot see it.</p>
      </>
    ),
  },
  {
    title: 'How long we keep data',
    body: (
      <p>
        We keep an organization&rsquo;s data while its account exists, including after a plan expires, so it can renew without losing anything. Closing an organization from
        Settings deletes its events, attendees, certificates and files permanently. Billing records and security logs may be kept longer where the law requires it.
      </p>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        Passwords are hashed, links in emails expire, every request checks who you are and which organization you belong to, certificate PDFs are stored privately, and every
        important action is logged. No system is perfectly secure, so please use a strong password and log out of shared computers.
      </p>
    ),
  },
  {
    title: 'Cookies and storage',
    body: (
      <p>
        We don&rsquo;t use advertising or tracking cookies. Your browser stores your login session and a few preferences (for example a dismissed banner or your last-used
        event) so the dashboard works smoothly.
      </p>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <p>
        You can see and correct your own account details in Settings, and ask us for a copy of your data or for it to be deleted. Organization admins can export their
        attendee lists and close their organization at any time.
      </p>
    ),
  },
  {
    title: 'Changes',
    body: <p>If we change this policy in an important way, we will announce it in the dashboard and update the date at the top of this page.</p>,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026"
      intro={
        <p>
          This policy explains what personal data EventoraX (operated by ORBIT-I, Pakistan) collects, why, and the choices you have. It works together with our{' '}
          <Link to="/terms" className="text-[#7c3aed] hover:underline">Terms of Service</Link>.
        </p>
      }
      sections={sections}
    />
  );
}
