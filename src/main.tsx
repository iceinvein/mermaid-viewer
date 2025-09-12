import { HeroUIProvider } from "@heroui/system";
import "@/styles/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("Root container not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  </React.StrictMode>,
);
