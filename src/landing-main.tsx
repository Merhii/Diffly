import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LandingPage from "./LandingPage.tsx";
import "./index.css";

// The public marketing site's entry — deliberately has no DiffProvider and
// no diff-parsing/rendering imports anywhere in its dependency graph, so
// none of that code ships in this bundle. See viewer.html/main.tsx for the
// actual review app, which only ever runs locally via the CLI.
document.documentElement.classList.toggle(
  "dark",
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
);
