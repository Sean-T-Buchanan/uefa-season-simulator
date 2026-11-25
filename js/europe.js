// European club competitions: Champions League, Europa League and Conference
// League in the 36-team league-phase format, with qualifying paths, drop-downs
// between competitions, knockout rounds, prize money and UEFA coefficients.
// Game internals are reached through Game.internal at run time.

const Europe = (() => {
  const G = () => Game.internal;

  const COMPS = [
    { id: "UCL", name: "Champions League", short: "UCL", lpMatches: 8, finalAt: 0.96 },
    { id: "UEL", name: "Europa League", short: "UEL", lpMatches: 8, finalAt: 0.95 },
    { id: "UECL", name: "Conference League", short: "UECL", lpMatches: 6, finalAt: 0.94 },
  ];
  const compDef = (id) => COMPS.find((c) => c.id === id);

  // Prize money (£m), roughly at 2024/25 levels. `market` is scaled by how big
  // the club's home TV market is.
  const PRIZE = {
    UCL: { qual: 0.4, lp: 16, market: 10, win: 1.8, draw: 0.6, KOPO: 0.85, R16: 9.4, QF: 10.6, SF: 12.8, F: 15.7, W: 3.4 },
    UEL: { qual: 0.25, lp: 3.7, market: 2, win: 0.38, draw: 0.13, KOPO: 0.25, R16: 1.5, QF: 2.1, SF: 3.4, F: 5.1, W: 3.4 },
    UECL: { qual: 0.2, lp: 2.7, market: 1, win: 0.34, draw: 0.11, KOPO: 0.17, R16: 0.68, QF: 1.1, SF: 1.7, F: 3.0, W: 1.7 },
  };
  // Coefficient points: win 2, draw 1 (halved in qualifying) plus bonuses.
  const BONUS = { UCL: { LP: 4, R16: 1, QF: 1, SF: 1, F: 1 }, UEL: { LP: 2, R16: 1, QF: 1, SF: 1, F: 1 }, UECL: { LP: 1, R16: 1, QF: 1, SF: 1, F: 1 } };

  const QUAL = ["Q1", "Q2", "Q3", "PO"];
  const QUAL_NAMES = { Q1: "First qualifying round", Q2: "Second qualifying round", Q3: "Third qualifying round", PO: "Play-off round" };
  const KO = ["KOPO", "R16", "QF", "SF", "F"];
  const KO_NAMES = { KOPO: "Knockout play-offs", R16: "Round of 16", QF: "Quarter-finals", SF: "Semi-finals", F: "Final" };
  const STAGE_TEXT = { Q1: "First qualifying round", Q2: "Second qualifying round", Q3: "Third qualifying round", PO: "Play-off round", LP: "League phase", KOPO: "Knockout play-offs", R16: "Round of 16", QF: "Quarter-finals", SF: "Semi-finals", F: "Final", W: "Winners" };

  // Where losers of a qualifying round go next: [comp, path, round] (round "LP" = league phase).
  const DROPS = {
    "UCL/CP/Q1": ["UECL", "MAIN", "Q2"], "UCL/CP/Q2": ["UEL", "MAIN", "Q3"], "UCL/CP/Q3": ["UEL", "MAIN", "PO"], "UCL/CP/PO": ["UEL", null, "LP"],
    "UCL/LP/Q2": ["UEL", "MAIN", "Q3"], "UCL/LP/Q3": ["UEL", "MAIN", "PO"], "UCL/LP/PO": ["UEL", null, "LP"],
    "UEL/MAIN/Q1": ["UECL", "MAIN", "Q2"], "UEL/MAIN/Q2": ["UECL", "MAIN", "Q3"], "UEL/MAIN/Q3": ["UECL", "MAIN", "PO"], "UEL/MAIN/PO": ["UECL", null, "LP"],
  };
  const PATHS = { UCL: ["CP", "LP"], UEL: ["MAIN"], UECL: ["MAIN"] };
  const QUALIFIERS = { "UCL/LP": 2 }; // the rest are worked out to fill 36 places

  // Calendar position of each stage (fraction of the league season).
  const AT = {
    Q1: [0, 0], Q2: [0, 0], Q3: [0, 0.02], PO: [0.04, 0.06],
    LP: [0.13, 0.2, 0.27, 0.32, 0.4, 0.44, 0.53, 0.56], LP6: [0.2, 0.27, 0.32, 0.4, 0.44, 0.53],
    KOPO: [0.6, 0.63], R16: [0.68, 0.71], QF: [0.78, 0.81], SF: [0.86, 0.89],
  };

  // ---- Access list ----------------------------------------------------------
  // Places by association rank: [comp, path, round, source]; source is a league
  // position (number) or "cup". Earlier entries are more valuable.
  function accessFor(rank) {
    const L = (comp, path, round, src) => ({ comp, path, round, src });
    const cp = rank <= 12 ? "PO" : rank <= 15 ? "Q3" : rank <= 20 ? "Q2" : "Q1";
    if (rank <= 4) return [1, 2, 3, 4].map((p) => L("UCL", null, "LP", p)).concat([L("UEL", null, "LP", "cup"), L("UEL", null, "LP", 5), L("UECL", "MAIN", "PO", 6)]);
    if (rank === 5) return [1, 2, 3].map((p) => L("UCL", null, "LP", p)).concat([L("UEL", null, "LP", "cup"), L("UEL", null, "LP", 4), L("UECL", "MAIN", "PO", 5)]);
    if (rank === 6) return [L("UCL", null, "LP", 1), L("UCL", null, "LP", 2), L("UCL", "LP", "Q3", 3), L("UEL", null, "LP", "cup"), L("UECL", "MAIN", "Q3", 4), L("UECL", "MAIN", "Q2", 5)];
    if (rank <= 10) return [L("UCL", null, "LP", 1), L("UCL", "LP", "Q2", 2), L("UEL", null, "LP", "cup"), L("UECL", "MAIN", "Q2", 3), L("UECL", "MAIN", "Q2", 4)];
    if (rank <= 12) return [L("UCL", "CP", cp, 1), L("UCL", "LP", "Q2", 2), L("UEL", null, "LP", "cup"), L("UECL", "MAIN", "Q2", 3), L("UECL", "MAIN", "Q2", 4)];
    if (rank <= 15) return [L("UCL", "CP", cp, 1), L("UCL", "LP", "Q2", 2), L("UEL", "MAIN", "Q2", "cup"), L("UECL", "MAIN", "Q2", 3), L("UECL", "MAIN", "Q2", 4)];
    if (rank <= 20) return [L("UCL", "CP", cp, 1), L("UEL", "MAIN", "Q2", "cup"), L("UECL", "MAIN", "Q1", 2), L("UECL", "MAIN", "Q1", 3)];
    if (rank <= 24) return [L("UCL", "CP", cp, 1), L("UEL", "MAIN", "Q1", "cup"), L("UECL", "MAIN", "Q1", 2), L("UECL", "MAIN", "Q1", 3)];
    if (rank <= 50) return [L("UCL", "CP", cp, 1), L("UECL", "MAIN", "Q1", "cup"), L("UECL", "MAIN", "Q1", 2), L("UECL", "MAIN", "Q1", 3)];
    return [L("UCL", "CP", cp, 1), L("UECL", "MAIN", "Q1", "cup"), L("UECL", "MAIN", "Q1", 2)];
  }

  const BANNED = new Set(["RUS"]);
  const sum = (a) => a.reduce((t, x) => t + x, 0);

  function rankings(state) {
    const c = state.euro.coef.assoc;
    return Object.keys(c).sort((a, b) => sum(c[b]) - sum(c[a]));
  }

  // Next season's entrants from final standings, cup winners and play-offs.
  //   standings: { cid: [club ids in finishing order] }
  //   cupWinners: { cid: id }, euroPlayoff: { cid: id }
  function buildEntrants(state, standings, cupWinners, euroPlayoff, holders, eps) {
    const order = rankings(state);
    const out = []; // { id, comp, path, round }
    const placed = new Map(); // id -> entry
    order.forEach((cid, i) => {
      if (BANNED.has(cid)) return;
      const rank = i + 1;
      if (cid === "LIE") {
        const w = cupWinners.LIE;
        if (w) { const e = { id: w, comp: "UECL", path: "MAIN", round: "Q1", country: cid }; out.push(e); placed.set(w, e); }
        return;
      }
      const table = standings[cid] || [];
      let slots = accessFor(rank);
      if (eps.includes(cid)) {
        const lastUcl = slots.map((s) => s.comp === "UCL" && s.round === "LP").lastIndexOf(true);
        slots = [...slots.slice(0, lastUcl + 1), { comp: "UCL", path: null, round: "LP", src: "eps" }, ...slots.slice(lastUcl + 1)];
      }
      const lastLeague = slots.map((s) => s.src !== "cup").lastIndexOf(true);
      let next = 0;
      const nextFree = () => { while (next < table.length && placed.has(table[next])) next++; return table[next++]; };
      slots.forEach((s, si) => {
        let id;
        if (s.src === "cup" && cupWinners[cid] && !placed.has(cupWinners[cid])) id = cupWinners[cid];
        else if (si === lastLeague && euroPlayoff[cid] && !placed.has(euroPlayoff[cid])) id = euroPlayoff[cid];
        else id = nextFree();
        if (!id) return;
        const e = { id, comp: s.comp, path: s.path, round: s.round, country: cid };
        out.push(e);
        placed.set(id, e);
      });
    });
    // Title holders: straight into the league phase (UECL holder: Europa League).
    const holderSlots = [["UCL", "UCL"], ["UEL", "UCL"], ["UECL", "UEL"]];
    for (const [won, comp] of holderSlots) {
      const id = holders[won];
      if (!id || BANNED.has(state.teams[id].country)) continue;
      const cur = placed.get(id);
      const better = cur && cur.round === "LP" && COMPS.findIndex((c) => c.id === cur.comp) <= COMPS.findIndex((c) => c.id === comp);
      if (better) {
        // Already qualified: the place goes to the best-ranked entrant in that competition's qualifying.
        const promote = out.find((e) => e.comp === comp && e.round !== "LP" && (e.path === "CP" || e.path === "MAIN"));
        if (promote) { promote.round = "LP"; promote.path = null; }
        continue;
      }
      if (cur) out.splice(out.indexOf(cur), 1);
      const e = { id, comp, path: null, round: "LP", country: state.teams[id].country };
      out.push(e);
      placed.set(id, e);
    }
    return out;
  }

  // ---- Coefficients -----------------------------------------------------------

  function init(state) {
    const assoc = {};
    for (const [cid, total] of ASSOCIATIONS) assoc[cid] = [1, 2, 3, 4, 5].map(() => total / 5);
    const club = {};
    for (const t of Object.values(state.teams)) {
      if (state.teams[t.id] && t.rating > 45) club[t.id] = [1, 2, 3, 4, 5].map(() => Math.max(0, (t.rating - 50) * 0.6));
    }
    // 2024/25 winners: PSG, Tottenham and Chelsea; England and Spain earned the extra places.
    const holders = { UCL: state.teams.FRA_PSG ? "FRA_PSG" : null, UEL: "TOT", UECL: "CHE" };
    state.euro = { coef: { assoc, club }, holders, next: null, history: [] };
    // First season: standings from current squad strength, cups to a strong club.
    const standings = {}, cups = {};
    for (const cid of Leagues.COUNTRY_ORDER) {
      const top = Leagues.COUNTRY[cid].divisions[0];
      if (!top) continue;
      standings[cid] = state.leagues[top].slice().sort((a, b) => state.teams[b].rating - state.teams[a].rating);
      cups[cid] = standings[cid][Math.min(standings[cid].length - 1, Math.floor(Math.random() * 6))];
    }
    if (state.outside.LIE) cups.LIE = state.outside.LIE.slice().sort((a, b) => state.teams[b].rating - state.teams[a].rating)[0];
    state.euro.next = buildEntrants(state, standings, cups, {}, state.euro.holders, ["ENG", "ESP"]);
  }

  const clubCoef = (state, id) => sum(state.euro.coef.club[id] || [0]);

  function addPoints(state, id, pts) {
    const s = state.euro.season;
    s.points[id] = (s.points[id] || 0) + pts;
  }

  // ---- Season set-up ------------------------------------------------------------

  // Ties needed so `present` clubs send on `target` (never more than half).
  const ties = (present, target) => Math.max(0, Math.min(Math.floor(present / 2), present - target));

  function emptyRound(key) {
    return { key, direct: [], drops: 0, ties: [], byes: [], drawn: false, done: false, planned: 0, plannedByes: 0, legsPlayed: 0 };
  }

  function startSeason(state) {
    const e = state.euro;
    const entrants = (e.next || []).filter((x) => state.teams[x.id]);
    e.season = { points: {}, entrants: {}, comps: {}, reach: {} };
    for (const x of entrants) {
      const c = state.teams[x.id].country;
      e.season.entrants[c] = (e.season.entrants[c] || 0) + 1;
    }
    for (const c of COMPS) {
      const comp = { id: c.id, paths: {}, lpDirect: [], lpDrops: 0, lp: null, ko: [], winner: null, runnerUp: null };
      for (const p of PATHS[c.id]) comp.paths[p] = { id: p, rounds: Object.fromEntries(QUAL.map((k) => [k, emptyRound(k)])), qualifiers: 0 };
      e.season.comps[c.id] = comp;
    }
    for (const x of entrants) {
      const comp = e.season.comps[x.comp];
      if (x.round === "LP") comp.lpDirect.push(x.id);
      else comp.paths[x.path].rounds[x.round].direct.push(x.id);
      e.season.reach[x.id] = { comp: x.comp, stage: x.round };
    }
    plan(state);
    // League-phase clubs get their participation money through the season.
    for (const c of COMPS) for (const id of e.season.comps[c.id].lpDirect) {
      const f = state.fin[id];
      if (f) f.europe = participation(state, c.id, id);
    }
    drawReady(state);
  }

  function participation(state, comp, id) {
    const lid = G().leagueOf(state, id);
    const tv = lid ? Leagues.DIVS[Leagues.COUNTRY[state.teams[id].country].divisions[0]] : null;
    const central = tv ? (tv.country === "ENG" ? FINANCE.central.PL : tv.money.tv) : 0.1;
    const market = Math.max(0.1, Math.min(3, central / 30));
    return PRIZE[comp].lp + PRIZE[comp].market * market;
  }

  // Work out how many ties each qualifying round needs (including clubs that
  // drop down from a higher competition) so each league phase has 36 clubs.
  function plan(state) {
    const comps = state.euro.season.comps;
    const strength = (id) => clubCoef(state, id) + state.teams[id].rating / 10;
    const byStrength = (ids) => ids.slice().sort((a, b) => strength(b) - strength(a));
    for (const c of COMPS) {
      const comp = comps[c.id];
      // Clubs dropping into this competition's league phase from above.
      const lpTotal = comp.lpDirect.length + comp.lpDrops;
      const paths = PATHS[c.id];
      const fixedQ = paths.reduce((t, p) => t + (QUALIFIERS[`${c.id}/${p}`] || 0), 0);
      for (const p of paths) {
        const path = comp.paths[p];
        path.qualifiers = QUALIFIERS[`${c.id}/${p}`] || Math.max(0, 36 - lpTotal - fixedQ);
        const R = QUAL.map((k) => path.rounds[k]);
        R.forEach((r) => { r.direct = byStrength(r.direct); });
        // Backwards from the play-off round. W = clubs a round must send on;
        // a full round has 2W clubs. Any shortfall comes from the round before;
        // a surplus of direct entrants starts a round earlier.
        let W = path.qualifiers;
        for (let k = R.length - 1; k >= 0; k--) {
          const r = R[k];
          let avail = r.direct.length + r.drops;
          if (k > 0 && avail > 2 * W) {
            const move = Math.min(avail - 2 * W, r.direct.length);
            R[k - 1].direct = byStrength(R[k - 1].direct.concat(r.direct.splice(r.direct.length - move, move)));
            avail = r.direct.length + r.drops;
          }
          r.target = W; // clubs this round should send on
          W = k === 0 ? 0 : Math.max(0, 2 * W - avail);
        }
        // Forwards with the expected numbers: ties needed to hit each target.
        let carry = 0;
        for (const r of R) {
          const present = r.direct.length + r.drops + carry;
          r.planned = ties(present, r.target);
          r.plannedByes = present - 2 * r.planned;
          carry = present - r.planned;
        }
        // Record where each round's losers go, for the competitions below.
        for (const r of R) {
          const drop = DROPS[`${c.id}/${p}/${r.key}`];
          if (!drop || !r.planned) continue;
          const [tc, tp, tk] = drop;
          if (tk === "LP") comps[tc].lpDrops += r.planned;
          else comps[tc].paths[tp].rounds[tk].drops += r.planned;
        }
      }
    }
  }

  // ---- Draws ------------------------------------------------------------------

  const drawn = (r) => r.drawn;
  function roundReady(state, comp, path, k) {
    const R = state.euro.season.comps[comp].paths[path].rounds;
    const i = QUAL.indexOf(k);
    if (i > 0 && !R[QUAL[i - 1]].done && (R[QUAL[i - 1]].planned || R[QUAL[i - 1]].drawn)) return false;
    // Every round that drops clubs in here must be finished.
    for (const [src, dst] of Object.entries(DROPS)) {
      if (dst[0] !== comp || dst[1] !== path || dst[2] !== k) continue;
      const [sc, sp, sk] = src.split("/");
      const sr = state.euro.season.comps[sc].paths[sp].rounds[sk];
      if (sr.planned && !sr.done) return false;
    }
    return true;
  }

  function drawRound(state, comp, path, k) {
    const r = state.euro.season.comps[comp].paths[path].rounds[k];
    const R = state.euro.season.comps[comp].paths[path].rounds;
    const i = QUAL.indexOf(k);
    const fromPrev = i > 0 ? R[QUAL[i - 1]].winners || [] : [];
    const pool = r.direct.concat(r.dropped || [], fromPrev);
    const strength = (id) => clubCoef(state, id) + state.teams[id].rating / 10;
    pool.sort((a, b) => strength(b) - strength(a));
    const n = ties(pool.length, r.target);
    const playing = pool.slice(pool.length - 2 * n);
    r.byes = pool.slice(0, pool.length - 2 * n);
    // Seeded halves: a seeded club meets an unseeded one, avoiding same-country ties.
    const seeded = Engine.shuffle(playing.slice(0, n)), unseeded = Engine.shuffle(playing.slice(n));
    r.ties = seeded.map((hi) => {
      let j = unseeded.findIndex((lo) => state.teams[lo].country !== state.teams[hi].country);
      if (j < 0) j = 0;
      const lo = unseeded.splice(j, 1)[0];
      return { hi, lo, games: [], winner: null };
    });
    r.drawn = true;
  }

  // Draw every round, league phase and knockout round whose entrants are known.
  function drawReady(state) {
    const s = state.euro.season;
    for (const c of COMPS) {
      const comp = s.comps[c.id];
      for (const p of PATHS[c.id]) {
        for (const k of QUAL) {
          const r = comp.paths[p].rounds[k];
          if (r.drawn || (!r.planned && !r.direct.length && !(r.dropped || []).length)) continue;
          if (roundReady(state, c.id, p, k)) drawRound(state, c.id, p, k);
        }
      }
      if (!comp.lp && lpReady(state, c.id)) drawLeaguePhase(state, c.id);
      if (comp.lp && comp.lp.results.length === comp.lp.fixtures.length) drawKnockout(state, c.id);
    }
  }

  function lpReady(state, comp) {
    const s = state.euro.season;
    for (const p of PATHS[comp]) for (const k of QUAL) { const r = s.comps[comp].paths[p].rounds[k]; if ((r.planned || r.drawn) && !r.done) return false; }
    for (const [src, dst] of Object.entries(DROPS)) {
      if (dst[0] !== comp || dst[2] !== "LP") continue;
      const [sc, sp, sk] = src.split("/");
      const sr = s.comps[sc].paths[sp].rounds[sk];
      if (sr.planned && !sr.done) return false;
    }
    return true;
  }

  // League phase: 36 clubs, four pots by coefficient; every club plays
  // `lpMatches` different opponents, spread across the pots, with no
  // same-country games. Uses rounds of a full round robin so matchdays are valid.
  function drawLeaguePhase(state, compId) {
    const s = state.euro.season, comp = s.comps[compId], def = compDef(compId);
    const qual = PATHS[compId].flatMap((p) => comp.paths[p].rounds.PO.winners || []);
    let teams = Array.from(new Set(comp.lpDirect.concat(comp.lpDropped || [], qual)));
    const strength = (id) => clubCoef(state, id) + state.teams[id].rating / 10;
    teams.sort((a, b) => strength(b) - strength(a));
    // At most 36 clubs: any overflow drops into the competition below.
    let overflow = teams.slice(36);
    teams = teams.slice(0, 36);
    if (teams.length % 2) { overflow = teams.slice(-1).concat(overflow); teams = teams.slice(0, -1); }
    const below = COMPS[COMPS.findIndex((c) => c.id === compId) + 1];
    if (below && overflow.length && !s.comps[below.id].lp) {
      (s.comps[below.id].lpDropped = s.comps[below.id].lpDropped || []).push(...overflow);
      for (const id of overflow) s.reach[id] = { comp: below.id, stage: "LP" };
    }
    const nPots = def.lpMatches === 6 ? 6 : 4;
    const potSize = Math.ceil(teams.length / nPots);
    const pot = Object.fromEntries(teams.map((id, i) => [id, Math.floor(i / potSize)]));
    const country = (id) => state.teams[id].country;
    let best = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const rounds = Engine.generateFixtures(Engine.shuffle(teams), 1);
      const chosen = [];
      const met = {}; // id -> {pot counts, country counts}
      teams.forEach((id) => { met[id] = { pots: new Array(nPots).fill(0), countries: {} }; });
      const per = def.lpMatches / nPots; // opponents wanted from each pot
      const score = (md) => md.reduce((t, f) => {
        if (country(f.h) === country(f.a)) return t + 100;
        const a = met[f.h], b = met[f.a];
        return t + Math.max(0, a.pots[pot[f.a]] + 1 - per) * 3 + Math.max(0, b.pots[pot[f.h]] + 1 - per) * 3
          + Math.max(0, (a.countries[country(f.a)] || 0) + 1 - 2) * 10 + Math.max(0, (b.countries[country(f.h)] || 0) + 1 - 2) * 10;
      }, 0);
      const left = rounds.slice();
      let total = 0;
      for (let m = 0; m < def.lpMatches; m++) {
        let bi = 0, bs = Infinity;
        left.forEach((md, i) => { const sc = score(md); if (sc < bs) { bs = sc; bi = i; } });
        const md = left.splice(bi, 1)[0];
        total += bs;
        md.forEach((f) => {
          met[f.h].pots[pot[f.a]]++; met[f.a].pots[pot[f.h]]++;
          met[f.h].countries[country(f.a)] = (met[f.h].countries[country(f.a)] || 0) + 1;
          met[f.a].countries[country(f.h)] = (met[f.a].countries[country(f.h)] || 0) + 1;
        });
        chosen.push(md);
      }
      if (!best || total < best.total) best = { total, chosen };
      if (total === 0) break;
    }
    // Venues: balance home games.
    const homes = Object.fromEntries(teams.map((id) => [id, 0]));
    const fixtures = best.chosen.map((md) => md.map((f) => {
      const [h, a] = homes[f.h] <= homes[f.a] ? [f.h, f.a] : [f.a, f.h];
      homes[h]++;
      return { h, a };
    }));
    comp.lp = { teams, pot, fixtures, results: [] };
    for (const id of teams) {
      s.reach[id] = { comp: compId, stage: "LP" };
      addPoints(state, id, BONUS[compId].LP);
      const f = state.fin[id];
      // Clubs that qualified (rather than entering directly) get their participation money now.
      if (f && !comp.lpDirect.includes(id)) G().credit(state, id, participation(state, compId, id), "europe");
    }
  }

  function lpTable(state, compId) {
    const lp = state.euro.season.comps[compId].lp;
    if (!lp) return [];
    return Engine.buildTable(lp.teams, lp.results);
  }

  function drawKnockout(state, compId) {
    const comp = state.euro.season.comps[compId];
    const n = comp.ko.length;
    const tie = (hi, lo, legs = 2) => ({ hi, lo, legs, games: [], winner: null });
    if (n === 0) {
      const t = lpTable(state, compId).map((r) => r.id);
      comp.lpFinal = t;
      t.slice(24).forEach((id) => { state.euro.season.reach[id].out = "LP"; });
      const reachStage = (id, key) => {
        state.euro.season.reach[id].stage = key;
        addPoints(state, id, BONUS[compId][key] || 0);
        if (PRIZE[compId][key]) G().credit(state, id, PRIZE[compId][key], "europe");
      };
      t.slice(0, 8).forEach((id) => reachStage(id, "R16"));
      t.slice(8, 24).forEach((id) => reachStage(id, "KOPO"));
      const ties = [];
      for (let i = 8; i < 16; i++) ties.push(tie(t[i], t[31 - i]));
      comp.ko.push({ key: "KOPO", ties, top8: t.slice(0, 8) });
    } else {
      const last = comp.ko[n - 1];
      if (last.ties.some((x) => !x.winner) || last.key === "F") return;
      const w = last.ties.map((x) => x.winner);
      let ties;
      if (last.key === "KOPO") {
        const top = last.top8; // seed i meets the winner of the tie involving 16−i/17+i
        ties = top.map((id, i) => tie(id, w[7 - i]));
      } else if (last.key === "R16") ties = [tie(w[0], w[7]), tie(w[3], w[4]), tie(w[1], w[6]), tie(w[2], w[5])];
      else if (last.key === "QF") ties = [tie(w[0], w[1]), tie(w[2], w[3])];
      else ties = [tie(w[0], w[1], 1)];
      const key = KO[KO.indexOf(last.key) + 1];
      comp.ko.push({ key, ties });
      for (const id of w) {
        state.euro.season.reach[id].stage = key;
        addPoints(state, id, BONUS[compId][key] || 0);
        if (PRIZE[compId][key]) G().credit(state, id, PRIZE[compId][key], "europe");
      }
    }
  }

  // ---- Bracket ------------------------------------------------------------------
  // The knockouts as a bracket, in tree order: every round-of-16 tie is fed by
  // one knockout play-off (its seeded club waits) and every later tie by the
  // two before it. Before the knockouts start, slots are filled provisionally
  // from the current league-phase table.
  //   { cols: [{ name, short, feed, matches: [{ a, b, ga, gb, winner, legs, note, seedA, seedB, prov }] }], winner, provisional }

  const KOPO_ORDER = [7, 0, 4, 3, 6, 1, 5, 2]; // play-off ties, top to bottom
  const R16_ORDER = [0, 7, 3, 4, 1, 6, 2, 5];  // round-of-16 ties, top to bottom
  const QF_FEED = [[0, 7], [3, 4], [1, 6], [2, 5]]; // R16 ties feeding each quarter-final

  function bracket(state, compId) {
    const comp = state.euro.season.comps[compId];
    const stage = (k) => comp.ko.find((x) => x.key === k);
    const goals = (t, id) => t.games.reduce((a, g) => a + (g.h === id ? g.hg : g.a === id ? g.ag : 0), 0);
    const match = (t, a, b, extra = {}) => {
      const last = t && t.games[t.games.length - 1];
      const scored = !!(t && t.games.length);
      return {
        a, b, ga: scored ? goals(t, a) : null, gb: scored ? goals(t, b) : null, winner: (t && t.winner) || null,
        note: last && last.pens ? "pens" : last && last.aet ? "aet" : "",
        legs: t ? t.games.map((g) => ({ h: g.h, a: g.a, hg: g.hg, ag: g.ag })) : [], ...extra,
      };
    };
    const final = comp.lpFinal;
    const table = final || (comp.lp && comp.lp.results.length ? lpTable(state, compId).map((r) => r.id) : []);
    const prov = !final;
    const seed = (pos) => table[pos - 1] || null;
    const kopo = stage("KOPO"), r16 = stage("R16"), qf = stage("QF"), sf = stage("SF"), fin = stage("F");
    const winnerOf = (t) => (t ? t.winner : null);

    const kopoCol = KOPO_ORDER.map((i) => {
      const t = kopo && kopo.ties[i];
      return match(t, t ? t.hi : seed(9 + i), t ? t.lo : seed(24 - i), { seedA: 9 + i, seedB: 24 - i, prov: !t && prov });
    });
    const r16Col = R16_ORDER.map((i) => {
      const t = r16 && r16.ties[i];
      return match(t, t ? t.hi : seed(i + 1), t ? t.lo : winnerOf(kopo && kopo.ties[7 - i]), { seedA: i + 1, prov: !t && prov });
    });
    const qfCol = QF_FEED.map(([x, y], q) => {
      const t = qf && qf.ties[q];
      return match(t, t ? t.hi : winnerOf(r16 && r16.ties[x]), t ? t.lo : winnerOf(r16 && r16.ties[y]));
    });
    const sfCol = [0, 1].map((s) => {
      const t = sf && sf.ties[s];
      return match(t, t ? t.hi : winnerOf(qf && qf.ties[2 * s]), t ? t.lo : winnerOf(qf && qf.ties[2 * s + 1]));
    });
    const ft = fin && fin.ties[0];
    const fCol = [match(ft, ft ? ft.hi : winnerOf(sf && sf.ties[0]), ft ? ft.lo : winnerOf(sf && sf.ties[1]))];
    return {
      cols: [
        { name: "Play-offs", short: "KOPO", feed: 0, matches: kopoCol },
        { name: "Round of 16", short: "R16", feed: 1, matches: r16Col },
        { name: "Quarter-finals", short: "QF", feed: 2, matches: qfCol },
        { name: "Semi-finals", short: "SF", feed: 2, matches: sfCol },
        { name: "Final", short: "F", feed: 2, matches: fCol, neutral: true },
      ],
      winner: comp.winner, provisional: prov && table.length > 0, started: comp.ko.length > 0,
    };
  }

  // ---- Calendar -----------------------------------------------------------------

  function calendarEvents(state, n) {
    const ev = [];
    const at = (x) => Math.max(0, Math.min(n - 1, Math.round(x * n)));
    for (const k of QUAL) for (const leg of [1, 2]) for (const c of COMPS) {
      ev.push({ type: "euro", comp: c.id, stage: k, leg, after: at(AT[k][leg - 1]) });
    }
    for (let m = 0; m < 8; m++) for (const c of COMPS) {
      const times = c.lpMatches === 6 ? AT.LP6 : AT.LP;
      if (m < c.lpMatches) ev.push({ type: "euro", comp: c.id, stage: "LP", md: m, after: at(times[m]) });
    }
    for (const k of ["KOPO", "R16", "QF", "SF"]) for (const leg of [1, 2]) for (const c of COMPS) {
      ev.push({ type: "euro", comp: c.id, stage: k, leg, after: at(AT[k][leg - 1]) });
    }
    for (const c of COMPS.slice().reverse()) ev.push({ type: "euro", comp: c.id, stage: "F", leg: 1, after: at(c.finalAt) });
    return ev;
  }

  // Ties/matches an event will play.
  function eventMatches(state, ev) {
    const comp = state.euro.season.comps[ev.comp];
    if (QUAL.includes(ev.stage)) {
      return PATHS[ev.comp].flatMap((p) => {
        const r = comp.paths[p].rounds[ev.stage];
        return r.drawn ? r.ties.map((t) => ({ t, path: p })) : [];
      });
    }
    if (ev.stage === "LP") return comp.lp && comp.lp.fixtures[ev.md] ? comp.lp.fixtures[ev.md].map((f) => ({ f })) : [];
    const stage = comp.ko.find((x) => x.key === ev.stage);
    return stage ? stage.ties.map((t) => ({ t })) : [];
  }

  const legFixture = (t, leg, final) => (final ? { h: t.hi, a: t.lo, neutral: true } : leg === 1 ? { h: t.lo, a: t.hi } : { h: t.hi, a: t.lo });

  function involves(state, ev) {
    drawReady(state);
    const me = state.myTeam;
    return eventMatches(state, ev).some((m) => (m.f ? m.f.h === me || m.f.a === me : (m.t.hi === me || m.t.lo === me) && !m.t.winner));
  }

  // Your match in an event: { f: fixture, game: result if played } or null.
  function myMatch(state, ev) {
    if (!state.euro.season) return null;
    const me = state.myTeam;
    const m = eventMatches(state, ev).find((x) => (x.f ? x.f.h === me || x.f.a === me : x.t.hi === me || x.t.lo === me));
    if (!m) return null;
    const final = ev.stage === "F";
    if (m.f) {
      const lp = state.euro.season.comps[ev.comp].lp;
      const game = (lp.results[ev.md] || []).find((g) => g.h === me || g.a === me) || null;
      return { f: m.f, game };
    }
    const f = legFixture(m.t, ev.leg, final);
    return { f, game: m.t.games[final ? 0 : ev.leg - 1] || null, tie: m.t };
  }

  function stageName(ev) {
    if (ev.stage === "LP") return `League phase, matchday ${ev.md + 1}`;
    if (ev.stage === "F") return "Final";
    return `${QUAL_NAMES[ev.stage] || KO_NAMES[ev.stage]}, ${ev.leg === 1 ? "1st" : "2nd"} leg`;
  }

  function myFixture(state, ev) {
    drawReady(state);
    const me = state.myTeam;
    const m = eventMatches(state, ev).find((x) => (x.f ? x.f.h === me || x.f.a === me : (x.t.hi === me || x.t.lo === me) && !x.t.winner));
    if (!m) return null;
    const c = compDef(ev.comp);
    const final = ev.stage === "F";
    const f = m.f || legFixture(m.t, ev.leg, final);
    return {
      h: f.h, a: f.a, kind: "euro", comp: ev.comp, compName: c.name, name: stageName(ev), neutral: !!f.neutral,
      home: f.h === me, opp: f.h === me ? f.a : f.h, final, extraTime: true,
      legOne: !m.f && !final && ev.leg === 1, firstLeg: !m.f && !final && ev.leg === 2 ? m.t.games[0] : null,
    };
  }

  // ---- Playing ------------------------------------------------------------------

  function playEvent(state, ev) {
    drawReady(state);
    const s = state.euro.season, comp = s.comps[ev.comp], me = state.myTeam;
    const qual = QUAL.includes(ev.stage);
    const prize = PRIZE[ev.comp];
    let mine = null;
    const results = [];
    const record = (g) => {
      const hRes = g.hg > g.ag ? "W" : g.hg < g.ag ? "L" : "D";
      const k = qual ? 0.5 : 1;
      if (hRes === "W") addPoints(state, g.h, 2 * k); else if (hRes === "L") addPoints(state, g.a, 2 * k);
      else { addPoints(state, g.h, k); addPoints(state, g.a, k); }
      if (!qual) {
        if (hRes === "W") G().credit(state, g.h, prize.win, "europe");
        if (hRes === "L") G().credit(state, g.a, prize.win, "europe");
        if (hRes === "D") { G().credit(state, g.h, prize.draw, "europe"); G().credit(state, g.a, prize.draw, "europe"); }
      }
      if (!g.neutral) G().credit(state, g.h, (G().crowdFor(state, g.h, 1.2) * G().matchdayYield(state, g.h)) / 1e6, "europe");
    };
    for (const m of eventMatches(state, ev)) {
      if (m.t && m.t.winner) continue;
      const final = ev.stage === "F";
      const f = m.f || legFixture(m.t, ev.leg, final);
      const r = G().playGame(state, f.h, f.a, { neutral: !!f.neutral, kind: "euro", midweek: true });
      const g = { h: f.h, a: f.a, hg: r.hg, ag: r.ag, xg: r.xg, neutral: !!f.neutral };
      if (r.cards && (r.cards.r[0] || r.cards.r[1])) g.rc = r.cards.r;
      if (m.t) {
        m.t.games.push(g);
        const decisive = final || ev.leg === 2;
        if (decisive) {
          const lead = () => m.t.games.reduce((d, x) => d + (x.h === m.t.hi ? x.hg - x.ag : x.ag - x.hg), 0);
          G().settle(g, lead, true);
          m.t.winner = lead() > 0 ? m.t.hi : lead() < 0 ? m.t.lo : g.pens === "h" ? g.h : g.a;
          m.t.loser = m.t.winner === m.t.hi ? m.t.lo : m.t.hi;
        }
        if (qual) { G().credit(state, f.h, prize.qual / 2, "europe"); G().credit(state, f.a, prize.qual / 2, "europe"); }
      }
      delete g.xg;
      record(g);
      results.push(g);
      if (g.h === me || g.a === me) {
        const home = g.h === me;
        const res = g.hg === g.ag ? "D" : (g.hg > g.ag) === home ? "W" : "L";
        mine = { ...g, kind: "euro", cupName: compDef(ev.comp).name, roundName: stageName(ev), home, res,
          through: m.t && m.t.winner ? m.t.winner === me : undefined, final: ev.stage === "F", round: ev.leg };
      }
    }
    if (ev.stage === "LP") comp.lp.results.push(results);
    if (qual && ev.leg === 2) finishQualifying(state, ev.comp, ev.stage);
    if (KO.includes(ev.stage) && (ev.leg === 2 || ev.stage === "F")) finishKnockout(state, ev.comp, ev.stage);
    state.lastPlayed = { type: "euro", comp: ev.comp, stage: ev.stage, md: ev.md, leg: ev.leg, games: results };
    newsFor(state, ev, mine);
    drawReady(state);
    return mine;
  }

  function finishQualifying(state, compId, k) {
    const s = state.euro.season;
    for (const p of PATHS[compId]) {
      const r = s.comps[compId].paths[p].rounds[k];
      if (!r.drawn || r.done) continue;
      r.done = true;
      r.winners = r.ties.map((t) => t.winner).concat(r.byes);
      const losers = r.ties.map((t) => t.loser);
      const drop = DROPS[`${compId}/${p}/${k}`];
      for (const id of losers) s.reach[id] = { comp: compId, stage: k, out: true };
      if (drop) {
        const [tc, tp, tk] = drop;
        if (tk === "LP") (s.comps[tc].lpDropped = s.comps[tc].lpDropped || []).push(...losers);
        else { const dst = s.comps[tc].paths[tp].rounds[tk]; (dst.dropped = dst.dropped || []).push(...losers); }
        for (const id of losers) s.reach[id] = { comp: tc, stage: tk };
      }
    }
  }

  function finishKnockout(state, compId, key) {
    const comp = state.euro.season.comps[compId];
    const st = comp.ko.find((x) => x.key === key);
    if (!st || st.ties.some((t) => !t.winner)) return;
    for (const t of st.ties) state.euro.season.reach[t.loser].out = key;
    if (key === "F") {
      comp.winner = st.ties[0].winner;
      comp.runnerUp = st.ties[0].loser;
      Managers.trophy(state, comp.winner, compId, compDef(compId).name);
      state.euro.season.reach[comp.winner].stage = "W";
      G().credit(state, comp.winner, PRIZE[compId].W, "europe");
      addPoints(state, comp.winner, 1);
    }
  }

  function newsFor(state, ev, mine) {
    const c = compDef(ev.comp);
    const label = c.short;
    if (mine) {
      const opp = state.teams[mine.home ? mine.a : mine.h].name;
      const score = mine.home ? `${mine.hg}–${mine.ag}` : `${mine.ag}–${mine.hg}`;
      let text = `${c.name}, ${stageName(ev).toLowerCase()}: ${{ W: "Won", D: "Drew", L: "Lost" }[mine.res]} ${score} ${mine.neutral ? "against" : mine.home ? "vs" : "at"} ${opp}${mine.aet && !mine.pens ? " after extra time" : ""}.`;
      if (mine.pens) text += mine.through ? " Won on penalties." : " Lost on penalties.";
      if (mine.through === true) text += mine.final ? ` ${c.name.toUpperCase()} WINNERS!` : " Through!";
      if (mine.through === false) text += mine.final ? " Runners-up." : " Knocked out.";
      state.news.unshift({ md: state.results.length, label, type: mine.through === undefined ? mine.res : mine.through ? "W" : "L", text });
    }
    if (ev.stage === "F") {
      const w = state.euro.season.comps[ev.comp].winner;
      if (w && w !== state.myTeam) state.news.unshift({ md: state.results.length, label, type: "info", text: `${state.teams[w].name} win the ${c.name}.` });
    }
  }

  // ---- End of season ----------------------------------------------------------

  function endSeason(state, tables, euroPlayoff) {
    const e = state.euro, s = e.season;
    // Club coefficients: this season's points join the five-season window.
    const clubs = new Set([...Object.keys(e.coef.club), ...Object.keys(s.points)]);
    for (const id of clubs) {
      const arr = e.coef.club[id] || [0, 0, 0, 0, 0];
      arr.push(s.points[id] || 0);
      while (arr.length > 5) arr.shift();
      e.coef.club[id] = arr;
    }
    // Association coefficients: points per club entered.
    const season = {};
    for (const [id, pts] of Object.entries(s.points)) {
      const c = state.teams[id].country;
      season[c] = (season[c] || 0) + pts;
    }
    for (const cid of Object.keys(e.coef.assoc)) {
      const v = s.entrants[cid] ? (season[cid] || 0) / s.entrants[cid] : 0;
      e.coef.assoc[cid].push(Math.round(v * 1000) / 1000);
      while (e.coef.assoc[cid].length > 5) e.coef.assoc[cid].shift();
    }
    const lastSeason = Object.keys(e.coef.assoc).sort((a, b) => e.coef.assoc[b][4] - e.coef.assoc[a][4]);
    const eps = lastSeason.filter((c) => !BANNED.has(c)).slice(0, 2);
    e.lastEps = eps;
    e.holders = { UCL: s.comps.UCL.winner, UEL: s.comps.UEL.winner, UECL: s.comps.UECL.winner };
    e.history.push({ season: state.season, winners: { ...e.holders } });
    const standings = {}, cups = {};
    for (const cid of Leagues.COUNTRY_ORDER) {
      const top = Leagues.COUNTRY[cid].divisions[0];
      if (top) standings[cid] = tables[top].map((r) => r.id);
      // England: the FA Cup winner takes the cup place.
      const cup = state.cups[cid === "ENG" ? "FA" : `${cid}_CUP`];
      if (cup && cup.winner) cups[cid] = cup.winner;
    }
    e.next = buildEntrants(state, standings, cups, euroPlayoff, e.holders, eps);
    // League-phase money is set for next season in startSeason.
    for (const f of Object.values(state.fin)) f.europe = 0;
  }

  // What a club did in Europe this season: { comp, name, text, won } or null.
  function summaryFor(state, id) {
    const r = state.euro.season && state.euro.season.reach[id];
    return r ? describe(r) : null;
  }

  function describe(r) {
    const c = compDef(r.comp);
    const won = r.stage === "W";
    const text = won ? "Winners!" : r.out === "F" ? "Runners-up" : r.out ? `${STAGE_TEXT[r.out]}` : STAGE_TEXT[r.stage];
    return { comp: r.comp, name: c.name, text, won };
  }

  function archiveEntry(state) {
    const s = state.euro.season;
    const reach = {};
    for (const [id, r] of Object.entries(s.reach)) reach[id] = [r.comp, r.out || r.stage, r.stage === "W" ? 1 : 0];
    return { winners: { UCL: s.comps.UCL.winner, UEL: s.comps.UEL.winner, UECL: s.comps.UECL.winner }, reach };
  }

  function reachFrom(entry, id) {
    if (!entry || !entry.reach[id]) return null;
    const [comp, stage, won] = entry.reach[id];
    return describe({ comp, stage: won ? "W" : stage, out: won ? null : stage });
  }

  // Next season's European place for a club, as text, or null.
  function qualificationFor(state, id) {
    const e = (state.euro.next || []).find((x) => x.id === id);
    if (!e) return null;
    const c = compDef(e.comp);
    return e.round === "LP" ? `${c.name} league phase` : `${c.name} (${STAGE_TEXT[e.round].toLowerCase()})`;
  }

  function expectedIncome(state, id) {
    const e = (state.euro.next || []).find((x) => x.id === id);
    return e && e.round === "LP" ? participation(state, e.comp, id) : 0;
  }

  // Association ranking with five-season totals, for the UI.
  function ranking(state) {
    return rankings(state).map((cid, i) => ({ cid, rank: i + 1, total: sum(state.euro.coef.assoc[cid]), seasons: state.euro.coef.assoc[cid].slice(), banned: BANNED.has(cid) }));
  }

  return {
    COMPS, PRIZE, STAGE_TEXT, QUAL, KO, KO_NAMES, QUAL_NAMES, init, myMatch, stageName, startSeason, calendarEvents, involves, myFixture, playEvent,
    endSeason, summaryFor, archiveEntry, reachFrom, qualificationFor, expectedIncome, ranking, lpTable, clubCoef, accessFor, drawReady, bracket,
  };
})();
