import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type AvatarProps = {
  photoUrl?: string | null;
  initial: string;
  size: number;
  className?: string;
  style?: CSSProperties;
};

/** Shared avatar rendering for the Compte header menu and the account sidebar — shows the uploaded photo when set, otherwise the first-name initial. */
export function Avatar({ photoUrl, initial, size, className, style }: AvatarProps) {
  if (photoUrl) {
    return (
      <span className={cn("block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size, ...style }}>
        <Image src={photoUrl} alt="" width={size} height={size} unoptimized className="size-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ width: size, height: size, ...style }}
    >
      {initial}
    </span>
  );
}
