import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function Loader({ size = "md", className, text }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-cyan-400", sizeClasses[size])} />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  );
}