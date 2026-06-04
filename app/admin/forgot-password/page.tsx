import { ForgotPasswordForm } from "@/components/admin/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="flex flex-col items-center mb-lg">
        <span className="h-14 w-14 rounded-pill bg-gradient-brand text-neutral-0 flex items-center justify-center text-h1 font-semibold shadow-card-md">
          R
        </span>
        <h1 className="text-display text-neutral-900 text-center mt-md">Forgot password</h1>
        <p className="text-caption text-neutral-700 text-center mt-xs">
          We will send you a reset link
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
