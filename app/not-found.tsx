import type { Metadata } from "next";
import { HttpErrorPage } from "./components/HttpErrorPage";

export const metadata: Metadata = {
  title: "Path not found",
  description: "The requested path is not part of the public Utopian Society corpus.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <HttpErrorPage
    code="404"
    browserTitle="Path not found · The Utopian Society"
    eyebrow="HTTP 404 · Uncharted path"
    title="This path has wandered beyond the corpus."
    explanation="The address does not point to a current public record. It may be mistyped, moved, or part of the private Civic Portal."
    note="The map is confident. Maps can be smug, but in this instance it appears to be correct."
  />;
}
