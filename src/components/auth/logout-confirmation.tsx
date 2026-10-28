"use client";

import { useState } from "react";
import { LogOut, X } from "lucide-react";

import { cn } from "@/lib/utilities/cn";
import { logoutAction } from "@/server/actions/auth";

import type { ReactNode } from "react";

type LogoutAppearance = "user" | "profile" | "admin" | "admin-icon" | "shortcut" | "custom";

export function LogoutConfirmation({
  portal = "user",
  appearance = "user",
  compact = false,
  children,
}: {
  portal?: "user" | "admin";
  appearance?: LogoutAppearance;
  compact?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isIcon = appearance === "admin-icon";

  return (
    <>
      {children ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            appearance === "shortcut"
              ? "group flex flex-col items-center justify-start text-center focus:outline-none min-w-0 w-full cursor-pointer"
              : "cursor-pointer",
          )}
          aria-label="Log out of account"
        >
          {children}
        </button>
      ) : (
        <button
          type="button"
          aria-label={compact || isIcon ? "Log out" : undefined}
          onClick={() => setOpen(true)}
          className={cn(
            appearance === "user" || appearance === "profile"
              ? "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-mist bg-surface px-4 py-2 text-sm font-semibold text-forest shadow-sm transition-colors hover:bg-ivory"
              : "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-bold text-charcoal/65 transition-colors hover:bg-danger/10 hover:text-danger",
            appearance === "profile" ? "w-full" : "",
            compact ? "justify-center px-2" : "",
            isIcon ? "size-11 min-h-0 justify-center px-0" : "",
          )}
        >
          <LogOut aria-hidden="true" size={isIcon ? 19 : 18} />
          {!compact && !isIcon ? "Log out" : null}
        </button>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/45 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-md rounded-lg border border-mist bg-surface p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="pak-kicker">Secure session</p>
                <h2 id="logout-title" className="mt-2 text-xl font-black text-forest">
                  Log out of your account?
                </h2>
                <p className="mt-2 text-sm leading-6 text-charcoal/70">
                  You will need to login again to access your{" "}
                  {portal === "admin" ? "admin" : "account"} workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cancel logout"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-charcoal/60 hover:bg-ivory hover:text-forest"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-md border border-mist bg-surface px-4 text-sm font-bold text-forest hover:bg-ivory"
              >
                Stay logged in
              </button>
              <form action={logoutAction}>
                <input type="hidden" name="portal" value={portal} />
                <button
                  type="submit"
                  className="min-h-11 w-full rounded-md bg-danger px-4 text-sm font-bold text-white transition-colors hover:bg-red-800 sm:w-auto"
                >
                  Yes, log out
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
