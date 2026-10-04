import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./preview.css";

document.documentElement.setAttribute("data-scroll-behavior", "smooth");
createRoot(document.getElementById("root")!).render(<App />);
