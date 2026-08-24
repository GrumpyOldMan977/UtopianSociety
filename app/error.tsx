"use client";

import Link from "next/link";
import { HttpErrorPage } from "./components/HttpErrorPage";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <HttpErrorPage
    code="500"
    browserTitle="Site interruption · The Utopian Society"
    eyebrow="HTTP 500 · Civic instrument interrupted"
    title="A small cog has declared independence."
    explanation="The request reached the Society, but this page could not complete its work. Trying once more is safe; no ceremonial hammer is required."
    note="If the interruption continues, return to the frontispiece and approach by another path."
    actions={<>
      <button className="http-error-primary" type="button" onClick={reset}>Try this page again</button>
      <Link href="/">Return to the frontispiece</Link>
      <Link href="/transparency-ledger">Check the public record</Link>
    </>}
  />;
}
