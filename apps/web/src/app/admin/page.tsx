import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AdminView } from "@/components/admin-view";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-5 pt-2 pb-16 sm:pl-16">
        <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Administración</h1>
        <AdminView />
      </main>
    </>
  );
}
