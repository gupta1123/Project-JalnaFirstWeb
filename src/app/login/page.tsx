import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <Suspense fallback={<div className="grid place-items-center p-8">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

