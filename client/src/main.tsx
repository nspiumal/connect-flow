import "./vendor/facit/styles/styles.scss";
import "animate.css";
import "react-notifications-component/dist/theme.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initLang } from "./lib/lang";

// Load language strings from /en.json before rendering the app
initLang().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
