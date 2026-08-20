# GIR or Three Putt

A lightweight, mobile-first golf diagnostic calculator. Predict a round score from greens in regulation (and optionally putts), compare that prediction to what you actually shot, get practice insights — based on Dr. Lucius Riccio’s golf analytics models — and run a Yes/No tee-club decision helper on the course.

Named in honour of the eternal conflict between GIR and 3-putting.

Runs entirely in the browser (HTML, CSS, JavaScript). No server-side backend. Built for **GitHub Pages**.

## What it does

Four tabs: **Baseline (GIR)**, **Advanced (GIR + putts + driving)**, **Formulas**, and **Tee Box Helper**.

### Baseline (GIR)
- Predicts score with Baseline (Eq. 1): `Score = 95 − 2 × GIR`
- Results bubbles: **Predicted** and **Differential**
- Differential badge: Short Game Leak / Balanced Game / Short Game Saviour
- **Played like** skill-bracket chip (not an official Handicap Index)
- Milestone target chart (Break 90 / 85 / 80 / 70 by GIR)
- Smart target benchmarks for GIR only (prompt to switch to Advanced for putts, fairways, and carry)
- Live recalculation as inputs change (no submit button)

### Advanced (GIR + putts + driving)
- Predicts score with Advanced (Eq. 9): `Score = 58 + Putts − (4/3) × GIR`
- Results bubbles: **Predicted**, **Differential**, and **Putts diff**
  - Putts diff uses Expected putts (Eq. 7): `even`, `+N` (above expected), or `−N` (below expected)
- Driving module: fairways hit (FIR), rough / first cut, recovery / penalty
- Driver carry profile (metres or yards), saved in browser `localStorage`
- Full skill-bracket overlay: GIR, putts, fairways, recovery %, and carry (amber/emerald fills vs gold target ticks)
- Richer practice insights (tee trouble, dispersion, short game, Putts diff, milestones)

### Formulas
- Reference only for the maths used by the calculator:
  - Baseline (Eq. 1) (GIR only)
  - Advanced (Eq. 9) (GIR + putts)
  - Expected putts (Eq. 7)
- Calculator tabs show answers in bubbles — not the working equations

### Tee Box Helper
On-course Yes/No flow for choosing driver, 3-wood, or a shorter club off the tee. Based loosely on the [DECADE Golf](https://decade.golf/) tee-box decision tree by Scott Fawcett (not affiliated with or endorsed by DECADE Golf).

**Setup**
- Driver carry and closest fairway hazard carry (metres default; yards toggle)
- Driver carry is shared with Advanced via `localStorage`
- Live hint compares your carry to the hazard as you type

**Dispersion gate (before the tree)**
- Asks whether driver dispersion is roughly within a 40–60 m left–right window (45–65 yd), or better
- **Yes** → continue into the decision tree
- **No** → shows a firm advisory to tighten dispersion first (points at Advanced FIR / rough / recovery to validate), then still continues into the tree
- Dispersion does **not** change the club recommendation result

**Decision tree**
- Starts with landing-zone width between adjacent penalty areas (~60 m / 65 yd)
- Then fairway width in the driver land/roll zone, carry-over-hazard checks, and shorter-club options
- Outcomes: take driver, driver with aim bias, 3-wood, shorter fairway wood / iron / hybrid, or “tight hole”
- Burnt-in yard thresholds convert to metres and round to the nearest 5 for display
- Driver / hazard inputs only personalise carry questions (and the setup hint); they do not auto-answer Yes/No

### Diagnostics and guidance
- Tailored **Practice insights** from score differential, Putts diff, driving mix, and next milestone
- Driving stats and carry inform insights and brackets only — they do **not** change predicted score
- Tee Box Helper is strategy guidance only — it does not change predicted score either

## Skill brackets (reference)

| Skill group | Target score | FIR % | GIR | Putts | Drive (m) | Recovery % |
|-------------|-------------:|------:|----:|------:|----------:|-----------:|
| 90-Shooter (~20 HCP) | 94 | 44 | 3 | 37 | 192 | 36 |
| 80-Shooter (~10 HCP) | 85 | 49 | 6 | 33 | 211 | 21 |
| Scratch (0 HCP) | 75 | 54 | 10 | 31 | 237 | 12 |
| PGA Tour Average | 71 | 60 | 12 | 29 | 274 | 5 |

Riccio milestone GIR tiers (separate from the table above): Break 90 → 3 GIR · Break 85 → 5 · Break 80 → 8 · Break 70 → 13.

## Stack

- HTML5, CSS3, vanilla JavaScript (ES modules)
- [PatternFly](https://www.patternfly.org/) 6 CSS via CDN (layout / design-system foundations)
- Golf-inspired emerald theme; responsive desktop and mobile layouts
- UK English copy throughout the UI
- Built with the help of AI

## Local preview

ES modules need an HTTP server (they will not load from `file://`).

```bash
cd riccios_rule
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Deploy on GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment**
3. Source: **Deploy from a branch**
4. Branch: `main` (or `master`), folder: **/ (root)**
5. Save — site URL: `https://<user>.github.io/<repo>/`

## Sources

- **Formulas:** Dr. Lucius J. (“Lou”) Riccio — notably [Want to improve your golf game? Work on GIR](https://pubsonline.informs.org/do/10.1287/LYTX.2021.05.03/full/) (INFORMS Analytics Magazine)
- **Historical context:** [The Herald](https://www.heraldscotland.com/news/12094233.riccio-puts-his-rule-on-the-line/), [GOLF.com](https://golf.com/instruction/1-golf-stat-predict-average-score-ed-oldham/), [USGA](https://www.usga.org/content/usga/home-page/articles/2014/06/lou-riccios-golf-laboratory-21474868849.html)
- **Skill brackets:** Informed by data such as [breakxgolf.com/golf-stats-by-handicap](https://breakxgolf.com/golf-stats-by-handicap/)
- **Driving distance targets:** [Arccos Annual Driving Distance Report](https://au.arccosgolf.com/blogs/community/arccos-golf-releases-largest-ever-annual-driving-distance-report-leveraging-data-from-25-million-rounds-to-deliver-eight-year-trend-analysis-across-age-gender-and-skill-level)
- **Tee Box Helper:** Based loosely on the [DECADE Golf](https://decade.golf/) tee-box decision tree by Scott Fawcett (not affiliated with or endorsed by DECADE Golf)

## License

[Apache License 2.0](./LICENSE)
