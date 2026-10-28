"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { updatePublicContentAction } from "@/server/actions/admin";

type PublicContent = {
  operatorName?: string;
  supportHours?: string;
  verificationTimeframe?: string;
  eggSalePaymentTimeframe?: string;
  heroLabel?: string;
  heroHeadline?: string;
  heroDescription?: string;
};

export function PublicContentForm({ content }: { content: PublicContent }) {
  const [state, action, pending] = useActionState(updatePublicContentAction, initialActionState);
  return (
    <form action={action} className="grid gap-5">
      <FormStatus state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business operator" name="operatorName">
          <TextInput
            id="operatorName"
            name="operatorName"
            defaultValue={content.operatorName ?? "Business operator details pending verification"}
            required
          />
        </Field>
        <Field label="Support hours" name="supportHours">
          <TextInput
            id="supportHours"
            name="supportHours"
            defaultValue={content.supportHours ?? "Support schedule pending confirmation"}
            required
          />
        </Field>
        <Field label="Payment verification timeframe" name="verificationTimeframe">
          <TextInput
            id="verificationTimeframe"
            name="verificationTimeframe"
            defaultValue={content.verificationTimeframe ?? "Shown during payment review"}
            required
          />
        </Field>
        <Field label="Egg-sale payment timeframe" name="eggSalePaymentTimeframe">
          <TextInput
            id="eggSalePaymentTimeframe"
            name="eggSalePaymentTimeframe"
            defaultValue={
              content.eggSalePaymentTimeframe ?? "Shown before an egg-sale request is submitted"
            }
            required
          />
        </Field>
      </div>
      <Field label="Hero label" name="heroLabel">
        <TextInput
          id="heroLabel"
          name="heroLabel"
          defaultValue={content.heroLabel ?? "Poultry records and egg sales"}
          required
        />
      </Field>
      <Field label="Hero heading" name="heroHeadline">
        <TextInput
          id="heroHeadline"
          name="heroHeadline"
          defaultValue={content.heroHeadline ?? "Buy Your Hen. Track Every Egg."}
          required
        />
      </Field>
      <Field label="Hero description" name="heroDescription">
        <textarea
          id="heroDescription"
          name="heroDescription"
          defaultValue={
            content.heroDescription ??
            "Choose a poultry plan, submit payment details and receive access after verification. Your hens, egg records, sale requests and payment updates stay organized in one account."
          }
          className="min-h-28 rounded-md border border-mist px-3 py-2 text-charcoal"
          required
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save public content"}
      </Button>
    </form>
  );
}
