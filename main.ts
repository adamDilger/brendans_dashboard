// import { getBomSummary } from "./bom.ts";
// getBomSummary();

import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

const env = await load();

const { SOLAR_PASSWORD, SOLAR_USERNAME } = env;

const baseUrl = "https://portal.solaranalytics.com.au";
const tokenUrl = "/api/v3/token";
const liveSiteDataUrl = "/api/v3/live_site_data";

const siteId = 313156;

async function getSolarToken() {
  const headers = new Headers();
  headers.append(
    "Authorization",
    `Basic ${btoa(SOLAR_USERNAME + ":" + SOLAR_PASSWORD)}`,
  );

  const res = await fetch(`${baseUrl}${tokenUrl}`, { headers });
  const json = await res.json();
  return json as TokenResponse;
}

let token: TokenResponse | null = null;

async function getSolarSummary() {
  const tokenExpired = token && new Date(token.expires) < new Date();
  if (!token || tokenExpired) {
    token = await getSolarToken();
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const params = new URLSearchParams();
  params.append("site_id", String(siteId));
  params.append("utc_hour", formatDate(startOfToday));
  params.append("last_six", "false");
  params.append("last_hour", "true");
  params.append("battery_data", "false");

  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token.token}`);

  const res = await fetch(`${baseUrl}${liveSiteDataUrl}?${params}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch solar data: ${res.statusText}`);
  }

  const json = await res.text();
  console.log(json);
}

type TokenResponse = {
  token: string;
  expires: string;
  duration: number;
};

getSolarSummary();

function formatDate(d: Date) {
  const s = d.toISOString();
  return s.substring(0, s.length - 5);
}
