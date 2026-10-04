/* Terms of Use and Privacy Policy. Bump LEGAL_VERSION whenever either text changes in substance:
   signed-in users are then asked once to accept the new version. */
export const LEGAL_VERSION = "2026-10-04";
export const LEGAL_UPDATED = "4 October 2026";
export const CONTACT = "support@uniteuow.com";

// Each section: { id, title, body: [paragraph | { list: [items] }] }
export const TERMS = {
  title: "Terms of Use",
  intro: "These terms explain how Unite works and what we expect from everyone who uses it. They're written to be read, so they're short. By using Unite you agree to them.",
  sections: [
    { id: "who", title: "Who can use Unite", body: [
      "Unite is for students and staff of the University of Wollongong in Dubai (UOWD). You need to be at least 16 years old.",
      "Unite is run by students. It is not an official UOWD service, although official clubs and teams use it.",
    ] },
    { id: "accounts", title: "Your account", body: [
      "You sign in with your UOWD email address. We email you a one-time code; there is no password to remember.",
      "Keep access to your email safe, because anyone who can read it can sign in as you. Use your real name so clubs and hosts know who you are.",
      "A demo account is available so anyone can try Unite. Nothing done in the demo account is real.",
    ] },
    { id: "clubs", title: "Joining clubs and applications", body: [
      "Sports teams register through the official UOWD tryouts form. Other clubs take applications through Unite.",
      "When you apply, your name, email, WhatsApp number and message are shared with that club's owner and helpers so they can contact you. Each club decides who it accepts.",
      "Club owners and helpers must only use applicants' details to reply about the club, and must not share them with anyone else.",
    ] },
    { id: "hosting", title: "Hosting events and moderation", body: [
      "Any signed-in student can submit an event. Every event is reviewed by the Unite team before it's published, usually within 2 hours.",
      "We may reject, edit the listing of, or remove any event that is unsafe, misleading, against UOWD rules or the law of the UAE, or doesn't match what was described.",
      "As a host you are responsible for your event: the venue, safety, what you promised attendees and, for group trips, buying and delivering the tickets.",
    ] },
    { id: "tickets", title: "Tickets and payments", body: [
      "Payments on Unite are in demo mode for now: no real money is charged, and the card shown is a test card.",
      "Each ticket has a signed QR code. Showing someone else's ticket, copying a QR code or reselling tickets for more than you paid is not allowed.",
    ] },
    { id: "refunds", title: "Refunds and cancelled events", body: [
      "If an event is cancelled, or a group trip doesn't reach its minimum number of people by its deadline, everyone who paid is refunded in full automatically.",
      "Otherwise, refunds are up to the host. Contact them first; if you can't reach them, contact us.",
    ] },
    { id: "behaviour", title: "Acceptable behaviour", body: [
      "Be respectful. Don't use Unite to:",
      { list: [
        "harass, threaten or discriminate against anyone",
        "post false, misleading or illegal content, or events that break UOWD rules or UAE law",
        "spam, scam, or contact people for anything unrelated to the club or event",
        "pretend to be someone else, or use another person's account",
        "interfere with Unite, try to break its security, or collect other users' data",
      ] },
    ] },
    { id: "content", title: "Photos and content you upload", body: [
      "You keep ownership of what you upload (event photos, your profile photo, descriptions). You give Unite permission to show it in the app for as long as it's on Unite.",
      "Only upload photos you took or have the right to use, and don't upload photos of people who haven't agreed to it.",
    ] },
    { id: "suspension", title: "Suspension of accounts", body: [
      "If someone breaks these terms we may remove their content, cancel their events, or suspend or close their account. Where we can, we'll explain why first.",
      "You can stop using Unite at any time and ask us to delete your account.",
    ] },
    { id: "liability", title: "Our responsibility", body: [
      "We work hard to keep Unite running and safe, but it's provided as is. Events are organised by their hosts, not by Unite, and we aren't responsible for what happens at them.",
    ] },
    { id: "changes", title: "Changes to these terms", body: [
      "We may update these terms as Unite grows. If the change matters, we'll ask you to accept the new version the next time you use the app. The date at the top always shows the latest version.",
    ] },
    { id: "contact", title: "Contact", body: [`Questions about these terms? Email ${CONTACT}.`] },
  ],
};

export const PRIVACY = {
  title: "Privacy Policy",
  intro: "This policy explains what Unite collects, why, who can see it and how you stay in control. We collect only what Unite needs to work. We don't sell data and we don't show ads.",
  sections: [
    { id: "collect", title: "What we collect", body: [
      { list: [
        "Account: your name, UOWD email address and, if you add them, your student ID and profile photo.",
        "Contacts: your WhatsApp number and Telegram username, if you add them, and the Telegram chat you connect for notifications.",
        "Club applications: the club, your year/major, your message and the application's status.",
        "Tickets: which events you booked, your ticket and its QR code, and whether it was scanned at the door.",
        "Hosted events: everything you submit for an event, including photos and contact details.",
        "Your consent: which version of these documents you accepted, and when.",
      ] },
      "We don't collect your location, contacts list or device identifiers.",
    ] },
    { id: "why", title: "Why we use it", body: [
      { list: [
        "to sign you in and keep your account secure",
        "to send your applications to clubs and tell you their decision",
        "to issue and check tickets",
        "to review and publish events, and to let hosts and guests reach each other",
        "to send emails and Telegram messages you'd expect (codes, applications, tickets, reminders)",
      ] },
      "We never use your data for advertising and never sell it.",
    ] },
    { id: "who-sees", title: "Who sees what", body: [
      { list: [
        "Club owners and helpers see the name, email, WhatsApp number and message of people who apply to their club. No other club can.",
        "Event hosts see the names of their attendees, and the contact details you choose to share for a group trip.",
        "Other students see your name only where it's part of something public, such as an event you host.",
        "The Unite team sees submitted events to moderate them and can access data when needed to keep Unite safe.",
      ] },
    ] },
    { id: "stored", title: "Where it's stored", body: [
      "We use a small number of trusted services to run Unite:",
      { list: [
        "Vercel: hosts the app and runs its server functions (including file storage).",
        "Upstash Redis: our database for applications, events, tickets and uploaded event photos.",
        "Resend: sends our emails (sign-in codes and notifications).",
        "Telegram: delivers notifications to people who connect it, and is used by moderators to review events.",
      ] },
      "Some of your details (like your profile photo and saved tickets) are also kept on your own device so the app works offline.",
    ] },
    { id: "keep", title: "How long we keep it", body: [
      { list: [
        "Declined club applications are deleted 90 days after the decision. Other applications are kept for about a year.",
        "Event submissions and their photos are kept for 120 days.",
        "Tickets are kept until the event is over and any refunds are settled.",
        "Your account details are kept until you ask us to delete them.",
      ] },
    ] },
    { id: "cookies", title: "Cookies and local storage", body: [
      "Unite uses only essential storage: your device keeps you signed in and remembers settings like the theme. There are no tracking cookies, analytics trackers or ads.",
    ] },
    { id: "rights", title: "Download or delete your data", body: [
      `You can see and edit most of your details in Profile. To get a copy of everything we hold about you, or to delete your account and data, email ${CONTACT} from your UOWD address. We'll reply within 30 days.`,
      "Signing out removes your data from that device.",
    ] },
    { id: "security", title: "Security", body: [
      "Sign-in uses one-time codes, tickets carry signed QR codes, and applicants' details are only sent to that club's team. No system is perfectly secure, but we'll tell you quickly if something affects your data.",
    ] },
    { id: "changes", title: "Changes to this policy", body: [
      "If we change how we use your data, we'll update this page and ask you to accept the new version the next time you use Unite.",
    ] },
    { id: "contact", title: "Contact", body: [`Questions or requests about your privacy? Email ${CONTACT}.`] },
  ],
};

export const DOCS = { terms: TERMS, privacy: PRIVACY };
