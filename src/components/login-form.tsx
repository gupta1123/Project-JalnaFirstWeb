"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, setAuthToken } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error("Invalid inputs");
      return;
    }
    setLoading(true);
    try {
      const res = await login({ email, password });
      setAuthToken(res.token);
      toast.success("Logged in");
      const next = search.get("next") ?? "/dashboard";
      router.replace(next);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      toast.error(anyErr?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 w-full">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[520px]">
          <form className="p-8 md:p-10" onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">Login to your Jalna First admin</p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              {/* Social sign-in and sign-up removed */}
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img src="https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=1600&auto=format&fit=crop" alt="Jalna First" className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.25] dark:grayscale" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="backdrop-blur-[2px] bg-background/40 dark:bg-black/30 rounded-md px-4 py-2 shadow-sm">
                <div className="text-xl font-semibold tracking-tight">Jalna First</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Disclaimer removed as requested */}
    </div>
  );
}

