"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Martini } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/server/actions/admin-password-reset";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-gold text-gold-foreground">
            <Martini className="size-6" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your admin account.</p>
        </div>

        {state?.success ? (
          <div className="mt-6 grid gap-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-gold" />
            <p className="text-sm text-foreground">Your password has been reset.</p>
            <Button render={<Link href="/admin/login" />} nativeButton={false} className="bg-gold text-gold-foreground hover:bg-gold/90">
              Sign in
            </Button>
          </div>
        ) : (
          <form action={formAction} className="mt-6 grid gap-4">
            <input type="hidden" name="token" value={token} />
            <div className="grid gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={4} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" minLength={4} />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" className="mt-2 bg-gold text-gold-foreground hover:bg-gold/90" disabled={pending}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Reset password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
