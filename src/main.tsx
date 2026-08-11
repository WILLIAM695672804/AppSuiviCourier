import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import { Fournisseurs } from "@/app/Fournisseurs";
import { routeur } from "@/app/routeur";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fournisseurs>
      <RouterProvider router={routeur} />
    </Fournisseurs>
  </StrictMode>,
);
