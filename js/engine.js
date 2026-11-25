// Match engine: fixtures, Poisson goal model, outcome probabilities, tables.
// Pure functions only — no DOM, no storage — so it can be tested headlessly.

const Engine = (() => {
  const AVG_GOALS = 1.35;   // average goals per team per match
  const RATING_K = 0.03;    // each rating point of att-vs-def gap shifts xG by ~3%
  const HOME_MULT = 1.12;
  const AWAY_MULT = 0.89;
  const MAX_GOALS = 10;

  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function poisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }

  function poissonPmf(lambda) {
    const out = [];
    let p = Math.exp(-lambda);
    for (let k = 0; k <= MAX_GOALS; k++) {
      out.push(p);
      p = p * lambda / (k + 1);
    }
    return out;
  }

  // `rr` round-robins via the circle method (1 = single, 2 = home and away,
  // 3 or 4 = repeated with venues alternating). Returns matchdays of [{h, a}].
  function generateFixtures(teamIds, rr = 2) {
    if (rr === 2) return doubleRoundRobin(teamIds);
    const single = doubleRoundRobin(teamIds).slice(0, teamIds.length % 2 ? teamIds.length : teamIds.length - 1);
    const flip = (md) => md.map((f) => ({ h: f.a, a: f.h }));
    const out = [];
    for (let k = 0; k < rr; k++) out.push(...shuffle(k % 2 ? single.map(flip) : single));
    return out;
  }

  // Double round-robin: the second half mirrors the first with venues swapped.
  function doubleRoundRobin(teamIds) {
    const teams = shuffle(teamIds);
    if (teams.length % 2) teams.push(null);
    const n = teams.length;
    const rounds = [];
    let rot = teams.slice();
    for (let r = 0; r < n - 1; r++) {
      const md = [];
      for (let i = 0; i < n / 2; i++) {
        const t1 = rot[i], t2 = rot[n - 1 - i];
        if (t1 === null || t2 === null) continue;
        // Alternate the fixed team's venue each round; alternate pairs too.
        const flip = i === 0 ? r % 2 === 1 : i % 2 === 1;
        md.push(flip ? { h: t2, a: t1 } : { h: t1, a: t2 });
      }
      rounds.push(md);
      rot = [rot[0], rot[n - 1], ...rot.slice(1, n - 1)];
    }
    const firstHalf = shuffle(rounds);
    const secondHalf = shuffle(firstHalf.map((md) => md.map((f) => ({ h: f.a, a: f.h }))));
    return firstHalf.concat(secondHalf);
  }

  // home/away: { att, def, homeEdge? } effective strengths.
  function expectedGoals(home, away, neutral = false) {
    const hm = neutral ? 1 : HOME_MULT * (1 + (home.homeEdge || 0) * 0.1);
    const am = neutral ? 1 : AWAY_MULT;
    return {
      home: AVG_GOALS * Math.exp(RATING_K * (home.att - away.def)) * hm,
      away: AVG_GOALS * Math.exp(RATING_K * (away.att - home.def)) * am,
    };
  }

  function outcomeProbs(xg) {
    const ph = poissonPmf(xg.home), pa = poissonPmf(xg.away);
    let win = 0, draw = 0, loss = 0;
    for (let i = 0; i <= MAX_GOALS; i++) {
      for (let j = 0; j <= MAX_GOALS; j++) {
        const p = ph[i] * pa[j];
        if (i > j) win += p; else if (i === j) draw += p; else loss += p;
      }
    }
    const t = win + draw + loss;
    return { win: win / t, draw: draw / t, loss: loss / t };
  }

  // Distribution of (home goals − away goals) over 90 minutes.
  function goalDiffDist(xg) {
    const ph = poissonPmf(xg.home), pa = poissonPmf(xg.away);
    const d = {};
    for (let i = 0; i <= MAX_GOALS; i++) {
      for (let j = 0; j <= MAX_GOALS; j++) d[i - j] = (d[i - j] || 0) + ph[i] * pa[j];
    }
    return d;
  }

  // `rates` (optional): expected cards, see playPeriod. Returns the goals, the
  // pre-match xG (`xg0`), the xG rates at the end (`xg`, lower for a side
  // down to ten men; extra time uses them) and the cards.
  function playMatch(home, away, neutral = false, rates = null) {
    const xg = expectedGoals(home, away, neutral);
    if (!rates) return { hg: poisson(xg.home), ag: poisson(xg.away), xg, xg0: xg };
    const p = playPeriod(xg, 0, 90, { rates, yc: [0, 0], down: [0, 0], ment: rates.ment, auto: [true, true] });
    const [mh, ma] = tenMen(p.down, p.ment);
    return { hg: p.hg, ag: p.ag, xg0: xg, xg: { home: xg.home * mh, away: xg.away * ma }, cards: cardCount(p.events) };
  }

  // ---- Match detail (your matches): halves, goal times, stats, penalties ----

  const HALF_SHARE = 0.45; // share of a match's goals that come before half-time
  const GOAL_TYPES = [["penalty", 0.1], ["header", 0.18], ["free kick", 0.04], ["long range", 0.08], ["own goal", 0.03]];

  function goalType() {
    let r = Math.random();
    for (const [k, p] of GOAL_TYPES) { if ((r -= p) < 0) return k; }
    return "";
  }

  // ---- Cards -------------------------------------------------------------------
  // Bookings come later in a match more often than not: the share of a match's
  // cards shown by minute t is cardShare(t) (37.5% by half-time). A booking can
  // be a player's second (more likely the more of the team are already on a
  // yellow): that's a red. Straight reds are rarer.
  //
  // Down to ten men, a side scores less and concedes more for the rest of the
  // match, and how much depends on how both sides set up: a ten-man side that
  // sits deep limits the damage but rarely scores; one that keeps attacking
  // leaves gaps. The side with the extra man gains most by going for it.
  // [own goals, opponent's goals] per man short, by the short side's mentality:
  const SHORT = { def: [0.5, 1.22], bal: [0.6, 1.5], att: [0.7, 1.8] };
  // ...and for the side with more men, by its mentality:
  const UP = { att: [1.15, 1.08], bal: [1, 1], def: [0.85, 0.95] };
  const SECOND_YELLOW = 0.012; // chance a booking is a second yellow, per booking the team already has

  // Goal multipliers [home, away] with `down` [home, away] players sent off
  // and the sides' mentalities `ment` [home, away].
  function tenMen(down, ment = ["bal", "bal"]) {
    const d = down[0] - down[1];
    if (!d) return [1, 1];
    const short = d > 0 ? 0 : 1, up = 1 - short, k = Math.abs(d);
    const s = SHORT[ment[short]] || SHORT.bal, u = UP[ment[up]] || UP.bal;
    const out = [];
    out[short] = s[0] ** k * u[1];
    out[up] = s[1] ** k * u[0];
    return out;
  }

  const cardShare = (t) => 0.5 * (t / 90) + 0.5 * (t / 90) ** 2;
  // A card minute between from and to, drawn from that curve.
  function cardMinute(from, to) {
    const u = cardShare(from) + Math.random() * (cardShare(to) - cardShare(from));
    return Math.min(to, Math.max(from + 1, Math.ceil(90 * (Math.sqrt(0.25 + 2 * u) - 0.5))));
  }

  // Cards between minutes `from` and `to`. rates: { y: [home, away] expected
  // bookings and r: [home, away] expected straight reds over 90 minutes };
  // yc: bookings so far (updated).
  function periodCards(rates, from, to, yc) {
    const out = [];
    const share = cardShare(Math.min(to, 90)) - cardShare(Math.min(from, 90));
    ["h", "a"].forEach((side, i) => {
      const mins = [];
      for (let k = poisson(rates.y[i] * share); k > 0; k--) mins.push(cardMinute(from, to));
      mins.sort((x, y) => x - y);
      for (const min of mins) {
        out.push({ min, plus: 0, side, card: Math.random() < SECOND_YELLOW * yc[i] ? "2Y" : "Y" });
        yc[i]++;
      }
      for (let k = poisson(rates.r[i] * share); k > 0; k--) out.push({ min: cardMinute(from, to), plus: 0, side, card: "R" });
    });
    return out.sort((x, y) => x.min - y.min);
  }

  // Bookings and sendings-off in a list of events: { y, r, straight, second } as [home, away].
  function cardCount(events) {
    const c = { y: [0, 0], r: [0, 0], straight: [0, 0], second: [0, 0] };
    for (const e of events) {
      if (!e.card) continue;
      const i = e.side === "h" ? 0 : 1;
      if (e.card !== "R") c.y[i]++;
      if (e.card !== "Y") c.r[i]++;
      if (e.card === "R") c.straight[i]++;
      if (e.card === "2Y") c.second[i]++;
    }
    return c;
  }

  // How a manager reacts to a sending-off: down to ten and not losing, sit
  // deep; down to ten and losing, keep a balanced shape; a man up and not
  // winning, go for it; a man up and winning, stay balanced.
  function redReaction(short, lead) {
    if (short > 0) return lead >= 0 ? "def" : "bal";
    if (short < 0) return lead <= 0 ? "att" : "bal";
    return null;
  }

  // Goals (and cards) between minutes `from` and `to`, with minutes. `xg` is
  // the expected goals over that stretch. `cards` (optional):
  //   { rates, yc, down, ment, auto, score, stopAtRed }
  // with bookings and dismissals so far, each side's mentality, which sides
  // react to a red on their own (`auto`), the score so far, and whether to stop
  // at the first sending-off. A red changes the goal rates from that minute on.
  // Returns goals, events, `down`, `ment`, the expected goals actually in play
  // (`xgEff`) and `stopped` (the minute of the red, if it stopped there).
  function playPeriod(xg, from, to, cards = null) {
    const yc0 = cards ? cards.yc.slice() : null;
    let events = cards ? periodCards(cards.rates, from, to, cards.yc) : [];
    const down = cards ? cards.down : [0, 0];
    const ment = cards && cards.ment ? cards.ment.slice() : ["bal", "bal"];
    const auto = cards && cards.auto ? cards.auto : [false, false];
    const score = cards && cards.score ? cards.score : [0, 0];
    const span = to - from;
    let end = to, stopped = null;
    const reds = events.filter((e) => e.card === "R" || e.card === "2Y");
    if (cards && cards.stopAtRed && reds.length) {
      end = stopped = reds[0].min;
      // Cards after the red haven't happened yet: they're drawn again when play resumes.
      events = events.filter((e) => e.min < end || e === reds[0]);
      ["h", "a"].forEach((side, i) => { cards.yc[i] = yc0[i] + events.filter((e) => e.side === side && (e.card === "Y" || e.card === "2Y")).length; });
    }
    let hg = 0, ag = 0, t0 = from;
    const xgEff = { home: 0, away: 0 };
    const goals = (side, n, a, b) => {
      for (let i = 0; i < n; i++) {
        const stoppage = b === to && !stopped && to % 45 === 0 && Math.random() < 0.1;
        events.push({ min: stoppage ? to : randInt(a + 1, Math.max(a + 1, b)), plus: stoppage ? randInt(1, 5) : 0, side, how: goalType() });
      }
    };
    const segment = (t1) => {
      if (t1 <= t0) return;
      const frac = (t1 - t0) / span, [mh, ma] = tenMen(down, ment);
      const eh = xg.home * frac * mh, ea = xg.away * frac * ma;
      const nh = poisson(eh), na = poisson(ea);
      xgEff.home += eh; xgEff.away += ea;
      hg += nh; ag += na;
      goals("h", nh, t0, t1); goals("a", na, t0, t1);
      t0 = t1;
    };
    for (const c of reds) {
      if (c.min > end) break;
      segment(c.min);
      const i = c.side === "h" ? 0 : 1;
      down[i]++;
      // Sides that react on their own change their approach to the new numbers.
      for (const j of [0, 1]) {
        if (!auto[j]) continue;
        const short = j === 0 ? down[0] - down[1] : down[1] - down[0];
        const lead = j === 0 ? score[0] + hg - (score[1] + ag) : score[1] + ag - (score[0] + hg);
        const r = redReaction(short, lead);
        if (r) ment[j] = r;
      }
    }
    segment(end);
    events.sort((x, y) => x.min - y.min || x.plus - y.plus);
    return { hg, ag, events, down, ment, xgEff, stopped };
  }

  // A penalty shootout won by `winner` ("h" or "a"): five kicks each, then
  // sudden death, about three in four scored. Returns [home, away] goals.
  function shootout(winner) {
    for (;;) {
      let h = 0, a = 0, k = 0;
      for (; k < 5; k++) {
        h += Math.random() < 0.76; a += Math.random() < 0.76;
        if (h > a + (4 - k) || a > h + (4 - k)) break; // can't be caught
      }
      while (h === a) { h += Math.random() < 0.76; a += Math.random() < 0.76; }
      if ((h > a) === (winner === "h")) return [h, a];
    }
  }

  // Shots, shots on target and possession for a match report, from each
  // side's xG and goals and the home side's share of the ball.
  function matchStats(xg, hg, ag, possH) {
    const side = (x, g) => {
      const shots = Math.max(g + 1, Math.round(x * 8 + rand(1, 4)));
      const onTarget = Math.min(shots, g + Math.round((shots - g) * rand(0.2, 0.38)));
      return { shots, onTarget };
    };
    const h = side(xg.home, hg), a = side(xg.away, ag);
    return { xg: [xg.home, xg.away], shots: [h.shots, a.shots], onTarget: [h.onTarget, a.onTarget], poss: [possH, 100 - possH] };
  }

  // Investment spend (£m) → effect size, with diminishing returns.
  function investmentEffect(def, spend, budgetBase) {
    if (!spend) return 0;
    return def.max * (1 - Math.exp(-spend / (budgetBase * def.scale)));
  }

  function emptyRow(id, ded = 0) {
    return { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: -ded, ded, form: [] };
  }

  function addResult(rows, m) {
    const h = rows[m.h], a = rows[m.a];
    if (!h || !a) return;
    h.p++; a.p++;
    h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg;
    if (m.hg > m.ag) { h.w++; a.l++; h.pts += 3; h.form.push("W"); a.form.push("L"); }
    else if (m.hg < m.ag) { a.w++; h.l++; a.pts += 3; h.form.push("L"); a.form.push("W"); }
    else { h.d++; a.d++; h.pts++; a.pts++; h.form.push("D"); a.form.push("D"); }
  }

  // results: array of matchdays, each an array of {h, a, hg, ag}.
  // ded: optional { id: points deducted }.
  function buildTable(teamIds, results, ded = {}) {
    const rows = {};
    teamIds.forEach((id) => { rows[id] = emptyRow(id, ded[id] || 0); });
    for (const md of results) for (const m of md) addResult(rows, m);
    return sortTable(Object.values(rows));
  }

  // League position of every club after each matchday: { id: [pos after MD1, …] }.
  function positionHistory(teamIds, results, ded = {}) {
    const rows = {}, out = {};
    teamIds.forEach((id) => { rows[id] = emptyRow(id, ded[id] || 0); out[id] = []; });
    for (const md of results) {
      for (const m of md) addResult(rows, m);
      sortTable(Object.values(rows)).forEach((r, i) => out[r.id].push(i + 1));
    }
    return out;
  }

  function sortTable(rows) {
    rows.forEach((r) => { r.gd = r.gf - r.ga; });
    return rows.sort((x, y) =>
      y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || (x.tiebreak || 0) - (y.tiebreak || 0) || (x.id < y.id ? -1 : 1));
  }

  // Monte Carlo of the remaining fixtures. strengthOf(id) → {att, def, homeEdge}.
  // Returns finishing-position counts and average points for `focusId`.
  // opts.baseRows / opts.groups: in a split phase, start from the carried
  // points and rank each group separately (groups in table order).
  function projectSeason(teamIds, results, remaining, strengthOf, focusId, sims = 400, ded = {}, opts = {}) {
    const base = opts.baseRows || buildTable(teamIds, results, ded);
    const baseMap = {};
    base.forEach((r) => { baseMap[r.id] = r; });
    // Pre-compute xG for every remaining fixture once.
    const fx = [];
    for (const md of remaining) {
      for (const f of md) fx.push({ h: f.h, a: f.a, xg: expectedGoals(strengthOf(f.h), strengthOf(f.a)) });
    }
    const positions = new Array(teamIds.length).fill(0);
    let ptsSum = 0;
    for (let s = 0; s < sims; s++) {
      const pts = {}, gd = {};
      teamIds.forEach((id) => { pts[id] = baseMap[id].pts; gd[id] = baseMap[id].gd; });
      for (const f of fx) {
        const hg = poisson(f.xg.home), ag = poisson(f.xg.away);
        if (hg > ag) pts[f.h] += 3; else if (hg < ag) pts[f.a] += 3; else { pts[f.h]++; pts[f.a]++; }
        gd[f.h] += hg - ag; gd[f.a] += ag - hg;
      }
      const rank = (ids) => ids.slice().sort((x, y) => pts[y] - pts[x] || gd[y] - gd[x] || Math.random() - 0.5);
      const order = opts.groups ? opts.groups.flatMap(rank) : rank(teamIds);
      positions[order.indexOf(focusId)]++;
      ptsSum += pts[focusId];
    }
    return { positions: positions.map((c) => c / sims), avgPts: ptsSum / sims };
  }

  return {
    rand, randInt, shuffle, poisson, generateFixtures, expectedGoals, outcomeProbs, goalDiffDist,
    playMatch, investmentEffect, buildTable, sortTable, addResult, positionHistory, projectSeason,
    HALF_SHARE, playPeriod, shootout, matchStats, tenMen, cardCount, cardShare, redReaction,
  };
})();
