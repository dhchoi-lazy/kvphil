import type { ComponentProps } from "react";

import { type SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { BetterTooltip } from "@/components/ui/tooltip";

import { SidebarLeftIcon } from "./icons";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <BetterTooltip content="Toggle Sidebar" align="start">
      <Button
        onClick={toggleSidebar}
        variant="outline"
        className={cn("md:px-2 md:h-fit", className)}
      >
        <SidebarLeftIcon size={16} />
      </Button>
    </BetterTooltip>
  );
}
