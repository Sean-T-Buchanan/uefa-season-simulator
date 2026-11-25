# Country data schema

Each file calls `addCountry({...})` for one or more countries.

```js
addCountry({
  id: "ESP",                 // 3-letter code (must match js/data/world.js ASSOCIATIONS)
  name: "Spain",
  flag: "🇪🇸",
  cup: { name: "Copa del Rey", short: "Copa", divisions: ["ESP1", "ESP2"] }, // domestic cup and who enters
  divisions: [
    {
      id: "ESP1", name: "LaLiga", short: "LaLiga", tier: 1,
      format: {
        rr: 2,               // times each club plays every other in the regular season (2, 3 or 4)
        split: {             // optional second phase after the regular season (groups in table order)
          groups: [
            { name: "Championship group", size: 6, rr: 1, carry: "full" }, // carry: "full" or "half" (points halved, rounded up)
            { name: "Relegation group", size: 6, rr: 1, carry: "full" },
          ],
        },
        playoff: { name: "European play-offs", from: 5, to: 8 }, // optional knockout for the last European place
      },
      money: {
        tv: 40,              // central/TV money per club per season (£m)
        ops: 10,             // running costs per club per season, excluding wages (£m)
        ticket: 25,          // matchday income per fan per home game (£)
        owner: [0, 10],      // owner funding per season, range (£m)
        wageRatio: 0.65,     // wages as a share of revenue at the start
        budget: 25,          // typical spending on players and staff per season (£m)
        commercialShare: 0.35, // second tiers only: share of top-flight commercial income earned here
      },
      // [name, code, rating, colour, capacity, demand, commercial]
      //   code: 3 capital letters, unique within the country
      //   rating: shared pyramid-wide scale (see anchors below)
      //   demand: typical tickets sold ÷ capacity (1 = full, >1 = more fans than seats)
      //   commercial: commercial & sponsorship income in £m a season at top-flight level
      teams: [
        ["Real Madrid", "RMA", 89, "#FEBE10", 83186, 1.05, 380],
      ],
    },
  ],
});
```

Liechtenstein has no league: give it `divisions: []` and `cupTeams: [[name, code, rating, colour, capacity, demand, commercial], ...]`.

Rating anchors: Liverpool 88, Arsenal 88, Man City 87, Chelsea 84, Newcastle 82, Aston Villa 80,
Championship mid-table ~64, League One ~54, League Two ~47, National League ~40.
