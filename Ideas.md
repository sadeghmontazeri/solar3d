# Ideas & Improvement Plan — 3D Hybrid Solar Simulator

**Version:** 3 · **Date/Time:** 2026-09-13T13:18:46-04:00
**Agent:** claude-opus-5 (Claude Code)
**Supersedes:** v2 (13:05) and v1 (12:44). Full history in `HISTORY.md`.
**Status:** PROPOSED — no application code modified.

> Owner's steer, honoured throughout: SLD content and cabling are **yours**, to be revised
> later. This document covers app logic, 3D, and UI only.

---

## 0. Corrections to v2 — I was wrong on four points

Astra's second review made specific, checkable claims against my v2. I tested each one instead
of accepting or dismissing it. **Astra is right on all of them.** Recording this plainly,
because two of the errors would have caused real damage if implemented.

### C1 — The grid fix is NOT a one-line change *(this was my #1-ranked action)*

I called E2 a "one line fix, XS effort." **Wrong.** The bug is *conditional*. Verified:

| Case | Condition | App output | Truth | Verdict |
|---|---|---|---|---|
| A | QG closed (`inverterGridAvailable = true`) | 2200 W import | 0 W | **wrong by +normalPower** |
| B | QG **open** | 2200 W import | 2200 W import | **correct** |

When the inverter's grid port is open, `inverterExchange` is forced to 0 by the ternary and the
formula is right. **Removing `normalPower` unconditionally would break Case B.** Astra caught
this; my recommendation would have introduced a regression.

The correct fix is a structural node balance at BUS-G, which I verified passes both cases:

```js
const invNetExport = inverterGridAvailable
  ? (pv + discharge - charge - epsPower)   // through the efficiency chain
  : 0;
gridPower = normalPower + bypassPower - invNetExport;
// Case A -> 0 W  ✓   Case B -> 2200 W  ✓
```

Effort is **M, not XS**, and it must be tested across QG-open, bypass, battery full/empty, and
single-string-loss paths.

### C2 — "The work is the adapter, not the physics" — wrong. The candidate engine is also buggy.

This was my central argument for promoting `simulation-engine.js`. I tested the engine directly
through its own API. Three defects, all reproduced:

```
SBY=II (bypass), loads 1800 W normal + 1200 W critical = 3000 W demand
  gridPortPower_W        = 1800      ← the 1200 W bypass load vanishes from accounting
  criticalLoadsPower_W   = 0
  totalLoadsPower_W      = 1800
  criticalLoadsVoltage_V = 230       ← claims energized while reporting 0 W

qoBreaker = false (critical loads isolated)
  criticalLoadsPower_W   = 0         ← correct
  criticalLoadsVoltage_V = 230       ← wrong: downstream of an open breaker must be 0 V

setFault(RCD_TRIP, true)  -> relays.rcdTripped = true
setFault(RCD_TRIP, false) -> relays.rcdTripped = false   ← clears with no separate reset
```

`pCritFromBypass` is computed and then never enters the final sum
(`simulation-engine.js:572, 581, 858–859`).

Two consequences I have to accept:

- **The candidate engine needs physics fixes before it can be promoted.** P-01 becomes
  *conditional*, not scheduled.
- **It does not have working latching faults**, which I asserted in v1/v2 from reading its
  structure without executing it. That was an unverified claim stated as verified. My mistake.

### C3 — §2 of v2 over-claimed. The existing tests are a starting point, not a specification.

My v2 finding stands and is important: **the test suite never loads `js/app.js`**, so it
validates only the engine that doesn't run in the browser. That is true and worth knowing.

But I went further and called those 9 scenarios "an executable acceptance specification" that
"de-risks promotion." **That doesn't hold** — the suite passes while the engine silently drops
1200 W of bypass load. Tests that miss a defect that large are a foundation to build on, not a
gate to trust. Astra's phrasing is the accurate one.

### C4 — `qpv_isolator` is not inert

I reported it as "declared but never read." The grep was right; **the conclusion was wrong.**
`app.js:2265–2270` has an alias map routing `qpv_isolator` → `dc_isolator` + `dc_iso_1`, both of
which the solver *does* read. Opening it kills string 1. It works.

**`eps_rcd` and `fspd_mcb` still stand as real defects** — `eps_rcd` aliases only to `sld-rcd`,
`fspd_mcb` isn't in the map at all, and neither reaches the solver. Astra agrees on this.

### Smaller corrections, all accepted

- **`sound-fx.js` is unused, not inert.** It instantiates a singleton at load (line 564) whose
  constructor calls `_bindGestureUnlock()` and registers listeners. Removing it needs care.
- **`verify_dc_box.js` does more than string-match** — it uses `vm.Script` to syntax-check
  `app.js`. The precise statement is "no test exercises live controller *behaviour*."
- **"Zero accessibility" was too strong.** Many controls are native HTML and work already. The
  actionable gaps are keyboard reach to equipment, naming, focus management, and a text
  description of state.
- **Clipping needs a port-specific criterion.** "PV must never exceed rated AC" conflates DC
  array power with AC port limits. The criterion must name the port and conversion path.
- **The "<20 ms" scenario measures nothing.** It's a label, not a timing measurement.
  Simulation time, animation time, and hardware claims must stay separate.

### New defect found while testing C1 — SBY late-callback race

`app.js:2213–2245`: the break-before-make transfer does `setTimeout(..., 80)` with `pos`
captured in a closure and **no cancellation token**. A newer user command issued inside that
80 ms window is silently overwritten when the stale callback fires. Astra found this; confirmed
by reading the code. The fix is a transfer-generation counter, not just input validation.

---

## 1. My assessment

**Astra's second review is the strongest single contribution so far.** It did the thing I
didn't: it tested my *conclusions*, not just the code. Two of my recommendations would have
caused regressions. Adopting its corrections wholesale.

**Where my work still holds:** the conditional grid bug is real (Case A); `_animateCamera` and
the SBY `undefined` crash are real; the unwired 3D capabilities are real; the font blocker is
real; the clutter measurements are real; and the discovery that the test suite targets the dead
engine is real and reframes the project.

**Where I was weakest:** I over-converted findings into confident remedies. A grep proving a
symbol isn't read in one file is not proof a control is inert (C4). Reading a fault map is not
proof faults latch (C2). Finding an arithmetic error at one operating point is not proof the fix
is one line (C1). Each needed execution, and Astra executed.

**On the third agent's "100% confirmed" verdict:** Astra is right to reject it. The evidence in
that report is code reading and grep output. No browser version, no startup log, no fresh
screenshot. It confirmed some real bugs, but "100% certain" isn't supported, and it endorsed my
auto-router rejection and my engine-promotion argument — the latter now demonstrably wrong.
Agreement between reports is not new evidence.

**Still true after three rounds: nobody has run this application in a browser.**

---

## 2. Verified findings

All reproduced in Node against unmodified source, or read directly. Nothing inferred.

### Live controller (`app.js`)

| # | Finding | Status |
|---|---|---|
| **E1** | `simulation-engine.js` (1,861 lines) is never instantiated; `computeElectricalState()` runs instead | holds |
| **E2** | Grid double-counts `normalPower` — **only when QG is closed**. Case A: 2200 W reported vs 0 W true. GPT's variant: 5900 W vs 3700 W. `index.html` hardcodes a third value (−720 W) | **amended — conditional** |
| **E3** | `efficiency: 97.4` displayed, multiplies nothing. No DC→AC or round-trip losses | holds |
| **E4** | No AC clipping — 7554 W DC into a 5 kW inverter at G=1200/T=−20 | holds; criterion needs port scoping |
| **E5** | Three conflicting PV parameter sets: 2×2800 W @385 V (live) / Ns=8×41.2 V (calculator) / 2×6×450 W @41.5 V (engine) | holds |
| **E6** | Faults non-physical: single-string labels kill both strings; asymmetric isolator logic; brownout inert; `ct_inverted` flips a display sign; nothing latches | holds |
| **E7** | `eps_rcd` and `fspd_mcb` never reach the solver. **`eps_rcd` is the life-safety RCD.** ~~`qpv_isolator`~~ works via alias | **amended — 2 of 3** |
| **E8** | Bypass power attributed to inverter output; 165 V brownout displays 230 V at the load | holds |
| **E9** | SOC displayed twice with different values | holds |

### Candidate engine (`simulation-engine.js`) — **new this round**

| # | Finding |
|---|---|
| **N1** | Bypass critical load dropped from accounting — 1200 W vanishes (`572, 581, 858–859`) |
| **N2** | `criticalLoadsVoltage_V = 230` downstream of an open QO breaker, and while reporting 0 W |
| **N3** | RCD trip clears on `setFault(...,false)` with no independent reset — does not latch |
| **N4** | The 9 existing scenarios pass despite N1–N3 |

### 3D scene

| # | Finding | Status |
|---|---|---|
| **V1** | `setCameraFrontView()` throws — `_animateCamera` never defined | holds |
| **V2** | Clicking the SBY dial sets `sw.state = undefined` and emits `{state: undefined}` | holds |
| **V3** | Inspection operates equipment — any `action:'toggle'` object switches on plain click | holds |
| **V10** | **SBY late-callback race** — 80 ms `setTimeout` with no cancellation overwrites newer commands | **new** |
| **V4** | Six built-but-unwired capabilities: `isolateSubsystem`, `setXRayMode`, `setSunIrradiance`, `updateSmartMeterLCD`, `circuitGraph` (39 conductors, never read), 4 orphan presets | holds |
| **V5** | 8-button bottom bar drives only the SLD, never the 3D | holds |
| **V6** | Flow direction conflicts with cable geometry and import/export sign | holds |
| **V7** | Cables pass *through* enclosures instead of terminating in them — the root cause of unreadable cabinets | holds |
| **V8** | Conductor telemetry hardcoded (230 V / 16.5 A) but rendered as live | holds |

### Shell and packaging

| # | Finding | Status |
|---|---|---|
| **S1** | 73 always-visible controls; chrome ~50 % of 1920×1080 with inspector open; ~610 px 3D width at 1366×768 | holds |
| **S2** | No `aria-*`/`role=`, 3 `:focus` rules, no keyboard model or focus traps. **Native controls do work** | **amended — softened** |
| **S3** | `css/styles.css:7` imports Vazirmatn from CDN — the only external reference | holds |
| **S4** | Single-file bundling low-risk: no ES modules, no fetch, procedural assets. Emit **classic** bundle (file-URL CORS) | holds |
| **S5** | `simulation-engine.js` (76 KB) unused; `sound-fx.js` (18 KB) unused **but has load-time side effects** | **amended** |
| **S6** | No git repository. `debug.log` shows ReadPixels stalls; `updateOLED` already throttled to 4 Hz | holds |

### Not verified by anyone

Live rendering, FPS, responsiveness, browser compatibility, whether init throws, whether cables
visually clip walls, the 5 non-`SLD-01` diagrams, 3D world units, and every IEC/standards claim
in the content.

---

## 3. Architecture

Unchanged in direction from v2; the engine decision is now conditional.

```
   system definition + user commands
                │
                ▼
     ONE authoritative state          ← engine chosen only after N1–N3 are fixed and tested
     measured · reference · unknown
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
   UI/HUD    3D scene   SLD adapter (YOURS)
```

1. **Stable IDs** for component/port/terminal/connection. Ratings and topology separate from
   geometry and labels. Aliases translate at **one** boundary — the current alias map (C4) is
   exactly the kind of scattered mapping to consolidate, not extend.
2. **Four distinct states everywhere:** *unknown / not modelled*, *de-energized*, *energized
   with no flow*, *isolated*. Never render a reference value as a measurement (V8, N2).
3. **Separate port voltage from downstream voltage.** N2 and E8 are the same category of error.
4. **Physics on elapsed sim time**, never on UI refresh.
5. **Command validation in the controller**, with cancellation for in-flight transfers (V10).
6. **Registry-based extension** for components and reference sections.
7. **Cable endpoints bind to terminal anchors** — contract only for now (see §5).

---

## 4. Interface

**Design target** (not a quality proof — Astra's correction): ≤ 12 always-visible controls;
3D ≥ 80 % at overview. Cabinet inspection gets its own separate criterion.

| Region | Now | Proposed |
|---|---|---|
| Top bar | 16 controls + subtitle + badge | ~6: title · scenario · pause/reset · **Tools & Reference ▾** · **View ▾** · sound |
| Telemetry | 7 badges | one strip: Solar · Battery · Grid · Loads, in words ("Charging", "Exporting") |
| Quick bar | 8 buttons | delete; Home/Focus/open-cabinet stay **discoverable as buttons**, with `1..9` and double-click as *additions*, not replacements |
| Side panel | 34 controls, always on | collapsible drawer: Scenario · Switching · Advanced→Faults |
| Bottom bar | 8 inert buttons | folds into **View ▾**, and actually drives the 3D |
| Inspector | 420 px, shifts layout | 360 px overlay — **must not cover the selected equipment**; camera frames using free space |

**Hard interaction rules:**
- **Single click selects. An explicit action operates.** Dragging never operates.
- SBY accepts only `I`/`0`/`II`; a new command **cancels** any in-flight transfer.

**Astra's 3D proposals — adopted in full:**
- **"Where is this fed from, and why is it off?"** — a one-line answer from state at the top of
  the inspector, with the relevant path highlighted. More useful than dozens of simultaneous numbers.
- **Return to previous view** after entering a cabinet; Home still goes to overview. Changing
  camera must not clear selection or scenario.
- **State-dependent numbers** — an open inspector updates with the scenario; fixed values are
  labelled "reference specification"; missing data shows "not modelled". **Zero never stands in
  for unknown.**
- **Traceable delivery** — the built HTML carries a version/commit ID and ships with a checksum,
  so you can confirm two machines have the identical file.

**Accessibility:** keyboard reach to equipment, accessible naming, focus management, text
description of state, status by text+shape not colour alone, `prefers-reduced-motion`, optional sound.

---

## 5. Phases — revised

**Day 1 — Baseline and provable packaging.**
git init; `build.js` → single offline HTML **proved day 1**; base64 font (S3). Behavioural
regression cases against the **live controller** (none exist today). Then only the fixes that
are safe and testable: `_animateCamera` (V1), SBY validation + transfer cancellation (V2, V10).

**Day 2 — One cabinet, end to end, and interaction safety.**
Click-selects/button-operates (V3). Decluttered overview. **One** cabinet: select → focus → open
→ inspect → return. `isolateSubsystem` rewritten with save/restore of original material state
and used on that one cabinet only — **not six APIs switched on at once** (Astra's correction;
R2 is exactly why). Focus and keyboard handling.

**Day 3 — Power accounting, on both engines.**
Structural node-balance fix (C1) tested across QG-open, bypass, battery full/empty, string loss.
Fix N1–N3 in the candidate engine. Extend the test suite to cover load power and grid power in
bypass, not just EPS-port zero. **Only then** decide which engine owns state. Telemetry contract
and flow directions (V6, V8).

**Day 4 — Delivery.**
Second PC, agreed browsers, network disabled, zoom, sustained session. Regression pass. Record
evidence.

**Not in the four-day commitment:** automatic cable routing; endpoint binding as a *mandatory*
deliverable (contract only — binding endpoints without an approved mapping can cement a wrong
relationship); new topologies; independent electrical validation; universal mobile support.

Fault-recovery rules are **per-device**, from the approved equipment definition — "all faults
always latch" is not a sound general rule. For `fspd_mcb`, model the real protection relationship
rather than inventing a visible effect.

---

## 6. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Both engines are wrong.** Neither is a safe default | Engine choice is a *gate*, not a schedule item. Fix N1–N3, extend tests, then decide |
| R2 | `isolateSubsystem()` mutates shared materials, tests descendants only one level deep, and forces `transparent = false` on reset | Rewrite with `traverse()` + save/restore of original material state. **One cabinet first** |
| R3 | Enabling many dormant APIs at once produces untraceable regressions | One capability at a time, each with a check |
| R4 | Merge conflicts in `app.js` (2,309) / `scene-3d.js` (4,387) | Split early as pure moves, one commit. Never two agents in the scene file at once |
| R5 | The alias map spreads ID ambiguity (C4) | Consolidate to one boundary; document each control's scope of effect |
| R6 | ReadPixels stalls with more canvas textures | Keep the 4 Hz throttle; update only on change |
| R7 | file-URL storage varies by browser and on move | Guarded `localStorage` for preferences only; JSON export/import for real state |
| R8 | Standards/timing claims unvalidated | Keep in clearly-qualified reference content |

---

## 7. Workflow

`git init` → private repo. `.gitignore`: `node_modules/`, `dist/`, `debug.log`, `scratch/`,
`scripts/screenshot-*.png`. **Never commit generated HTML** — build from merged source; ship as
a Release artifact with a checksum and version ID.

| Owner | Files |
|---|---|
| **You** | `js/sld-schematic.js`, future `data/cabling.js` |
| Agent A — `claude-opus-5` | `js/sim/*`, `js/model/*` |
| Agent B — `gpt-*` | `js/ui/*`, `css/*` |
| **Shared — PR only** | `index.html`, `js/scene-3d.js` |

Short-lived branches `agent/<name>/<ISO-date>-<topic>`; rebase before PR; squash-merge; small
PRs carrying validation evidence. `HISTORY.md` append-only — corrections are **new entries**,
never edits to old ones. Ideas one file per agent. **Only you set `APPROVED`.**
No credentials, tokens, `.env`, or private logs; enable secret scanning at repo creation.

---

## 8. Acceptance criteria

**Power accounting** — node balance closes within an explicit loss/rounding contract across:
QG open, bypass, battery full/empty, single-string loss, and rapid scenario change. In bypass
with 1800 + 1200 W, the critical load is **in** the accounting (3000 W total). Downstream of an
open QO breaker, load voltage is **0 V**, shown separately from upstream port voltage.

**Commands** — SBY rejects invalid input; a new command cancels an in-flight transfer; the last
valid user command wins. Every alias has one documented result and scope of effect. Every visible
switch either affects its modelled circuit or is labelled illustrative.

**Interaction** — inspection never toggles a breaker; dragging never operates; Front/Home work.

**Interface** — ≤ 12 controls at overview; core controls reachable at 1366×768 and at 200 % zoom;
the inspector never covers the selected equipment; essential tasks work by keyboard; status never
colour-only.

**3D** — one cabinet opens, focuses, and reads without overlap, and returns to the previous view.
Selecting a terminal reveals endpoints and connections. View filters visibly change the 3D scene.

**Offline** — the exported HTML alone, in an empty folder on a **second PC**, fresh profiles,
network disabled, agreed Chrome/Edge/Firefox: 3D, Persian fonts, reference content, and scenarios
all work with zero sidecar requests. Record browser and device versions. Same checksum both machines.

**Performance** — agree a reference PC first; proposed floor 30 FPS during orbit and inspection.
Test WebGL-unavailable and reduced-motion paths separately.

**Tests** — keep and extend the existing suite; add behavioural cases against the controller the
UI actually uses; run a real browser test on the delivered HTML. Repetition of a result across
reports is not new evidence.

---

## 9. Ranked by value ÷ effort

| # | Action | Effort | Value |
|---|---|---|---|
| 1 | `_animateCamera` (V1) + SBY validation & transfer cancellation (V2, V10) | XS–S | ⭐⭐⭐⭐⭐ |
| 2 | Base64 font (S3) — unblocks true offline | XS | ⭐⭐⭐⭐⭐ |
| 3 | git init + `build.js` → one HTML, proved day 1 | S | ⭐⭐⭐⭐⭐ |
| 4 | Click selects / button operates (V3) | S | ⭐⭐⭐⭐⭐ |
| 5 | Behavioural regression cases against the live controller | S | ⭐⭐⭐⭐⭐ |
| 6 | One cabinet end to end + `isolateSubsystem` rewritten safely | M | ⭐⭐⭐⭐⭐ |
| 7 | Structural node-balance fix, multi-path tested (C1/E2) | M | ⭐⭐⭐⭐⭐ |
| 8 | `eps_rcd` / `fspd_mcb` (E7) — wire or label illustrative | S | ⭐⭐⭐⭐ |
| 9 | 73 → ~12 controls (S1) | M | ⭐⭐⭐⭐ |
| 10 | Fix N1–N3, extend tests, **then** decide the engine (E1) | L | ⭐⭐⭐⭐⭐ |
| 11 | Remaining 3D capabilities, one at a time (V4) | M | ⭐⭐⭐⭐ |
| 12 | Accessibility: keyboard reach, naming, focus, state text (S2) | M | ⭐⭐⭐ |
| — | ~~Manhattan auto-router~~ · ~~mandatory endpoint binding~~ | — | deferred |

---

## 10. Before anything is implemented

**Three agents have now reviewed this app. None has run it in a browser.** Everything above is
static analysis plus Node execution of non-UI code paths.

Ten minutes in a real browser with DevTools open:

1. Grid badge at defaults — ~2200 W import? *(E2 Case A)*
2. Open QG, then check the grid badge — still correct at 2200 W? *(E2 Case B — the case that
   makes the fix structural rather than one-line)*
3. Click "🎯 نمای روبرو" — `_animateCamera is not a function`? *(V1)*
4. Click the SBY dial in the 3D scene — does it break? *(V2)*
5. Open the RCD switch — does anything change electrically? *(E7)*

If any of these disagrees, tell me and I'll re-derive that section rather than build on it.

---

*Consolidated across three independent reviews and two correction rounds. Nothing is approved —
every item is PROPOSED pending your decision. Companions: `gpt-ideas.md`, `HISTORY.md`.*
