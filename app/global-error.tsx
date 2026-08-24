"use client";

import Link from "next/link";
import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en">
    <head><title>System interruption · The Utopian Society</title><meta name="robots" content="noindex, nofollow" /></head>
    <body>
      <main className="http-error-page is-global">
        <header className="http-error-emergency-header">
          <Link href="/" className="wordmark"><span className="wordmark-mark" role="img" aria-label="Five interlocking rings" /><strong>The Utopian Society</strong></Link>
        </header>
        <section className="http-error-stage" aria-labelledby="global-error-title">
          <div className="http-error-orbit" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="http-error-code" aria-hidden="true">500</div>
          <article className="http-error-vellum">
            <span className="http-error-eyebrow">HTTP 500 · System interruption</span>
            <h1 id="global-error-title">The machinery has misplaced a cog.</h1>
            <p>The site encountered a broader interruption before it could finish assembling this page.</p>
            <aside>It has been asked to count its cogs again. This may take less time than forming a committee.</aside>
            <nav aria-label="Error recovery choices">
              <button className="http-error-primary" type="button" onClick={reset}>Try again</button>
              <Link href="/">Return to the frontispiece</Link>
            </nav>
          </article>
        </section>
      </main>
    </body>
  </html>;
}
