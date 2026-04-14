import { LoginForm } from "@/components/LoginForm";
import { prisma } from "@/lib/prisma";
import { getSessionShopId } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function HomePage(){ const shopId=await getSessionShopId(); if(shopId) redirect("/dashboard"); const shops=await prisma.shop.findMany({ where:{ isActive:true }, orderBy:{ name:"asc" }, select:{ id:true, name:true } }); return <div className="mx-auto max-w-md pt-12"><div className="mb-6 text-center"><h1 className="text-3xl font-semibold text-slate-900">WIP Workload</h1><p className="mt-2 text-slate-600">Login and choose your shop to view workload rankings.</p></div><LoginForm shops={shops} /></div>; }
