import type { Metadata } from "next";
import "./globals.css";
import "./civic-completion.css";
import "./blog-completion.css";
import "./sexual-care.css";
import "./transparency-ledger.css";
import "./citizen-portal.css";
import "./editorial-studio.css";
import { SiteAnalytics } from "./components/SiteAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://utopiansocietycorpus.org"),
  title: { default: "The Utopian Society", template: "%s · The Utopian Society" },
  description: "A living framework for ethical, civic, and human continuity.",
  icons: { icon: "/corpus-mark.jpg", shortcut: "/corpus-mark.jpg" },
  openGraph: {
    title: "The Utopian Society",
    description: "A living framework for ethical, civic, and human continuity.",
    images: [{ url: "/og.png", width: 1792, height: 921, alt: "Five interlocking rings of The Utopian Society" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var v=localStorage.getItem('utopia.textSize');document.documentElement.dataset.utopiaTextSize=(v==='standard'||v==='largest')?v:'large'}catch(e){document.documentElement.dataset.utopiaTextSize='large'}})();` }} />
    </head>
    <body>{children}<SiteAnalytics /></body>
  </html>;
}
