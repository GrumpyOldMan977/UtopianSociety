import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

type HttpErrorPageProps = {
  code: string;
  browserTitle: string;
  eyebrow: string;
  title: string;
  explanation: string;
  note: string;
  actions?: ReactNode;
};

export function HttpErrorPage({ code, browserTitle, eyebrow, title, explanation, note, actions }: HttpErrorPageProps) {
  return <main className="http-error-page">
    <title>{browserTitle}</title>
    <meta name="robots" content="noindex, nofollow" />
    <SiteHeader />
    <section className="http-error-stage" aria-labelledby="http-error-title">
      <div className="http-error-orbit" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="http-error-code" aria-hidden="true">{code}</div>
      <article className="http-error-vellum">
        <span className="http-error-eyebrow">{eyebrow}</span>
        <h1 id="http-error-title">{title}</h1>
        <p>{explanation}</p>
        <aside>{note}</aside>
        <nav aria-label="Error recovery choices">
          {actions || <>
            <Link className="http-error-primary" href="/">Return to the frontispiece</Link>
            <Link href="/utopian-society">Explore the Society</Link>
            <Link href="/blogs-essays">Read Blogs &amp; Essays</Link>
          </>}
        </nav>
      </article>
    </section>
  </main>;
}
