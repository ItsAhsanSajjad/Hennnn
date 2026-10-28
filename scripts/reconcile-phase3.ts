import { prisma } from "../src/lib/database/prisma";
import { runPhase3Reconciliation } from "../src/server/services/reconciliation-service";

async function main() {
  const asJson = process.argv.includes("--json");
  const result = await runPhase3Reconciliation();

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Phase 3 reconciliation: ${result.ok ? "OK" : "FINDINGS"}`);
  console.log(`Findings: ${result.findings.length}`);
  for (const finding of result.findings) {
    console.log(
      `${finding.severity.toUpperCase()} ${finding.code} ${finding.entityType} ${
        finding.entityId ?? ""
      } - ${finding.message}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
