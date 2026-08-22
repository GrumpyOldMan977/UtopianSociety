import type { Metadata } from "next";
import Link from "next/link";
import { PublicCivicProfile } from "../../components/PublicCivicProfile";
import { SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "Adreto Nagdo Senoviros · Public Civic Profile",
  description: "The public civic profile of the founder of the Utopian Society.",
};

const slug = "adreto-nagdo-senoviros";

export default function AdretoPublicProfile() {
  return <main className="citizen-portal-page public-civic-profile">
    <SiteHeader />
    <nav className="citizen-portal-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">The Utopian Society</Link><span>/</span>
      <Link href="/?map=civic-portal">Civic Portal</Link><span>/</span><b>Public Profile</b>
    </nav>
    <PublicCivicProfile slug={slug} />
  </main>;
}
