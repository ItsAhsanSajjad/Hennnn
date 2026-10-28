"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus } from "@/components/ui/forms";
import { PasswordInput } from "@/components/ui/password-input";
import { changeOwnPasswordAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4">
      <FormStatus state={state} />
      <Field
        label="Current password"
        name="currentPassword"
        error={state.fieldErrors?.currentPassword}
      >
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          hasError={Boolean(state.fieldErrors?.currentPassword)}
          required
        />
      </Field>
      <Field
        label="New password"
        name="newPassword"
        hint="Use at least 10 characters."
        error={state.fieldErrors?.newPassword}
      >
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          hasError={Boolean(state.fieldErrors?.newPassword)}
          required
        />
      </Field>
      <Field
        label="Confirm new password"
        name="confirmPassword"
        error={state.fieldErrors?.confirmPassword}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          hasError={Boolean(state.fieldErrors?.confirmPassword)}
          required
        />
      </Field>
      <div className="pt-2">
        <Button type="submit" disabled={pending}>
          <KeyRound aria-hidden="true" size={18} />
          {pending ? "Updating password..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
