import { RegisterForm } from "@/components/admin/RegisterForm";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  if (!env.ENABLE_REGISTER) {
    return (
      <div className="w-full max-w-md text-center">
        <h1 className="text-h1 text-neutral-900">Registration disabled</h1>
        <p className="text-caption text-neutral-700 mt-sm">
          Public sign-ups are currently turned off.
        </p>
      </div>
    );
  }
  return (
    <div className="w-full max-w-md">
      <h1 className="text-display text-neutral-900 text-center">Create workspace</h1>
      <p className="text-caption text-neutral-700 text-center mt-xs">
        Start collecting AI-generated reviews
      </p>
      <div className="mt-lg">
        <RegisterForm />
      </div>
    </div>
  );
}
