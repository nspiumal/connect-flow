import "./index.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeThemeListener } from "./lib/theme";

// Initialize theme colors from environment variables
initializeThemeListener();

createRoot(document.getElementById("root")!).render(<App />);
