import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import "./lib/i18n";
import { TRPCProvider } from "@/providers/trpc";
import App from "./App.tsx";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const stored = localStorage.getItem("wordai-storage");
    const theme = stored ? JSON.parse(stored).state?.theme || "system" : "system";
    const active = theme === "system" ? systemTheme : theme;
    root.classList.remove("light", "dark");
    root.classList.add(active);
  }, []);

  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>
);
