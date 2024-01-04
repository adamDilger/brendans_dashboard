import { getBomSummary } from "./bom.ts";
import { getSolarDataSummary } from "./solarAnalytics.ts";

Deno.serve(async (_req: Request) => {
  const s = new Date();
  const [bom, solar] = await Promise.all([
    getBomSummary(),
    getSolarDataSummary(),
  ]);

  const e = new Date();
  const elapsedMillis = e.getTime() - s.getTime() + "ms";

  return new Response(
    JSON.stringify({
      ...bom,
      ...solar,
      requestTime: elapsedMillis,
    }),
  );
});
