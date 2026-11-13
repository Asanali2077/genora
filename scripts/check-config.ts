import { appConfig, quizConfig, paywallConfig, analyzeMock } from "../config";
console.log(`config OK: brand=${appConfig.brand.name}, quiz steps=${quizConfig.steps.length}, plans=${paywallConfig.plans.length}, mocks=${Object.keys(analyzeMock).join(",")}`);
