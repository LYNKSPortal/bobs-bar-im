"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock, Martini } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminSignIn } from "@/server/actions/admin-auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [state, formAction, pending] = useActionState(adminSignIn, undefined);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="grid gap-1.5">
        <Label htmlFor="email">Username</Label>
        <Input id="email" name="email" type="text" required autoComplete="username" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="mt-2 bg-gold text-gold-foreground hover:bg-gold/90" disabled={pending}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lock className="mr-2 size-4" />}
        Sign in
      </Button>

      <Link href="/admin/forgot-password" className="text-center text-sm text-muted-foreground hover:text-gold">
        Forgot password?
      </Link>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-gold text-gold-foreground">
            <Martini className="size-6" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold">Admin Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage bookings, availability, and settings.</p>
        </div>

        <Suspense fallback={<div className="mt-6 h-48" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
