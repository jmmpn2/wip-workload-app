import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();

const stages = [
  ["Check in", "PERCENT", 1.0, null, true, 10],
  ["Disassembly", "PERCENT", 0.9, null, true, 20],
  ["A+", "PERCENT", 0.75, null, true, 30],
  ["Waiting on Authorization", "PERCENT", 0.85, null, true, 40],
  ["Waiting on Parts", "PERCENT", 0.8, null, true, 50],
  ["Body", "PERCENT", 0.6, null, true, 60],
  ["Paint", "PERCENT", 0.4, null, true, 70],
  ["Reassembly", "PERCENT", 0.3, null, true, 80],
  ["Mechanical", "PERCENT", 0.5, null, true, 90],
  ["PDR/Sublet", "PERCENT", 0.5, null, true, 100],
  ["Detail", "PERCENT", 0.2, null, true, 110],
  ["Ready for QC", "PERCENT", 0.1, null, true, 120],
] as const;

const techs = [["Nick Sladek", 270], ["Bryan Smith", 75], ["Justin O'Hare", 75], ["Jason Wilcox", 165], ["Chris Baldwin", 270], ["Kolin Netemeyer", 75]] as const;

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
  return `${salt}:${key.toString("hex")}`;
}

async function main() {
  await prisma.stageRule.deleteMany();
  for (const stage of stages) {
    await prisma.stageRule.create({ data: { stageName: stage[0], logicType: stage[1], remainingPct: stage[2], fixedHours: stage[3], includeInLoad: stage[4], sortOrder: stage[5] } });
  }

  const shop = await prisma.shop.upsert({ where: { name: "Creve Coeur" }, update: { needsWorkThreshold: 125, overloadedThreshold: 250 }, create: { name: "Creve Coeur", needsWorkThreshold: 125, overloadedThreshold: 250 } });
  for (const tech of techs) {
    await prisma.technician.upsert({ where: { shopId_name: { shopId: shop.id, name: tech[0] } }, update: { capacity: tech[1], isActive: true }, create: { shopId: shop.id, name: tech[0], capacity: tech[1], isActive: true } });
  }

  const superAdminHash = await hashPassword("changeme");
  await prisma.user.upsert({
    where: { email: "johnm@schaeferautobody.com" },
    update: { role: "SUPER_ADMIN", shopId: null, isActive: true, mustChangePassword: true },
    create: { email: "johnm@schaeferautobody.com", passwordHash: superAdminHash, role: "SUPER_ADMIN", shopId: null, isActive: true, mustChangePassword: true },
  });

  console.log("Seed complete");
}

main().catch(console.error).finally(async () => prisma.$disconnect());
