import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import "./lib/i18n";
import { TRPCProvider } from "@/providers/trpc";
import App from "./App.tsx";

// Apply theme immediately (before first render) to prevent flash
(function applyInitialTheme() {
  try {
    // New storage key is wordai-storage-v2
    const stored = localStorage.getItem("wordai-storage-v2") || localStorage.getItem("wordai-storage");
    const theme = stored ? (JSON.parse(stored).state?.theme ?? "system") : "system";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const active = theme === "system" ? (systemDark ? "dark" : "light") : theme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(active);
  } catch {}
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>
);
