import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Privacy Policy — backpocket",
  description:
    "Learn how backpocket collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href={routes.home} className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <ThemeSwitcher />
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 pt-32 pb-20">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="font-serif text-4xl font-medium tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 23, 2026
          </p>

          <hr className="my-8" />

          <section>
            <h2>Overview</h2>
            <p>
              Backpocket ("we", "us", or "our") is a personal bookmarking
              application that lets you save, organize, and optionally share
              links. We are committed to protecting your privacy and being
              transparent about the data we collect.
            </p>
            <p>
              This Privacy Policy explains what information we collect, how we
              use it, and your rights regarding your data. It applies to our web
              application, browser extensions, and mobile applications.
            </p>
          </section>

          <section>
            <h2>Information We Collect</h2>

            <h3>Account Information</h3>
            <p>
              When you create an account, we collect your email address and name
              (if provided) through our authentication provider, Clerk. This
              information is used solely for account management and
              authentication.
            </p>

            <h3>Saved Content</h3>
            <p>When you save a link, we collect and store:</p>
            <ul>
              <li>
                <strong>URL</strong> — The web address you save
              </li>
              <li>
                <strong>Page metadata</strong> — Title, description, site name,
                and preview image automatically extracted from the page
              </li>
              <li>
                <strong>Your notes</strong> — Any personal notes or annotations
                you add
              </li>
              <li>
                <strong>Organization data</strong> — Tags and collections you
                create
              </li>
              <li>
                <strong>Timestamps</strong> — When you saved the content
              </li>
            </ul>

            <h3>Content Snapshots</h3>
            <p>
              For reader mode functionality, we fetch and store the readable
              content of web pages you save. This helps preserve content that
              may change or become unavailable. Snapshots include:
            </p>
            <ul>
              <li>Article text and HTML content</li>
              <li>Author information (if available)</li>
              <li>Word count and language</li>
            </ul>

            <h3>Usage Data</h3>
            <p>We collect minimal usage data to improve the service:</p>
            <ul>
              <li>
                <strong>Visit counts</strong> — For public spaces, we maintain a
                simple visitor counter (no cookies or fingerprinting)
              </li>
              <li>
                <strong>Client source</strong> — Whether saves came from web,
                mobile, or browser extension (for product improvement)
              </li>
            </ul>
          </section>

          <section>
            <h2>Information We Do NOT Collect</h2>
            <p>We want to be clear about what we don't collect:</p>
            <ul>
              <li>
                <strong>Browsing history</strong> — We only store URLs you
                explicitly save, not your general browsing activity
              </li>
              <li>
                <strong>Location data</strong> — We don't collect GPS, IP-based
                location, or any geolocation data
              </li>
              <li>
                <strong>Health information</strong> — We don't collect any
                health-related data
              </li>
              <li>
                <strong>Financial information</strong> — We don't process
                payments or collect financial data
              </li>
              <li>
                <strong>Personal communications</strong> — We don't access your
                emails, messages, or other communications
              </li>
              <li>
                <strong>Keystroke logging</strong> — We don't track your typing,
                mouse movements, or clicks
              </li>
              <li>
                <strong>Third-party tracking</strong> — We don't use advertising
                trackers or sell data to advertisers
              </li>
            </ul>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>
                <strong>Provide the service</strong> — Store and organize your
                saved links
              </li>
              <li>
                <strong>Enable features</strong> — Power search, reader mode,
                and public sharing
              </li>
              <li>
                <strong>Detect duplicates</strong> — Prevent accidentally saving
                the same link twice
              </li>
              <li>
                <strong>Improve the product</strong> — Understand how features
                are used to make them better
              </li>
              <li>
                <strong>Communicate with you</strong> — Send important service
                updates (no marketing emails)
              </li>
            </ul>
          </section>

          <section>
            <h2>Data Sharing and Third Parties</h2>
            <p>
              <strong>We do not sell your data.</strong> We do not share your
              personal information with third parties for their marketing
              purposes.
            </p>
            <p>We use the following service providers to operate Backpocket:</p>
            <ul>
              <li>
                <strong>Clerk</strong> — Authentication and user management
              </li>
              <li>
                <strong>Convex</strong> — Database and real-time data
                synchronization
              </li>
              <li>
                <strong>Vercel</strong> — Web hosting and analytics
              </li>
            </ul>
            <p>
              These providers only access data necessary to perform their
              services and are bound by their own privacy policies.
            </p>
          </section>

          <section>
            <h2>Public Spaces</h2>
            <p>
              If you choose to make your space or individual saves public, that
              content becomes visible to anyone with the URL. Public content
              includes:
            </p>
            <ul>
              <li>Your space name and bio</li>
              <li>Saves you've marked as public (URL, title, description)</li>
              <li>Public collections and their contents</li>
              <li>A visitor counter showing total views</li>
            </ul>
            <p>
              Private saves, notes, and private collections are{" "}
              <strong>never</strong> publicly visible.
            </p>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul>
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for stored data</li>
              <li>Secure authentication via Clerk</li>
              <li>Regular security updates and monitoring</li>
            </ul>
          </section>

          <section>
            <h2>Your Rights and Choices</h2>
            <p>You have control over your data:</p>
            <ul>
              <li>
                <strong>Access</strong> — View all your saved content in the app
              </li>
              <li>
                <strong>Export</strong> — Download all your data in JSON format
                from Settings
              </li>
              <li>
                <strong>Delete</strong> — Remove individual saves or delete your
                entire account
              </li>
              <li>
                <strong>Visibility</strong> — Control which saves are public or
                private
              </li>
            </ul>
            <p>
              To delete your account and all associated data, please contact us
              at the email address below.
            </p>
          </section>

          <section>
            <h2>Browser Extension</h2>
            <p>
              This section specifically addresses data collection by the
              Backpocket browser extension for Chrome and Firefox.
            </p>

            <h3>Data the Extension Collects</h3>
            <p>
              <strong>Personally identifiable information:</strong> The
              extension uses Clerk for authentication, which collects your email
              address for account creation and sign-in.
            </p>
            <p>
              <strong>Web history (user-initiated only):</strong> When you
              explicitly click to save a page, the extension collects:
            </p>
            <ul>
              <li>The URL of the page you are saving</li>
              <li>The page title</li>
              <li>The timestamp of when you saved it</li>
            </ul>
            <p>
              This data is only collected when you actively choose to save a
              link. The extension does <strong>not</strong> passively monitor or
              record your browsing activity.
            </p>

            <h3>Data the Extension Does NOT Collect</h3>
            <ul>
              <li>
                <strong>Health information</strong> — No health-related data
              </li>
              <li>
                <strong>Financial and payment information</strong> — No payment
                or financial data
              </li>
              <li>
                <strong>Authentication credentials</strong> — Clerk handles all
                passwords and credentials; the extension only stores session
                tokens
              </li>
              <li>
                <strong>Personal communications</strong> — No access to emails,
                messages, or chats
              </li>
              <li>
                <strong>Location</strong> — No GPS, IP geolocation, or location
                data
              </li>
              <li>
                <strong>User activity</strong> — No click tracking, mouse
                position monitoring, scroll tracking, or keystroke logging
              </li>
              <li>
                <strong>Website content</strong> — The extension saves page
                titles and URLs only, not the actual content (text, images,
                videos) of pages
              </li>
            </ul>

            <h3>Extension Permissions</h3>
            <p>The extension requests only the permissions it needs:</p>
            <ul>
              <li>
                <strong>Active Tab</strong> — To read the URL and title of the
                page you're saving (only activated when you click the extension
                icon)
              </li>
              <li>
                <strong>Storage</strong> — To save your preferences locally in
                the browser
              </li>
              <li>
                <strong>Host permission for backpocket.my</strong> — To
                communicate with our servers for authentication and saving links
              </li>
            </ul>

            <h3>Data Use Certification</h3>
            <p>We certify that:</p>
            <ul>
              <li>
                We do <strong>not</strong> sell or transfer user data to third
                parties, outside of the approved use cases (authentication via
                Clerk, data storage via Convex)
              </li>
              <li>
                We do <strong>not</strong> use or transfer user data for
                purposes unrelated to the extension's single purpose of saving
                and organizing links
              </li>
              <li>
                We do <strong>not</strong> use or transfer user data to
                determine creditworthiness or for lending purposes
              </li>
            </ul>
          </section>

          <section>
            <h2>Children's Privacy</h2>
            <p>
              Backpocket is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13.
            </p>
          </section>

          <section>
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or your data,
              please contact us at:
            </p>
            <p>
              <a
                href="mailto:privacy@backpocket.my"
                className="text-denim hover:text-denim-deep"
              >
                privacy@backpocket.my
              </a>
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href={routes.home} className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Backpocket
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
