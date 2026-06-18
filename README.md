# Boliglån – flytte til SPK?

Kalkulator som sammenligner å beholde hele lånet i Skue Sparebank mot å flytte
2,3 mill til Statens pensjonskasse (SPK).

## Filer
- `boliglan.html` – selve kalkulatoren. Åpne i nettleser (dobbeltklikk).
  Alt regnes lokalt; alle felter kan justeres manuelt uten auto-henting.
- `hent-renter.mjs` – henter dagens renter og skriver `rates.json`.
- `rates.json` – sist hentede renter (lages av skriptet).

## Auto-henting av renter

Krever Node 18+ (har innebygd `fetch`).

```bash
node hent-renter.mjs
```

Skriptet henter:
- **SPK** nominell rente fra https://www.spk.no/boliglan/
- **Skue** listepris (ordinært boliglån) fra https://www.skuesparebank.no/lan/boliglan

og skriver dem til `rates.json`. I `boliglan.html` trykker du så
**«Hent renter fra rates.json»**. Appen setter SPK-renta direkte og regner din
Skue-rente som **listepris − din rabatt** (standard rabatt 0,15 pp = 5,70 → 5,55 %).

> **Obs:** Knappen leser `rates.json`, og nettlesere blokkerer dette når sida
> åpnes direkte som fil (`file://`). Start derfor en liten lokal server i mappa
> og åpne via `http://localhost:8000/boliglan.html`:
> ```bash
> python3 -m http.server 8000
> ```
> Uten server fungerer alt unntatt selve auto-hentingen (skriv rentene inn manuelt).

> Tilbudsrenta på *hele* lånet (5,2 %) er forhandlet og endres ikke av auto-hentingen –
> den justerer du manuelt.

### Daglig oppdatering (valgfritt, macOS)

Legg en linje i `crontab -e` for å hente kl. 07 hver dag:

```cron
0 7 * * * cd "/Users/magnus/Library/CloudStorage/OneDrive-Personlig/Claude/Rente" && /usr/local/bin/node hent-renter.mjs >> hent.log 2>&1
```

(Sjekk stien til node med `which node`.)

## Hvis et tall blir borte
Bankene endrer av og til tekst/layout. Får du `spkError`/`skueError` i
`rates.json`, oppdater regex-ene `SPK_PATTERNS` / `SKUE_PATTERN` i
`hent-renter.mjs` etter dagens sidetekst.
