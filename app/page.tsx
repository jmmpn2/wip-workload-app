import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";
import { prisma } from "@/lib/prisma";
import { getSessionShopId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const shopId = await getSessionShopId();
  if (shopId) redirect("/dashboard");

  const shops = await prisma.shop.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-md pt-8">
      <div className="mb-5 text-center">
        <Image src="/logo.png" alt="WIP Feeder" width={320} height={159} className="mx-auto h-auto w-[280px]" priority />
        <p className="mt-3 text-slate-600">Login and choose your shop to view workload rankings.</p>
      </div>
      <LoginForm shops={shops} />
    </div>
  );
}
