import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

const env = await load();

const { SOLAR_PASSWORD, SOLAR_USERNAME } = env;

const baseUrl = "https://portal.solaranalytics.com.au";
const tokenUrl = "/api/v3/token";

const siteDataUrl = (siteId: number) => `/api/v2/site_data/${siteId}`;
const liveSiteDataUrl = "/api/v3/live_site_data";

const siteId = 313156;

type TokenResponse = {
  token: string;
  expires: string;
  duration: number;
};

async function getSolarToken() {
  const headers = new Headers();
  headers.append(
    "Authorization",
    `Basic ${btoa(SOLAR_USERNAME + ":" + SOLAR_PASSWORD)}`,
  );

  const res = await fetch(`${baseUrl}${tokenUrl}`, { headers });
  if (!res.ok) {
    throw Error("Failed to authenticate with Solar Analytics");
  }
  const json = await res.json();
  return json as TokenResponse;
}

async function fetchLiveSiteData(
  token: TokenResponse,
  options: {
    siteId: number;
    lastSix?: boolean;
    utcHour?: Date;
    lastHour?: boolean;
    batteryData?: false;
  },
) {
  const params = new URLSearchParams();
  params.append("site_id", String(options.siteId));
  if (options.utcHour)
    params.append("utc_hour", formatISODateTime(options.utcHour));
  if (options.lastSix) params.append("last_six", "true");
  if (options.lastHour) params.append("last_hour", "true");
  if (options.batteryData) params.append("battery_data", "true");

  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token.token}`);

  const res = await fetch(`${baseUrl}${liveSiteDataUrl}?${params}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch live solar data: ${res.statusText}`);
  }

  type LiveSiteDataResponse = {
    data: {
      count: number;
      consumed: number;
      generated: number;
      t_stamp: string;
    }[];
    site_timezone: string;
  };

  const json = (await res.json()) as LiveSiteDataResponse;
  return json;
}

async function fetchSiteData(
  token: TokenResponse,
  options: {
    siteId: number;
    tStart?: Date;
    tEnd?: Date;
    gran?: "minute" | "hour" | "day" | "month" | "year";
    raw?: boolean;
    trunc?: boolean;
    all?: boolean;
  },
) {
  const tokenExpired = token && new Date(token.expires) < new Date();
  if (!token || tokenExpired) {
    token = await getSolarToken();
  }

  const params = new URLSearchParams();
  params.append("site_id", String(options.siteId));
  if (options.tStart) params.append("tstart", formatLocalDate(options.tStart));
  if (options.tEnd) params.append("tend", formatLocalDate(options.tEnd));
  if (options.gran) params.append("gran", options.gran);
  if (options.raw) params.append("raw", "true");
  if (options.trunc) params.append("trunc", "true");
  if (options.all) params.append("all", "true");

  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token.token}`);

  const res = await fetch(`${baseUrl}${siteDataUrl(siteId)}?${params}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch solar data: ${res.statusText}`);
  }

  type SiteDataResponse = {
    data: {
      t_stamp: string;
      energy_expected: number;
      energy_generated: number;
      energy_consumed: number;
      load_hot_water: number;
      load_air_conditioner: number;
      load_lighting: number;
      load_powerpoint: number;
    }[];
    t_step: number;
  };

  const json = (await res.json()) as SiteDataResponse;
  return json;
}

let token: TokenResponse | null = null;

async function getSolarData() {
  const tokenExpired = token && new Date(token.expires) < new Date();
  if (!token || tokenExpired) {
    token = await getSolarToken();
  }

  const [liveData, siteData] = await Promise.all([
    fetchLiveSiteData(token, { siteId, lastSix: true }),
    fetchSiteData(token, {
      siteId,
      gran: "day",
      tStart: new Date(),
      all: true,
    }),
  ]);

  return {
    liveData,
    siteData,
  };
}

export async function getSolarDataSummary() {
  const { siteData, liveData } = await getSolarData();

  const lastestLive = liveData.data[liveData.data.length - 1];
  const latestSite = siteData.data[siteData.data.length - 1];

  const liveTimeStamp = new Date(lastestLive.t_stamp).toLocaleTimeString(
    "en-AU",
    {
      timeZone: "Australia/Hobart",
      timeStyle: "short",
    },
  );

  const siteTimeStamp = new Date(latestSite.t_stamp).toLocaleDateString(
    "en-AU",
    {
      timeZone: "Australia/Hobart",
      dateStyle: "medium",
    },
  );

  return {
    liveConsumed: lastestLive.consumed,
    liveGenerated: lastestLive.generated,
    liveTimeStamp,

    dayConsumed: latestSite.energy_consumed,
    dayGenerated: latestSite.energy_generated,
    dayHotWater: latestSite.load_hot_water,
    dayAirCon: latestSite.load_air_conditioner,
    dayLighting: latestSite.load_lighting,
    dayPowerpoint: latestSite.load_powerpoint,
    dayTimeStamp: siteTimeStamp,
  };
}

function formatISODateTime(d: Date) {
  const s = d.toISOString();
  return s.substring(0, s.length - 5);
}

function formatLocalDate(d: Date) {
  const parts = d
    .toLocaleDateString("en-AU", {
      timeZone: "Australia/Hobart",
    })
    .split("/");
  const [day, month, year] = parts;

  return `${year}${month}${day}`;
}
