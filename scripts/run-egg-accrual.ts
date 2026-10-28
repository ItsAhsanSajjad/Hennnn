import { runEggAccrual } from "../src/server/services/egg-accrual";
import { prisma } from "../src/lib/database/prisma";

function readFlag(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const date = readFlag("date");
  const dryRun = process.argv.includes("--dry-run");
  const result = await runEggAccrual({ productionDate: date, dryRun });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
