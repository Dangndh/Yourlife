"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useQuickLog } from "./quick-log";

export function QuickLogOpenButton({ label, variant = "default" }: { label: string; variant?: "default" | "outline" }) {
  const { open } = useQuickLog();
  return (
    <Button type="button" onClick={open} variant={variant} size={variant === "outline" ? "sm" : "default"}>
      <Plus />
      {label}
    </Button>
  );
}
