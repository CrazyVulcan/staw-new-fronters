# Star Trek Attack Wing Remodulated

A local fleet builder based on Utopia, with authentic card images, a ship-by-ship fleet spread, searchable and sortable cards, Utopia's equipment/cost rules, editable SPUDS values, and checked TTS exports.

## Start

Double-click **START.cmd**, then open **http://127.0.0.1:4173**. Node.js 22 or newer is required and is already installed on the development machine. Keep the command window open while using the builder.

Alternatively run `npm start` in this folder. Running the site does not require npm install or an Internet connection. The included card fronts, fonts, icons, and application code are local. TTS itself still downloads its original Steam-hosted assets.

`npm run build` creates a deployable static site in `dist/`. No hosting account or deployment is configured.

## Build a fleet

1. Search/filter by faction, card type, expansion, unique status, name, ID, class, or rules text. Sort by name, cost, ID, or captain skill.
2. Add ships, then select a ship header or one of its empty slots. Click Equip or drag a card onto a ship. Selecting a slot targets that particular slot.
3. Click a card to read the full-size front and searchable rules. Printed scan values remain authentic; the SP values below each card show the calculated cost for your selected rules profile.
4. Switch between card spread and compact list. Fleet and ship totals include Utopia's faction penalties and special cost rules. Set your own fleet limit.
5. Save the fleet as JSON. Fleets auto-save in this browser; downloaded fleets also include their cost profile. Import accepts Remodulated JSON, original Utopia URL hashes/JSON, TTS schema-2 JSON, or one-ID-per-line lists. Unknown IDs stop import instead of being dropped.
6. Export to TTS, then paste the result into **Fleet Setup** in the supplied Remodulated save. Both familiar Utopia ID text and schema-2 JSON are supported.

## Bonus slots and flexible cards

The builder runs the original Utopia rules engine locally, including card-specific slot additions, flexible `?` upgrades, faction penalties, free-card effects, uniqueness checks, and fleet cost interceptors. Selecting a slot filters the library using all compatible types and any restrictions attached to that slot.

Remodulated adds a capability layer above that engine instead of asking players to equip bookkeeping cards. Lower Decks is the first converted rule: a Lower Decks crew in a printed crew slot exposes one linked position that accepts only another crew with the Lower Decks keyword. Both real cards are saved, priced, validated, and exported; Utopia's fake `C426` helper is not shown in the library.

Utopia's generated slots marked `faceDown` are treated as hidden cards throughout the builder. Hidden cards have a face-down badge in the fleet spread, remain included in cost and legality checks, and export as `#ID`. The Remodulated TTS importer strips the marker, spawns the card face down, and offsets it beneath the card that generated the slot. JSON exports carry the equivalent `"hidden": true` field.

## Edit card costs / SPUDS

**`public/data/card-costs.json` is the editable catalog.** It has exactly one row per canonical card, with `name`, `id`, `type`, `cost`, and `spudsCost`. Example:

```json
{"id":"S274","name":"U.S.S. Enterprise-D","type":"ship","cost":26,"spudsCost":20}
```

Set `spudsCost` to a number to override the base points in SPUDS mode; use `null` to inherit the standard value. Zero is a valid override. Utopia equipment modifiers and faction penalties still apply. No unprovided SPUDS cost schedule or alternative penalty rules have been invented.

Use **SPUDS cost editor** at the bottom of the site to search and edit values, import a complete cost file, and download the full edited catalog. Browser edits remain local until you replace the file above. A saved fleet carries its cost profile and can restore it on another browser.

If you edit the file outside the browser, use the editor's **Import costs** to load that file into an existing browser session; its saved profile otherwise takes precedence. On a fresh browser the bundled file is used immediately. Rebuild `dist/` after file changes when serving the built site.

Three upstream cards have computed standard costs (Gareb, Marlena Moreau, Emergency Force Field); their original standard calculation is retained. An explicit SPUDS override replaces their base calculation. `null` standard values on reference cards mean not applicable, not a missing numeric zero.

The TTS importer reads its own card values. Exporting a SPUDS list does not rewrite printed images or the mod's Value fields; use the builder's fleet total for the SPUDS budget.

## Catalog and ID audit

- 2,373 canonical Utopia card/reference records converted, with globally unique scalar IDs.
- Seven equivalent duplicate records merged, combining their expansion membership. Different editions and mechanically different cards retain their separate IDs even when their names match.
- Array IDs and alternate-side IDs have explicit aliases. The accidentally duplicated Borg Tractor Beam reference ID is separated from the Specialization reference.
- T053 and T057 keep stable tech catalog identities while retaining Utopia's multi-slot equipment behavior.
- 2,142 verified canonical TTS routes, each with a local WebP front extracted from the exact source image and cell. All match the supplied TTS catalog's name/type.
- **231 records have no verified route in the supplied save**, including all 42 resources and various reference/supplemental cards. They are still in the catalog and cost file; uncheck TTS-ready cards to see them. Unmapped cards render from converted rules data with STAW fonts. Export blocks any unmapped card and identifies it by name/ID. No substitute card or guessed image is exported.

See `public/data/id-audit.json` for every merge, alias, correction, and missing mapping. `public/data/image-audit.json` reports asset extraction. This audit proves ID/type/name/cell consistency against the supplied mod; it is not an OCR review of every printed rule or an in-game TTS playtest.

## Files and provenance

| File | Purpose |
| --- | --- |
| `public/data/card-costs.json` | Editable card values and SPUDS overrides |
| `public/data/data.json` | Converted fleet cards, sets, ship classes |
| `public/data/reference-data.json` | Converted Utopia rulings, missions, mission sets |
| `public/data/tts-routes.json` | Canonical IDs → verified TTS images/cells and local fronts |
| `public/data/aliases.json` | Old identifiers → canonical identifiers |
| `public/data/hidden-slot-audit.json` | Cards whose generated slots hold face-down/hidden cards |
| `public/cards/` | 2,142 extracted local card fronts |
| `src/` | New interface and export/import code |
| `vendor/utopia/` | Preserved Utopia source, including special card rules |
| `vendor/tts-catalog.json` | Card catalog extracted from the supplied Remodulated save |
| `vendor/tts-importer-source.lua` | Snapshot used for importer compatibility checks |
| `scripts/update-tts-hidden-import.cjs` | Safe updater for `#ID` face-down TTS imports |

Source: AngryTribble/Star-Trek-Attack-Wing-Utopia at commit `478c9779ec901d2bae2a60d1aec625dcace0f148`, the same revision recorded by the mod. Site builds do not rewrite a TTS save automatically; `scripts/update-tts-hidden-import.cjs` applies the matching `#ID` importer behavior to an explicitly supplied save and creates a backup first.

## Development and verification

`npm test` checks catalog identity, aliases, cost validation, all local image references, export grouping, missing-route rejection, and TTS layout bounds using Node's built-in test runner.

For optional browser/Lua/asset tooling, run `npm install`. With the development server running, use `npm run test:browser` (Microsoft Edge) and `npm run test:tts`. Browser checks cover actual interactions, standard/SPUDS point totals, faction penalties, duplicate unique cards, save/reload, export, bad-import rollback, and mobile width. The Lua test executes the supplied save's actual `parseFleet` and `reviewFleet` on every verified route.

`npm run convert` regenerates converted source catalogs and the audit, preserving existing editable costs and valid local image routes. `node scripts/assets.cjs "PATH TO LOCAL CARD SHEETS"` rebuilds local fronts from SHA-1-matched source sheets and downloads missing originals. Keep `.asset-cache/` local; it is not needed to run or distribute the site.

## Credits and license

Utopia by ComaToes and contributors KFNEXUS, jsterner73, CrazyVulcan, wiegeabo, SpinStabilized, catsgotmytongue, AngryTribble, and Relequestual. Utopia code is LGPL-3.0; this derivative retains that license and the upstream source. See THIRD_PARTY.md and the included license texts. Star Trek / Attack Wing names and card artwork remain the property of their respective owners.
