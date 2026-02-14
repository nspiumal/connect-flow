import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeThemeListener } from "./lib/theme";

// Initialize theme colors from environment variables
initializeThemeListener();

createRoot(document.getElementById("root")!).render(<App />);
