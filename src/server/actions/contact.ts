"use server";

import { sendContactMessageEmail } from "@/lib/email";
import { getBusinessSettings } from "@/lib/settings";
import { contactFormSchema } from "@/lib/validations";

export async function submitContactForm(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  const settings = await getBusinessSettings();
  if (settings.email) {
    await sendContactMessageEmail({
      to: settings.email,
      fromName: parsed.data.name,
      fromEmail: parsed.data.email,
      message: parsed.data.message,
    });
  }

  return { ok: true };
}
