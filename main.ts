import "https://deno.land/std@0.210.0/dotenv/load.ts";

import { getBomSummary } from "./bom.ts";
import { getSolarDataSummary } from "./solarAnalytics.ts";
import { getSensiboSummary } from "./sensibo.ts";
import { getQuoteOfTheDay } from "./quotes.ts";

Deno.serve(async (req: Request) => {
  const s = new Date();
  const [bom, solar, sensibo, quote] = await Promise.all([
    getBomSummary(),
    getSolarDataSummary(),
    getSensiboSummary(),
    getQuoteOfTheDay(),
  ]);

  const e = new Date();
  const elapsedMillis = e.getTime() - s.getTime() + "ms";

  if (req.headers.get("accept") === "application/json") {
    return new Response(
      JSON.stringify({
        ...bom,
        ...solar,
        ...sensibo,
        ...quote,
        requestTime: elapsedMillis,
      }),
    );
  }

  // plain text response
  let o = ``;
  o += `Request Time Millis: ${elapsedMillis}\n`;
  o += `\n--- BOM Montrose Weather ---\n`;
  o += `Current_Temp: ${bom.currentTemp}\n`;
  o += `Todays_Max: ${bom.todaysMax}\n`;
  o += `\n--- BOM Montrose Rain ---\n`;
  for (const value of bom.rain) {
    o += `${value.time}: ${value.chance},${value.rainfall}\n`;
  }
  o += `\n--- Solar Analytics ---\n`;
  o += `Live_Consumed: ${solar.liveConsumed}\n`;
  o += `Live_Generated: ${solar.liveGenerated}\n`;
  o += `Live_TimeStamp: ${solar.liveTimeStamp}\n`;
  o += `Day_Consumed: ${solar.dayConsumed}\n`;
  o += `Day_Generated: ${solar.dayGenerated}\n`;
  o += `Day_HotWater: ${solar.dayHotWater}\n`;
  o += `Day_AirCon: ${solar.dayAirCon}\n`;
  o += `Day_Lighting: ${solar.dayLighting}\n`;
  o += `Day_Powerpoint: ${solar.dayPowerpoint}\n`;
  o += `Day_TimeStamp: ${solar.dayTimeStamp}\n`;

  o += `\n--- Sensibo Temp ---\n`;
  o += `Current_Temp: ${sensibo ? `${sensibo.value}*C` : "n/a"}\n`;

  o += `\n--- Quote of the day ---\n`;
  o += `Quote: ${quote.quote}\n`;
  o += `Quote_Author: ${quote.author}\n`;

  return new Response(o);
});
