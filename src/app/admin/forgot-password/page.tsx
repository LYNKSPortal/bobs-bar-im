"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Mail, Martini } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/server/actions/admin-password-reset";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-gold text-gold-foreground">
            <Martini className="size-6" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your admin login and we&rsquo;ll send you a reset link.
          </p>
        </div>

        {state?.message ? (
          <div className="mt-6 grid gap-3 text-center">
            <p className="text-sm text-foreground">{state.message}</p>
            {state.devResetUrl && (
              <div className="rounded-lg border border-dashed border-border bg-muted p-3 text-left text-xs">
                <p className="mb-1 font-medium text-muted-foreground">
                  No email service is configured, so here&rsquo;s your reset link:
                </p>
                <Link href={state.devResetUrl} className="break-all text-gold underline">
                  {state.devResetUrl}
                </Link>
              </div>
            )}
            <Link href="/admin/login" className="text-sm text-gold hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form action={formAction} className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Username / email</Label>
              <Input id="email" name="email" type="text" required autoComplete="username" />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" className="mt-2 bg-gold text-gold-foreground hover:bg-gold/90" disabled={pending}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
              Send reset link
            </Button>

            <Link href="/admin/login" className="text-center text-sm text-muted-foreground hover:text-gold">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
