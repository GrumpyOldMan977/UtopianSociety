import type { Metadata } from "next";
import "./globals.css";
import "./civic-completion.css";
import "./blog-completion.css";
import "./sexual-care.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://utopiansocietycorpus.org"),
  title: { default: "The Utopian Society Corpus", template: "%s · Utopian Society Corpus" },
  description: "A living framework for ethical, civic, and human continuity.",
  icons: { icon: "/corpus-mark.jpg", shortcut: "/corpus-mark.jpg" },
  openGraph: {
    title: "The Utopian Society Corpus",
    description: "A living framework for ethical, civic, and human continuity.",
    images: [{ url: "/og.png", width: 1792, height: 921, alt: "Five interlocking rings of the Utopian Society Corpus" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
