import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind.css";

const Popup: React.FC = () => {
  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Hello, Tailwind!</h1>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Click me
      </button>
    </div>
  );
};
const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
