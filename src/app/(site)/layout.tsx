import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getVertical } from "@/lib/verticals";

/**
 * Chrome for network-level pages: the brand portal at `/` plus the shared
 * policy pages (about, privacy, terms, contact, editorial-policy,
 * affiliate-disclosure) that apply across every vertical.
 *
 * These render in PORTAL branding — they belong to Firsthand the network, not
 * to any one vertical, so the header shows no category nav.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const portal = getVertical("portal");

  return (
    <>
      <Header
        verticalKey="portal"
        brandName={portal.name}
        categories={portal.navCategories}
        primaryCount={portal.navPrimaryCount}
      />
      <main className="flex-1">{children}</main>
      <Footer verticalKey="portal" />
    </>
  );
}
