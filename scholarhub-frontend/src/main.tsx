import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Debug: Check if React and DOM are available
if (typeof document !== "undefined") {
} else {
}

const root = document.getElementById("root");

createRoot(root!).render(<App />);
