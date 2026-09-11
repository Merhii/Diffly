import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { DiffProvider } from "./context/DiffContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DiffProvider>
      <App />
    </DiffProvider>
  </StrictMode>,
);
