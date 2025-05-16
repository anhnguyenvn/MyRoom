import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { NotificationProvider } from "./context/NotificationContext";
import "./index.css";

// BabylonJS Core and Loaders
import "@babylonjs/core/Loading/loadingScreen"; // Optional: for default BJS loading screen behavior
import "@babylonjs/loaders/glTF"; // Crucial for GLTF/GLB files
import { Database } from "@babylonjs/core/Offline/database"; // For IndexedDB caching

// Enable BabylonJS IndexedDB Caching
Database.IDBStorageEnabled = true;
console.log("BabylonJS IndexedDB Caching Enabled.");

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
