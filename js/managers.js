// Managers: every club's manager, board objectives and confidence, sackings
// and appointments (the managerial merry-go-round), and your own job: your
// reputation, the board's verdict, and approaches from other clubs.
// Game internals are reached through Game.internal at run time.

const Managers = (() => {
  const G = () => Game.internal;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const round2 = (v) => Math.round(v * 100) / 100;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // "Qualify for the Champions League" → "qualify for the Champions League"
  const lcFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");

  const BASE_CONF = 60;       // confidence drifts back towards this
  const NEW_CONF = 70;        // a new manager's honeymoon
  const RESULT_WEIGHT = 3.8;  // confidence per point above/below expectation
  const AI_SACK_AT = 34;      // AI boards may act below this
  const USER_SACK_AT = 12;    // ...and yours
  const BOUNCE = 5;           // matches of "new manager bounce"
  const BOUNCE_BONUS = 1.2;   // rating at the start of the bounce
  const POOL_SIZE = 70;       // unemployed managers available
  const KIND_WEIGHT = { league: 1, cup: 0.5, euro: 0.6, playoff: 0.8 };
  // Managers from these associations also work abroad.
  const EXPORTERS = ["ENG", "ESP", "ITA", "GER", "FRA", "POR", "NED", "BEL", "SCO", "CRO", "SRB", "AUT", "SUI", "DEN", "NOR", "SWE", "TUR", "GRE", "POL", "CZE", "UKR", "ROU", "HUN"];

  function gauss(mean, sd) {
    const u = 1 - Math.random(), v = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // ---- Lookups --------------------------------------------------------------

  // The AI manager of a club, or null (yours, vacant, or a non-league club).
  function of(state, clubId) {
    const ai = state.ai && state.ai[clubId];
    return ai && ai.mgr && state.mgr ? state.mgr.list[ai.mgr] || null : null;
  }

  const age = (state, m) => state.season - m.born;

  // How big a job a club is (0–100): squad quality plus the size of its brand.
  function stature(state, id) {
    const t = state.teams[id];
    const f = state.fin && state.fin[id];
    const brand = f ? f.brand : 5;
    return clamp((t.rating - 40) * 1.8 + Math.log2(1 + brand / 10) * 4, 0, 100);
  }

  function board(state, id) {
    const B = state.mgr.board;
    return B[id] || (B[id] = freshBoard(NEW_CONF));
  }

  function freshBoard(conf) {
    return { conf, E: null, obj: null, pts: 0, xp: 0, n: 0, bounce: 0, vacant: false, hiredMd: -99 };
  }

  // Rating bonus from the manager: tactical quality, plus a new-manager bounce.
  function boost(state, id) {
    if (!state.mgr) return 0;
    const m = of(state, id);
    const b = state.mgr.board[id];
    const bounce = b && b.bounce > 0 ? (BOUNCE_BONUS * b.bounce) / BOUNCE : 0;
    return (m ? m.tac : 0) + bounce;
  }

  // ---- Creating managers ----------------------------------------------------

  let nameCache = { ref: null, set: null };
  function usedNames(state) {
    if (nameCache.ref !== state.mgr) nameCache = { ref: state.mgr, set: new Set(Object.values(state.mgr.list).map((m) => m.name)) };
    return nameCache.set;
  }

  function nationality(country) {
    return Math.random() < 0.78 ? country : pick(EXPORTERS);
  }

  function create(state, nat, rep, years) {
    const M = state.mgr;
    const names = MANAGER_NAMES[NAME_REGION[nat]] || MANAGER_NAMES.en;
    const used = usedNames(state);
    let name = "";
    for (let i = 0; i < 10; i++) {
      name = `${pick(names.first)} ${pick(names.last)}`;
      if (!used.has(name)) break;
    }
    used.add(name);
    const form = Tactics.weighted(Tactics.POPULARITY);
    const shape = Tactics.FORM[form];
    const styles = shape.att < 0 ? ["pragmatic", "prudent", "balanced", "youth"]
      : shape.att >= 1.5 ? ["ambitious", "gambler", "balanced", "youth"] : AI_STYLES.map((s) => s.id);
    const m = {
      id: `M${M.seq++}`, name, nat, born: state.season - years,
      tac: round2(clamp(gauss(0.1, 0.5) + (rep - 50) / 100, -1, 1.5)),
      form, alt: Tactics.altFor(form), press: Tactics.weighted({ high: 3, med: 5, low: 2 }),
      flex: round2(Engine.rand(0.1, 1)), style: pick(styles), recruit: round2(Engine.rand(0.4, 0.9)),
      rep: Math.round(clamp(rep, 1, 99)), club: null, since: null, w: 0, d: 0, l: 0, trophies: 0, sacked: 0,
    };
    M.list[m.id] = m;
    return m;
  }

  // Put a manager in charge of an AI club.
  function assign(state, m, clubId, opts = {}) {
    const ai = state.ai[clubId];
    m.club = clubId;
    m.since = opts.since != null ? opts.since : state.season;
    ai.mgr = m.id;
    // Owners in a takeover or crisis set the approach; otherwise the manager does.
    if (!opts.keepStyle && !ai.event) ai.style = m.style;
    ai.recruit = m.recruit;
    const i = state.mgr.pool.indexOf(m.id);
    if (i >= 0) state.mgr.pool.splice(i, 1);
  }

  function topUpPool(state) {
    const M = state.mgr;
    M.pool = M.pool.filter((id) => M.list[id] && !M.list[id].club && !M.list[id].retired);
    while (M.pool.length < POOL_SIZE) {
      const nat = pick(Math.random() < 0.7 ? EXPORTERS : Leagues.COUNTRY_ORDER);
      const m = create(state, nat, clamp(gauss(38, 18), 5, 85), Engine.randInt(35, 62));
      M.pool.push(m.id);
    }
  }

  // ---- Start of a career ----------------------------------------------------

  // Managers for every AI club, an unemployed pool, every board, and your job.
  // `keepStyle`: leave AI spending styles alone (upgrading an old save).
  function init(state, opts = {}) {
    state.mgr = { list: {}, pool: [], seq: 1, board: {}, events: [] };
    for (const ids of Object.values(state.leagues)) {
      for (const id of ids) {
        state.mgr.board[id] = freshBoard(65);
        if (id === state.myTeam || !state.ai[id]) continue;
        const m = create(state, nationality(state.teams[id].country), stature(state, id) + gauss(0, 10), Engine.randInt(36, 66));
        assign(state, m, id, { since: state.season - Engine.randInt(0, 4), keepStyle: opts.keepStyle });
      }
    }
    topUpPool(state);
    state.job = {
      name: opts.name || "", sackable: opts.sackable !== false,
      rep: Math.round(clamp(stature(state, state.myTeam) - 5, 15, 95)),
      stints: [newStint(state, state.myTeam, state.season, 0)],
      prompt: null, summerOffers: [], pendingMove: null, approaches: 0, warned: 0,
    };
  }

  function newStint(state, club, season, md) {
    return { club, season, md, end: null, why: null, w: 0, d: 0, l: 0, trophies: [] };
  }

  // ---- Objectives -----------------------------------------------------------

  // European places for a top flight: { ucl, total }.
  function euroPlaces(state, country) {
    if (country === "RUS" || !state.euro) return { ucl: 0, total: 0 };
    const rank = Europe.ranking(state).filter((r) => !r.banned).findIndex((r) => r.cid === country) + 1;
    if (!rank) return { ucl: 0, total: 0 };
    const slots = Europe.accessFor(rank).filter((x) => typeof x.src === "number");
    return { ucl: slots.filter((x) => x.comp === "UCL").length, total: slots.length };
  }

  function objectiveFor(state, lid, E, n, places) {
    const def = Game.leagueDef(lid), z = def.zones;
    if (def.tier === 1) {
      if (E <= 1) return "Win the league";
      if (places.ucl && E <= places.ucl) return "Qualify for the Champions League";
      if (E <= 3 && !places.ucl) return "Challenge for the title";
      if (E <= places.total) return "Qualify for Europe";
      if (E <= Math.ceil(n / 2)) return "Finish in the top half";
      if (!z.down || E <= n - z.down - 3) return "Finish mid-table";
      return "Avoid relegation";
    }
    if (E <= (z.autoUp || 0)) return "Win promotion";
    if (z.playoff && E <= z.playoff[1]) return "Reach the play-offs";
    if (E <= Math.ceil(n / 2)) return "Finish in the top half";
    return z.down ? "Avoid relegation" : "Finish mid-table";
  }

  const tolerance = (n) => Math.max(2, Math.round(n / 6));

  // Each board predicts where its club should finish and sets an objective.
  function seasonStart(state, opts = {}) {
    const places = {};
    for (const [lid, ids] of Object.entries(state.leagues)) {
      const country = Game.leagueDef(lid).country;
      if (!places[country]) places[country] = euroPlaces(state, country);
      // Squad rating and the manager's quality (spending isn't known when targets are set).
      const ranked = ids.map((id) => ({ id, s: state.teams[id].rating + boost(state, id) }))
        .sort((a, b) => b.s - a.s);
      ranked.forEach((r, i) => {
        const id = r.id;
        if (id !== state.myTeam && state.ai[id] && !of(state, id)) hire(state, id, { mid: false });
        const b = board(state, id);
        const m = of(state, id);
        const fresh = id === state.myTeam ? currentStint(state).season === state.season : m && m.since === state.season;
        if (!opts.keepConf) b.conf = fresh ? NEW_CONF : clamp(0.5 * b.conf + 32, 25, 85);
        // New investors at your club raise the board's sights.
        b.E = id === state.myTeam ? Math.max(1, i + 1 - Game.investorAmbition(state, id)) : i + 1;
        b.obj = objectiveFor(state, lid, b.E, ids.length, places[country]);
        b.pts = 0; b.xp = 0; b.n = 0; b.vacant = false; b.hiredMd = -99;
        if (!opts.keepConf) b.bounce = 0;
      });
    }
    if (state.job) { state.job.approaches = 0; state.job.warned = 0; }
  }

  const currentStint = (state) => state.job.stints[state.job.stints.length - 1];

  // ---- During the season ----------------------------------------------------

  // After any match: boards compare points with what was expected.
  // probs: home-side { win, draw, loss } before kick-off.
  // `mult` weights the result more (derbies).
  function afterGame(state, h, a, hg, ag, probs, kind, mult = 1) {
    if (!state.mgr) return;
    const w = (KIND_WEIGHT[kind] || 1) * mult;
    const side = (id, gf, ga, pw, pd) => {
      const b = state.mgr.board[id];
      const res = gf > ga ? "w" : gf === ga ? "d" : "l";
      const m = of(state, id);
      if (m) m[res]++;
      if (id === state.myTeam && state.job) currentStint(state)[res]++;
      if (!b) return;
      const pts = res === "w" ? 3 : res === "d" ? 1 : 0, xp = 3 * pw + pd;
      b.conf = Math.round(clamp(b.conf + RESULT_WEIGHT * w * (pts - xp), 0, 100) * 10) / 10;
      if (kind === "league") {
        b.pts += pts; b.xp = round2(b.xp + xp); b.n++;
        if (b.bounce > 0) b.bounce--;
      }
    };
    side(h, hg, ag, probs.win, probs.draw);
    side(a, ag, hg, probs.loss, probs.draw);
  }

  // A decided knockout tie: giant-killings hurt the loser's manager.
  function knockout(state, winner, loser) {
    if (!state.mgr) return;
    const bw = state.mgr.board[winner], bl = state.mgr.board[loser];
    const upset = Tactics.quickStrength(state, winner) < Tactics.quickStrength(state, loser) - 8;
    if (bl) bl.conf = clamp(bl.conf - (upset ? 6 : 1), 0, 100);
    if (bw && upset) bw.conf = clamp(bw.conf + 4, 0, 100);
  }

  // A trophy: confidence and reputation for whoever won it.
  const TROPHY = { UCL: [10, 20], UEL: [6, 15], UECL: [4, 12], cup: [4, 12], USC: [3, 6], SC: [1, 4] };
  function trophy(state, id, compId, name) {
    if (!state.mgr) return;
    const [rep, conf] = TROPHY[compId] || TROPHY.cup;
    const b = state.mgr.board[id];
    if (b) b.conf = clamp(b.conf + conf, 0, 100);
    if (id === state.myTeam && state.job) {
      state.job.rep = clamp(state.job.rep + rep, 0, 100);
      currentStint(state).trophies.push(`${name} ${Game.seasonLabel(state.season)}`);
    } else {
      const m = of(state, id);
      if (m) { m.rep = clamp(m.rep + rep, 0, 100); m.trophies++; }
    }
  }

  // After every league matchday in a division: league position weighs on the
  // board, confidence drifts back to normal, and boards that have lost faith act.
  function afterMatchday(state, lid) {
    if (!state.mgr) return;
    const { fixtures, results } = G().leagueFixtures(state, lid);
    const n = fixtures.length, md = results.length;
    const tbl = G().table(state, lid);
    const tol = tolerance(tbl.length);
    tbl.forEach((r, i) => {
      const b = state.mgr.board[r.id];
      if (!b || b.E == null) return;
      b.conf += 0.03 * (BASE_CONF - b.conf);
      if (md >= n / 3) {
        const gap = i + 1 - b.E;
        if (gap > tol) b.conf -= 1.2 * Math.min(2, (gap - tol) / tol + 0.3);
        else if (gap < -tol) b.conf += 0.4;
      }
      b.conf = Math.round(clamp(b.conf, 0, 100) * 10) / 10;
    });
    if (md >= 5 && md <= n - 3) {
      for (const r of tbl) {
        if (r.id === state.myTeam) continue;
        const b = state.mgr.board[r.id];
        if (!b || b.vacant || md - b.hiredMd < 6 || b.conf >= AI_SACK_AT) continue;
        if (Math.random() < 0.15 + (0.85 * (AI_SACK_AT - b.conf)) / AI_SACK_AT) sack(state, r.id, "results");
        if (state.job && state.job.prompt) break;
      }
    }
    if (lid === state.league) checkUser(state, md, n);
  }

  // Your board: warnings, then the sack.
  function checkUser(state, md, n) {
    const J = state.job;
    const b = board(state, state.myTeam);
    const say = (text) => state.news.unshift({ md, label: "Board", type: "bad", text });
    if (b.conf >= 45) J.warned = 0;
    if (b.conf < 35 && J.warned < 1 && md >= 4) { J.warned = 1; say(`The board is concerned about results. Objective: ${lcFirst(b.obj)}.`); }
    if (b.conf < 22 && J.warned < 2) { J.warned = 2; say("Final warning: the board expects an immediate improvement."); }
    if (J.sackable && !J.prompt && b.conf < USER_SACK_AT && md >= 6 && md <= n - 2 && state.phase === "season") {
      J.prompt = { kind: "sacked", offers: offersFor(state, "sacked") };
      say(`You've been sacked by ${state.teams[state.myTeam].name}. Pick your next job.`);
    }
  }

  // ---- Sackings and appointments --------------------------------------------

  function logEvent(state, e) {
    state.mgr.events.unshift({ season: state.season, md: state.results ? state.results.length : 0, ...e });
    if (state.mgr.events.length > 300) state.mgr.events.length = 300;
  }

  // News for clubs in your division, and for the biggest jobs anywhere.
  function tell(state, clubId, text, type = "info") {
    if (G().leagueOf(state, clubId) === state.league || stature(state, clubId) >= 85) {
      state.news.unshift({ md: state.results ? state.results.length : 0, label: "Manager", type, text });
    }
  }

  // The board dismisses a manager. Unless `noHire`, a successor is found (or
  // the club approaches you first).
  function sack(state, clubId, why, opts = {}) {
    const m = of(state, clubId);
    if (!m) return;
    m.club = null;
    m.sacked++;
    m.rep = clamp(m.rep - 4, 0, 100);
    state.mgr.pool.push(m.id);
    state.ai[clubId].mgr = null;
    const b = board(state, clubId);
    b.vacant = true;
    b.bounce = 0;
    logEvent(state, { type: "sacked", club: clubId, mgr: m.id, name: m.name, why });
    tell(state, clubId, `${state.teams[clubId].name} have sacked ${m.name}${why === "season" ? " after a disappointing season" : ""}.`);
    if (opts.noHire) return;
    if (maybeApproach(state, clubId)) return;
    hire(state, clubId, { mid: state.phase === "season" });
  }

  // A manager leaves for another job, or to make way for you.
  function release(state, clubId, why) {
    const m = of(state, clubId);
    const b = board(state, clubId);
    b.vacant = false;
    if (!m) return null;
    m.club = null;
    state.ai[clubId].mgr = null;
    if (why === "replaced") { state.mgr.pool.push(m.id); m.rep = clamp(m.rep - 2, 0, 100); }
    logEvent(state, { type: why === "replaced" ? "sacked" : "left", club: clubId, mgr: m.id, name: m.name, why, by: why === "replaced" ? "you" : undefined });
    return m;
  }

  // Appoint a new manager: the best available candidate who fits the job,
  // sometimes poaching one who is doing well at a smaller club.
  function hire(state, clubId, opts = {}) {
    const depth = opts.depth || 0;
    const s = stature(state, clubId);
    const country = state.teams[clubId].country;
    const M = state.mgr;
    let best = null, bestScore = -Infinity;
    for (const id of M.pool) {
      const m = M.list[id];
      if (!m || m.club || m.retired || m.rep > s + 12 || age(state, m) >= 70) continue;
      const score = m.rep - Math.abs(m.rep - s) * 0.3 + (m.nat === country ? 6 : 0) + Engine.rand(0, 14);
      if (score > bestScore) { best = m; bestScore = score; }
    }
    let poached = null;
    if (depth === 0 && Math.random() < 0.3) {
      let top = -Infinity;
      for (const ids of Object.values(state.leagues)) {
        for (const id of ids) {
          const m = of(state, id);
          if (!m || id === clubId) continue;
          const b = M.board[id];
          if (stature(state, id) > s - 8 || m.rep < s - 12 || m.rep > s + 12 || !b || b.conf < 55) continue;
          const score = m.rep + (state.teams[id].country === country ? 5 : 0) + Engine.rand(0, 10);
          if (score > top) { top = score; poached = m; }
        }
      }
      if (poached && best && poached.rep < best.rep + 4) poached = null;
    }
    let m;
    if (poached) {
      const from = poached.club;
      release(state, from, "poached");
      tell(state, from, `${poached.name} leaves ${state.teams[from].name} to take charge of ${state.teams[clubId].name}.`);
      m = poached;
      hire(state, from, { mid: opts.mid, depth: depth + 1 });
    } else if (best) m = best;
    else m = create(state, nationality(country), clamp(s - 10 + gauss(0, 8), 3, 95), Engine.randInt(35, 52));
    assign(state, m, clubId);
    const b = board(state, clubId);
    b.conf = NEW_CONF;
    b.vacant = false;
    b.bounce = opts.mid ? BOUNCE : 0;
    const lid = G().leagueOf(state, clubId);
    const lf = lid && state.results ? G().leagueFixtures(state, lid) : null;
    b.hiredMd = lf ? lf.results.length : 0;
    logEvent(state, { type: "hired", club: clubId, mgr: m.id, name: m.name });
    tell(state, clubId, `${state.teams[clubId].name} appoint ${m.name} as manager.`);
    return m;
  }

  // A club that has just sacked its manager may want you.
  function maybeApproach(state, clubId) {
    const J = state.job;
    if (!J || J.prompt || state.phase !== "season" || J.approaches >= 2) return false;
    const n = state.fixtures.length, md = state.results.length;
    const st = currentStint(state);
    if (md > n - 5 || (st.season === state.season && md - st.md < 10)) return false;
    const s = stature(state, clubId);
    // Most approaches come from your own country.
    const chance = state.teams[clubId].country === state.teams[state.myTeam].country ? 0.3 : 0.1;
    if (s < stature(state, state.myTeam) + 5 || s > J.rep + 8 || Math.random() > chance || sackedYouRecently(state, clubId)) return false;
    J.approaches++;
    J.prompt = { kind: "offer", offers: [{ club: clubId, vacant: true }] };
    state.news.unshift({ md, label: "Job", type: "good", text: `${state.teams[clubId].name} have asked for permission to speak to you about their vacancy.` });
    return true;
  }

  // A club that sacked you in the last two seasons won't want you back.
  const sackedYouRecently = (state, id) => (state.job.sackedBy || []).some((x) => x.club === id && x.season >= state.season - 2);

  // Clubs that would take you. "sacked": a step down; "summer": a step up.
  function offersFor(state, kind) {
    const J = state.job, rep = J.rep, cur = stature(state, state.myTeam);
    const myCountry = state.teams[state.myTeam].country;
    const all = [];
    for (const [lid, ids] of Object.entries(state.leagues)) {
      for (const id of ids) {
        if (id === state.myTeam || !state.ai[id] || sackedYouRecently(state, id)) continue;
        const s = stature(state, id), b = board(state, id);
        const ok = kind === "sacked" ? s <= rep - 2 && s >= rep - 40
          : s >= cur + 3 && s <= rep + 8 && (b.vacant || Math.random() < 0.12);
        if (!ok) continue;
        all.push({ club: id, lid, vacant: !!b.vacant, score: (b.vacant ? 40 : 0) + (100 - b.conf) / 2.5 + Engine.rand(0, 25) + (state.teams[id].country === myCountry ? 8 : 0) });
      }
    }
    all.sort((a, b) => b.score - a.score);
    const out = [], divs = new Set();
    for (const o of all) {
      if (divs.has(o.lid)) continue;
      divs.add(o.lid);
      out.push({ club: o.club, vacant: o.vacant });
      if (out.length >= 3) break;
    }
    // Sacked managers always find something, if only at a smaller club.
    if (kind === "sacked" && out.length < 2) {
      const fallback = Object.values(state.leagues).flat()
        .filter((id) => id !== state.myTeam && state.ai[id] && !out.some((o) => o.club === id) && !sackedYouRecently(state, id) && stature(state, id) <= Math.max(rep, 20))
        .sort(() => Math.random() - 0.5).slice(0, 3 - out.length);
      fallback.forEach((id) => out.push({ club: id, vacant: !!board(state, id).vacant }));
    }
    return out;
  }

  // You turned down offers: the clubs that were waiting for you appoint someone else.
  function declined(state, offers) {
    for (const o of offers || []) {
      if (state.ai[o.club] && !of(state, o.club) && board(state, o.club).vacant) hire(state, o.club, { mid: state.phase === "season" });
    }
  }

  // ---- End of season --------------------------------------------------------

  // Reputations move with results; boards that are unhappy act over the
  // summer; you get the board's verdict and perhaps offers. Returns a report
  // for the season review.
  function endSeason(state, tables, moves) {
    const J = state.job, me = state.myTeam;
    const repBefore = J.rep;
    const myLid = state.league;
    let myPos = null, myE = null, myN = null;
    for (const [lid, rows] of Object.entries(tables)) {
      const def = Game.leagueDef(lid), n = rows.length, tol = tolerance(n);
      rows.forEach((r, i) => {
        const b = state.mgr.board[r.id];
        if (!b) return;
        const pos = i + 1, E = b.E || pos;
        let delta = clamp(((E - pos) / n) * 20, -8, 8);
        if (pos === 1) delta += def.tier === 1 ? 6 : 3;
        if (moves.up[lid] && moves.up[lid].includes(r.id)) delta += 4;
        if (moves.down[lid] && moves.down[lid].includes(r.id)) delta -= 6;
        b.conf = Math.round(clamp(b.conf + clamp(((E - pos) / tol) * 6, -15, 15), 0, 100) * 10) / 10;
        if (r.id === me) { J.rep = Math.round(clamp(J.rep + delta, 0, 100)); if (lid === myLid) { myPos = pos; myE = E; myN = n; } return; }
        const m = of(state, r.id);
        if (m) m.rep = Math.round(clamp(m.rep + delta, 0, 100));
        if (!m) return;
        // Summer decisions.
        const relegated = moves.down[lid] && moves.down[lid].includes(r.id);
        let p = b.conf < 25 ? 0.85 : b.conf < 35 ? 0.4 : 0;
        if (relegated) p = Math.max(p, 0.5);
        if (pos - E > 2 * tol) p = Math.max(p, 0.45);
        if (Math.random() < p) sack(state, r.id, "season", { noHire: true });
        else if (age(state, m) >= 64 && Math.random() < 0.3) {
          release(state, r.id, "retired");
          m.retired = true;
          board(state, r.id).vacant = true;
          logEvent(state, { type: "retired", club: r.id, mgr: m.id, name: m.name });
          tell(state, r.id, `${m.name} retires as ${state.teams[r.id].name} manager.`);
        }
      });
    }
    // Your verdict.
    const b = board(state, me);
    const relegatedOut = moves.down.L2 && moves.down.L2.includes(me);
    const relegated = Object.values(moves.down).some((ids) => ids.includes(me));
    const promoted = Object.values(moves.up).some((ids) => ids.includes(me));
    const sacked = relegatedOut || (J.sackable && (b.conf < 20 || (relegated && b.conf < 40)));
    const verdict = sacked ? "The board has decided to part ways with you."
      : relegated ? "Relegation hurts, but the board is standing by you."
      : promoted ? "The board is delighted with promotion."
      : b.conf >= 75 ? "The board is delighted with the season."
      : b.conf >= 50 ? "The board is satisfied."
      : b.conf >= 30 ? "The board is disappointed and expects better next season."
      : "The board is very unhappy. Your job is on the line next season.";
    if (sacked) {
      J.rep = clamp(J.rep - 8, 0, 100);
      J.prompt = { kind: "sacked", offers: offersFor(state, "sacked"), summer: true, relegatedOut };
      J.summerOffers = [];
    } else {
      J.summerOffers = offersFor(state, "summer");
    }
    // Vacancies that aren't waiting on you are filled now.
    const waiting = new Set([...(J.prompt ? J.prompt.offers : []), ...J.summerOffers].map((o) => o.club));
    for (const ids of Object.values(state.leagues)) {
      for (const id of ids) if (id !== me && state.ai[id] && !of(state, id) && !waiting.has(id)) hire(state, id, { mid: false });
    }
    const changes = state.mgr.events.filter((e) => e.season === state.season && G().leagueOf(state, e.club) === myLid && e.type !== "hired");
    return {
      verdict, conf: b.conf, objective: b.obj, expected: myE, pos: myPos, n: myN,
      rep: J.rep, repChange: J.rep - repBefore, sacked, relegatedOut, changes: changes.length,
    };
  }

  // Between seasons: fill any vacancies left (offers you declined), retire
  // old managers in the pool and bring in new ones.
  function summer(state) {
    const M = state.mgr;
    for (const id of M.pool) {
      const m = M.list[id];
      if (m && !m.club && age(state, m) >= 63 && Math.random() < 0.3) m.retired = true;
      else if (m) m.rep = clamp(m.rep - 1, 0, 100);
    }
    topUpPool(state);
    for (const ids of Object.values(state.leagues)) {
      for (const id of ids) if (id !== state.myTeam && state.ai[id] && !of(state, id)) hire(state, id, { mid: false });
    }
    // Retired managers who never got another job are forgotten.
    const keep = new Set(Object.values(state.ai).map((ai) => ai.mgr).filter(Boolean));
    for (const [id, m] of Object.entries(M.list)) if (m.retired && !keep.has(id)) delete M.list[id];
  }

  // Job security, as a word.
  function security(conf) {
    return conf >= 60 ? "Secure" : conf >= 40 ? "Stable" : conf >= 25 ? "Under pressure" : "At risk";
  }

  return {
    of, stature, board, boost, init, seasonStart, afterGame, afterMatchday, knockout, trophy, sack, release, hire,
    offersFor, declined, endSeason, summer, security, newStint, currentStint, age, tolerance, logEvent, lcFirst,
  };
})();
