import { Link } from 'react-router';
import { LegalPage, type LegalSection } from '@/components/public/LegalPage';

const sections: LegalSection[] = [
  {
    title: 'Who we are',
    body: (
      <p>
        EventoraX is an event management service owned and operated by ORBIT-I, Pakistan (&ldquo;we&rdquo;, &ldquo;us&rdquo;). These Terms apply to everyone who
        uses EventoraX: organizations and their team members, and attendees who register for events, receive tickets or check certificates.
      </p>
    ),
  },
  {
    title: 'Accounts',
    body: (
      <>
        <p>To use the dashboard you create an organization account. You must give correct details and keep your password private. You are responsible for what happens under your account and for the people you invite to your team.</p>
        <p>Organization admins decide who joins their team and with which role (admin, manager or viewer). We may disable an account that is used to break these Terms.</p>
      </>
    ),
  },
  {
    title: 'Free trial, plans and payment',
    body: (
      <>
        <p>
          New organizations get a free trial of the Pro plan. After it ends, the organization becomes read-only until a plan is paid. Plans are paid yearly in
          Pakistani rupees; current prices are on the <Link to="/pricing" className="text-[#7c3aed] hover:underline">Pricing</Link> page.
        </p>
        <p>
          Payment is made by JazzCash, Easypaisa or bank transfer. Your plan starts (or is extended by one year) once we have confirmed the payment. Plans do not
          renew automatically. Prices may change for future periods; a period you have already paid for is not affected.
        </p>
        <p>Payments are not refundable once confirmed, except where we made a mistake or the law requires a refund.</p>
      </>
    ),
  },
  {
    title: 'Your content and attendee data',
    body: (
      <>
        <p>
          Everything your organization puts into EventoraX — events, attendee details, logos, signatures — stays yours. You give us permission to store and process it only to
          run the service for you (for example to create tickets, certificates and ID cards and to send emails you trigger).
        </p>
        <p>
          You are responsible for having the right to collect and use your attendees&rsquo; details and for telling them how you use them. Only add people who have
          registered for or agreed to take part in your event.
        </p>
      </>
    ),
  },
  {
    title: 'Certificates and verification',
    body: (
      <p>
        Certificates issued through EventoraX can be checked by anyone on our public verification page using their code or QR. Your organization is responsible for issuing
        certificates only to people who earned them. A revoked certificate stays visible as &ldquo;revoked&rdquo; together with the reason you gave.
      </p>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <>
        <p>You must not use EventoraX to:</p>
        <ul>
          <li>send spam or messages to people who did not register with you;</li>
          <li>issue fake or misleading certificates;</li>
          <li>upload content that is illegal, hateful or that you have no right to use;</li>
          <li>try to access other organizations&rsquo; data, overload the service or get around its security.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Suspension and closing an account',
    body: (
      <p>
        We may suspend an organization that breaks these Terms or does not pay, and we tell you why. You can close your organization at any time from Settings → Danger zone;
        this permanently deletes its data. Certificates already issued may then no longer be verifiable.
      </p>
    ),
  },
  {
    title: 'Availability',
    body: (
      <p>
        We work hard to keep EventoraX running, but we cannot promise it will never be interrupted — for example during announced maintenance. We are not responsible for losses
        caused by internet, payment-provider or email-provider problems outside our control.
      </p>
    ),
  },
  {
    title: 'Liability',
    body: (
      <p>
        To the extent the law allows, our total liability for any claim is limited to the amount your organization paid us in the 12 months before the claim. We are not liable
        for indirect losses such as lost profit or reputation.
      </p>
    ),
  },
  {
    title: 'Changes and governing law',
    body: (
      <p>
        We may update these Terms; important changes are announced in the dashboard before they take effect. These Terms are governed by the laws of Pakistan.
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 2026"
      intro={
        <p>
          Please read these Terms before using EventoraX. By creating an account, registering for an event or using our website you agree to them. Also see how we handle data
          in our <Link to="/privacy" className="text-[#7c3aed] hover:underline">Privacy Policy</Link>.
        </p>
      }
      sections={sections}
    />
  );
}
