import React from "react";
import ReactDOM from "react-dom/client"; 
import AppRoutes from "./routes/index";
import { BrowserRouter } from "react-router-dom";
import "./index.css"; // Tailwind CSS 포함
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
