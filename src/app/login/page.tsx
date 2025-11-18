"use client";

import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <LanguageProvider>
      <LoginPageContent />
    </LanguageProvider>
  );
}

function LoginPageContent() {
  const { lang } = useLanguage();
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <Suspense fallback={<div className="grid place-items-center p-8">{tr(lang, "login.loading")}</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

