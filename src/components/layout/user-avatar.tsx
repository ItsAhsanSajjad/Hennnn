"use client";

import Image from "next/image";

interface UserAvatarProps {
  username?: string;
  image?: string | null;
  size?: "header" | "profile" | "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({
  username = "User",
  image,
  size = "header",
  className = "",
}: UserAvatarProps) {
  const initial = (username.trim().charAt(0) || "U").toUpperCase();

  // Size mapping: header = 42x42px, profile = 48x48px (sm = 36px, md = 40px, lg = 56px)
  const sizeStyles =
    size === "header"
      ? "size-[42px] text-[15px]"
      : size === "profile"
        ? "size-12 text-lg"
        : size === "sm"
          ? "size-9 text-sm"
          : size === "lg"
            ? "size-14 text-xl"
            : "size-10 text-base";

  if (image) {
    return (
      <div
        style={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          border: "1px solid rgba(255, 208, 165, 0.4)",
        }}
        className={`relative overflow-hidden rounded-xl bg-[#061A2B] shrink-0 ${sizeStyles} ${className}`}
      >
        <Image
          src={image}
          alt={username}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #F59B52 0%, #D8793F 60%, #B85822 100%)",
        border: "1px solid rgba(255, 208, 165, 0.55)",
        boxShadow:
          "0 3px 10px rgba(184, 88, 34, 0.35), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.45), inset 0 -2px 3px rgba(140, 55, 15, 0.4)",
      }}
      className={`rounded-xl grid place-items-center shrink-0 select-none font-black text-[#FFFDF4] tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] ${sizeStyles} ${className}`}
      aria-hidden="true"
    >
      <span>{initial}</span>
    </div>
  );
}
