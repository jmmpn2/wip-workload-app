import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect(session.mustChangePassword ? "/change-password" : "/dashboard");

  return (
    <div className="mx-auto max-w-md pt-8">
      <div className="mb-5 text-center">
        <Image src="/logo.png" alt="WIP Feeder" width={320} height={159} className="mx-auto h-auto w-[280px]" priority />
        <p className="mt-3 text-slate-600">Sign in with your email address to access your shop dashboard.</p>
      </div>
      <LoginForm />
    </div>
  );
}
