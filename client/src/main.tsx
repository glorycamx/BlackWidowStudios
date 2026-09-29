import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { DEMO } from "./api";
import { primeAudio } from "./buzz";
import { installTapFeedback } from "./motion";
import "./styles.css";

primeAudio();
installTapFeedback();
if (!DEMO && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

const Router = DEMO ? HashRouter : BrowserRouter;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
