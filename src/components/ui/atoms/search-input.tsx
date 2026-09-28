import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  className?: string;
};

/**
 * daisyUI `input` with a leading search glyph. 56px tall — a filter field you tap into, not a
 * required record field.
 */
export function SearchInput({ className, ...rest }: SearchInputProps) {
  return (
    <label className={cn("input input-md w-full items-center gap-2 bg-base-100", className)}>
      <Search aria-hidden className="size-4 shrink-0 text-base-content/45" />
      <input type="search" className="grow bg-transparent text-[15px] focus:outline-none" {...rest} />
    </label>
  );
}
