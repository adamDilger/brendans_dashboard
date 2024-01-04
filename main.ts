import { getBomSummary } from "./bom.ts";
import { getSolarDataSummary } from "./solarAnalytics.ts";

(async function () {
  const s = new Date();
  const [bom, solar] = await Promise.all([
    getBomSummary(),
    getSolarDataSummary(),
  ]);

  console.log(bom);
  console.log(solar);

  const e = new Date();
  // print elapsed time in milliseconds
  console.log("Total request time:", e.getTime() - s.getTime() + "ms");
})();
