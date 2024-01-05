const url = "https://zenquotes.io/api/today";

const cache = new Map<string, { author: string; quote: string }>();

const fallback = {
  author: "Bud",
  quote: "The quote of the day cannot be found.",
};

export async function getQuoteOfTheDay() {
  const key = new Date().toLocaleDateString("en-AU", {
    timeZone: "Australia/Hobart",
  });

  if (!cache.has(key)) {
    const data = await fetchQuoteOfTheDay();
    if (!data) {
      cache.set(key, fallback);
    } else {
      cache.set(key, { author: data.a, quote: data.q });
    }
  }

  return cache.get(key) || fallback;
}

async function fetchQuoteOfTheDay() {
  const res = await fetch(`${url}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch quote of the day: ${
        res.statusText
      }: ${await res.text()}`,
    );
  }

  const json = await res.json();
  return json[0] as {
    /** quote text */
    q: string;
    /** author name */
    a: string;
    /** author image (key required) */
    i: string;
    /** character count*/
    c: string;
    /** pre-formatted HTML quote*/
    h: string;
  };
}
