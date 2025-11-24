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
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const search = useSearchParams();
  const { lang } = useLanguage();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const message = tr(lang, "login.toast.invalidInputs");
      setErrorMessage(message);
      toast.error(message);
      return;
    }
    setLoading(true);
    try {
      const res = await login({ email, password });
      // For now, keep the token approach until backend supports httpOnly cookies
      setAuthToken(res.token);
      toast.success(tr(lang, "login.toast.success"));
      setErrorMessage(null);
      const next = search.get("next") ?? "/dashboard";
      router.replace(next);
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (anyErr?.response?.status === 401) {
        const message = tr(lang, "login.toast.invalidPassword");
        setErrorMessage(message);
        toast.error(message);
        return;
      }
      const fallback = anyErr?.response?.data?.message ?? tr(lang, "login.toast.error");
      setErrorMessage(fallback);
      toast.error(fallback);
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
                <h1 className="text-2xl font-bold">{tr(lang, "login.heading")}</h1>
                <p className="text-muted-foreground text-balance">{tr(lang, "login.subheading")}</p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">{tr(lang, "login.labels.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={tr(lang, "login.placeholder.email")}
                  required
                  value={email}
                  onChange={(e) => {
                    if (errorMessage) setErrorMessage(null);
                    setEmail(e.target.value);
                  }}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">{tr(lang, "login.labels.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      if (errorMessage) setErrorMessage(null);
                      setPassword(e.target.value);
                    }}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? tr(lang, "login.password.hide") : tr(lang, "login.password.show")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? tr(lang, "login.button.loading") : tr(lang, "login.button.submit")}
                </Button>
                {errorMessage && (
                  <p className="text-sm text-destructive text-center" role="alert">
                    {errorMessage}
                  </p>
                )}
              </div>
              {/* Social sign-in and sign-up removed */}
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img src="https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=1600&auto=format&fit=crop" alt="My-Jalna" className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.25] dark:grayscale" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="backdrop-blur-[2px] bg-background/40 dark:bg-black/30 rounded-md px-4 py-2 shadow-sm">
                <div className="text-xl font-semibold tracking-tight">My-Jalna</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Disclaimer removed as requested */}
    </div>
  );
}
