const SENSIBO_DEVICE_ID = Deno.env.get("SENSIBO_DEVICE_ID");
const SENSIBO_API_KEY = Deno.env.get("SENSIBO_API_KEY") || "";

const url = `https://home.sensibo.com/api/v2/pods/${SENSIBO_DEVICE_ID}/historicalMeasurements`;

export async function getSensiboSummary() {
  const data = await fetchSensiboData();

  const temps = data.result?.temperature;
  if (!temps?.length) {
    return null;
  }

  return temps[temps.length - 1];
}

async function fetchSensiboData() {
  const params = new URLSearchParams();
  params.append("apiKey", SENSIBO_API_KEY);
  params.append("days", "1");

  const res = await fetch(`${url}?${params}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch sensibo data: ${res.statusText}: ${await res.text()}`,
    );
  }

  const json = await res.json();
  return json as {
    status: string;
    result: {
      temperature: { time: string; value: number }[];
      humidity: { time: string; value: number }[];
    };
  };
}
