import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

function getBomSummaryHtml() {
  const url = "http://www.bom.gov.au/places/tas/montrose";
  return fetch(url).then((r) => r.text());
}

type BomSummary = {
  rain: {
    time: string;
    rainfall: string;
    chance: string;
  }[];
};

export async function getBomSummary() {
  let html: string;
  try {
    html = await getBomSummaryHtml();
  } catch (e) {
    throw Error("Failed to request BOM data: " + e);
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) {
    throw new Error("Failed to parse HTML");
  }

  const result: BomSummary = {
    rain: [],
  };

  const summary = document.querySelectorAll(".pme table tbody tr");

  let first = true;
  for (const s of summary) {
    if (first) {
      first = false;
      continue;
    }

    const t = (s as Element).querySelector(".time");
    const r = (s as Element).querySelector(".amt");
    const c = (s as Element).querySelector(".coaf");

    if (!t || !r || !c) {
      continue;
    }

    const time = t.textContent
      ?.trim()
      ?.replace(/ /g, "")
      ?.replaceAll(":00", "");

    result.rain.push({
      time: time || "",
      rainfall: r.textContent?.trim() || "",
      chance: c.textContent?.trim() || "",
    });
  }

  result.rain.reverse();

  return result;
}
