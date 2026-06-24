import "./index.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeThemeListener } from "./lib/theme";
import { initLang } from "./lib/lang";

// Initialize theme colors from environment variables
initializeThemeListener();

// Load language strings from /en.json before rendering the app
initLang().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
