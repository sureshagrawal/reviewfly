import { LoginForm } from "@/components/admin/LoginForm";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="text-display text-neutral-900 text-center">ReviewFly</h1>
      <p className="text-caption text-neutral-700 text-center mt-xs">
        Sign in to your workspace
      </p>
      <div className="mt-lg">
        <LoginForm allowRegister={env.ENABLE_REGISTER} />
      </div>
    </div>
  );
}
