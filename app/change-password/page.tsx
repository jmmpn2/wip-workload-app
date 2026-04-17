import Image from "next/image";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (!session.mustChangePassword) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md pt-8">
      <div className="mb-5 text-center">
        <Image src="/logo.png" alt="WIP Feeder" width={280} height={139} className="mx-auto h-auto w-[240px]" priority />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Change your password</h1>
        <p className="mt-2 text-slate-600">Your temporary password must be changed before you can use the app.</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
