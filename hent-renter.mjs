#!/usr/bin/env node
// Henter boliglånsrenter fra SPK og Skue Sparebank og skriver rates.json
// ved siden av boliglan.html. Krever Node 18+ (innebygd fetch).
//
// Kjør:  node hent-renter.mjs
//
// Bankene endrer av og til layout/tekst. Hvis et tall blir null, oppdater
// regex-ene under (SPK_PATTERNS / SKUE_PATTERN) etter teksten på sidene.

import { writeFileSync } from 'node:fs';

const SPK_URL  = 'https://www.spk.no/boliglan/';
const SKUE_URL = 'https://www.skuesparebank.no/lan/boliglan';

const toNum = s => parseFloat(String(s).replace(',', '.'));

// Dekoder HTML-entiteter (sidene bruker f.eks. p&#xE5; for "på").
const decode = s => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

async function getText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (rente-kalkulator)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return decode(await res.text());
}

// SPK: "Vår nominelle rente er på 4,698 prosent ut august."
const SPK_PATTERNS = [
  /nominelle?\s+rente\s+er\s+på\s+(\d{1,2}[,.]\d{1,3})\s*prosent/i,
  /nominell\s+rente[^0-9]{0,40}(\d{1,2}[,.]\d{1,3})\s*(?:%|prosent)/i,
];

// Skue: "Nominell rente fra" og verdien ligger i neste tabellcelle, så vi
// tillater HTML/mellomrom mellom etiketten og første prosenttall.
const SKUE_PATTERN = /Nominell\s+rente\s+fra[\s\S]{0,200}?(\d{1,2}[,.]\d{1,2})\s*%/i;

function firstMatch(html, patterns) {
  for (const p of [].concat(patterns)) {
    const m = html.match(p);
    if (m) return toNum(m[1]);
  }
  return null;
}

const out = { updated: new Date().toISOString().slice(0, 10) };

try {
  const v = firstMatch(await getText(SPK_URL), SPK_PATTERNS);
  if (v == null) throw new Error('fant ikke SPK-rente i HTML');
  out.spkRate = v;
} catch (e) {
  out.spkError = String(e.message);
}

try {
  const v = firstMatch(await getText(SKUE_URL), SKUE_PATTERN);
  if (v == null) throw new Error('fant ikke Skue listepris i HTML');
  out.skueListRate = v;
} catch (e) {
  out.skueError = String(e.message);
}

writeFileSync(new URL('./rates.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log('Skrev rates.json:', out);
if (out.spkError || out.skueError) {
  console.error('\nAdvarsel: noen tall ble ikke funnet. Sjekk regex-ene i skriptet mot dagens sidetekst.');
  process.exitCode = 1;
}
