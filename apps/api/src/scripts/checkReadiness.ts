import { ReadinessValidator } from "../config/readiness.js";

async function main() {
  console.log("Checking DevFlow system readiness...\n");
  const report = await ReadinessValidator.check();
  ReadinessValidator.printBanner(report);

  if (report.overallStatus === "critical") {
    console.error("❌ Critical configuration issues detected! Please review errors above.\n");
    process.exit(1);
  } else if (report.overallStatus === "degraded") {
    console.warn("⚠️ System is operational with warnings. Review checklist before production deployment.\n");
    process.exit(0);
  } else {
    console.log("🎉 All DevFlow subsystems and requirements are fully operational!\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Failed to run readiness check:", err);
  process.exit(1);
});
