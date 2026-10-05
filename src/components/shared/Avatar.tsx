import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  shape = "circle",
  size = "md",
}: {
  name: string;
  src?: string | null;
  shape?: "circle" | "square";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-base" }[size];
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-md";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(sizeClasses, shapeClass, "object-cover shrink-0 border border-[#e9e4ff] bg-white")}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses,
        shapeClass,
        "shrink-0 bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white font-semibold flex items-center justify-center"
      )}
    >
      {getInitials(name)}
    </div>
  );
}