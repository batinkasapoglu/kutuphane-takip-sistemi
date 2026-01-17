import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <Toaster position="top-right" richColors closeButton />
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
