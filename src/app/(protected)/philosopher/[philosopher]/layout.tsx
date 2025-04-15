import { cookies } from "next/headers";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@/auth";
import { getPhilosopher } from "@/actions/philosopher";
export const experimental_ppr = true;

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { philosopher: string };
}) {
  const { philosopher: philosopherKey } = await params;
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";
  const philosopher = await getPhilosopher(philosopherKey);
  if (!philosopher) {
    return <div>Philosopher not found</div>;
  }

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} philosopher={philosopher} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
