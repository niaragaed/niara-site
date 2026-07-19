type FlagSize = "sm" | "md" | "lg";

// flag-icons dimensiona pelo font-size (width: 1.333em, proporção 4:3) —
// por isso o tamanho é controlado via text-*, não h-*/w-*. Esses três
// tamanhos cobrem os usos do site: sm (~16px) em tabelas/listas densas,
// md (~18px) em linhas um pouco mais destacadas, lg (~20px) no cabeçalho
// do ativo selecionado.
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
