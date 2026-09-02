import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Sonner también intenta inyectar estos estilos en runtime. La imagen Docker
// bloquea correctamente los bloques <style> mediante CSP, por eso deben formar
// parte del CSS estático generado por Vite.
import "sonner/dist/styles.css";
import "./styles/index.css";
import App from "./App.tsx";
import { configureValidationMessages } from "./lib/configure-validation.ts";

configureValidationMessages();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
