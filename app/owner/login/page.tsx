import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";

export const dynamic = "force-dynamic";

export default function OwnerLoginPage() {
  return (
    <div>
      <div className="flex flex-col items-center mb-lg">
        <span className="h-14 w-14 rounded-pill bg-gradient-brand text-neutral-0 flex items-center justify-center text-h1 font-semibold shadow-card-md">
          R
        </span>
        <h1 className="text-display text-neutral-900 text-center mt-md">ReviewFly Owner</h1>
        <p className="text-caption text-neutral-700 text-center mt-xs">
          Platform superadmin sign in
        </p>
      </div>
      <OwnerLoginForm />
    </div>
  );
}
