export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /**
   * Safe internal path the client should navigate to after a successful action.
   * Used for logins so the browser can offer to save the password on a real
   * navigation, instead of a soft server-action redirect.
   */
  redirectTo?: string;
};

export const initialActionState: ActionState = {
  status: "idle",
};

export function formError(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

export function formSuccess(message: string): ActionState {
  return {
    status: "success",
    message,
  };
}

export function formRedirect(redirectTo: string, message?: string): ActionState {
  return {
    status: "success",
    message,
    redirectTo,
  };
}
