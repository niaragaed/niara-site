type FlagSize = "sm" | "md" | "lg";

// flag-icons sizes by font-size (width: 1.333em, 4:3 ratio), which is why
// the size is controlled with text-*, not h-*/w-*. These three sizes cover
// the site's uses: sm (~16px) in dense tables/lists, md (~18px) in slightly
// more prominent rows, lg (~20px) in the selected asset's header.
const SIZE_CLASSES: Record<FlagSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
};

export function Flag({
  country,
  size = "sm",
  className = "",
}: {
  country: string;
  size?: FlagSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`fi fi-${country} inline-block shrink-0 rounded-[2px] align-middle ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
