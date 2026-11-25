// Leagues across Europe: the registry of every division, season formats
// (round-robins and split phases), tables, domestic cups outside England, and
// end-of-season play-offs and promotion/relegation outside England.
// Game internals are reached through Game.internal at run time.

const Leagues = (() => {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const G = () => Game.internal;

  // ---- Registry -------------------------------------------------------------

  const RANK = Object.fromEntries(ASSOCIATIONS.map(([id], i) => [id, i + 1]));
  const DIVS = {};
  const COUNTRY = {};

  COUNTRY.ENG = { id: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", divisions: LEAGUES.map((l) => l.id), cupIds: ["FA", "EFL"] };
  for (const l of LEAGUES) DIVS[l.id] = { ...l, country: "ENG", format: { rr: 2 } };

  // Promotion and relegation outside England (the second tiers are closed at the bottom).
  const PROREL = {
    ESP: { top: "ESP1", second: "ESP2", down: 3, up: 2, playoff: "spain" },
    ITA: { top: "ITA1", second: "ITA2", down: 3, up: 2, playoff: "italy" },
    GER: { top: "GER1", second: "GER2", down: 2, up: 2, playoff: "germany" },
    FRA: { top: "FRA1", second: "FRA2", down: 2, up: 2, playoff: "france" },
  };

  const byRank = COUNTRIES.slice().sort((a, b) => (RANK[a.id] || 99) - (RANK[b.id] || 99));
  for (const c of byRank) {
    COUNTRY[c.id] = { id: c.id, name: c.name, flag: c.flag, divisions: c.divisions.map((d) => d.id), cup: c.cup, cupIds: [`${c.id}_CUP`] };
    for (const d of c.divisions) {
      const r = d.teams.map((t) => t[2]);
      const pr = PROREL[c.id];
      const zones = { champion: 1, down: 0 };
      if (pr && d.id === pr.top) { zones.down = pr.down; if (pr.playoff === "germany" || pr.playoff === "france") zones.relPlayoff = d.teams.length - pr.down; }
      if (pr && d.id === pr.second) {
        zones.autoUp = pr.up;
        zones.playoff = { spain: [3, 6], italy: [3, 8], germany: [3, 3], france: [3, 5] }[pr.playoff];
      }
      DIVS[d.id] = {
        ...d, country: c.id, budgetBase: d.money.budget, ticketYield: d.money.ticket, zones,
        impact: clamp(0.4 + (Math.max(...r) - Math.min(...r)) / 28, 0.5, 1),
      };
    }
  }
  const DIV_ORDER = Object.keys(DIVS);
  const COUNTRY_ORDER = ["ENG", ...byRank.map((c) => c.id)];

  // Domestic cups outside England: everyone in the listed divisions (or
  // Liechtenstein's clubs) in a knockout, strongest clubs given first-round byes.
  const FOREIGN_CUPS = byRank.map((c) => {
    const n = c.cupTeams ? c.cupTeams.length : c.cup.divisions.reduce((t, id) => t + DIVS[id].teams.length, 0);
    const R = Math.max(1, Math.ceil(Math.log2(n)));
    const budget = c.divisions.length ? DIVS[c.divisions[0].id].budgetBase : 0.1;
    const rounds = [];
    for (let r = 0; r < R; r++) {
      const size = 2 ** (R - r);
      const final = size === 2;
      rounds.push({
        name: final ? "Final" : size === 4 ? "Semi-final" : size === 8 ? "Quarter-final" : `Round of ${size}`,
        short: final ? "F" : size === 4 ? "SF" : size === 8 ? "QF" : `R${size}`,
        at: final ? 0.93 : 0.08 + (r / Math.max(1, R - 1)) * 0.75,
        prize: budget * (final ? 0.2 : 0.02 * 2 ** r), extraTime: true, neutral: final,
      });
    }
    return { id: `${c.id}_CUP`, country: c.id, name: c.cup.name, short: c.cup.short, tag: c.cup.short, byes: true, divisions: c.cup.divisions, rounds };
  });

  const divisionDef = (id) => DIVS[id];
  const countryOf = (lid) => DIVS[lid].country;

  // ---- Formats --------------------------------------------------------------

  const perRound = (n) => (n % 2 ? n : n - 1);
  const regularLength = (lid, n) => perRound(n) * DIVS[lid].format.rr;
  function splitLength(lid) {
    const s = DIVS[lid].format.split;
    return s ? Math.max(...s.groups.map((g) => perRound(g.size) * g.rr)) : 0;
  }

  // A season's fixtures. Split-phase matchdays are placeholders, filled in
  // once the regular season ends and the groups are known.
  function seasonFixtures(state, lid) {
    const fx = Engine.generateFixtures(state.leagues[lid], DIVS[lid].format.rr);
    for (let i = 0; i < splitLength(lid); i++) fx.push([]);
    return fx;
  }

  // After each matchday: start the split phase when the regular season ends.
  function afterMatchday(state, lid, fixtures, results) {
    const split = DIVS[lid].format.split;
    const reg = regularLength(lid, state.leagues[lid].length);
    if (!split || results.length !== reg) return;
    const base = table(state, lid, reg);
    let at = 0;
    const groups = split.groups.map((g) => {
      const ids = base.slice(at, at + g.size).map((r) => r.id);
      at += g.size;
      return ids;
    });
    (state.splits = state.splits || {})[lid] = groups;
    groups.forEach((ids, gi) => {
      Engine.generateFixtures(ids, split.groups[gi].rr).forEach((md, i) => { fixtures[reg + i].push(...md); });
    });
  }

  // League table after `upto` matchdays (default: all played), honouring
  // points deductions and any split phase (groups ranked in order).
  function table(state, lid, upto) {
    const ids = state.leagues[lid];
    const all = G().leagueFixtures(state, lid).results;
    const res = upto == null ? all : all.slice(0, upto);
    const ded = state.deduct || {};
    const split = DIVS[lid].format.split;
    const reg = regularLength(lid, ids.length);
    if (!split || res.length <= reg || !(state.splits && state.splits[lid])) return Engine.buildTable(ids, res, ded);
    const base = Engine.buildTable(ids, res.slice(0, reg), ded);
    const byId = Object.fromEntries(base.map((r) => [r.id, r]));
    let out = [];
    state.splits[lid].forEach((gids, gi) => {
      const g = split.groups[gi];
      const rows = {};
      for (const id of gids) {
        const r = byId[id];
        rows[id] = { ...r, form: r.form.slice(), pts: g.carry === "half" ? Math.ceil(r.pts / 2) : r.pts, group: gi };
      }
      for (const md of res.slice(reg)) for (const m of md) if (rows[m.h] && rows[m.a]) Engine.addResult(rows, m);
      out = out.concat(Engine.sortTable(Object.values(rows)));
    });
    return out;
  }

  function positionHistory(state, lid) {
    const ids = state.leagues[lid];
    const out = Object.fromEntries(ids.map((id) => [id, []]));
    const n = G().leagueFixtures(state, lid).results.length;
    for (let k = 1; k <= n; k++) table(state, lid, k).forEach((r, i) => out[r.id].push(i + 1));
    return out;
  }

  // In the split phase: the groups, for Monte Carlo projections.
  function splitGroups(state, lid) {
    const reg = regularLength(lid, state.leagues[lid].length);
    const played = G().leagueFixtures(state, lid).results.length;
    return played >= reg && state.splits && state.splits[lid] ? state.splits[lid] : null;
  }

  // ---- End-of-season series -------------------------------------------------
  // A series is a run of knockout stages. Each tie has one or two legs.
  // Level ties: "et" = extra time then penalties; "seed" = extra time, then the
  // better-placed club goes through (Spain, Italy).

  function makeTie(hi, lo, legs, neutral = false) {
    // Two legs: the lower seed hosts the first leg.
    return { hi, lo, legs, neutral, games: [], winner: null, loser: null };
  }

  function stage(name, ties) { return { name, ties }; }

  // Builders return the first stage; nextStage() adds the rest from winners.
  function createSeries(state, type, info) {
    const s = { type, ...info, stages: [], leg: 0, winner: null, done: false };
    const p = info.seeds; // ids in finishing order
    if (type === "spain") s.stages.push(stage("Semi-finals", [makeTie(p[0], p[3], 2), makeTie(p[1], p[2], 2)]));
    if (type === "italy") s.stages.push(stage("Preliminary round", [makeTie(p[2], p[5], 1), makeTie(p[3], p[4], 1)]));
    if (type === "germany") s.stages.push(stage("Relegation play-off", [makeTie(info.topClub, p[0], 2)]));
    if (type === "france") s.stages.push(stage("Play-off round 1", [makeTie(p[1], p[2], 1)]));
    if (type === "europe") {
      const n = p.length, size = 2 ** Math.ceil(Math.log2(n));
      const byes = size - n;
      s.byes = p.slice(0, byes);
      const rest = p.slice(byes);
      const ties = [];
      for (let i = 0; i < rest.length / 2; i++) ties.push(makeTie(rest[i], rest[rest.length - 1 - i], 1));
      s.stages.push(stage(size === 2 ? "Final" : size === 4 ? "Semi-finals" : "Quarter-finals", ties));
    }
    return s;
  }

  function nextStage(s) {
    const last = s.stages[s.stages.length - 1];
    const w = last.ties.map((t) => t.winner);
    const rank = (id) => s.seeds.indexOf(id) === -1 ? 99 : s.seeds.indexOf(id);
    const order = (a, b) => (rank(a) <= rank(b) ? [a, b] : [b, a]);
    if (s.type === "spain" && s.stages.length === 1) return stage("Final", [makeTie(...order(w[0], w[1]), 2)]);
    if (s.type === "italy" && s.stages.length === 1) {
      const [x, y] = rank(w[0]) > rank(w[1]) ? [w[0], w[1]] : [w[1], w[0]]; // x = lowest seed left
      return stage("Semi-finals", [makeTie(s.seeds[0], x, 2), makeTie(s.seeds[1], y, 2)]);
    }
    if (s.type === "italy" && s.stages.length === 2) return stage("Final", [makeTie(...order(w[0], w[1]), 2)]);
    if (s.type === "france" && s.stages.length === 1) return stage("Play-off round 2", [makeTie(s.seeds[0], w[0], 1)]);
    if (s.type === "france" && s.stages.length === 2) return stage("Barrage", [makeTie(s.topClub, w[0], 2)]);
    if (s.type === "europe") {
      const alive = [...(s.byes || []), ...w].sort((a, b) => rank(a) - rank(b));
      s.byes = [];
      if (alive.length < 2) return null;
      const ties = [];
      for (let i = 0; i < alive.length / 2; i++) ties.push(makeTie(alive[i], alive[alive.length - 1 - i], 1));
      return stage(alive.length === 2 ? "Final" : "Semi-finals", ties);
    }
    return null;
  }

  // Fixture for the current leg of a tie.
  function legFixture(t, leg) {
    if (t.legs === 1) return { h: t.hi, a: t.lo, neutral: t.neutral };
    return leg === 0 ? { h: t.lo, a: t.hi, neutral: false } : { h: t.hi, a: t.lo, neutral: false };
  }

  // Goals for `hi` minus goals for `lo` across the games played.
  function tieLead(t) {
    return t.games.reduce((d, g) => d + (g.h === t.hi ? g.hg - g.ag : g.ag - g.hg), 0);
  }

  const drawRule = (s) => (s.type === "spain" || s.type === "italy" ? "seed" : "et");

  // Play the current leg of every tie in the current stage.
  function playStep(state, s) {
    if (s.done) return [];
    const st = s.stages[s.stages.length - 1];
    const games = [];
    for (const t of st.ties) {
      if (t.winner || s.leg >= t.legs) continue;
      const f = legFixture(t, s.leg);
      const m = G().playGame(state, f.h, f.a, { neutral: f.neutral, kind: "playoff" });
      const g = { h: f.h, a: f.a, hg: m.hg, ag: m.ag, xg: m.xg, neutral: f.neutral };
      t.games.push(g);
      games.push(g);
      if (s.leg === t.legs - 1) {
        const lead = () => tieLead(t);
        if (drawRule(s) === "seed") {
          G().settle(g, lead, true);
          delete g.pens;
          t.winner = lead() > 0 ? t.hi : lead() < 0 ? t.lo : t.hi;
        } else {
          G().settle(g, lead, true);
          t.winner = lead() > 0 ? t.hi : lead() < 0 ? t.lo : g.pens === "h" ? g.h : g.a;
        }
        t.loser = t.winner === t.hi ? t.lo : t.hi;
      }
      delete g.xg;
    }
    const maxLegs = Math.max(...st.ties.map((t) => t.legs));
    s.leg++;
    if (s.leg >= maxLegs) {
      s.leg = 0;
      const next = nextStage(s);
      if (next) s.stages.push(next);
      else { s.done = true; s.winner = st.ties[0].winner; }
    }
    return games;
  }

  function runSeries(state, s) {
    let guard = 0;
    while (!s.done && guard++ < 20) playStep(state, s);
    return s;
  }

  // Every end-of-season series in a country, from final tables.
  function seriesFor(state, cid, tables) {
    const out = [];
    const pr = PROREL[cid];
    if (pr) {
      const second = tables[pr.second].map((r) => r.id);
      const top = tables[pr.top].map((r) => r.id);
      const name = { spain: "Segunda play-offs", italy: "Serie B play-offs", germany: "Relegation play-off", france: "Ligue 2 play-offs" }[pr.playoff];
      const seeds = { spain: second.slice(2, 6), italy: second.slice(2, 8), germany: [second[2]], france: second.slice(2, 5) }[pr.playoff];
      const topClub = pr.playoff === "germany" || pr.playoff === "france" ? top[top.length - pr.down - 1] : null;
      out.push(createSeries(state, pr.playoff, { kind: "promotion", country: cid, lid: pr.second, name, seeds, topClub }));
    }
    for (const lid of COUNTRY[cid].divisions) {
      const po = DIVS[lid].format.playoff;
      if (!po) continue;
      const seeds = tables[lid].slice(po.from - 1, po.to).map((r) => r.id);
      out.push(createSeries(state, "europe", { kind: "europe", country: cid, lid, name: po.name, seeds }));
    }
    return out;
  }

  // Who goes up and down in a country once its series are done.
  function countryMoves(cid, tables, series) {
    const pr = PROREL[cid];
    if (!pr) return null;
    const top = tables[pr.top].map((r) => r.id), second = tables[pr.second].map((r) => r.id);
    const down = top.slice(top.length - pr.down);
    const up = second.slice(0, pr.up);
    const s = series.find((x) => x.kind === "promotion");
    if (pr.playoff === "spain" || pr.playoff === "italy") up.push(s.winner);
    else {
      // Germany/France: the lower-division club wins the play-off → swap.
      const t = s.stages[s.stages.length - 1].ties[0];
      if (t.winner !== s.topClub) { up.push(t.winner); down.push(s.topClub); }
    }
    return { [pr.top]: { up: [], down }, [pr.second]: { up, down: [] } };
  }

  return {
    DIVS, COUNTRY, COUNTRY_ORDER, DIV_ORDER, RANK, PROREL, FOREIGN_CUPS,
    divisionDef, countryOf, regularLength, splitLength, seasonFixtures, afterMatchday, table, positionHistory, splitGroups,
    createSeries, playStep, runSeries, seriesFor, countryMoves, legFixture, tieLead,
  };
})();
