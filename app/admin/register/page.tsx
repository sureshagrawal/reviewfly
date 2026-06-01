import { RegisterForm } from "@/components/admin/RegisterForm";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  if (!env.ENABLE_REGISTER) {
    return (
      <div className="text-center">
        <h1 className="text-h1 text-neutral-900">Registration disabled</h1>
        <p className="text-caption text-neutral-700 mt-sm">
          Public sign-ups are currently turned off.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-col items-center mb-lg">
        <span className="h-14 w-14 rounded-pill bg-gradient-brand text-neutral-0 flex items-center justify-center text-h1 font-semibold shadow-card-md">
          R
        </span>
        <h1 className="text-display text-neutral-900 text-center mt-md">Create workspace</h1>
        <p className="text-caption text-neutral-700 text-center mt-xs">
          Start collecting AI-generated reviews
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
