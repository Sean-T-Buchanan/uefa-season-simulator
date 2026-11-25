// Game state and season flow: investments (yours and the AI clubs'), the
// calendar of league and cup dates, play-offs, promotion/relegation and
// multi-season careers. No DOM access here.

const Game = (() => {
  const VERSION = 3;
  const INJURY_CHANCE = 0.05;
  const FORM_WEIGHTS = [1, 0.8, 0.6, 0.4, 0.2]; // most recent first
  const FORM_POINT = 0.5;                        // rating swing per weighted result
  const ROTATION_PENALTY = 4;                    // rating lost by resting key players
  const START_SEASON = 2025;
  const TOPUP_EVERY = 8;                         // AI clubs review staff spending every N matchdays
  // Ticket demand relative to the Premier League (tier 5 = non-league).
  const DEMAND_BY_TIER = { 1: 1, 2: 0.8, 3: 0.62, 4: 0.5, 5: 0.4 };
  const MAX_CAPACITY = 90000;
  const WEMBLEY_YIELD = 40;                      // £ per fan at Wembley, split between the clubs
  const TRANSFER_CATS = INVESTMENTS.filter((d) => d.group === "transfer").map((d) => d.id);
  // How far into their credit line AI clubs are willing to finish a season.
  const RISK = { ambitious: 0.7, gambler: 0.9, balanced: 0.3, pragmatic: 0.3, youth: 0.2, prudent: 0 };
  // The long run: commercial income drifts back towards a club's usual level,
  // AI clubs regress towards their division's mean, squads age.
  const BRAND_REVERT = 0.12;
  const AI_REGRESS = 0.18;
  const PEAK_AGE = [25.5, 27.2];                  // squads improve below, decline above
  // Bookings per match (both sides together), roughly recent top-flight
  // averages: LaLiga and Portugal book far more than the Premier League or Norway.
  const CARDS_PER_MATCH = {
    ENG: 3.9, ESP: 5.1, ITA: 4.6, GER: 4.0, FRA: 3.9, POR: 5.1, NED: 3.4, BEL: 4.1, TUR: 4.9, GRE: 5.0, SCO: 3.7,
    AUT: 4.1, SUI: 3.9, DEN: 3.3, NOR: 2.9, SWE: 3.2, FIN: 3.1, ISL: 3.2, POL: 4.6, CZE: 4.4, SVK: 4.5, HUN: 4.5,
    CRO: 4.6, SRB: 5.0, ROU: 5.0, BUL: 4.9, RUS: 4.4, UKR: 4.5, ISR: 4.7, CYP: 5.0,
  };
  const DEFAULT_CARDS = 4.4, EURO_CARDS = 3.9;
  const STRAIGHT_RED = 0.03;   // straight reds per side per match, at an average booking rate
  const ACCUMULATION = 0.1;    // chance a booking is a player's fifth (a one-match ban)

  const leagueDef = (id) => Leagues.DIVS[id];
  const invDef = (id) => INVESTMENTS.find((i) => i.id === id);
  // Super cups: last season's champions against the cup winners (the league
  // runners-up after a double) before the new season starts. Spain and Italy
  // play four-team mini tournaments in January. [name, short, format, neutral]
  const SUPER_CUP_NAMES = {
    ENG: ["Community Shield", "Shield", "final", true], ESP: ["Supercopa de España", "Supercopa", "four", true],
    ITA: ["Supercoppa Italiana", "Supercoppa", "four", true], GER: ["DFL-Supercup", "Supercup", "final", false],
    FRA: ["Trophée des Champions", "Trophée", "final", true], POR: ["Supertaça Cândido de Oliveira", "Supertaça", "final", true],
    NED: ["Johan Cruijff Schaal", "Schaal", "final", false], TUR: ["Turkish Super Cup", "Süper Kupa", "final", true],
    UKR: ["Ukrainian Super Cup", "Super Cup", "final", true], RUS: ["Russian Super Cup", "Super Cup", "final", true],
    POL: ["Polish Super Cup", "Superpuchar", "final", false], ROU: ["Supercupa României", "Supercupa", "final", true],
    BUL: ["Bulgarian Supercup", "Supercup", "final", true], ISR: ["Israel Super Cup", "Super Cup", "final", true],
    CYP: ["Cypriot Super Cup", "Super Cup", "final", true], KAZ: ["Kazakhstan Super Cup", "Super Cup", "final", true],
    BLR: ["Belarusian Super Cup", "Super Cup", "final", true], GEO: ["Georgian Super Cup", "Super Cup", "final", true],
    MDA: ["Moldovan Super Cup", "Super Cup", "final", true], ARM: ["Armenian Supercup", "Supercup", "final", true],
    ALB: ["Albanian Supercup", "Supercup", "final", true], KOS: ["Kosovar Supercup", "Supercup", "final", true],
    CRO: ["Croatian Super Cup", "Super Cup", "final", false], ISL: ["Icelandic Super Cup", "Super Cup", "final", false],
    FRO: ["Faroe Islands Super Cup", "Super Cup", "final", false], EST: ["Estonian Supercup", "Supercup", "final", false],
    LTU: ["Lithuanian Supercup", "Supercup", "final", false], IRL: ["President's Cup", "President's Cup", "final", false],
    MLT: ["Maltese Super Cup", "Super Cup", "final", true], GIB: ["Pepe Reyes Cup", "Pepe Reyes", "final", true],
    AND: ["Andorran Supercup", "Supercup", "final", true], SMR: ["San Marino Super Cup", "Super Cup", "final", true],
  };
  const SUPER_CUPS = Object.entries(SUPER_CUP_NAMES).filter(([cid]) => Leagues.COUNTRY[cid] && Leagues.COUNTRY[cid].divisions.length).map(([cid, [name, short, format, neutral]]) => {
    const prize = cid === "ENG" ? 0.5 : Leagues.DIVS[Leagues.COUNTRY[cid].divisions[0]].budgetBase * 0.02;
    const rounds = format === "four"
      ? [{ name: "Semi-final", short: "SF", at: 0.5, neutral: true }, { name: "Final", short: "Final", at: 0.52, neutral: true, prize }]
      : [{ name: "Final", short: "Final", at: 0, neutral, prize }];
    return { id: `${cid}_SC`, country: cid, name, short, tag: short, super: true, format, rounds };
  });
  const UEFA_SUPER_CUP = { id: "USC", country: "EUR", name: "UEFA Super Cup", short: "Super Cup", tag: "USC", super: true, format: "final",
    rounds: [{ name: "Final", short: "Final", at: 0, neutral: true, extraTime: false, prize: 3.5 }] };
  for (const c of SUPER_CUPS) Leagues.COUNTRY[c.country].cupIds.push(c.id);
  // Every cup: England's two, one per other country, the super cups.
  const ALL_CUPS = [...CUPS.map((c) => ({ ...c, country: "ENG", tag: c.id })), ...Leagues.FOREIGN_CUPS, ...SUPER_CUPS, UEFA_SUPER_CUP];
  const CUP_BY_ID = Object.fromEntries(ALL_CUPS.map((c) => [c.id, c]));
  const cupDef = (id) => CUP_BY_ID[id];
  const styleDef = (id) => AI_STYLES.find((s) => s.id === id);
  const zeroInvest = () => Object.fromEntries(INVESTMENTS.map((i) => [i.id, 0]));
  const seasonLabel = (y) => `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
  const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function fmtMoney(m) {
    const sign = m < -0.0005 ? "−" : "";
    const v = Math.abs(m);
    if (v >= 1) return `${sign}£${v.toFixed(1)}m`;
    return `${sign}£${Math.round(v * 1000)}k`;
  }

  // `support` is the club's fan base in its country's top-flight terms: ticket
  // demand in any division is support × demandFactor(country, tier).
  function demandFactor(country, tier) {
    if (country === "ENG") return DEMAND_BY_TIER[tier];
    return tier === 1 ? 1 : tier === 2 ? 0.75 : 0.4;
  }

  function teamRow([name, short, rating, color], tier) {
    return { id: short, name, short, rating, color, country: "ENG", ...stadiumFor(short, tier) };
  }

  function stadiumFor(short, tier) {
    const capacity = CAPACITY[short] || 5000;
    const fill = ATTENDANCE[short] != null ? ATTENDANCE[short] : tier <= 4 ? 0.9 : 0.5;
    return { capacity, support: Math.round((capacity * fill) / DEMAND_BY_TIER[tier]) };
  }

  // Clubs outside England: id is COUNTRY_CODE; the tuple carries ground and commercial data.
  function foreignTeam(country, [name, code, rating, color, capacity, demand, commercial], tier) {
    return {
      id: `${country}_${code}`, name, short: code, rating, color, country, capacity, brand0: commercial,
      support: Math.round((capacity * demand) / demandFactor(country, tier)),
    };
  }

  // Club → division lookup, rebuilt whenever the divisions change.
  let lgCache = { ref: null, map: null };
  function leagueOf(state, teamId) {
    if (lgCache.ref !== state.leagues) {
      const map = {};
      for (const [lid, ids] of Object.entries(state.leagues)) ids.forEach((id) => { map[id] = lid; });
      lgCache = { ref: state.leagues, map };
    }
    return lgCache.map[teamId];
  }

  // ---- New career ---------------------------------------------------------

  // opts: { name: manager name, sackable: whether the board can sack you }
  function newGame(teamId, opts = {}) {
    const teams = {};
    const leagues = {};
    for (const l of LEAGUES) {
      leagues[l.id] = l.teams.map((t) => {
        const row = teamRow(t, l.tier);
        teams[row.id] = row;
        return row.id;
      });
    }
    const addAll = (rows) => rows.map((t) => {
      const row = teamRow(t, 5);
      teams[row.id] = row;
      return row.id;
    });
    const outside = {};
    for (const c of COUNTRIES) {
      for (const d of c.divisions) {
        leagues[d.id] = d.teams.map((t) => {
          const row = foreignTeam(c.id, t, d.tier);
          teams[row.id] = row;
          return row.id;
        });
      }
      if (c.cupTeams) {
        outside[c.id] = c.cupTeams.map((t) => {
          const row = foreignTeam(c.id, t, 5);
          teams[row.id] = row;
          return row.id;
        });
      }
    }
    for (const t of Object.values(teams)) t.age = newSquadAge();
    const state = {
      version: VERSION,
      season: START_SEASON,
      teams, leagues, outside,
      pool: addAll(NATIONAL_LEAGUE_POOL),
      nonLeague: addAll(NON_LEAGUE_CLUBS),
      myTeam: teamId,
      history: [],
      phase: "season",
      ai: {},
      fin: {},
      deduct: {},
      archive: [],
      stadium: { project: null },
      invest: zeroInvest(),
      prefs: { halftime: true },
    };
    state.league = leagueOf(state, teamId);
    for (const ids of Object.values(leagues)) {
      for (const id of ids) if (id !== teamId) state.ai[id] = newAiClub();
    }
    for (const ids of Object.values(leagues)) for (const id of ids) newFinances(state, id);
    Managers.init(state, opts);
    Tactics.initUser(state);
    Europe.init(state);
    startSeason(state);
    return state;
  }

  // Average age of a squad at the start of a career.
  const newSquadAge = () => Math.round(Engine.rand(24.8, 28.4) * 10) / 10;

  // `recruit` is how well a club turns money into quality (you always get 1.0):
  // some AI clubs waste money on poor signings, others are shrewd.
  function newAiClub() {
    return {
      style: AI_STYLES[Math.floor(Math.random() * AI_STYLES.length)].id,
      recruit: Math.round(Engine.rand(0.4, 0.9) * 100) / 100,
      invest: zeroInvest(), fx: null,
    };
  }

  function startSeason(state) {
    const lid = leagueOf(state, state.myTeam);
    state.league = lid;
    state.country = leagueDef(lid).country;
    state.splits = {};
    state.fixtures = Leagues.seasonFixtures(state, lid);
    state.results = [];
    state.others = {};
    for (const id of Leagues.DIV_ORDER) {
      if (id !== lid) state.others[id] = { fixtures: Leagues.seasonFixtures(state, id), results: [] };
    }
    state.invest = zeroInvest();
    state.locked = zeroInvest();
    state.teamState = {};
    state.leagues[lid].forEach((id) => { state.teamState[id] = { form: [], injury: null }; });
    state.disc = {}; // bookings and sendings-off in league games: { id: [yellows, reds] }
    // A summer's rest: your players start the season fresh (AI clubs' fatigue is
    // reset in aiPreseason), and the record by formation starts again. Familiarity
    // with your formations carries over.
    if (state.tactics) { state.tactics.fat = 0; state.tactics.log = {}; }
    for (const ai of Object.values(state.ai)) ai.fat = 0;
    state.startRating = state.teams[state.myTeam].rating;
    state.stadium = state.stadium || { project: null };
    state.stadium.gate = { games: 0, crowd: 0, demand: 0, revenue: 0, soldOut: 0 };
    state.stadium.spent = 0;
    state.summary = null;
    state.playoff = null;
    state.post = null;
    state.rotate = false;
    state.lastPlayed = null;
    state.phase = "season";
    state.news = [];
    checkStadiumProject(state);
    state.deduct = {};
    state.deductWhy = {};
    for (const ids of Object.values(state.leagues)) for (const id of ids) seasonStartFinances(state, id);
    for (const [id, f] of Object.entries(state.fin)) if (f.investors && f.investors.length) investorsAtSeasonStart(state, id);
    Europe.startSeason(state);
    for (const ids of Object.values(state.leagues)) {
      for (const id of ids) state.fin[id].credit = Math.round(forecast(state, id).revenue * FINANCE.credit * 10) / 10;
    }
    const fc = forecast(state, state.myTeam);
    const mine = state.fin[state.myTeam];
    state.news.unshift({
      md: 0, type: "info",
      text: `${seasonLabel(state.season)} ${leagueDef(lid).name} season begins. Forecast turnover ${fmtMoney(fc.revenue)}, ` +
        `wage bill ${fmtMoney(fc.costs.wages)}. You have ${fmtMoney(mine.bank)} in the bank and a ${fmtMoney(mine.credit)} credit line.`,
    });
    if (state.deduct[state.myTeam]) {
      state.news.unshift({ md: 0, type: "bad", text: `You start the season on −${state.deduct[state.myTeam]} points for breaching financial rules.` });
    }
    if (mine.embargo) state.news.unshift({ md: 0, type: "bad", text: "Transfer embargo: you can't sign players this season." });
    aiPreseason(state);
    state.cups = {};
    for (const c of ALL_CUPS) state.cups[c.id] = createCup(state, c.id);
    state.cal = buildCalendar(state);
    state.calIdx = 0;
    Managers.seasonStart(state);
    const b = Managers.board(state, state.myTeam);
    state.news.unshift({ md: 0, label: "Board", type: "info", text: `The board's objective: ${Managers.lcFirst(b.obj)} (they expect ${ordinal(b.E)}).` });
  }

  // League matchdays interleaved with cup rounds and European nights.
  function buildCalendar(state) {
    const n = state.fixtures.length;
    const events = Europe.calendarEvents(state, n);
    for (const c of ALL_CUPS) {
      // A super cup with nobody to play it (the first season) is skipped.
      if (c.super && !(state.cups[c.id] && state.cups[c.id].alive.length >= 2)) continue;
      c.rounds.forEach((r, i) => {
        // Super cups in the summer are played before the first matchday.
        events.push({ type: "cup", cup: c.id, round: i, after: c.super && r.at === 0 ? 0 : clamp(Math.round(r.at * n), 1, n - 1) });
      });
    }
    const cal = [];
    for (let md = 0; md < n; md++) {
      events.filter((e) => e.after === md).forEach((e) => cal.push(e));
      cal.push({ type: "league", md });
    }
    return cal;
  }

  // ---- Money & investments ------------------------------------------------

  const spent = (state) => sum(state.invest);
  // Spending you've chosen but that isn't paid yet (paid when the next match kicks off).
  const pendingSpend = (state) => sum(state.invest) - sum(state.locked);
  // What you can spend right now: bank balance plus credit line, less pending spending.
  const cash = (state) => {
    const f = state.fin[state.myTeam];
    return f.bank + f.credit - pendingSpend(state);
  };

  function computeFx(invest, lid, recruit = 1) {
    const { budgetBase, impact } = leagueDef(lid);
    const out = {};
    for (const def of INVESTMENTS) {
      out[def.id] = Engine.investmentEffect(def, invest[def.id] * recruit, budgetBase) * (def.rating ? impact : 1);
    }
    return out;
  }

  function effects(state) {
    return computeFx(state.invest, state.league);
  }

  // Effects for any club: yours, an AI club's, or none (non-league).
  function clubFx(state, id) {
    if (id === state.myTeam) return effects(state);
    const ai = state.ai[id];
    return ai && ai.fx ? ai.fx : null;
  }

  function transferWindow(state) {
    const md = state.results.length, total = state.fixtures.length, half = Math.floor(total / 2);
    if (md === 0) return { open: true, name: "Summer transfer window" };
    if (md >= half && md < half + 3) return { open: true, name: "January transfer window", closesAfter: half + 3 - md };
    return { open: false, name: "Transfer window closed", opensIn: md < half ? half - md : null };
  }

  function canAdjust(state, catId) {
    if (state.phase !== "season" && state.phase !== "playoffs") return false;
    if (state.live) return false; // spending is locked once your match kicks off
    if (invDef(catId).group !== "transfer") return true;
    return state.phase === "season" && transferWindow(state).open && !state.fin[state.myTeam].embargo;
  }

  // Set a category's spend. Once a match has been played, money already
  // committed is locked in — you can add more but not take it back.
  function setInvestment(state, catId, amount) {
    if (!canAdjust(state, catId)) return state.invest[catId];
    const max = state.invest[catId] + cash(state);
    const v = Math.max(state.locked[catId], Math.min(max, Math.round(amount * 100) / 100));
    state.invest[catId] = v;
    return v;
  }

  // Pay money to a club, booked under an income line (matchday, cups, sales, merit).
  // Non-league clubs don't keep accounts.
  function credit(state, id, amount, kind) {
    const f = state.fin[id];
    if (!amount || !f) return;
    f.bank += amount;
    f.acc[kind] += amount;
  }

  // Your chosen spending is paid when a match locks it in.
  function commitSpending(state) {
    const f = state.fin[state.myTeam];
    for (const k of Object.keys(state.invest)) {
      const d = state.invest[k] - state.locked[k];
      if (d > 0) bookSpend(f, k, d);
    }
    state.locked = { ...state.invest };
  }

  function bookSpend(f, cat, amount) {
    f.bank -= amount;
    f.acc.spending += amount;
    if (cat === "academy") f.acc.academy += amount;
    if (TRANSFER_CATS.includes(cat)) f.acc.transfers += amount;
  }

  // ---- Finances -------------------------------------------------------------

  // Per-division money settings (England from FINANCE, elsewhere from the data).
  function moneyOf(lid) {
    const def = leagueDef(lid);
    if (def.country === "ENG") {
      return {
        central: FINANCE.central[lid], operations: FINANCE.operations[lid], owner: FINANCE.owner[lid],
        wageRatio: FINANCE.wageRatio[def.tier], commercialShare: FINANCE.commercialShare[def.tier], administration: FINANCE.administration[lid],
      };
    }
    const m = def.money;
    return {
      central: m.tv, operations: m.ops, owner: m.owner, wageRatio: m.wageRatio,
      commercialShare: def.tier === 1 ? 1 : m.commercialShare || 0.35, administration: 10,
    };
  }

  const zeroAccounts = () => ({
    broadcast: 0, parachute: 0, europe: 0, commercial: 0, matchday: 0, cups: 0, sales: 0, merit: 0,
    owner: 0, wages: 0, operations: 0, spending: 0, academy: 0, transfers: 0, stadium: 0,
  });
  const INCOME_LINES = ["broadcast", "merit", "parachute", "europe", "commercial", "matchday", "cups", "sales"];

  // Wage bill: the market cost of the squad's quality × the club's pay level
  // (big clubs pay more for the same quality).
  function squadValue(rating) {
    const w = FINANCE.wages;
    return w.base * Math.exp(w.growth * (rating - w.from));
  }

  function wageBill(state, id) {
    return squadValue(state.teams[id].rating) * (state.fin[id].pay || 1);
  }

  function commercial(state, id) {
    return state.fin[id].brand * moneyOf(leagueOf(state, id)).commercialShare;
  }

  // Matchday income per fan: the division's rate plus a premium for big brands.
  function matchdayYield(state, id) {
    const f = state.fin && state.fin[id];
    return ticketYield(state, id) * (1 + (f ? f.brand : 0) / 400);
  }

  // A club's usual commercial income (£m at top-flight level), from the data.
  const baseBrand = (t) => (t.brand0 != null ? t.brand0 : COMMERCIAL[t.id] || Math.round(8 + 0.55 * t.support / 1000));

  function newFinances(state, id) {
    const lid = leagueOf(state, id);
    const range = moneyOf(lid).owner;
    const t = state.teams[id];
    const brand = baseBrand(t);
    const f = {
      bank: 0, credit: 0, brand, brandBase: brand,
      owner: id === state.myTeam ? (range[0] + range[1]) / 2 : Engine.rand(range[0], range[1]),
      parachute: [], parachuteNow: 0, europe: 0, europeNext: 0, hist: [], deductNext: 0,
      embargo: false, embargoNext: false, admin: false, acc: zeroAccounts(), bankHist: [], pay: 1,
    };
    state.fin[id] = f;
    const revenue = forecast(state, id).revenue;
    // AI clubs vary: some run tight wage bills, others overpay.
    const ratio = moneyOf(lid).wageRatio * (id === state.myTeam ? 1 : Engine.rand(0.85, 1.15));
    f.pay = clamp((ratio * revenue) / squadValue(state.teams[id].rating), 0.4, 3);
    f.bank = Math.round(revenue * 0.15 * 10) / 10;
    return f;
  }

  // Full-season income and costs at the club's current division.
  function forecast(state, id) {
    const lid = leagueOf(state, id);
    const def = leagueDef(lid);
    const f = state.fin[id];
    const n = state.leagues[lid].length;
    const income = {
      broadcast: moneyOf(lid).central,
      merit: lid === "PL" ? (FINANCE.meritPerPlace * (n + 1)) / 2 : 0,
      parachute: f.parachuteNow || 0,
      europe: f.europe || 0,
      commercial: commercial(state, id),
      matchday: (crowdFor(state, id, 1) * matchdayYield(state, id) * (n - 1)) / 1e6,
    };
    const costs = { wages: wageBill(state, id), operations: moneyOf(lid).operations };
    const revenue = sum(income);
    return { income, costs, revenue, owner: f.owner, surplus: revenue + f.owner - sum(costs) };
  }

  function seasonStartFinances(state, id) {
    const f = state.fin[id] || newFinances(state, id);
    f.acc = zeroAccounts();
    f.parachuteNow = f.parachute.length ? f.parachute.shift() : 0;
    f.europe = 0; // set by Europe.startSeason for league-phase clubs
    if (f.deductNext) {
      state.deduct[id] = f.deductNext;
      state.deductWhy[id] = [`−${f.deductNext} financial rules breach`];
    }
    f.deductNext = 0;
    f.embargo = f.embargoNext;
    f.embargoNext = false;
    f.admin = false;
    f.credit = Math.round(forecast(state, id).revenue * FINANCE.credit * 10) / 10;
    f.bankHist = [f.bank];
  }

  function leagueFixtures(state, lid) {
    return lid === state.league ? { fixtures: state.fixtures, results: state.results } : state.others[lid];
  }

  // Money that flows in and out evenly through the season, per league matchday.
  function installment(state, id) {
    const lid = leagueOf(state, id), f = state.fin[id];
    const n = leagueFixtures(state, lid).fixtures.length;
    return {
      broadcast: moneyOf(lid).central / n, parachute: (f.parachuteNow || 0) / n, europe: (f.europe || 0) / n,
      commercial: commercial(state, id) / n, owner: f.owner / n,
      wages: wageBill(state, id) / n, operations: moneyOf(lid).operations / n,
    };
  }

  function payInstallment(state, id) {
    const f = state.fin[id], i = installment(state, id);
    for (const [k, v] of Object.entries(i)) f.acc[k] += v;
    f.bank += i.broadcast + i.parachute + i.europe + i.commercial + i.owner - i.wages - i.operations;
  }

  function meritFor(state, lid, pos) {
    return lid === "PL" ? FINANCE.meritPerPlace * (state.leagues[lid].length + 1 - pos) : 0;
  }

  // What's still to come in and go out this league season (no more spending):
  // remaining installments, expected home gates and merit at the current
  // position (or, if `cautious`, a near-bottom finish).
  function remainingSeason(state, id, cautious = false) {
    const lid = leagueOf(state, id), f = state.fin[id];
    const { fixtures, results } = leagueFixtures(state, lid);
    const left = fixtures.length - results.length;
    const i = installment(state, id);
    const homeLeft = fixtures.slice(results.length).filter((md) => md.some((m) => m.h === id)).length;
    let merit = 0;
    if (lid === "PL" && !f.acc.merit) {
      const n = state.leagues[lid].length;
      let pos = results.length ? table(state, lid).findIndex((r) => r.id === id) + 1 : (n + 1) / 2;
      if (cautious) pos = Math.max(pos, n - 2);
      merit = meritFor(state, lid, pos);
    }
    return {
      revenue: (i.broadcast + i.parachute + i.europe + i.commercial) * left + merit
        + (homeLeft * crowdFor(state, id, 1) * matchdayYield(state, id)) / 1e6,
      owner: i.owner * left, wages: i.wages * left, operations: i.operations * left,
    };
  }

  // Line-by-line accounts: booked so far and the full-season forecast.
  function accountLines(state, id) {
    const f = state.fin[id], a = f.acc, lid = leagueOf(state, id);
    const { fixtures, results } = leagueFixtures(state, lid);
    const left = fixtures.length - results.length;
    const i = installment(state, id);
    const homeLeft = fixtures.slice(results.length).filter((md) => md.some((m) => m.h === id)).length;
    const r = remainingSeason(state, id);
    const gates = (homeLeft * crowdFor(state, id, 1) * matchdayYield(state, id)) / 1e6;
    const pending = id === state.myTeam ? pendingSpend(state) : 0;
    const rest = {
      broadcast: i.broadcast * left, parachute: i.parachute * left, europe: i.europe * left,
      commercial: i.commercial * left, matchday: gates,
      merit: r.revenue - (i.broadcast + i.parachute + i.europe + i.commercial) * left - gates,
      cups: 0, sales: 0, owner: r.owner, wages: r.wages, operations: r.operations, spending: pending, stadium: 0,
    };
    const line = (k) => ({ key: k, sofar: a[k], forecast: a[k] + rest[k] });
    return {
      income: INCOME_LINES.map(line),
      costs: ["wages", "operations", "spending", "stadium"].map(line),
      owner: line("owner"),
    };
  }

  // Bank balance at the end of the league season if nothing more is spent.
  function projectedBank(state, id, cautious = false) {
    const r = remainingSeason(state, id, cautious);
    const pending = id === state.myTeam ? pendingSpend(state) : 0;
    return state.fin[id].bank - pending + r.revenue + r.owner - r.wages - r.operations;
  }

  // Whole-season totals: booked so far plus what's still to come.
  function projectedSeason(state, id) {
    const a = state.fin[id].acc, r = remainingSeason(state, id);
    const pending = id === state.myTeam ? pendingSpend(state) : 0;
    const pendingTransfers = id === state.myTeam
      ? TRANSFER_CATS.reduce((t, k) => t + state.invest[k] - state.locked[k], 0) : 0;
    const pendingAcademy = id === state.myTeam ? state.invest.academy - state.locked.academy : 0;
    return {
      revenue: INCOME_LINES.reduce((t, k) => t + a[k], 0) + r.revenue,
      owner: a.owner + r.owner, wages: a.wages + r.wages, operations: a.operations + r.operations,
      spending: a.spending + pending, academy: a.academy + pendingAcademy, transfers: a.transfers + pendingTransfers,
      stadium: a.stadium,
    };
  }

  // Spending that leaves half your credit line unused, keeps a cautious
  // end-of-season forecast in the black, and stays inside the financial rules.
  function safeToSpend(state) {
    const me = state.myTeam, credit = state.fin[me].credit;
    const rules = rulesStatus(state, me);
    const ruleRoom = rules.kind === "ps" ? rules.room : rules.kind === "scmp" ? rules.room / 0.6 : Infinity;
    return Math.max(0, Math.min(cash(state) - credit * 0.5, projectedBank(state, me, true) - credit * 0.25, ruleRoom));
  }

  // Headroom under the financial rules for more spending this season.
  //   PL/Championship: how much more can be lost before the 3-season limit.
  //   Leagues One/Two: how much more can go on players before the squad-cost cap.
  function rulesStatus(state, id) {
    const f = state.fin[id], lid = leagueOf(state, id);
    const p = projectedSeason(state, id);
    const ps = FINANCE.ps[lid];
    if (ps) {
      const past = f.hist.slice(-2).filter((h) => FINANCE.ps[h.lid]);
      const pastResult = past.reduce((t, h) => t + h.psProfit, 0);
      const thisSeason = p.revenue - p.wages - p.operations - (p.spending - p.academy);
      const loss = -(pastResult + thisSeason);
      return { kind: "ps", limit: ps.limit, loss, pastSeasons: past.length, room: ps.limit - loss };
    }
    const cap = FINANCE.scmp[lid];
    if (!cap) return { kind: "none", room: Infinity };
    const turnover = p.revenue + p.owner;
    const squadCost = p.wages + p.transfers;
    return { kind: "scmp", cap, turnover, squadCost, ratio: turnover > 0 ? squadCost / turnover : 1, room: cap * turnover - squadCost };
  }

  // Raise money by selling players: lower rating, lower wages, a fee now.
  function saleValue(state, id, points) {
    const r = state.teams[id].rating;
    const saving = (squadValue(r) - squadValue(r - points)) * state.fin[id].pay;
    return { saving, fee: saving * FINANCE.saleFeeYears };
  }

  function saleOptions(state) {
    const open = state.phase === "season" && transferWindow(state).open;
    return SALES.map((o) => ({ ...o, ...saleValue(state, state.myTeam, o.points), blocked: open ? null : "Only in a transfer window" }));
  }

  function sellPlayers(state, optId) {
    const o = saleOptions(state).find((x) => x.id === optId);
    if (!o || o.blocked) return false;
    sell(state, state.myTeam, o.points);
    state.news.unshift({ md: state.results.length, label: "Sale", type: "info",
      text: `${o.name.replace("Sell", "Sold")} for ${fmtMoney(o.fee)}. Wages fall by ${fmtMoney(o.saving)} a season; squad rating −${o.points}.` });
    return true;
  }

  function sell(state, id, points) {
    const { fee } = saleValue(state, id, points);
    const t = state.teams[id];
    t.rating = Math.round((t.rating - points) * 10) / 10;
    credit(state, id, fee, "sales");
    return fee;
  }

  // Out of money: points deduction, debts written down, players sold, new owners.
  function enterAdministration(state, id) {
    const f = state.fin[id], lid = leagueOf(state, id);
    if (f.admin) { f.bank = Math.max(f.bank, -f.credit); return; }
    const pts = moneyOf(lid).administration;
    state.deduct[id] = (state.deduct[id] || 0) + pts;
    (state.deductWhy[id] = state.deductWhy[id] || []).push(`−${pts} administration`);
    f.admin = true;
    f.embargoNext = true;
    f.bank = 0;
    f.owner = moneyOf(lid).owner[0];
    const t = state.teams[id];
    t.rating = Math.round((t.rating - 2) * 10) / 10;
    if (state.ai[id]) state.ai[id].style = "prudent";
    const text = id === state.myTeam
      ? `The club has entered administration! −${pts} points, players sold off (−2 rating), and a transfer embargo next season.`
      : `${t.name} have entered administration and been deducted ${pts} points.`;
    if (id === state.myTeam || lid === state.league) state.news.unshift({ md: state.results.length, label: "Finance", type: id === state.myTeam ? "bad" : "info", text });
  }

  // Season accounts: what came in, what went out, and the figures the rules use.
  function seasonResult(f) {
    const a = f.acc;
    const revenue = INCOME_LINES.reduce((t, k) => t + a[k], 0);
    const costs = a.wages + a.operations + a.spending + a.stadium;
    return {
      revenue, costs, profit: revenue - costs, owner: a.owner,
      // Academy and stadium spending don't count against the loss limits.
      psProfit: revenue - (a.wages + a.operations + a.spending - a.academy),
      squadCost: a.wages + a.transfers, turnover: revenue + a.owner,
    };
  }

  // End-of-season checks: Profitability & Sustainability (PL, Championship)
  // and squad-cost caps (Leagues One and Two).
  function checkFinancialRules(state, id, lid) {
    const f = state.fin[id];
    const r = seasonResult(f);
    f.hist.push({ season: state.season, lid, ...r });
    if (f.hist.length > 5) f.hist.shift();
    const out = { lid, result: r };
    const ps = FINANCE.ps[lid];
    if (ps) {
      const window = f.hist.slice(-3).filter((h) => FINANCE.ps[h.lid]);
      const total = window.reduce((t, h) => t + h.psProfit, 0);
      out.ps = { total, limit: ps.limit, seasons: window.length };
      if (-total > ps.limit) {
        const pts = Math.min(ps.max, Math.ceil((-total - ps.limit) / ps.perPoint));
        f.deductNext += pts;
        out.breach = `Losses of ${fmtMoney(-total)} over ${window.length} seasons broke the ${fmtMoney(ps.limit)} limit: −${pts} points next season.`;
        f.hist = [];
      }
    } else if (FINANCE.scmp[lid]) {
      const cap = FINANCE.scmp[lid];
      const ratio = r.turnover > 0 ? r.squadCost / r.turnover : 1;
      out.scmp = { ratio, cap };
      if (ratio > cap) {
        f.embargoNext = true;
        out.breach = `Squad costs were ${Math.round(ratio * 100)}% of turnover (cap ${Math.round(cap * 100)}%): transfer embargo next season.`;
      }
    }
    return out;
  }

  // ---- Stadiums & gates -----------------------------------------------------

  // Ticket demand for a home game: fan base × division × how the season is
  // going (`form`, 0.85–1.15) × fan investment (up to +15%).
  function ticketDemand(state, id, form = 1) {
    const t = state.teams[id];
    const fx = clubFx(state, id);
    return t.support * demandFactor(t.country, tierOf(state, id)) * form * (1 + 0.15 * (fx ? fx.stadium : 0));
  }

  function crowdFor(state, id, form = 1) {
    return Math.round(Math.min(state.teams[id].capacity, ticketDemand(state, id, form)));
  }

  function ticketYield(state, id) {
    const lid = leagueOf(state, id);
    return lid ? leagueDef(lid).ticketYield : 5;
  }

  // Demand boost/drag from league position going into a matchday.
  function formFactors(state, lid, results) {
    const out = {};
    if (!results.length) return out;
    const t = table(state, lid);
    t.forEach((r, i) => { out[r.id] = 1 + 0.3 * (0.5 - i / (t.length - 1)); });
    return out;
  }

  // Cost per seat (£m): about three and a half seasons of a sold-out seat's takings.
  function seatCost(state, id) {
    const lid = leagueOf(state, id);
    const homeGames = (state.leagues[lid].length - 1);
    return (ticketYield(state, id) * homeGames * 3.5) / 1e6;
  }

  function stadiumOptions(state) {
    const me = state.teams[state.myTeam];
    const busy = !!state.stadium.project;
    const open = state.phase === "season" || state.phase === "playoffs";
    const lateInSeason = state.results.length + 6 > state.fixtures.length;
    return EXPANSIONS.map((e) => {
      const cost = Math.round(e.seats * seatCost(state, state.myTeam) * e.premium * 100) / 100;
      let blocked = null;
      if (!open) blocked = "Season over";
      else if (busy) blocked = "Another project is under way";
      else if (me.capacity + e.seats > MAX_CAPACITY) blocked = "Ground is at its maximum size";
      else if (e.matchdays && (lateInSeason || state.phase !== "season")) blocked = "Too late in the season";
      else if (cost > cash(state)) blocked = `Needs ${fmtMoney(cost)}`;
      return { ...e, cost, blocked };
    });
  }

  function buildStadium(state, optId) {
    const opt = stadiumOptions(state).find((o) => o.id === optId);
    if (!opt || opt.blocked) return false;
    const f = state.fin[state.myTeam];
    f.bank -= opt.cost;
    f.acc.stadium += opt.cost;
    state.stadium.spent += opt.cost;
    state.stadium.project = {
      id: opt.id, name: opt.name, seats: opt.seats, cost: opt.cost,
      opensSeason: opt.nextSeason ? state.season + 1 : state.season,
      opensMd: opt.nextSeason ? 0 : state.results.length + opt.matchdays,
    };
    const when = opt.nextSeason ? `ready for ${seasonLabel(state.season + 1)}` : `ready after matchday ${state.results.length + opt.matchdays}`;
    state.news.unshift({ md: state.results.length, label: "Ground", type: "info", text: `Work begins: ${opt.name.toLowerCase()} (+${opt.seats.toLocaleString("en-GB")} seats) for ${fmtMoney(opt.cost)}, ${when}.` });
    return true;
  }

  function checkStadiumProject(state) {
    const p = state.stadium && state.stadium.project;
    if (!p) return;
    if (state.season > p.opensSeason || (state.season === p.opensSeason && state.results.length >= p.opensMd)) {
      const t = state.teams[state.myTeam];
      t.capacity = Math.min(MAX_CAPACITY, t.capacity + p.seats);
      state.stadium.project = null;
      state.news.unshift({ md: state.results.length, label: "Ground", type: "good",
        text: `${p.name} complete! Capacity is now ${t.capacity.toLocaleString("en-GB")}.` });
    }
  }

  // AI clubs that keep selling out may expand over the summer.
  function aiStadiumPlans(state) {
    for (const ids of Object.values(state.leagues)) {
      for (const id of ids) {
        if (id === state.myTeam) continue;
        const ai = state.ai[id], t = state.teams[id];
        if (ai.project) continue;
        const excess = ticketDemand(state, id, 1) - t.capacity;
        if (excess < t.capacity * 0.03) continue;
        const chance = { ambitious: 0.6, prudent: 0.25, gambler: 0.5 }[ai.style] || 0.4;
        if (Math.random() > chance) continue;
        const seats = Math.min(MAX_CAPACITY - t.capacity, clamp(Math.round(excess / 1000) * 1000, 2000, 10000));
        const cost = seats * seatCost(state, id);
        const f = state.fin[id];
        if (seats <= 0 || f.bank < cost * 1.5) continue;
        f.bank -= cost;
        f.acc.stadium += cost;
        ai.project = { seats, opensSeason: state.season + 1 };
      }
    }
  }

  // ---- AI clubs -----------------------------------------------------------

  // How much an AI club is prepared to spend now: what it can borrow today, and
  // what it can afford by the end of the season given its appetite for risk.
  // Rules headroom also limits spending; risk-takers sometimes overshoot it.
  function aiBudget(state, id, extraRisk = 0) {
    const f = state.fin[id];
    const risk = clamp(RISK[state.ai[id].style] + extraRisk, 0, 1);
    const byEnd = projectedBank(state, id) + f.credit * risk;
    const now = f.bank + f.credit * 0.8;
    let budget = Math.max(0, Math.min(byEnd, now));
    const rules = rulesStatus(state, id);
    // Clubs keep a safety margin. About 60% of a typical spend goes on players,
    // which is what the squad-cost cap counts.
    const room = rules.kind === "ps" ? rules.room - rules.limit * 0.1
      : rules.kind === "scmp" ? (rules.room - rules.cap * rules.turnover * 0.08) / 0.6 : Infinity;
    budget = Math.min(budget, Math.max(0, room) + risk * risk * leagueDef(leagueOf(state, id)).budgetBase);
    return budget;
  }
  const aiCash = (state, id) => state.fin[id].bank;

  function normalise(w) {
    const t = sum(w) || 1;
    return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / t]));
  }

  // A style's split with per-decision noise; `only` restricts the categories.
  function styleWeights(styleId, only = null) {
    const s = styleDef(styleId);
    let w;
    if (!s.weights) {
      const focus = Engine.shuffle(INVESTMENTS.map((d) => d.id)).slice(0, Engine.randInt(1, 2));
      w = Object.fromEntries(INVESTMENTS.map((d) => [d.id, focus.includes(d.id) ? Engine.rand(0.6, 1) : Engine.rand(0, 0.08)]));
    } else {
      w = { ...s.weights };
    }
    for (const k of Object.keys(w)) {
      w[k] *= Engine.rand(0.6, 1.4);
      if (only && !only.includes(k)) w[k] = 0;
    }
    return normalise(w);
  }

  function noisy(w) {
    const out = {};
    for (const [k, v] of Object.entries(w)) out[k] = v * Engine.rand(0.7, 1.3);
    return normalise(out);
  }

  function aiSpend(state, id, amount, weights) {
    const ai = state.ai[id], fin = state.fin[id];
    if (fin.embargo) {
      const w = { ...weights };
      TRANSFER_CATS.forEach((k) => { w[k] = 0; });
      weights = normalise(w);
    }
    let amt = Math.max(0, amount);
    if (amt <= 0 || !sum(weights)) return 0;
    // Under a squad-cost cap, keep player spending inside the headroom
    // (risk-takers allow themselves a little more).
    const rules = rulesStatus(state, id);
    if (rules.kind === "scmp") {
      const share = TRANSFER_CATS.reduce((t, k) => t + (weights[k] || 0), 0);
      const risk = RISK[ai.style];
      const allowed = Math.max(0, rules.room - rules.cap * rules.turnover * 0.08) + risk * risk * 0.2 * leagueDef(leagueOf(state, id)).budgetBase;
      if (share > 0 && amt * share > allowed) {
        const scale = allowed / (amt * share);
        const w = { ...weights };
        TRANSFER_CATS.forEach((k) => { w[k] = (w[k] || 0) * scale; });
        amt *= sum(w);
        weights = normalise(w);
      }
    }
    if (amt <= 0) return 0;
    for (const [k, f] of Object.entries(weights)) {
      ai.invest[k] = (ai.invest[k] || 0) + amt * f;
      bookSpend(fin, k, amt * f);
    }
    ai.fx = computeFx(ai.invest, leagueOf(state, id), ai.recruit);
    return amt;
  }

  // Clubs heading for trouble sell players in the windows.
  function aiFireSale(state, id, lid) {
    const f = state.fin[id];
    const gap = -f.credit * 0.5 - projectedBank(state, id);
    if (gap <= 0) return;
    const points = gap > saleValue(state, id, 1.5).fee ? 3 : 1.5;
    const fee = sell(state, id, points);
    leagueNews(state, lid, { type: "info", text: `${state.teams[id].name} sell players for ${fmtMoney(fee)} to ease money worries.` });
  }

  function leagueNews(state, lid, item) {
    if (lid === state.league) state.news.unshift({ md: state.results.length, ...item });
  }

  // Preseason: new budgets, the odd takeover or financial crisis, then spending.
  function aiPreseason(state) {
    for (const [lid, ids] of Object.entries(state.leagues)) {
      const base = leagueDef(lid).budgetBase;
      for (const id of ids) {
        if (id === state.myTeam) continue;
        const ai = state.ai[id] || (state.ai[id] = newAiClub());
        if (ai.project && state.season >= ai.project.opensSeason) {
          const t = state.teams[id];
          t.capacity = Math.min(MAX_CAPACITY, t.capacity + ai.project.seats);
          leagueNews(state, lid, { type: "info", text: `${t.name} open their expanded ground: capacity now ${t.capacity.toLocaleString("en-GB")}.` });
          ai.project = null;
        }
        ai.invest = zeroInvest();
        ai.fx = null;
        ai.event = null;
        ai.fat = 0;
        // After a takeover or crisis, the manager's own approach returns.
        const m = Managers.of(state, id);
        if (m) { ai.style = m.style; ai.recruit = m.recruit; }
      }
      const others = ids.filter((id) => id !== state.myTeam);
      const ownerTop = moneyOf(lid).owner[1];
      // Takeover: a cash injection and much richer owners.
      if (Math.random() < 0.35) {
        const id = others[Math.floor(Math.random() * others.length)];
        const windfall = base * Engine.rand(0.5, 1.2);
        const f = state.fin[id];
        f.bank += windfall;
        f.acc.owner += windfall;
        f.owner = Math.max(f.owner, ownerTop * Engine.rand(1.5, 3));
        f.credit = Math.round(forecast(state, id).revenue * FINANCE.credit * 10) / 10;
        state.ai[id].style = "ambitious";
        state.ai[id].event = "takeover";
        leagueNews(state, lid, { type: "bad", text: `Takeover at ${state.teams[id].name}! New owners inject ${fmtMoney(windfall)} and promise ${fmtMoney(f.owner)} a season.` });
      }
      // Owner trouble: the money stops.
      if (Math.random() < 0.2) {
        const id = others[Math.floor(Math.random() * others.length)];
        if (!state.ai[id].event) {
          state.fin[id].owner = 0;
          state.ai[id].style = "prudent";
          state.ai[id].event = "crisis";
          leagueNews(state, lid, { type: "good", text: `Financial trouble at ${state.teams[id].name}: their owner has stopped funding the club.` });
        }
      }
      megaTakeover(state, lid, others);
      for (const id of others) {
        const ai = state.ai[id];
        const s = styleDef(ai.style);
        aiFireSale(state, id, lid);
        aiSpend(state, id, aiBudget(state, id) * Engine.rand(s.spend[0], s.spend[1]), rebuildWeights(state, id, styleWeights(ai.style)));
      }
    }
  }

  // Now and then a big club-in-waiting is bought by very rich owners: a
  // well-supported club outside the top three of a major league, which can
  // become a new power over the following seasons.
  function megaTakeover(state, lid, others) {
    const def = leagueDef(lid);
    if (def.tier !== 1 || (Leagues.RANK[def.country] || 99) > 15 || Math.random() > 0.025) return;
    const byRating = others.slice().sort((a, b) => state.teams[b].rating - state.teams[a].rating);
    const supports = others.map((id) => state.teams[id].support).sort((a, b) => a - b);
    const median = supports[Math.floor(supports.length / 2)] || 0;
    const pool = byRating.slice(3).filter((id) => state.teams[id].support >= median && state.ai[id].event !== "crisis");
    if (!pool.length) return;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const f = state.fin[id], ai = state.ai[id], base = def.budgetBase;
    const windfall = Math.round(base * Engine.rand(2, 4) * 10) / 10;
    f.bank += windfall;
    f.acc.owner += windfall;
    f.owner = Math.max(f.owner, Math.round(base * Engine.rand(1.2, 2.2) * 10) / 10);
    f.brandBase = Math.round((f.brandBase || f.brand) * 1.3 * 10) / 10;
    f.brand = Math.round(f.brand * 1.2 * 10) / 10;
    f.credit = Math.round(forecast(state, id).revenue * FINANCE.credit * 10) / 10;
    ai.style = "ambitious";
    ai.event = "takeover";
    const text = `Blockbuster takeover at ${state.teams[id].name}! Super-rich new owners put in ${fmtMoney(windfall)} and promise ${fmtMoney(f.owner)} a season.`;
    if (lid === state.league) leagueNews(state, lid, { type: "bad", text });
    else state.news.unshift({ md: state.results ? state.results.length : 0, label: "World", type: "info", text });
  }

  // AI clubs with an ageing squad rebuild: more money on signings and the academy.
  function rebuildWeights(state, id, w) {
    const age = state.teams[id].age || 26.5;
    if (age < 28.2) return w;
    const out = { ...w };
    for (const k of TRANSFER_CATS) out[k] = (out[k] || 0) * 1.3;
    out.academy = (out.academy || 0) * 2 + 0.05;
    return normalise(out);
  }

  // January: clubs react to where they are in the table.
  function aiJanuary(state, lid, table) {
    const def = leagueDef(lid);
    const n = table.length, z = def.zones;
    const big = [];
    table.forEach((row, i) => {
      const id = row.id, pos = i + 1;
      if (id === state.myTeam) return;
      const ai = state.ai[id], s = styleDef(ai.style);
      aiFireSale(state, id, lid);
      const danger = pos > n - z.down - 2;
      const chase = def.tier === 1 ? pos <= 5 : pos <= z.playoff[1];
      let amt, w, mood;
      if (danger) {
        amt = aiBudget(state, id, 0.3) * Engine.rand(0.7, 1.0);
        w = noisy({ defence: 0.4, attack: 0.3, midfield: 0.2, coaching: 0.1 });
        mood = "in a bid to beat the drop";
      } else if (chase) {
        amt = Math.min(aiBudget(state, id, 0.2), aiBudget(state, id, 0.2) * Engine.rand(0.5, 1.0) * s.january);
        w = noisy({ attack: 0.4, midfield: 0.2, defence: 0.3, coaching: 0.1 });
        mood = def.tier === 1 ? "to strengthen their challenge" : "to push for promotion";
      } else {
        amt = aiBudget(state, id) * Engine.rand(0, 0.4) * s.january;
        w = styleWeights(ai.style);
        mood = "";
      }
      const done = aiSpend(state, id, amt, w);
      if (done > def.budgetBase * 0.12) big.push({ id, done, mood });
    });
    big.sort((a, b) => b.done - a.done).slice(0, 3).forEach((b) => {
      leagueNews(state, lid, {
        type: "info",
        text: `${state.teams[b.id].name} spend ${fmtMoney(b.done)} in January${b.mood ? " " + b.mood : ""}.`,
      });
    });
  }

  // Every few matchdays clubs may put spare money (e.g. cup winnings) into staff.
  function aiTopUp(state, lid) {
    const base = leagueDef(lid).budgetBase;
    for (const id of state.leagues[lid]) {
      if (id === state.myTeam) continue;
      const ai = state.ai[id];
      const spare = aiBudget(state, id, -0.3);
      if (spare > base * 0.1 && Math.random() < 0.5) {
        aiSpend(state, id, spare * Engine.rand(0.1, 0.35), styleWeights(ai.style, ["coaching", "medical", "stadium", "academy"]));
      }
    }
  }

  // ---- Team strength ------------------------------------------------------

  function formValue(formArr) {
    let v = 0;
    for (let i = 0; i < FORM_WEIGHTS.length && i < formArr.length; i++) {
      const r = formArr[formArr.length - 1 - i];
      v += FORM_WEIGHTS[i] * (r === "W" ? FORM_POINT : r === "L" ? -FORM_POINT : 0);
    }
    return v;
  }

  // opts: invest (apply *my* investments — off for "without spending" previews),
  //       form, injury, rotate (rested players for a cup tie), bonus (flat rating),
  //       tactics (formation, mentality, pressing, familiarity, fatigue and the
  //       manager), lineup (the lineup to use; default: the club's usual one)
  function strength(state, id, opts = {}) {
    const o = { invest: true, form: true, injury: true, rotate: false, bonus: 0, tactics: true, ...opts };
    const r = state.teams[id].rating;
    const lid = leagueOf(state, id);
    const impact = lid ? leagueDef(lid).impact : 0.6;
    let att = r, def = r, homeEdge = 0, coachFrac = 0;
    const fx = id === state.myTeam ? (o.invest ? effects(state) : null) : clubFx(state, id);
    if (fx) {
      att += fx.attack + fx.midfield + fx.coaching;
      def += fx.defence + fx.midfield + fx.coaching;
      homeEdge = fx.stadium;
      coachFrac = fx.coaching / (invDef("coaching").max * impact);
    }
    const ts = state.teamState && state.teamState[id];
    if (ts && o.form) {
      let f = formValue(ts.form);
      if (f < 0) f *= 1 - 0.5 * coachFrac;
      att += f; def += f;
    }
    if (ts && o.injury && ts.injury) { att -= ts.injury.amount; def -= ts.injury.amount; }
    if (ts && o.injury && ts.bans && ts.bans.length) {
      const b = Math.min(3, ts.bans.reduce((t, x) => t + x.amt, 0));
      att -= b; def -= b;
    }
    if (o.rotate) { att -= ROTATION_PENALTY * impact; def -= ROTATION_PENALTY * impact; }
    if (o.tactics) {
      const t = Tactics.mods(state, id, o.lineup || Tactics.lineup(state, id));
      const mgr = Managers.boost(state, id);
      att += t.att + mgr; def += t.def + mgr;
    }
    att += o.bonus; def += o.bonus;
    return { att, def, homeEdge };
  }

  // Strengths for a match: both sides choose a lineup for this opponent, and
  // the formation matchup shifts the balance. Returns [home, away, info].
  // ---- Derbies ---------------------------------------------------------------
  // Named rivalries (js/data/derbies.js): bigger crowds, more weight with the
  // board, and the form book goes out of the window (the underdog raises its game).

  const DERBY = new Map();
  for (const d of typeof DERBIES !== "undefined" ? DERBIES : []) DERBY.set([...d.clubs].sort().join("|"), d);
  const derbyOf = (h, a) => DERBY.get([h, a].sort().join("|")) || null;
  const DERBY_LIFT = 0.4;   // rating for the underdog per point of heat
  const DERBY_CROWD = 0.08; // extra ticket demand per point of heat

  // Every derby a club plays: [{ name, opp, heat }].
  function derbiesOf(id) {
    const out = [];
    for (const d of DERBY.values()) if (d.clubs.includes(id)) out.push({ name: d.name, opp: d.clubs[0] === id ? d.clubs[1] : d.clubs[0], heat: d.heat });
    return out.sort((x, y) => y.heat - x.heat);
  }

  // oh/oa may also carry `ment`: a mentality the side switched to at half-time.
  function pair(state, h, a, oh = {}, oa = {}) {
    let luH = Tactics.lineup(state, h, a), luA = Tactics.lineup(state, a, h);
    if (oh.ment) luH = { ...luH, ment: oh.ment };
    if (oa.ment) luA = { ...luA, ment: oa.ment };
    const sh = strength(state, h, { ...oh, lineup: luH }), sa = strength(state, a, { ...oa, lineup: luA });
    const mu = Tactics.matchup(luH, luA);
    if (oh.tactics !== false && oa.tactics !== false) {
      sh.att += mu.edge / 2; sh.def += mu.edge / 2;
      sa.att -= mu.edge / 2; sa.def -= mu.edge / 2;
    }
    const derby = derbyOf(h, a);
    if (derby) {
      const lift = DERBY_LIFT * derby.heat, under = sh.att + sh.def < sa.att + sa.def ? sh : sa;
      under.att += lift; under.def += lift;
    }
    return [sh, sa, { luH, luA, mu, derby }];
  }

  // Play one match. Afterwards: fatigue and familiarity, and the boards react.
  // opts: { neutral, rotH, rotA, kind: "league" | "cup" | "euro" | "playoff", midweek }
  function playGame(state, h, a, opts = {}) {
    if (h === state.myTeam || a === state.myTeam) return playMyGame(state, h, a, opts);
    const [sh, sa, info] = pair(state, h, a, { rotate: !!opts.rotH }, { rotate: !!opts.rotA });
    const m = Engine.playMatch(sh, sa, !!opts.neutral, cardRates(state, h, a, sh, sa, info, opts));
    const res = m.hg > m.ag ? "W" : m.hg < m.ag ? "L" : "D";
    const flip = { W: "L", L: "W", D: "D" };
    Tactics.afterGame(state, h, info.luH, { midweek: opts.midweek, rotated: opts.rotH }, res);
    Tactics.afterGame(state, a, info.luA, { midweek: opts.midweek, rotated: opts.rotA }, flip[res]);
    Managers.afterGame(state, h, a, m.hg, m.ag, Engine.outcomeProbs(m.xg0), opts.kind || "league", info.derby ? 1 + 0.25 * info.derby.heat : 1);
    applyCards(state, h, a, m.cards, opts.kind || "league");
    return m;
  }

  // ---- Cards and suspensions -----------------------------------------------------
  // Expected bookings for each side: the country's rate, more for the away side,
  // the underdog, a deep block or a high press, and in derbies; the referee
  // (`ref`) is strict or lenient on the day. Straight reds follow the same factors.
  function cardRates(state, h, a, sh, sa, info, opts = {}, ref = Engine.rand(0.75, 1.25)) {
    // 0.96: the factors below average out a little above 1.
    const base = (0.96 * (opts.kind === "euro" ? EURO_CARDS : CARDS_PER_MATCH[state.teams[h].country] || DEFAULT_CARDS)) / 2;
    const ment = { att: 0.94, bal: 1, def: 1.12 }, press = { high: 1.15, med: 1, low: 0.92 };
    const heat = info.derby ? 1 + 0.15 * info.derby.heat : 1;
    const side = (own, opp, lu, venue) => base * venue * ref * heat * (ment[lu.ment] || 1) * (press[lu.press] || 1)
      * Math.exp(0.018 * ((opp.att + opp.def) - (own.att + own.def)) / 2);
    const y = [side(sh, sa, info.luH, opts.neutral ? 1 : 0.93), side(sa, sh, info.luA, opts.neutral ? 1 : 1.07)];
    return { y, r: y.map((v) => (STRAIGHT_RED * v) / base), ref, ment: [info.luH.ment, info.luA.ment] };
  }

  // After a match: the season's fair-play tally (league games), and for clubs
  // in your division suspensions: a straight red is a three-match ban, a second
  // booking one match, and now and then a booking is a player's fifth (one match).
  // Bans are served match by match in any competition.
  function applyCards(state, h, a, c, kind) {
    if (!c) return;
    [h, a].forEach((id, i) => {
      if (kind === "league" && state.disc) {
        const d = (state.disc[id] = state.disc[id] || [0, 0]);
        d[0] += c.y[i]; d[1] += c.r[i];
      }
      const ts = state.teamState && state.teamState[id];
      if (!ts) return;
      ts.bans = (ts.bans || []).filter((b) => --b.left > 0);
      const add = [];
      for (let k = 0; k < c.straight[i]; k++) add.push({ amt: 1, left: 3, why: "red" });
      for (let k = 0; k < c.second[i]; k++) add.push({ amt: 0.8, left: 1, why: "second" });
      for (let k = c.y[i] - c.second[i]; k > 0; k--) if (Math.random() < ACCUMULATION) add.push({ amt: 0.6, left: 1, why: "fifth" });
      ts.bans.push(...add);
      if (id !== state.myTeam || !add.length || !state.news) return;
      const text = add.map((b) => (b.why === "red" ? "a straight red card means a three-match ban"
        : b.why === "second" ? "a sending-off for a second booking means a one-match ban" : "a fifth booking of the season means a one-match ban")).join("; ");
      state.news.unshift({ md: state.results ? state.results.length : 0, label: "🟥", type: "bad",
        text: `Suspension: ${text}. The squad is weaker (−${add.reduce((t, b) => t + b.amt, 0).toFixed(1)} rating) until it's served.` });
    });
  }

  // ---- Your matches, as they happen ------------------------------------------------
  // Your matches are played as a live match (`state.live`) that stops at
  // half-time and whenever someone is sent off (unless you sim straight
  // through). At each stop you can change your formation, mentality and
  // pressing; the other manager reacts to the score and to the numbers.
  // Expected goals are split 45/55 between the halves and spread evenly over
  // each half, so with no changes (and no red cards) the odds are exactly
  // those of a whole match.

  const HALF = Engine.HALF_SHARE;
  // The report of the match being played, so extra time and penalties can be added to it.
  let openReport = null;

  const otherSide = (state, live) => (live.h === state.myTeam ? live.a : live.h);

  // Strengths for the next stretch: your set-up as it stands, theirs with any change they've made.
  function livePair(state, live) {
    const r = live.react;
    return pair(state, live.h, live.a,
      { rotate: !!live.rot[live.h], ment: r && r.id === live.h ? r.ment : undefined },
      { rotate: !!live.rot[live.a], ment: r && r.id === live.a ? r.ment : undefined });
  }

  function startLive(state, f, rot) {
    const [sh, sa, info] = pair(state, f.h, f.a, { rotate: !!rot[f.h] }, { rotate: !!rot[f.a] });
    return {
      h: f.h, a: f.a, kind: f.kind || "league", neutral: !!f.neutral, rot, ref: Engine.rand(0.75, 1.25),
      pre: Engine.outcomeProbs(Engine.expectedGoals(sh, sa, !!f.neutral)), lu0: { h: info.luH, a: info.luA },
      derby: info.derby ? info.derby.name : null,
      min: 0, hg: 0, ag: 0, ht: null, events: [], yc: [0, 0], down: [0, 0],
      xgAcc: [0, 0], possAcc: 0, react: null, pause: null,
    };
  }

  // Share of the ball for the home side (%), from strengths, mentalities and numbers.
  function possession(sh, sa, luH, luA, down = [0, 0]) {
    const tilt = { att: 3, bal: 0, def: -5 };
    const v = 50 + ((sh.att + sh.def) - (sa.att + sa.def)) * 0.35 + (tilt[luH.ment] || 0) - (tilt[luA.ment] || 0)
      + 8 * (down[1] - down[0]) + Engine.rand(-3, 3);
    return clamp(v, 25, 75);
  }

  // Play from the current minute to `until` (45 or 90) with the set-ups as
  // they stand; with `stop`, stop at the first sending-off.
  function playStretch(state, live, until, stop) {
    const [sh, sa, info] = livePair(state, live);
    const full = Engine.expectedGoals(sh, sa, live.neutral);
    const share = (live.min < 45 ? HALF : 1 - HALF) * (until - live.min) / 45;
    const rates = cardRates(state, live.h, live.a, sh, sa, info, { kind: live.kind, neutral: live.neutral }, live.ref);
    const me = state.myTeam;
    const from = live.min;
    // The other manager reacts to a red on their own; so does your side when
    // you sim straight through (your assistant makes the call).
    const auto = [live.h !== me || !stop, live.a !== me || !stop];
    const ment = [info.luH.ment, info.luA.ment];
    [0, 1].forEach((j) => {
      if (!auto[j] || (j === 0 ? live.h : live.a) !== me) return;
      const short = j === 0 ? live.down[0] - live.down[1] : live.down[1] - live.down[0];
      const r = Engine.redReaction(short, j === 0 ? live.hg - live.ag : live.ag - live.hg);
      if (r) ment[j] = r;
    });
    const p = Engine.playPeriod({ home: full.home * share, away: full.away * share }, from, until, {
      rates, yc: live.yc, down: live.down, ment, auto, score: [live.hg, live.ag], stopAtRed: stop,
    });
    const to = p.stopped || until;
    live.events.push(...p.events);
    live.hg += p.hg; live.ag += p.ag;
    live.xgAcc[0] += p.xgEff.home; live.xgAcc[1] += p.xgEff.away;
    live.possAcc += possession(sh, sa, info.luH, info.luA, live.down) * (to - from);
    live.min = to;
    // The other manager changed approach at a sending-off.
    const opp = otherSide(state, live), oi = live.h === opp ? 0 : 1;
    const before = oi === 0 ? info.luH.ment : info.luA.ment;
    if (p.ment[oi] !== before) live.react = { id: opp, from: live.react ? live.react.from : before, ment: p.ment[oi], why: "red" };
    live.info = info;
    return p.stopped;
  }

  // The other manager at half-time: chase the game when behind, protect a
  // lead, sit deep when down to ten, push on with an extra man.
  function halfTimeReaction(state, live) {
    const opp = otherSide(state, live), oi = live.h === opp ? 0 : 1;
    const m = Managers.of(state, opp);
    const lu = Tactics.lineup(state, opp, oi === 0 ? live.a : live.h);
    const cur = live.react ? live.react.ment : lu.ment;
    const diff = oi === 0 ? live.hg - live.ag : live.ag - live.hg, flex = m ? m.flex : 0.3;
    const short = oi === 0 ? live.down[0] - live.down[1] : live.down[1] - live.down[0];
    let ment = cur;
    const r = Engine.redReaction(short, diff);
    if (r) ment = r;
    else if (diff <= -2 || (diff === -1 && flex >= 0.25)) ment = "att";
    else if (diff >= 2 || (diff === 1 && flex >= 0.45)) ment = "def";
    if (ment !== lu.ment) live.react = { id: opp, from: lu.ment, ment, why: r ? "red" : "ht" };
    else live.react = null;
  }

  // Stats so far: xG actually created, shots, possession and cards.
  function liveStats(live) {
    const poss = live.min ? Math.round(live.possAcc / live.min) : 50;
    const st = Engine.matchStats({ home: live.xgAcc[0], away: live.xgAcc[1] }, live.hg, live.ag, poss);
    const c = Engine.cardCount(live.events);
    st.yellow = c.y; st.red = c.r;
    return st;
  }

  // Play on until the next stop (half-time or a red card, if `stop`) or full
  // time. Sets live.pause, or leaves live.min at 90 when the match is over.
  function runLive(state, live, stop) {
    const was = live.pause;
    live.pause = null;
    if (live.min < 45 && playStretch(state, live, 45, stop)) { live.pause = { kind: "red", min: live.min }; live.stats = liveStats(live); return; }
    if (!live.ht) {
      live.ht = [live.hg, live.ag];
      halfTimeReaction(state, live);
      // (No second stop if the red card came on the stroke of half-time.)
      if (stop && !(was && was.min === 45)) { live.pause = { kind: "ht", min: 45 }; live.stats = liveStats(live); return; }
    }
    while (live.min < 90) {
      if (playStretch(state, live, 90, stop) && live.min < 90) { live.pause = { kind: "red", min: live.min }; live.stats = liveStats(live); return; }
    }
  }

  // Kick off your next match: play until half-time or the first red card.
  function kickOff(state) {
    if (state.live) return state.live;
    if (pendingDecision(state)) return null;
    const f = nextMyEvent(state);
    if (!f) return null;
    commitSpending(state);
    const me = state.myTeam;
    // Cup ties: the other side's team selection is made now.
    const rot = {};
    if (f.kind === "cup") for (const id of [f.h, f.a]) rot[id] = id === me ? !!state.rotate : Math.random() < rotationChance(state, id, f.cup, f.round);
    state.live = startLive(state, f, rot);
    runLive(state, state.live, true);
    return state.live;
  }

  // Play on from a stop to the next one. Returns true if it stopped again,
  // false if the match reached full time (the round is then played with advance).
  function resumeLive(state) {
    const live = state.live;
    if (!live || !live.pause) return false;
    runLive(state, live, true);
    return !!live.pause;
  }

  // At a stop: your chances from here (W/D/L over 90 minutes, from your side),
  // and for the deciding match of a knockout tie, the chance of going through.
  function liveOdds(state) {
    const live = state.live;
    if (!live) return null;
    const [sh, sa, info] = livePair(state, live);
    const full = Engine.expectedGoals(sh, sa, live.neutral);
    const left = live.min < 45 ? HALF * (45 - live.min) / 45 + (1 - HALF) : (1 - HALF) * (90 - live.min) / 45;
    const [mh, ma] = Engine.tenMen(live.down, [info.luH.ment, info.luA.ment]);
    const dist = Engine.goalDiffDist({ home: full.home * left * mh, away: full.away * left * ma });
    const sign = live.h === state.myTeam ? 1 : -1;
    const lead = sign * (live.hg - live.ag);
    let win = 0, draw = 0, loss = 0;
    for (const [d, p] of Object.entries(dist)) {
      const v = lead + sign * +d;
      if (v > 0) win += p; else if (v < 0) loss += p; else draw += p;
    }
    const tot = win + draw + loss || 1;
    win /= tot; draw /= tot; loss /= tot;
    const mine = live.h === state.myTeam ? 0 : 1;
    const out = { win, draw, loss, info, numbers: { mine: [mh, ma][mine], theirs: [mh, ma][1 - mine], short: (live.down[mine] - live.down[1 - mine]) } };
    const f = nextMyEvent(state);
    if (f && f.kind !== "league" && !f.legOne && !(f.kind === "playoff" && f.round === 0) && !(f.kind === "euro" && !f.firstLeg && !f.final && f.name.startsWith("League phase"))) {
      const prior = f.firstLeg ? myLead(state, f.firstLeg) : 0;
      let through = 0;
      for (const [d, p] of Object.entries(dist)) {
        const v = prior + lead + sign * +d;
        through += v > 0 ? p : v === 0 ? p / 2 : 0;
      }
      out.through = through;
    }
    return out;
  }

  function playMyGame(state, h, a, opts) {
    const me = state.myTeam;
    let live = state.live && state.live.h === h && state.live.a === a ? state.live : null;
    if (!live) live = startLive(state, { h, a, neutral: opts.neutral, kind: opts.kind }, { [h]: !!opts.rotH, [a]: !!opts.rotA });
    state.live = null;
    runLive(state, live, false);
    const [sh, sa, info] = livePair(state, live);
    const full = Engine.expectedGoals(sh, sa, live.neutral);
    const [mh, ma] = Engine.tenMen(live.down, [info.luH.ment, info.luA.ment]);
    const m = { hg: live.hg, ag: live.ag, xg: { home: full.home * mh, away: full.away * ma } };
    const res = m.hg > m.ag ? "W" : m.hg < m.ag ? "L" : "D";
    const flip = { W: "L", L: "W", D: "D" };
    const changed = (lu1, lu2) => lu1.form !== lu2.form || lu1.ment !== lu2.ment || lu1.press !== lu2.press;
    const mineHome = h === me;
    const stats = liveStats(live);
    const cards = Engine.cardCount(live.events);
    m.cards = cards;
    live.events.sort((x, y) => x.min - y.min || x.plus - y.plus);
    state.lastMatch = openReport = {
      h, a, kind: live.kind, season: state.season, hg: m.hg, ag: m.ag, ht: live.ht || [live.hg, live.ag],
      events: live.events, stats, react: live.react,
      changed: changed(mineHome ? live.lu0.h : live.lu0.a, mineHome ? info.luH : info.luA),
      derby: info.derby ? info.derby.name : null,
    };
    Tactics.afterGame(state, h, info.luH, { midweek: opts.midweek, rotated: !!live.rot[h] }, res);
    Tactics.afterGame(state, a, info.luA, { midweek: opts.midweek, rotated: !!live.rot[a] }, flip[res]);
    Managers.afterGame(state, h, a, m.hg, m.ag, live.pre, opts.kind || "league", info.derby ? 1 + 0.25 * info.derby.heat : 1);
    applyCards(state, h, a, cards, opts.kind || "league");
    if (info.derby) {
      // Your record in each derby, across every club you've managed.
      const myRes = mineHome ? res : flip[res];
      const log = (state.job.derbies = state.job.derbies || {});
      const k = `${info.derby.name}|${me}|${mineHome ? a : h}`;
      const rec = (log[k] = log[k] || { w: 0, d: 0, l: 0 });
      rec[myRes.toLowerCase()]++;
    }
    const ht = live.ht || [0, 0];
    const htLead = mineHome ? ht[0] - ht[1] : ht[1] - ht[0];
    if (htLead <= -2 && (mineHome ? res : flip[res]) === "W") unlock(state, "comeback");
    else unlock(state);
    return m;
  }

  // Extra time and penalties in your match go into its report.
  function reportExtra(m, before) {
    const r = openReport;
    if (!r || r.h !== m.h || r.a !== m.a) return;
    const add = (side, n) => { for (let i = 0; i < n; i++) r.events.push({ min: Engine.randInt(91, 120), plus: 0, side, how: "" }); };
    add("h", m.hg - before[0]);
    add("a", m.ag - before[1]);
    r.events.sort((x, y) => x.min - y.min || x.plus - y.plus);
    r.hg = m.hg; r.ag = m.ag;
    if (m.aet) r.aet = true;
    if (m.pens) { r.pens = m.pens; r.shootout = Engine.shootout(m.pens); }
  }

  // New injury crises for clubs in your division (after a match at full strength).
  function rollInjury(state, id, label) {
    const ts = state.teamState[id];
    if (!ts || ts.injury) return;
    const fx = clubFx(state, id);
    const medical = fx ? fx.medical : 0;
    // Tired players break down more often.
    const tired = 1 + Tactics.fatigue(state, id) / 6;
    if (Math.random() >= INJURY_CHANCE * (1 - 0.7 * medical) * tired) return;
    const matches = Math.max(1, Math.round(Engine.randInt(2, 6) * (1 - 0.5 * medical)));
    ts.injury = { amount: Engine.randInt(2, 5), matches };
    if (id === state.myTeam) {
      state.news.unshift({
        md: state.results.length, label, type: "bad",
        text: `Injury crisis! Key players out for ${matches} matchday${matches > 1 ? "s" : ""} (−${ts.injury.amount} rating).`,
      });
    }
  }

  // ---- Calendar -----------------------------------------------------------

  // Your next match: league, cup or play-off, with what the preview needs.
  function nextMyEvent(state) {
    const me = state.myTeam;
    if (state.phase === "playoffs") return nextPlayoffFixture(state);
    if (state.phase === "postseason") return nextPostFixture(state);
    if (state.phase !== "season") return null;
    for (let i = state.calIdx; i < state.cal.length; i++) {
      const ev = state.cal[i];
      if (ev.type === "league") {
        const f = state.fixtures[ev.md].find((x) => x.h === me || x.a === me);
        if (!f) continue; // a bye, or split-phase fixtures not drawn yet
        return { ...f, kind: "league", md: ev.md, neutral: false, home: f.h === me, opp: f.h === me ? f.a : f.h };
      }
      if (ev.type === "euro") {
        const f = Europe.myFixture(state, ev);
        if (f) return f;
        continue;
      }
      const cup = state.cups[ev.cup];
      if (ev.round !== cup.round) continue;
      const t = cup.ties.find((x) => x.h === me || x.a === me);
      if (!t) continue;
      const r = cupDef(ev.cup).rounds[ev.round];
      return {
        h: t.h, a: t.a, kind: "cup", cup: ev.cup, round: ev.round, name: r.name, neutral: !!r.neutral,
        home: t.h === me, opp: t.h === me ? t.a : t.h, firstLeg: r.secondLeg ? t.first : null,
        twoLegs: !!(r.firstLeg || r.secondLeg), legOne: !!r.firstLeg, extraTime: !!r.extraTime,
        final: ev.round === cupDef(ev.cup).rounds.length - 1, super: !!cupDef(ev.cup).super, country: cupDef(ev.cup).country,
      };
    }
    return null;
  }

  function eventInvolvesMe(state, ev) {
    if (ev.type === "league") {
      const md = state.fixtures[ev.md];
      return !md.length || md.some((x) => x.h === state.myTeam || x.a === state.myTeam);
    }
    if (ev.type === "euro") return Europe.involves(state, ev);
    const cup = state.cups[ev.cup];
    return cup.ties.some((t) => t.h === state.myTeam || t.a === state.myTeam);
  }

  // Play calendar events up to and including your next match. Stops early if
  // there's a job decision to make (you've been sacked, or a club wants you).
  function advance(state) {
    if (pendingDecision(state)) return null;
    openReport = null;
    if (state.phase === "playoffs") return playPlayoffMatch(state);
    if (state.phase === "postseason") return playPostseason(state);
    while (state.phase === "season" && state.calIdx < state.cal.length) {
      const ev = state.cal[state.calIdx];
      const mine = eventInvolvesMe(state, ev);
      let r;
      if (ev.type === "league") r = playLeagueMatchday(state);
      else if (ev.type === "euro") { commitSpending(state); r = Europe.playEvent(state, ev); state.calIdx++; }
      else r = playCupRound(state, ev);
      if (mine || pendingDecision(state)) return r;
    }
    return null;
  }

  // A job decision that blocks play: sacked mid-season, or an approach.
  const pendingDecision = (state) => !!(state.job && state.job.prompt && state.phase === "season");

  // ---- League matchdays ---------------------------------------------------

  // Plays one matchday in a division. Returns the matches and what you earned.
  function playMatchdayFor(state, lid, fixtures, results) {
    const md = results.length;
    const form = formFactors(state, lid, results);
    const played = fixtures[md].map((f) => {
      const r = playGame(state, f.h, f.a, { kind: "league" });
      const g = { h: f.h, a: f.a, hg: r.hg, ag: r.ag };
      if (r.cards && (r.cards.r[0] || r.cards.r[1])) g.rc = r.cards.r;
      return g;
    });
    results.push(played);
    Leagues.afterMatchday(state, lid, fixtures, results);
    let mine = null;
    for (const m of played) {
      const hRes = m.hg > m.ag ? "W" : m.hg < m.ag ? "L" : "D";
      const aRes = hRes === "W" ? "L" : hRes === "L" ? "W" : "D";
      const derby = derbyOf(m.h, m.a);
      const f = (form[m.h] || 1) * (derby ? 1 + DERBY_CROWD * derby.heat : 1);
      const demand = ticketDemand(state, m.h, f);
      m.crowd = crowdFor(state, m.h, f);
      const gate = (m.crowd * matchdayYield(state, m.h)) / 1e6;
      credit(state, m.h, gate, "matchday");
      if (m.h === state.myTeam) {
        const g = state.stadium.gate;
        g.games++; g.crowd += m.crowd; g.demand += demand; g.revenue += gate;
        if (m.crowd >= state.teams[m.h].capacity) g.soldOut++;
        mine = { earned: gate, crowd: m.crowd, gate, soldOut: m.crowd >= state.teams[m.h].capacity };
      } else if (m.a === state.myTeam) {
        mine = { earned: 0 };
      }
    }
    // Wages, TV money, commercial income and owner funding flow every matchday.
    for (const id of state.leagues[lid]) {
      payInstallment(state, id);
      const fin = state.fin[id];
      fin.bankHist.push(Math.round(fin.bank * 100) / 100);
      // Lenders cover a dip that money still due (merit, gates) will repay;
      // administration comes when the club is past its limit and can't recover.
      if (fin.bank < -fin.credit && projectedBank(state, id) < -fin.credit * 0.25) enterAdministration(state, id);
    }
    const half = Math.floor(fixtures.length / 2);
    if (results.length === half) aiJanuary(state, lid, table(state, lid));
    else if (results.length % TOPUP_EVERY === 0) aiTopUp(state, lid);
    Managers.afterMatchday(state, lid);
    return { played, mine };
  }

  // Keep the other divisions in step with yours.
  function syncOtherLeagues(state) {
    const progress = state.results.length / state.fixtures.length;
    for (const [lid, o] of Object.entries(state.others)) {
      const target = Math.round(progress * o.fixtures.length);
      while (o.results.length < target) playMatchdayFor(state, lid, o.fixtures, o.results);
    }
  }

  function playLeagueMatchday(state) {
    if (state.phase !== "season") return null;
    const md = state.results.length;
    commitSpending(state);
    const { played: results, mine } = playMatchdayFor(state, state.league, state.fixtures, state.results);
    state.calIdx++;
    state.lastPlayed = { type: "league", md };

    let myResult = null;
    for (const m of results) {
      const hRes = m.hg > m.ag ? "W" : m.hg < m.ag ? "L" : "D";
      const aRes = hRes === "W" ? "L" : hRes === "L" ? "W" : "D";
      state.teamState[m.h].form.push(hRes);
      state.teamState[m.a].form.push(aRes);
      if (m.h === state.myTeam || m.a === state.myTeam) {
        const home = m.h === state.myTeam;
        myResult = { ...m, kind: "league", home, res: home ? hRes : aRes };
      }
    }

    if (myResult) {
      const earned = mine.earned;
      const opp = state.teams[myResult.home ? myResult.a : myResult.h].name;
      const score = myResult.home ? `${myResult.hg}–${myResult.ag}` : `${myResult.ag}–${myResult.hg}`;
      const verb = { W: "Victory", D: "Draw", L: "Defeat" }[myResult.res];
      const crowd = myResult.home ? ` Crowd ${mine.crowd.toLocaleString("en-GB")}${mine.soldOut ? " (sell-out)" : ""}.` : "";
      const derby = derbyOf(myResult.h, myResult.a);
      const rc = myResult.rc || [0, 0], myRed = rc[myResult.home ? 0 : 1], theirRed = rc[myResult.home ? 1 : 0];
      const reds = (myRed ? ` 🟥 ${myRed > 1 ? `${myRed} of your players were` : "One of your players was"} sent off.` : "") + (theirRed ? ` 🟥 ${opp} had ${theirRed > 1 ? `${theirRed} players` : "a player"} sent off.` : "");
      state.news.unshift({
        md: md + 1, type: myResult.res,
        text: `${derby ? `${derby.name}: ` : ""}${verb} ${score} ${myResult.home ? "vs" : "at"} ${opp}.${reds}${crowd}` + (earned > 0 ? ` Gate receipts ${fmtMoney(earned)}.` : ""),
      });
    }
    checkStadiumProject(state);

    // Injuries: tick down existing ones, then roll for new crises.
    for (const id of Object.keys(state.teamState)) {
      const ts = state.teamState[id];
      if (ts.injury) {
        ts.injury.matches--;
        if (ts.injury.matches <= 0) {
          ts.injury = null;
          if (id === state.myTeam) state.news.unshift({ md: md + 1, type: "good", text: "Injured players are back in training." });
        }
      }
      rollInjury(state, id);
    }

    const tw = transferWindow(state);
    if (tw.open && md + 1 === Math.floor(state.fixtures.length / 2)) {
      state.news.unshift({ md: md + 1, type: "info", text: "The January transfer window is open for 3 matchdays." });
    }
    syncOtherLeagues(state);
    // Halfway: investors take notice of a club at the top of a lower division.
    if (state.results.length === Math.floor(state.fixtures.length / 2) && !state.offer && table(state).findIndex((r) => r.id === state.myTeam) < 2) {
      state.offer = investorOffer(state, "midseason");
      if (state.offer) state.news.unshift({ md: md + 1, label: "Owners", type: "good", text: `${state.offer.name} want to invest in the club. See the Board panel.` });
    }
    state.news = state.news.slice(0, 50);

    if (state.results.length >= state.fixtures.length) {
      if (state.country === "ENG" && inPlayoffZone(state)) startPlayoffs(state);
      else if (!startPostseason(state)) endSeason(state);
    }
    return myResult;
  }

  function table(state, lid = state.league) {
    return Leagues.table(state, lid);
  }

  // ---- Season outlook (Monte Carlo) --------------------------------------

  function project(state, sims = 300) {
    const ids = state.leagues[state.league];
    const remaining = state.fixtures.slice(state.results.length);
    const groups = Leagues.splitGroups(state, state.league);
    const opts = groups ? { baseRows: table(state), groups } : {};
    const run = (invest) => Engine.projectSeason(ids, state.results, remaining,
      (id) => strength(state, id, { invest, form: false, injury: false }), state.myTeam, sims, state.deduct || {}, opts);
    return { withInv: run(true), base: run(false) };
  }

  // ---- Cups ---------------------------------------------------------------

  // Super cup line-ups from last season. In the first season only England's and
  // UEFA's are known (Liverpool v Crystal Palace; PSG v Tottenham).
  function superCupEntrants(state, def) {
    const exists = (id) => id && state.teams[id];
    if (def.country === "EUR") {
      const h = state.euro && state.euro.holders;
      return h && exists(h.UCL) && exists(h.UEL) && h.UCL !== h.UEL ? [h.UCL, h.UEL] : [];
    }
    const arch = state.archive || [];
    const a = arch[arch.length - 1];
    if (!a) return def.country === "ENG" && exists("LIV") && exists("CRY") ? ["LIV", "CRY"] : [];
    const table = a.tables[Leagues.COUNTRY[def.country].divisions[0]];
    const cup = a.cups[def.country === "ENG" ? "FA" : `${def.country}_CUP`];
    if (!table || table.length < 4) return [];
    const out = [];
    const add = (id) => { if (exists(id) && !out.includes(id)) out.push(id); };
    if (def.format === "four") {
      [table[0].id, table[1].id, cup && cup.winner, cup && cup.runnerUp].forEach(add);
      for (let i = 2; out.length < 4 && i < table.length; i++) add(table[i].id);
    } else {
      add(table[0].id);
      add(cup && cup.winner);
      if (out.length < 2) add(table[1].id);
    }
    return out;
  }

  function cupEntrants(state, cupId, round) {
    const L = state.leagues;
    const def = cupDef(cupId);
    if (def.super) return round === 0 ? superCupEntrants(state, def) : [];
    if (def.country !== "ENG") {
      if (round !== 0) return [];
      return state.outside[def.country] || def.divisions.flatMap((lid) => L[lid]);
    }
    if (cupId === "EFL") {
      const topPL = L.PL.slice().sort((a, b) => state.teams[b].rating - state.teams[a].rating).slice(0, 8);
      if (round === 0) return [...L.CH, ...L.L1, ...L.L2];
      if (round === 1) return L.PL.filter((id) => !topPL.includes(id));
      if (round === 2) return topPL;
    } else {
      if (round === 0) return [...L.L1, ...L.L2, ...state.pool, ...state.nonLeague];
      if (round === 2) return [...L.PL, ...L.CH];
    }
    return [];
  }

  function createCup(state, cupId) {
    const cup = { id: cupId, round: 0, alive: [], ties: [], history: [], winner: null, runnerUp: null, out: {} };
    drawCupRound(state, cup);
    return cup;
  }

  function drawCupRound(state, cup) {
    const r = cupDef(cup.id).rounds[cup.round];
    if (r.secondLeg) {
      cup.ties = cup.history[cup.history.length - 1].ties.map((t) => ({ h: t.a, a: t.h, top: t.top, first: { h: t.h, a: t.a, hg: t.hg, ag: t.ag } }));
      return;
    }
    cup.alive = cup.alive.concat(cupEntrants(state, cup.id, cup.round));
    cup.byes = [];
    const def = cupDef(cup.id);
    // From the last 16 (once every club has entered) the rest of the draw is
    // made in one go as a bracket: winners of neighbouring ties meet next.
    if (!cup.bracket && bracketReady(state, cup)) {
      cup.bracket = { start: cup.round };
      cup.alive = Engine.shuffle(cup.alive);
    }
    let pot;
    if (cup.bracket) pot = cup.alive.slice();
    else {
      pot = Engine.shuffle(cup.alive);
      if (def.byes && cup.round === 0) {
        // Strongest clubs skip the first round so the next one is a power of two.
        const size = 2 ** (def.rounds.length - 1);
        const ties = cup.alive.length - size;
        const byRating = cup.alive.slice().sort((a, b) => state.teams[b].rating - state.teams[a].rating);
        cup.byes = byRating.slice(0, cup.alive.length - 2 * ties);
        pot = Engine.shuffle(byRating.slice(cup.alive.length - 2 * ties));
      }
    }
    cup.ties = [];
    for (let i = 0; i + 1 < pot.length; i += 2) {
      // In the bracket `top` is the club from the upper half; home is a coin toss.
      const swap = cup.bracket && Math.random() < 0.5;
      cup.ties.push({ h: swap ? pot[i + 1] : pot[i], a: swap ? pot[i] : pot[i + 1], top: cup.bracket ? pot[i] : undefined });
    }
  }

  // The bracket can be drawn once 16 or fewer clubs (a power of two) are left,
  // nobody else is due to enter, and no club needs a bye.
  function bracketReady(state, cup) {
    const def = cupDef(cup.id);
    const n = cup.alive.length;
    if (n < 2 || n > 16 || (n & (n - 1))) return false;
    if (def.byes && cup.round === 0 && n !== 2 ** def.rounds.length) return false;
    for (let r = cup.round + 1; r < def.rounds.length; r++) if (cupEntrants(state, cup.id, r).length) return false;
    return true;
  }

  // Goals a club scored in a cup tie (both legs of a two-legged tie).
  function tieGoals(t, id) {
    const leg = (m) => (m ? (m.h === id ? m.hg : m.a === id ? m.ag : 0) : 0);
    return leg(t) + leg(t.first);
  }

  // A domestic cup as a bracket: columns of matches from the last 16 (or the
  // round the bracket starts) to the final, each match fed by the two above
  // it in the previous column. Earlier rounds are returned as plain lists.
  //   { cols: [{ name, short, feed, matches: [{ a, b, ga, gb, winner, legs, note, played, neutral }] }], earlier: [{ name, ties }], fixed }
  function cupBracket(state, cupId) {
    const cup = state.cups[cupId], def = cupDef(cupId);
    const decisive = def.rounds.map((r, i) => ({ r, i })).filter((x) => !x.r.firstLeg);
    let from = decisive.length - Math.min(4, decisive.length);
    if (cup.bracket) from = decisive.findIndex((x) => x.i >= cup.bracket.start);
    const shown = decisive.slice(from);
    const roundName = (r) => r.name.replace(/, 2nd leg$/, "");
    const hist = (i) => cup.history.find((h) => h.round === i);
    // A tie as a bracket match: `a` is the club from the upper half. Goals are
    // totals over the legs played so far; `winner` is set once it's decided.
    const toMatch = (t) => {
      const top = t.top || t.h, bottom = top === t.h ? t.a : t.h;
      const legs = (t.first ? [t.first, t] : [t]).filter((m) => m.hg != null);
      const scored = legs.length > 0;
      return {
        a: top, b: bottom, ga: scored ? tieGoals(t, top) : null, gb: scored ? tieGoals(t, bottom) : null,
        winner: t.winner || null, note: t.pens ? "pens" : t.aet ? "aet" : "",
        legs: legs.map((m) => ({ h: m.h, a: m.a, hg: m.hg, ag: m.ag })),
      };
    };
    const cols = shown.map(({ r, i }, c) => {
      const size = 2 ** (shown.length - 1 - c);
      let ties = null;
      const h = hist(i);
      if (h) ties = h.ties.map(toMatch);
      // Drawn but not decided: this round (or, for two legs, its first leg) is next.
      else if ((cup.round === i || (r.secondLeg && cup.round === i - 1)) && cup.ties.length) ties = cup.ties.map(toMatch);
      return { name: roundName(r), short: r.short.replace(/2$/, ""), feed: c ? 2 : 0, neutral: !!r.neutral, ties, size };
    });
    // Order every drawn column so each match sits next to the ties that fed
    // it (already true once the bracket is fixed), then fill in the rest.
    for (let c = cols.length - 1; c > 0; c--) {
      const cur = cols[c].ties, prev = cols[c - 1].ties;
      if (!cur || !prev) continue;
      const order = [];
      for (const m of cur) {
        for (const id of [m.a, m.b]) {
          const k = prev.findIndex((x, xi) => !order.includes(xi) && x.winner === id);
          if (k >= 0) order.push(k);
        }
      }
      prev.forEach((_, xi) => { if (!order.includes(xi)) order.push(xi); });
      cols[c - 1].ties = order.map((k) => prev[k]);
    }
    cols.forEach((col, c) => {
      if (col.ties && col.ties.length === col.size) { col.matches = col.ties; return; }
      const prev = c ? cols[c - 1].matches : null;
      col.matches = Array.from({ length: col.size }, (_, j) => {
        const fa = prev && prev[2 * j], fb = prev && prev[2 * j + 1];
        // Only a fixed bracket knows who meets whom before the draw.
        const known = !!cup.bracket;
        return { a: known && fa ? fa.winner : null, b: known && fb ? fb.winner : null, ga: null, gb: null, winner: null, legs: [], note: "" };
      });
    });
    const earlier = decisive.slice(0, from).map(({ r, i }) => {
      const h = hist(i);
      if (h) return { name: roundName(r), ties: h.ties.map(toMatch) };
      if ((cup.round === i || (r.secondLeg && cup.round === i - 1)) && cup.ties.length) return { name: roundName(r), ties: cup.ties.map(toMatch), upcoming: true };
      return null;
    }).filter(Boolean);
    return {
      cols: cols.map(({ name, short, feed, matches, neutral }) => ({ name, short, feed, matches, neutral })),
      earlier, fixed: !!cup.bracket, winner: cup.winner,
    };
  }

  // When are you "in" a cup? Returns a short status for the UI.
  function cupStatus(state, cupId) {
    const cup = state.cups[cupId];
    const me = state.myTeam;
    if (cup.winner === me) return { state: "won" };
    if (cup.out[me] != null) return { state: "out", round: cup.out[me].round, by: cup.out[me].by };
    if (cup.alive.includes(me)) return { state: "in" };
    const def = cupDef(cupId);
    for (let r = cup.round; r < def.rounds.length; r++) {
      if (cupEntrants(state, cupId, r).includes(me)) return { state: "waiting", round: r };
    }
    return { state: "none" };
  }

  // How likely an AI club is to rest players: bigger clubs care less about
  // early rounds, the EFL Cup matters less than the FA Cup, styles differ.
  function rotationChance(state, id, cupId, round) {
    const def = cupDef(cupId);
    const r = def.rounds[round];
    if (def.super || r.neutral || r.firstLeg || r.secondLeg) return 0;
    const lid = leagueOf(state, id);
    if (!lid) return 0;
    const tier = leagueDef(lid).tier;
    const late = round >= def.rounds.length - 3;
    let p = cupId === "EFL" ? [0.7, 0.45, 0.3, 0.25][tier - 1] : [0.45, 0.35, 0.15, 0.1][tier - 1];
    if (def.country !== "ENG") p = tier === 1 ? 0.3 : 0.2;
    if (late) p *= 0.3;
    const style = state.ai[id] ? state.ai[id].style : "balanced";
    if (style === "prudent" || style === "youth") p += 0.1;
    if (style === "ambitious") p -= 0.15;
    if (style === "gambler") p = Math.random();
    return clamp(p, 0, 0.9);
  }

  // Extra time (a third of a match) then penalties, if `lead()` is still 0.
  function settle(m, lead, extraTime) {
    if (lead() !== 0) return;
    const before = [m.hg, m.ag];
    if (extraTime) {
      m.aet = true;
      m.hg += Engine.poisson(m.xg.home / 3);
      m.ag += Engine.poisson(m.xg.away / 3);
    }
    if (lead() === 0) m.pens = Math.random() < 0.5 ? "h" : "a";
    reportExtra(m, before);
  }

  const tierOf = (state, id) => {
    const lid = leagueOf(state, id);
    return lid ? leagueDef(lid).tier : 5;
  };

  function playCupRound(state, ev) {
    const cup = state.cups[ev.cup];
    const def = cupDef(ev.cup);
    const r = def.rounds[cup.round];
    const me = state.myTeam;
    const label = `${def.tag} ${r.short}`;
    const local = def.country === state.country;
    if (!cup.ties.length) { state.calIdx++; return null; }
    commitSpending(state);

    // Your tie, if you kicked off already: team selections were made then.
    const picked = (id) => (state.live && state.live.rot && id in state.live.rot ? state.live.rot[id] : null);
    for (const t of cup.ties) {
      t.rotH = picked(t.h) != null ? picked(t.h) : t.h === me ? state.rotate : Math.random() < rotationChance(state, t.h, ev.cup, cup.round);
      t.rotA = picked(t.a) != null ? picked(t.a) : t.a === me ? state.rotate : Math.random() < rotationChance(state, t.a, ev.cup, cup.round);
      const m = playGame(state, t.h, t.a, { neutral: !!r.neutral, rotH: t.rotH, rotA: t.rotA, kind: "cup", midweek: true });
      t.hg = m.hg; t.ag = m.ag; t.xg = m.xg;
      if (m.cards && (m.cards.r[0] || m.cards.r[1])) t.rc = m.cards.r;
      if (r.firstLeg) { delete t.xg; continue; }
      if (r.secondLeg) {
        const lead = () => (t.first.ag + t.hg) - (t.first.hg + t.ag);
        settle(t, lead, false);
        t.winner = lead() > 0 ? t.h : lead() < 0 ? t.a : t.pens === "h" ? t.h : t.a;
      } else {
        settle(t, () => t.hg - t.ag, !!r.extraTime);
        t.winner = t.hg > t.ag ? t.h : t.hg < t.ag ? t.a : t.pens === "h" ? t.h : t.a;
      }
      t.loser = t.winner === t.h ? t.a : t.h;
      delete t.xg;
    }

    // Money: gate receipts shared 45/45 by the clubs, prize money to the winner.
    // Super cups abroad draw a crowd about the size of the clubs' own grounds.
    const uefa = def.country === "EUR";
    for (const t of cup.ties) {
      const abroad = def.super && r.neutral && def.country !== "ENG";
      t.crowd = abroad ? Math.round(Math.min(MAX_CAPACITY, (state.teams[t.h].capacity + state.teams[t.a].capacity) / 2) * Engine.rand(0.6, 0.95))
        : r.neutral ? Engine.randInt(cup.round === def.rounds.length - 1 ? 85000 : 70000, 90000) : crowdFor(state, t.h, 1);
      const gate = (t.crowd * (abroad ? ticketYield(state, t.h) : r.neutral ? WEMBLEY_YIELD : ticketYield(state, t.h))) / 1e6;
      credit(state, t.h, gate * 0.45, uefa ? "europe" : "cups");
      credit(state, t.a, gate * 0.45, uefa ? "europe" : "cups");
      if (t.winner && r.prize) credit(state, t.winner, r.prize, uefa ? "europe" : "cups");
      if (uefa && t.loser) credit(state, t.loser, 3, "europe");
    }

    // Injury risk for clubs in your division who played at full strength.
    for (const t of cup.ties) {
      if (!t.rotH) rollInjury(state, t.h, label);
      if (!t.rotA) rollInjury(state, t.a, label);
    }

    cup.history.push({ round: cup.round, ties: cup.ties });
    if (!r.firstLeg) {
      cup.alive = cup.ties.map((t) => t.winner).concat(cup.byes || []);
      cup.byes = [];
      for (const t of cup.ties) {
        cup.out[t.loser] = { round: cup.round, by: t.winner };
        Managers.knockout(state, t.winner, t.loser);
        if (t.winner === me && state.teams[t.loser].rating - state.teams[me].rating >= 12) unlock(state, "giant-killer");
      }
    }

    // News: your tie, then the round's biggest upsets.
    let myResult = null;
    const mine = cup.ties.find((t) => t.h === me || t.a === me);
    if (mine) {
      const home = mine.h === me;
      const my = home ? mine.hg : mine.ag, their = home ? mine.ag : mine.hg;
      const res = my > their ? "W" : my < their ? "L" : "D";
      myResult = { ...mine, kind: "cup", cup: ev.cup, cupName: def.name, round: cup.round, roundName: r.name, home, res,
        neutral: !!r.neutral, through: r.firstLeg ? undefined : mine.winner === me, final: cup.round === def.rounds.length - 1 };
      const opp = state.teams[home ? mine.a : mine.h].name;
      let text = `${def.name} ${r.name.toLowerCase()}: ${{ W: "Won", D: "Drew", L: "Lost" }[res]} ${my}–${their} ${r.neutral ? "against" : home ? "vs" : "at"} ${opp}`;
      if (mine.aet && !mine.pens) text += " after extra time";
      if (mine.pens) text += myResult.through ? ", won on penalties" : ", lost on penalties";
      if (r.secondLeg) {
        const agg = home ? [mine.first.ag + mine.hg, mine.first.hg + mine.ag] : [mine.first.hg + mine.ag, mine.first.ag + mine.hg];
        text += ` (${agg[0]}–${agg[1]} on aggregate)`;
      }
      text += ".";
      if (myResult.through === true) text += myResult.final ? ` ${def.name.toUpperCase()} WINNERS!` : " Through to the next round.";
      if (myResult.through === false) text += myResult.final ? " Runners-up." : " Knocked out.";
      if (state.rotate) text += " (rotated squad)";
      state.news.unshift({ md: state.results.length, label, type: r.firstLeg ? res : myResult.through ? "W" : "L", text });
    }
    if (local && !r.firstLeg && !r.neutral) {
      const gap = (t) => tierOf(state, t.winner) - tierOf(state, t.loser);
      cup.ties
        .filter((t) => t.h !== me && t.a !== me && gap(t) >= 2)
        .sort((x, y) => gap(y) - gap(x))
        .slice(0, 2)
        .forEach((t) => {
          const score = t.winner === t.h ? `${t.hg}–${t.ag}` : `${t.ag}–${t.hg}`;
          state.news.unshift({ md: state.results.length, label, type: "info",
            text: `Giant-killing! ${state.teams[t.winner].name} knock ${state.teams[t.loser].name} out of the ${def.name} (${score}${t.pens ? ", pens" : ""}).` });
        });
    }

    state.lastPlayed = { type: "cup", cup: ev.cup, round: cup.round };
    state.rotate = false;
    state.calIdx++;
    cup.round++;
    if (cup.round < def.rounds.length) {
      drawCupRound(state, cup);
    } else {
      const f = cup.ties[0];
      cup.winner = f.winner;
      cup.runnerUp = f.loser;
      Managers.trophy(state, f.winner, def.country === "EUR" ? "USC" : def.super ? "SC" : "cup", def.name);
      if (f.winner !== me && (local || def.country === "EUR")) state.news.unshift({ md: state.results.length, label, type: "info", text: `${state.teams[f.winner].name} win the ${def.name}.` });
    }
    state.news = state.news.slice(0, 50);
    return myResult;
  }

  // ---- Knockout odds ------------------------------------------------------

  // Chance my team wins a tie from here. `legs` are fixtures still to play;
  // `prior` is my aggregate lead so far. Level after 90 minutes ≈ coin flip.
  function tieChance(state, legs, prior, invest, rotate = false) {
    const me = state.myTeam;
    let dist = { [prior]: 1 };
    legs.forEach((fx, i) => {
      const rot = (id) => id === me && rotate && i === 0;
      const [sh, sa] = pair(state, fx.h, fx.a, { invest, rotate: rot(fx.h) }, { invest, rotate: rot(fx.a) });
      const g = Engine.goalDiffDist(Engine.expectedGoals(sh, sa, fx.neutral));
      const sign = fx.h === me ? 1 : -1;
      const next = {};
      for (const [a, pa] of Object.entries(dist)) {
        for (const [b, pb] of Object.entries(g)) {
          const k = +a + sign * +b;
          next[k] = (next[k] || 0) + pa * pb;
        }
      }
      dist = next;
    });
    let p = 0;
    for (const [k, v] of Object.entries(dist)) p += +k > 0 ? v : +k === 0 ? v / 2 : 0;
    return p;
  }

  function myLead(state, leg) {
    return leg.h === state.myTeam ? leg.hg - leg.ag : leg.ag - leg.hg;
  }

  function fixtureChance(state, f, invest) {
    const rot = f.kind === "cup" && state.rotate;
    if (f.legOne || (f.kind === "playoff" && f.round === 0)) {
      return tieChance(state, [f, { h: f.a, a: f.h, neutral: false }], 0, invest, rot);
    }
    const prior = f.firstLeg ? myLead(state, f.firstLeg) : 0;
    return tieChance(state, [f], prior, invest, rot);
  }

  // Win/draw/loss from my perspective, with and without investments, plus the
  // chance of winning the tie for knockout matches.
  function preview(state) {
    const f = nextMyEvent(state);
    if (!f) return null;
    const rotate = f.kind === "cup" && state.rotate;
    // At half-time the other side's set-up is the one they'll use after the break.
    const r = state.live && state.live.react;
    const ment = (id) => (r && r.id === id ? r.ment : undefined);
    let info = null;
    const calc = (invest) => {
      const [sh, sa, i] = pair(state, f.h, f.a, { invest, rotate: rotate && f.h === state.myTeam, ment: ment(f.h) }, { invest, rotate: rotate && f.a === state.myTeam, ment: ment(f.a) });
      info = i;
      const p = Engine.outcomeProbs(Engine.expectedGoals(sh, sa, f.neutral));
      return f.home ? p : { win: p.loss, draw: p.draw, loss: p.win };
    };
    const out = { fixture: f, withInv: calc(true), base: calc(false) };
    if (f.kind !== "league") out.advance = { withInv: fixtureChance(state, f, true), base: fixtureChance(state, f, false) };
    // The tactical picture: both lineups and how the shapes match up (from your side).
    const mineHome = f.h === state.myTeam;
    out.tactics = {
      mine: mineHome ? info.luH : info.luA, theirs: mineHome ? info.luA : info.luH,
      matchup: Tactics.matchup(mineHome ? info.luH : info.luA, mineHome ? info.luA : info.luH),
    };
    return out;
  }

  // Your assistant's pick for the next match: the formation and mentality
  // (with your current pressing) that maximise expected points, or the chance
  // of winning a knockout tie. Familiarity counts, so new shapes rarely win.
  function suggestTactics(state) {
    const f = nextMyEvent(state);
    if (!f || !state.tactics) return null;
    const t = state.tactics, saved = { form: t.form, ment: t.ment };
    let best = null;
    for (const form of Tactics.FORMATIONS) {
      for (const ment of Tactics.MENTALITIES) {
        t.form = form.id; t.ment = ment.id;
        let v;
        if (state.live) {
          // At half-time: the best odds from the score as it stands.
          const o = liveOdds(state);
          v = o.through != null ? o.through : 3 * o.win + o.draw;
        } else if (f.kind === "league") {
          const [sh, sa] = pair(state, f.h, f.a);
          const p = Engine.outcomeProbs(Engine.expectedGoals(sh, sa, f.neutral));
          v = f.home ? 3 * p.win + p.draw : 3 * p.loss + p.draw;
        } else v = fixtureChance(state, f, true);
        if (!best || v > best.value + 1e-9) best = { form: form.id, ment: ment.id, value: v };
      }
    }
    t.form = saved.form; t.ment = saved.ment;
    best.metric = state.live ? (liveOdds(state).through != null ? "advance" : "points") : f.kind === "league" ? "points" : "advance";
    return best;
  }

  // Change your tactics: { form, ment, press }.
  function setTactics(state, changes) {
    if (!state.tactics) return;
    for (const k of ["form", "ment", "press"]) if (changes[k]) state.tactics[k] = changes[k];
  }

  // ---- Play-offs ----------------------------------------------------------
  // Seeds 1v4 and 2v3 (i.e. 3rd v 6th, 4th v 5th) over two legs, the higher
  // seed at home second; then a one-off final at Wembley. Level ties go to
  // extra time and then penalties.

  const PLAYOFF_ROUNDS = ["Semi-final, 1st leg", "Semi-final, 2nd leg", "Final at Wembley"];
  const PLAYOFF_SHORT = ["SF 1st", "SF 2nd", "Final"];

  function createPlayoff(seeds) {
    return {
      seeds,
      ties: [{ hi: seeds[0], lo: seeds[3], legs: [] }, { hi: seeds[1], lo: seeds[2], legs: [] }],
      final: null,
      round: 0, // 0 = SF 1st legs, 1 = SF 2nd legs, 2 = final, 3 = done
      winner: null,
    };
  }

  function playoffFixtures(po) {
    if (po.round === 0) return po.ties.map((t) => ({ h: t.lo, a: t.hi, neutral: false }));
    if (po.round === 1) return po.ties.map((t) => ({ h: t.hi, a: t.lo, neutral: false }));
    if (po.round === 2) return [{ h: po.final.a, a: po.final.b, neutral: true }];
    return [];
  }

  // Goals the tie's `hi` side leads by on aggregate.
  function tieLead(t) {
    const [l1, l2] = t.legs;
    return (l1.ag + (l2 ? l2.hg : 0)) - (l1.hg + (l2 ? l2.ag : 0));
  }

  function playPlayoffRound(state, po) {
    const matches = playoffFixtures(po).map((f) => {
      const r = playGame(state, f.h, f.a, { neutral: f.neutral, kind: "playoff" });
      return { h: f.h, a: f.a, hg: r.hg, ag: r.ag, xg: r.xg, neutral: f.neutral };
    });
    if (po.round < 2) {
      matches.forEach((m, i) => {
        const t = po.ties[i];
        t.legs.push(m);
        if (po.round === 1) {
          settle(m, () => tieLead(t), true);
          const lead = tieLead(t);
          t.winner = lead > 0 ? t.hi : lead < 0 ? t.lo : m.pens === "h" ? m.h : m.a;
        }
      });
      if (po.round === 1) po.final = { a: po.ties[0].winner, b: po.ties[1].winner };
    } else {
      const m = matches[0];
      settle(m, () => m.hg - m.ag, true);
      po.final.match = m;
      po.winner = m.hg > m.ag ? m.h : m.hg < m.ag ? m.a : m.pens === "h" ? m.h : m.a;
    }
    po.round++;
    return matches;
  }

  function playoffLog(state, po) {
    const sh = (id) => state.teams[id].short;
    const log = po.ties.map((t) => {
      const l2 = t.legs[1];
      const hiAgg = t.legs[0].ag + l2.hg, loAgg = t.legs[0].hg + l2.ag;
      const how = l2.pens ? `, ${sh(t.winner)} win on pens` : l2.aet ? " aet" : "";
      return `SF: ${sh(t.hi)} ${hiAgg}–${loAgg} ${sh(t.lo)} on agg${how}`;
    });
    const m = po.final.match;
    const how = m.pens ? `, ${sh(po.winner)} win on pens` : m.aet ? " aet" : "";
    log.push(`Final: ${sh(m.h)} ${m.hg}–${m.ag} ${sh(m.a)}${how}`);
    return log;
  }

  function simulatePlayoff(state, seeds) {
    const po = createPlayoff(seeds);
    while (po.round < 3) playPlayoffRound(state, po);
    return { winner: po.winner, finalists: [po.final.a, po.final.b], log: playoffLog(state, po) };
  }

  function inPlayoffZone(state) {
    const def = leagueDef(state.league);
    if (def.tier === 1) return false;
    const pos = table(state).findIndex((r) => r.id === state.myTeam) + 1;
    return pos >= def.zones.playoff[0] && pos <= def.zones.playoff[1];
  }

  function startPlayoffs(state) {
    const z = leagueDef(state.league).zones;
    const seeds = table(state).slice(z.playoff[0] - 1, z.playoff[1]).map((r) => r.id);
    state.playoff = createPlayoff(seeds);
    state.phase = "playoffs";
    const pos = seeds.indexOf(state.myTeam) + z.playoff[0];
    const opp = state.teams[seeds[3 - seeds.indexOf(state.myTeam)]].name;
    state.news.unshift({
      label: "PO", type: "info",
      text: `Into the play-offs! You finished ${ordinal(pos)} and face ${opp} in the semi-finals.`,
    });
  }

  function myTie(po, me) {
    return po.ties.find((t) => t.hi === me || t.lo === me);
  }

  function nextPlayoffFixture(state) {
    const po = state.playoff;
    if (!po || state.phase !== "playoffs") return null;
    const me = state.myTeam;
    const f = playoffFixtures(po).find((x) => x.h === me || x.a === me);
    if (!f) return null;
    const t = myTie(po, me);
    return {
      ...f, kind: "playoff", round: po.round, name: PLAYOFF_ROUNDS[po.round], home: f.h === me, opp: f.h === me ? f.a : f.h,
      firstLeg: po.round === 1 ? t.legs[0] : null,
    };
  }

  // Play the next play-off round. Returns my match result.
  function playPlayoffMatch(state) {
    if (state.phase !== "playoffs") return null;
    const po = state.playoff;
    const me = state.myTeam;
    const round = po.round;
    commitSpending(state);
    const matches = playPlayoffRound(state, po);
    state.lastPlayed = { type: "playoff", round };

    let myResult = null;
    for (const m of matches) {
      const hRes = m.hg > m.ag ? "W" : m.hg < m.ag ? "L" : "D";
      const aRes = hRes === "W" ? "L" : hRes === "L" ? "W" : "D";
      state.teamState[m.h].form.push(hRes);
      state.teamState[m.a].form.push(aRes);
      if (m.h === me || m.a === me) {
        const home = m.h === me;
        myResult = { ...m, kind: "playoff", home, res: home ? hRes : aRes, round, roundName: PLAYOFF_ROUNDS[round] };
      }
    }

    const gateHome = myResult.home && !myResult.neutral;
    const crowd = gateHome ? crowdFor(state, me, 1.25) : 0;
    const earned = (crowd * matchdayYield(state, me)) / 1e6;
    credit(state, me, earned, "matchday");
    const opp = state.teams[myResult.home ? myResult.a : myResult.h].name;
    const score = myResult.home ? `${myResult.hg}–${myResult.ag}` : `${myResult.ag}–${myResult.hg}`;
    const verb = { W: "Won", D: "Drew", L: "Lost" }[myResult.res];
    let text = `${PLAYOFF_ROUNDS[round]}: ${verb} ${score} ${myResult.neutral ? "against" : myResult.home ? "vs" : "at"} ${opp}${myResult.aet && !myResult.pens ? " after extra time" : ""}.`;
    if (round === 1) {
      const t = myTie(po, me);
      const lead = tieLead(t) * (t.hi === me ? 1 : -1);
      const mine = t.hi === me ? t.legs[0].ag + t.legs[1].hg : t.legs[0].hg + t.legs[1].ag;
      const theirs = mine - lead;
      text += t.winner === me
        ? ` Through to Wembley${t.legs[1].pens ? " on penalties" : ""} (${mine}–${theirs} on aggregate)!`
        : ` Knocked out${t.legs[1].pens ? " on penalties" : ""} (${mine}–${theirs} on aggregate).`;
      myResult.through = t.winner === me;
    }
    if (round === 2) {
      text += po.winner === me ? `${myResult.pens ? " Won on penalties —" : ""} PROMOTED!` : `${myResult.pens ? " Lost on penalties." : ""} So close.`;
      myResult.through = po.winner === me;
    }
    if (earned > 0) text += ` Gate receipts ${fmtMoney(earned)}.`;
    // Colour the news by whether the tie was won, once it has been decided.
    const type = round === 0 ? myResult.res : myResult.through ? "W" : "L";
    state.news.unshift({ label: PLAYOFF_SHORT[round], type, text });
    state.news = state.news.slice(0, 50);

    // Knocked out in the semis: the final goes ahead without us.
    if (round === 1 && !myResult.through) playPlayoffRound(state, po);
    if (po.round >= 3) endSeason(state);
    return myResult;
  }

  // ---- End of season ------------------------------------------------------

  function cupSummary(state, cupId) {
    const cup = state.cups[cupId];
    const def = cupDef(cupId);
    const st = cupStatus(state, cupId);
    let text;
    if (st.state === "won") text = "Winners!";
    else if (st.state === "out") {
      const final = st.round === def.rounds.length - 1;
      text = final ? `Runners-up (lost to ${state.teams[st.by].name})` : `${def.rounds[st.round].name.replace(/, 2nd leg$/, "")} (lost to ${state.teams[st.by].name})`;
    } else text = "Did not take part";
    return { cup: cupId, name: def.name, text, won: st.state === "won", winner: cup.winner };
  }

  // ---- Post-season outside England -----------------------------------------
  // Promotion play-offs, relegation play-offs and European play-offs. If your
  // club is in one you play it match by match; the rest are simulated.

  // In a series and not yet knocked out (including clubs waiting on a bye).
  const stillIn = (state, s) => {
    const me = state.myTeam;
    if (s.done || !(s.seeds.includes(me) || s.topClub === me)) return false;
    return !s.stages.some((st) => st.ties.some((t) => t.loser === me));
  };

  // Play the other ties until your club's next match is up (or you're out).
  function untilMine(state) {
    let guard = 0;
    while (!myPostTie(state) && state.post.series.some((x) => stillIn(state, x)) && guard++ < 20) {
      for (const x of state.post.series) if (!x.done) Leagues.playStep(state, x);
    }
  }

  function startPostseason(state) {
    if (state.country === "ENG") return false;
    syncOtherLeagues(state);
    const tables = {};
    for (const lid of Leagues.COUNTRY[state.country].divisions) tables[lid] = table(state, lid);
    const series = Leagues.seriesFor(state, state.country, tables);
    state.post = { country: state.country, series };
    const mine = series.find((x) => stillIn(state, x));
    if (!mine) return false;
    state.phase = "postseason";
    state.news.unshift({ label: "PO", type: "info", text: `Into the ${mine.name}!` });
    untilMine(state);
    return true;
  }

  function myPostTie(state) {
    for (const s of state.post.series) {
      if (s.done) continue;
      const st = s.stages[s.stages.length - 1];
      const t = st.ties.find((x) => !x.winner && (x.hi === state.myTeam || x.lo === state.myTeam));
      if (t) return { s, st, t };
    }
    return null;
  }

  function nextPostFixture(state) {
    const found = myPostTie(state);
    if (!found) return null;
    const { s, st, t } = found;
    const me = state.myTeam;
    const f = Leagues.legFixture(t, s.leg);
    const legName = t.legs === 2 ? (s.leg === 0 ? ", 1st leg" : ", 2nd leg") : "";
    return {
      ...f, kind: "post", name: `${st.name}${legName}`, series: s.name, home: f.h === me, opp: f.h === me ? f.a : f.h,
      legOne: t.legs === 2 && s.leg === 0, firstLeg: t.legs === 2 && s.leg === 1 ? t.games[0] : null,
      final: st.name === "Final" || st.name === "Barrage" || st.name === "Relegation play-off",
    };
  }

  function playPostseason(state) {
    commitSpending(state);
    const me = state.myTeam;
    let myResult = null;
    const played = [];
    for (const s of state.post.series) {
      if (s.done) continue;
      const games = Leagues.playStep(state, s);
      played.push(...games);
      const g = games.find((x) => x.h === me || x.a === me);
      if (!g) continue;
      const t = s.stages.flatMap((st) => st.ties).find((x) => x.games.includes(g));
      const st = s.stages.find((x) => x.ties.includes(t));
      const home = g.h === me;
      const res = g.hg === g.ag ? "D" : (g.hg > g.ag) === home ? "W" : "L";
      myResult = { ...g, kind: "playoff", home, res, roundName: `${s.name}, ${st.name.toLowerCase()}`, through: t.winner ? t.winner === me : undefined };
      const opp = state.teams[home ? g.a : g.h].name;
      const score = home ? `${g.hg}–${g.ag}` : `${g.ag}–${g.hg}`;
      let text = `${s.name}, ${st.name.toLowerCase()}: ${{ W: "Won", D: "Drew", L: "Lost" }[res]} ${score} ${home ? "vs" : "at"} ${opp}${g.aet ? " after extra time" : ""}.`;
      if (t.winner) text += t.winner === me ? (s.done && s.winner === me ? " Done it!" : " Through!") : " Knocked out.";
      state.news.unshift({ label: "PO", type: t.winner ? (t.winner === me ? "W" : "L") : res, text });
    }
    state.lastPlayed = { type: "post", games: played };
    untilMine(state);
    // Once you're out (or it's all over), the rest is simulated and the season ends.
    if (!state.post.series.some((x) => stillIn(state, x))) {
      state.post.series.forEach((x) => Leagues.runSeries(state, x));
      endSeason(state);
    }
    state.news = state.news.slice(0, 50);
    return myResult;
  }

  function seriesLog(state, s) {
    const sh = (id) => state.teams[id].name;
    return s.stages.flatMap((st) => st.ties.map((t) => {
      const lead = Leagues.tieLead(t);
      const hiGoals = t.games.reduce((a, g) => a + (g.h === t.hi ? g.hg : g.ag), 0);
      const pens = t.games.some((g) => g.pens);
      return `${st.name}: ${sh(t.hi)} ${hiGoals}–${hiGoals - lead} ${sh(t.lo)}${t.legs === 2 ? " on agg" : ""}${pens ? `, ${sh(t.winner)} on pens` : ""}`;
    }));
  }

  // ---- End of season --------------------------------------------------------

  function endSeason(state) {
    syncOtherLeagues(state);
    const tables = {};
    for (const lid of Leagues.DIV_ORDER) tables[lid] = table(state, lid);

    const moves = { up: {}, down: {} }; // by league id
    for (const lid of Leagues.DIV_ORDER) { moves.up[lid] = []; moves.down[lid] = []; }
    const playoffLogs = {};
    // England: the EFL play-offs (yours were played; the rest are simulated).
    for (const l of LEAGUES) {
      const ids = tables[l.id].map((r) => r.id);
      const z = l.zones;
      moves.down[l.id] = z.down ? ids.slice(ids.length - z.down) : [];
      if (l.tier === 1) continue;
      const up = ids.slice(0, z.autoUp);
      const po = l.id === state.league && state.playoff
        ? { winner: state.playoff.winner, finalists: [state.playoff.final.a, state.playoff.final.b], log: playoffLog(state, state.playoff) }
        : simulatePlayoff(state, ids.slice(z.playoff[0] - 1, z.playoff[1]));
      playoffLogs[l.id] = po;
      up.push(po.winner);
      moves.up[l.id] = up;
    }

    // National League: the strongest of the pool (with some luck) come up.
    const nlUp = state.pool
      .map((id) => ({ id, s: state.teams[id].rating + Engine.rand(0, 5) }))
      .sort((a, b) => b.s - a.s).slice(0, moves.down.L2.length).map((x) => x.id);

    // Everywhere else: play-offs, relegation play-offs and European play-offs.
    const series = {};
    const euroPlayoff = {};
    for (const cid of Leagues.COUNTRY_ORDER) {
      if (cid === "ENG") continue;
      const list = state.post && state.post.country === cid ? state.post.series : Leagues.seriesFor(state, cid, tables);
      list.forEach((x) => Leagues.runSeries(state, x));
      series[cid] = list;
      const m = Leagues.countryMoves(cid, tables, list);
      if (m) for (const [lid, v] of Object.entries(m)) { moves.up[lid] = v.up; moves.down[lid] = v.down; }
      const ep = list.find((x) => x.kind === "europe");
      if (ep) euroPlayoff[cid] = ep.winner;
    }

    // Merit payments, then every club's accounts are checked against the rules.
    const rules = {};
    for (const lid of Leagues.DIV_ORDER) {
      tables[lid].forEach((row, i) => credit(state, row.id, meritFor(state, lid, i + 1), "merit"));
      tables[lid].forEach((row) => { rules[row.id] = checkFinancialRules(state, row.id, lid); });
    }
    // Parachute payments, pay after moving division, and brand growth or decline.
    for (const lid of Leagues.DIV_ORDER) {
      const def = leagueDef(lid);
      tables[lid].forEach((row, i) => {
        const f = state.fin[row.id], pos = i + 1;
        const down = moves.down[lid].includes(row.id), up = moves.up[lid].includes(row.id);
        if (lid === "PL" && down) f.parachute = FINANCE.parachute.slice();
        if (lid === "CH" && up) f.parachute = [];
        if (up) f.pay *= FINANCE.payChange.promoted;
        if (down) f.pay *= FINANCE.payChange.relegated;
        f.brand *= pos === 1 ? 1.05 : up || (def.tier === 1 && pos <= 4) ? 1.03 : down ? 0.97 : 1;
        // Success lifts commercial income for a while; it drifts back towards
        // the club's usual level unless the success keeps coming.
        if (f.brandBase == null) f.brandBase = baseBrand(state.teams[row.id]);
        f.brand = Math.round((f.brand + BRAND_REVERT * (f.brandBase - f.brand)) * 10) / 10;
      });
    }
    rollGoldenGenerations(state, tables);

    const euroThisSeason = Europe.summaryFor(state, state.myTeam);
    Europe.endSeason(state, tables, euroPlayoff);
    aiStadiumPlans(state);
    const job = Managers.endSeason(state, tables, moves);

    const myTable = tables[state.league];
    const pos = myTable.findIndex((r) => r.id === state.myTeam) + 1;
    const myRow = myTable[pos - 1];
    const def = leagueDef(state.league);
    const n = myTable.length;
    const promoted = moves.up[state.league].includes(state.myTeam);
    const relegated = moves.down[state.league].includes(state.myTeam);
    const po = playoffLogs[state.league];
    const inPlayoffs = (po && myTable.slice(def.zones.playoff[0] - 1, def.zones.playoff[1]).some((r) => r.id === state.myTeam))
      || (state.post && state.post.series.some((x) => x.kind === "promotion" && x.seeds.includes(state.myTeam)));
    const europeNext = Europe.qualificationFor(state, state.myTeam);

    let outcome;
    if (def.tier === 1 && pos === 1) outcome = `${def.name} champions!`;
    else if (pos === 1) outcome = `${def.name} champions — promoted!`;
    else if (promoted && pos <= (def.zones.autoUp || 0)) outcome = "Automatic promotion!";
    else if (promoted) outcome = "Promoted via the play-offs!";
    else if (relegated && def.tier === 4) outcome = "Relegated out of the Football League.";
    else if (relegated) outcome = "Relegated.";
    else if (inPlayoffs) outcome = "Play-off heartbreak.";
    else if (europeNext) outcome = `Qualified for the ${europeNext}.`;
    else outcome = pos <= n / 2 ? "A solid top-half finish." : "Survived another season.";

    // Super cups (and the UEFA Super Cup) only when you played in them.
    const cups = Leagues.COUNTRY[state.country].cupIds.concat(["USC"])
      .filter((id) => !cupDef(id).super || cupStatus(state, id).state !== "none")
      .map((id) => cupSummary(state, id));
    const myFin = state.fin[state.myTeam];
    const myDivs = Leagues.COUNTRY[state.country].divisions;

    state.summary = {
      season: state.season, league: state.league, pos, row: myRow, outcome, promoted, relegated,
      gate: { ...state.stadium.gate, capacity: state.teams[state.myTeam].capacity, spent: state.stadium.spent },
      finance: {
        acc: { ...myFin.acc }, ...rules[state.myTeam].result, bank: myFin.bank, rules: rules[state.myTeam],
        parachuteNext: myFin.parachute[0] || 0, europeNext: Europe.expectedIncome(state, state.myTeam), deductNext: myFin.deductNext, embargoNext: myFin.embargoNext,
      },
      invest: { ...state.invest }, effects: effects(state),
      playoffs: po ? po.log : state.post ? state.post.series.flatMap((x) => [`${x.name}:`, ...seriesLog(state, x)]) : null,
      movements: myDivs.filter((lid) => moves.up[lid].length || moves.down[lid].length).map((lid) => ({
        league: lid, up: moves.up[lid], down: moves.down[lid],
      })),
      nlUp: state.country === "ENG" ? nlUp : [], cups, europe: euroThisSeason, europeNext,
      development: { mine: squadChange(state, state.myTeam, effects(state), finishOf(tables, moves, state.myTeam)), leagueAvg: averageAiDevelopment(state, tables, moves) },
      // Relegation out of the Football League no longer ends a career: you move on.
      gameOver: false, job,
    };
    archiveSeason(state, tables, moves, playoffLogs, nlUp, series);
    state.history.push({
      season: seasonLabel(state.season), year: state.season, club: state.myTeam, league: state.league, pos, pts: myRow.pts,
      w: myRow.w, d: myRow.d, l: myRow.l, gf: myRow.gf, ga: myRow.ga, n, promoted, relegated, outcome, rep: Math.round(state.job.rep), E: job.expected,
      cups: cups.map((c) => ({ name: c.name, text: c.text, won: c.won })).concat(euroThisSeason ? [{ name: euroThisSeason.name, text: euroThisSeason.text, won: euroThisSeason.won }] : []),
    });
    state.summary.achievements = unlock(state).map((a) => a.id);

    // Apply promotion & relegation.
    const next = {};
    Object.keys(state.leagues).forEach((lid) => { next[lid] = state.leagues[lid].slice(); });
    const order = LEAGUES.map((l) => l.id);
    order.forEach((lid, i) => {
      for (const id of moves.down[lid]) {
        next[lid].splice(next[lid].indexOf(id), 1);
        if (i + 1 < order.length) next[order[i + 1]].push(id);
        else state.pool.push(id);
      }
      for (const id of moves.up[lid]) {
        next[lid].splice(next[lid].indexOf(id), 1);
        next[order[i - 1]].push(id);
      }
    });
    for (const id of nlUp) {
      state.pool.splice(state.pool.indexOf(id), 1);
      next.L2.push(id);
    }
    for (const [cid, pr] of Object.entries(Leagues.PROREL)) {
      if (!Leagues.COUNTRY[cid]) continue;
      for (const id of moves.down[pr.top]) { next[pr.top].splice(next[pr.top].indexOf(id), 1); next[pr.second].push(id); }
      for (const id of moves.up[pr.second]) { next[pr.second].splice(next[pr.second].indexOf(id), 1); next[pr.top].push(id); }
    }
    state.pendingLeagues = next;
    state.phase = "summary";

    // Investors: a strong season can bring an offer (not if you've been sacked).
    state.offer = null;
    if (!state.job.prompt) {
      const nextLid = Object.keys(next).find((lid) => next[lid].includes(state.myTeam)) || state.league;
      state.offer = investorOffer(state, "summer", {
        promoted, pos, tier: def.tier, nextLid,
        cupWon: cups.some((c) => c.won && !cupDef(c.cup).super), europeWon: !!(euroThisSeason && euroThisSeason.won),
      });
    }
  }

  // Rating change from a season's spending: signings partly stay as permanent
  // quality and the academy pays off.
  function development(fx) {
    const signings = fx ? ((fx.attack + fx.defence) / 2 + fx.midfield) * 0.4 : 0;
    const academy = fx ? fx.academy : 0;
    return { signings, academy, total: signings + academy };
  }

  // Squads age a year every summer and part of each squad is replaced:
  // natural turnover (players in their early twenties), signings (older at
  // clubs at the top, who buy players in their prime) and academy graduates.
  // A title-winning squad tends to stay together, so it gets older; relegation
  // breaks a squad up. Young squads improve, old ones decline.
  function ageEffect(age) {
    if (age < PEAK_AGE[0]) return Math.min(2, (PEAK_AGE[0] - age) * 0.8);
    if (age > PEAK_AGE[1]) return -Math.min(4, (age - PEAK_AGE[1]) * 1.3);
    return 0;
  }

  const ageWord = (age) => (age < 24.6 ? "Young" : age < PEAK_AGE[0] ? "Developing" : age <= PEAK_AGE[1] ? "Peak years" : age < 28.6 ? "Experienced" : "Ageing");

  // Where a club finished: { pos, tier, down } from season tables and moves.
  function finishOf(tables, moves, id) {
    for (const [lid, rows] of Object.entries(tables)) {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) return { pos: i + 1, tier: leagueDef(lid).tier, down: moves.down[lid].includes(id) };
    }
    return { pos: 10, tier: 5, down: false };
  }

  // Next season's squad: new average age and the rating change, before luck
  // and (for AI clubs) the pull towards the division's mean.
  function squadChange(state, id, fx, finish) {
    const t = state.teams[id];
    const dev = development(fx);
    // Far above your division, players better than the ones you have are
    // rare and dear: signings and graduates add less.
    const lid = leagueOf(state, id);
    if (lid) {
      const ids = state.leagues[lid];
      const mean = ids.reduce((a, x) => a + state.teams[x].rating, 0) / ids.length;
      const f = clamp(1 - (t.rating - mean) / 25, 0.35, 1);
      dev.signings *= f; dev.academy *= f; dev.total *= f;
    }
    const age0 = t.age != null ? t.age : 26.5;
    const top = finish.tier === 1 && finish.pos <= 2;
    let r0 = 0.22 - (top ? 0.05 : finish.tier === 1 && finish.pos <= 4 ? 0.02 : 0) + (finish.down ? 0.08 : 0);
    const rs = clamp(dev.signings / 12, 0, 0.12);
    const ra = clamp(dev.academy / 6, 0, 0.08);
    const signAge = finish.tier === 1 && finish.pos <= 4 ? 26.5 : 24.5;
    const age = Math.round(((age0 + 1) * (1 - r0 - rs - ra) + r0 * 23.5 + rs * signAge + ra * 19) * 10) / 10;
    const effect = ageEffect(age);
    const golden = t.golden ? t.golden.boost : 0;
    const m = id === state.myTeam ? null : Managers.of(state, id);
    const manager = m ? m.tac * 0.5 : 0;
    return {
      signings: dev.signings, academy: dev.academy, age0, age, ageEffect: effect, golden, manager,
      total: dev.signings + dev.academy + effect + golden + manager,
    };
  }

  function averageAiDevelopment(state, tables, moves) {
    const ids = state.leagues[state.league].filter((id) => id !== state.myTeam && state.ai[id]);
    return ids.reduce((a, id) => a + squadChange(state, id, state.ai[id].fx, finishOf(tables, moves, id)).total, 0) / (ids.length || 1);
  }

  // Now and then an academy produces a golden generation: a few seasons of
  // rapid improvement. Clubs that invest in their academy see more of them;
  // the very top clubs, whose youngsters rarely get a game, see fewer.
  function rollGoldenGenerations(state, tables) {
    for (const [lid, rows] of Object.entries(tables)) {
      rows.forEach((r, i) => {
        const t = state.teams[r.id];
        if (t.golden && t.golden.left > 0) return;
        const fx = clubFx(state, r.id);
        let p = 0.012 + 0.035 * Math.min(1, (fx ? fx.academy : 0) / 3);
        if (leagueDef(lid).tier === 1 && i < 3) p *= 0.5;
        if (Math.random() >= p) return;
        t.golden = { left: 3, boost: Math.round(Engine.rand(0.9, 1.6) * 10) / 10, from: state.season + 1 };
        if (r.id === state.myTeam) state.news.unshift({ md: state.results.length, label: "Academy", type: "good", text: `A golden generation is coming through the academy: expect the squad to improve quickly over the next three seasons.` });
        else leagueNews(state, lid, { type: "info", text: `Word is that ${t.name} have a golden generation coming through their academy.` });
      });
    }
  }

  function nextSeason(state) {
    if (state.phase !== "summary") return;
    // Sacked over the summer: you must pick a new club (or retire) first.
    if (state.job && state.job.prompt) return;
    const s = state.summary;

    // Fan bases grow with success and shrink with relegation.
    const last = state.archive[state.archive.length - 1];
    for (const lid of Leagues.DIV_ORDER) {
      const rows = last.tables[lid], n = rows.length;
      rows.forEach((r, i) => {
        const t = state.teams[r.id];
        const f = last.moves.up[lid].includes(r.id) ? 1.05 : last.moves.down[lid].includes(r.id) ? 0.96
          : i < n / 4 ? 1.02 : i >= (3 * n) / 4 ? 0.99 : 1;
        t.support = Math.round(t.support * f);
      });
    }

    // Everyone develops from their own spending, their squad's age, golden
    // generations and (AI clubs) their manager. Each division is then
    // re-centred on its own average, so ratings don't inflate year on year and
    // richer divisions don't pull away from the rest. AI clubs also regress a
    // little towards their division's mean, so no club runs away for ever.
    for (const ids of Object.values(state.leagues)) {
      const mean = ids.reduce((a, id) => a + state.teams[id].rating, 0) / ids.length;
      const change = {}, ages = {};
      for (const id of ids) {
        const mine = id === state.myTeam;
        const sq = squadChange(state, id, mine ? s.effects : state.ai[id].fx, finishOf(last.tables, last.moves, id));
        ages[id] = sq.age;
        change[id] = mine ? sq.total + Engine.rand(-1, 1)
          : sq.total + AI_REGRESS * (mean - state.teams[id].rating) + Engine.rand(-1.5, 1.5);
      }
      const avg = ids.reduce((a, id) => a + change[id], 0) / ids.length;
      for (const id of ids) {
        const t = state.teams[id];
        t.rating = Math.round((t.rating + change[id] - avg) * 10) / 10;
        t.age = ages[id];
        if (t.golden && --t.golden.left <= 0) delete t.golden;
      }
      if (ids.includes(state.myTeam)) s.ratingChange = change[state.myTeam] - avg;
    }
    state.leagues = state.pendingLeagues;
    delete state.pendingLeagues;

    // Non-league clubs drift a little around a typical non-league level.
    for (const id of [...state.pool, ...state.nonLeague]) {
      const t = state.teams[id];
      t.rating = Math.round((t.rating + 0.15 * (40 - t.rating) + Engine.rand(-1.5, 1.5)) * 10) / 10;
    }
    for (const ids of Object.values(state.outside || {})) {
      for (const id of ids) state.teams[id].rating = Math.round((state.teams[id].rating + Engine.rand(-1, 1)) * 10) / 10;
    }

    // A new job starts with the new season; vacancies you turned down are filled.
    const J = state.job;
    if (state.offer) {
      state.offer = null; // an offer you didn't answer lapses
    }
    if (J.pendingMove) takeJob(state, J.pendingMove.club, J.pendingMove.why);
    else Managers.declined(state, J.summerOffers);
    J.pendingMove = null;
    J.summerOffers = [];
    Managers.summer(state);

    state.season++;
    startSeason(state);
  }

  // ---- Achievements ---------------------------------------------------------------

  // Check achievements (js/achievements.js); news for any just unlocked.
  function unlock(state, featId) {
    if (typeof Achievements === "undefined" || !state.job) return [];
    const fresh = featId ? Achievements.feat(state, featId) : Achievements.update(state);
    for (const a of fresh) state.news.unshift({ md: state.results ? state.results.length : 0, label: "🏅", type: "good", text: `Achievement unlocked: ${a.name}. ${a.desc}` });
    return fresh;
  }

  // ---- Investors ----------------------------------------------------------------
  // Success attracts money, especially lower down the pyramid. After a strong
  // season (or at the halfway point while you're top of a lower division)
  // investors may offer to buy into your club: money now, more every season,
  // and in most cases higher expectations from the board. You decide.

  const INVESTOR_TYPES = {
    local: { label: "Local consortium", ambition: 0, now: [0.4, 0.8], yearly: 0.15,
      pitch: "Local businesspeople who want to see the club do well. No strings attached." },
    celebrity: { label: "Celebrity owners", ambition: 1, now: [0.6, 1.2], yearly: 0.2, brand: 1.4, fans: 1.1,
      pitch: "Famous new owners and a documentary crew: a much bigger profile, more fans and commercial income." },
    equity: { label: "Investment fund", ambition: 1, now: [1.5, 2.5], yearly: 0.25, interest: 0.06, years: 6,
      pitch: "An overseas investment fund. Big money now, partly borrowed against the club: interest of {interest} a season for six seasons." },
    sovereign: { label: "Sovereign wealth fund", ambition: 3, now: [3, 5], yearly: 1, brand: 1.2,
      pitch: "A state-backed fund with almost unlimited money. They expect trophies, and soon." },
  };

  function investorName(type, club) {
    const pool = MANAGER_NAMES.en;
    const last = () => pool.last[Math.floor(Math.random() * pool.last.length)];
    const first = () => pool.first[Math.floor(Math.random() * pool.first.length)];
    if (type === "local") return `${last()} & ${last()} Holdings`;
    if (type === "celebrity") return `${first()} ${last()} and ${first()} ${last()}`;
    if (type === "equity") return `${last()} ${["Capital", "Partners", "Sports Group", "Equity"][Math.floor(Math.random() * 4)]}`;
    return `A sovereign wealth fund`;
  }

  // An investment offer for your club, or null. `when`: "summer" (end of a
  // season, with how it went) or "midseason" (top of a lower division).
  function investorOffer(state, when, how = {}) {
    const me = state.myTeam, f = state.fin[me];
    const lid = how.nextLid || leagueOf(state, me), def = leagueDef(lid);
    const recent = (f.investors || []).some((x) => x.season >= state.season - 1);
    const assocRank = Leagues.RANK[def.country] || 55;
    let p = 0;
    if (when === "midseason") p = def.tier >= 2 || assocRank > 15 ? 0.3 : 0;
    else {
      if (how.promoted) p += 0.35;
      if (how.pos === 1) p += 0.25; else if (how.tier === 1 && how.pos <= 4) p += 0.1;
      if (how.cupWon) p += 0.15;
      if (how.europeWon) p += 0.2;
    }
    const tierFactor = def.country === "ENG" ? [0.7, 1.15, 1.3, 1.4][def.tier - 1] || 1.4 : def.tier === 1 ? (assocRank > 10 ? 1 : 0.7) : 1.15;
    p = Math.min(0.75, p * tierFactor * (recent ? 0.2 : 1));
    if (Math.random() >= p) return null;
    const w = def.tier === 1
      ? { local: 1, celebrity: 0.5, equity: 3, sovereign: assocRank <= 10 && (how.pos <= 6 || how.cupWon || how.europeWon) ? 1.5 : 0 }
      : { local: 3, celebrity: how.promoted || def.country === "ENG" ? 3 : 1.5, equity: 2, sovereign: 0 };
    const type = Tactics.weighted(w);
    const T = INVESTOR_TYPES[type], base = def.budgetBase;
    const now = Math.round(base * Engine.rand(T.now[0], T.now[1]) * 10) / 10;
    const yearly = Math.round(base * T.yearly * Engine.rand(0.8, 1.2) * 10) / 10;
    const interest = T.interest ? Math.round(now * T.interest * 10) / 10 : 0;
    return {
      type, name: investorName(type, me), club: me, when, season: state.season, now, yearly, interest, years: T.years || 0,
      ambition: T.ambition, brand: T.brand || 1, fans: T.fans || 1,
      pitch: T.pitch.replace("{interest}", fmtMoney(interest)),
    };
  }

  // Accept (true) or turn down (false) the investment offer on the table.
  function respondOffer(state, accept) {
    const o = state.offer;
    if (!o) return false;
    state.offer = null;
    const t = state.teams[o.club], f = state.fin[o.club];
    if (!accept) {
      state.news.unshift({ md: state.results.length, label: "Owners", type: "info", text: `You advised the board to turn down ${o.name}.` });
      return true;
    }
    f.bank += o.now;
    f.acc.owner += o.now;
    f.owner = Math.round((f.owner + o.yearly - o.interest) * 10) / 10;
    if (o.brand !== 1) { f.brandBase = Math.round((f.brandBase || f.brand) * o.brand * 10) / 10; f.brand = Math.round(f.brand * o.brand * 10) / 10; }
    if (o.fans !== 1) t.support = Math.round(t.support * o.fans);
    f.credit = Math.round(forecast(state, o.club).revenue * FINANCE.credit * 10) / 10;
    (f.investors = f.investors || []).push({
      type: o.type, name: o.name, season: state.season, now: o.now, yearly: o.yearly, interest: o.interest,
      until: o.interest ? state.season + o.years + (o.when === "summer" ? 1 : 0) : null, ambition: o.ambition,
    });
    const strings = o.ambition ? " The board's expectations rise." : "";
    state.news.unshift({ md: state.results.length, label: "Owners", type: "good",
      text: `${o.name} invest in ${t.name}: ${fmtMoney(o.now)} now and ${fmtMoney(o.yearly)} a season.${strings}` });
    unlock(state, "investors");
    return true;
  }

  // How many places higher your board aims because of investors who joined in
  // the last three seasons.
  function investorAmbition(state, id) {
    const list = (state.fin[id] && state.fin[id].investors) || [];
    return list.filter((x) => x.season >= state.season - 3).reduce((a, x) => a + (x.ambition || 0), 0);
  }

  // Loans taken on by investment funds are paid off after a few seasons.
  function investorsAtSeasonStart(state, id) {
    const f = state.fin[id];
    for (const x of f.investors || []) {
      if (x.until && state.season >= x.until && x.interest) {
        f.owner = Math.round((f.owner + x.interest) * 10) / 10;
        x.interest = 0;
        if (id === state.myTeam) state.news.unshift({ md: 0, label: "Owners", type: "good", text: `${x.name}'s loan is paid off: no more interest to pay.` });
      }
    }
  }

  // ---- Changing jobs ----------------------------------------------------------

  // Your answer to a job decision. `clubId` takes that job; null turns an
  // approach down (not allowed when you've been sacked); "retire" ends the career.
  // At the end of a season the move happens when the next one starts.
  function respondJob(state, clubId) {
    const J = state.job;
    const prompt = J.prompt;
    if (clubId === "retire") {
      const st = Managers.currentStint(state);
      if (!st.end) { st.end = { season: state.season, md: state.results.length }; st.why = "Retired"; }
      J.prompt = null;
      J.retired = true;
      state.phase = "retired";
      return true;
    }
    const offers = prompt ? prompt.offers : state.phase === "summary" ? J.summerOffers : [];
    if (clubId == null) {
      if (!prompt || prompt.kind === "sacked") return false;
      J.prompt = null;
      Managers.declined(state, prompt.offers);
      state.news.unshift({ md: state.results.length, label: "Job", type: "info", text: `You turned down ${prompt.offers.map((o) => state.teams[o.club].name).join(" and ")}.` });
      return true;
    }
    if (!offers.some((o) => o.club === clubId)) return false;
    const why = prompt && prompt.kind === "sacked" ? (prompt.relegatedOut ? "Relegated" : "Sacked") : "Left";
    J.prompt = null;
    if (state.phase === "season") {
      Managers.declined(state, offers.filter((o) => o.club !== clubId));
      takeJob(state, clubId, why);
    } else {
      J.pendingMove = { club: clubId, why };
      J.summerOffers = offers.filter((o) => o.club !== clubId);
    }
    return true;
  }

  // Take charge of another club. In the season (phase "season") the move is
  // immediate, switching divisions and calendars if needed; between seasons
  // it's called from nextSeason before the new season starts.
  function takeJob(state, newId, why = "Left") {
    const old = state.myTeam;
    if (newId === old || !state.ai[newId]) return false;
    const J = state.job;
    const midSeason = state.phase === "season";
    const st = Managers.currentStint(state);
    if (!st.end) { st.end = { season: state.season, md: midSeason ? state.results.length : null }; st.why = why; }
    if (why === "Sacked") (J.sackedBy = J.sackedBy || []).push({ club: old, season: state.season });
    if (midSeason) commitSpending(state);
    state.offer = null; // an investment offer was for the club you're leaving

    // The club you leave returns to AI control, keeping what you spent.
    const oldLid = leagueOf(state, old);
    const ai = newAiClub();
    ai.fat = state.tactics ? state.tactics.fat || 0 : 0;
    if (midSeason && oldLid) { ai.invest = { ...state.invest }; ai.recruit = 1; ai.fx = computeFx(ai.invest, oldLid, 1); }
    if (state.stadium && state.stadium.project) ai.project = { seats: state.stadium.project.seats, opensSeason: state.season + 1 };
    state.ai[old] = ai;

    // The club you join: its manager makes way (unless the post is vacant).
    const nai = state.ai[newId];
    const prev = Managers.release(state, newId, "replaced");
    if (prev) state.news.unshift({ md: state.results.length, label: "Manager", type: "info", text: `${state.teams[newId].name} part company with ${prev.name} to make way for you.` });
    if (midSeason) {
      // AI spending counts at the club's recruitment rate; yours at full value.
      state.invest = Object.fromEntries(INVESTMENTS.map((d) => [d.id, Math.round((nai.invest[d.id] || 0) * (nai.recruit || 1) * 100) / 100]));
      state.locked = { ...state.invest };
    }
    const project = nai.project ? { id: "ai", name: "Ground expansion", seats: nai.project.seats, cost: 0, opensSeason: nai.project.opensSeason, opensMd: 0 } : null;
    state.stadium = { project, gate: { games: 0, crowd: 0, demand: 0, revenue: 0, soldOut: 0 }, spent: 0 };
    delete state.ai[newId];
    state.myTeam = newId;
    Tactics.initUser(state, prev ? prev.form : null);
    state.tactics.fat = nai.fat || 0;

    // Your old club appoints a successor.
    Managers.hire(state, old, { mid: midSeason });

    // Your new job: a fresh board and a honeymoon (with a bounce mid-season).
    J.stints.push(Managers.newStint(state, newId, midSeason ? state.season : state.season + 1, midSeason ? state.results.length : 0));
    Managers.logEvent(state, { type: "hired", club: newId, mgr: "you", name: J.name || "You" });
    const b = Managers.board(state, newId);
    Object.assign(b, { conf: 70, vacant: false, bounce: midSeason ? 5 : 0, hiredMd: state.results.length });
    J.warned = 0;

    if (midSeason) {
      const lid = leagueOf(state, newId);
      if (lid !== state.league) {
        // Swap your division's fixtures with the new one's and re-plan the calendar.
        const oldN = state.fixtures.length;
        state.others[state.league] = { fixtures: state.fixtures, results: state.results };
        const o = state.others[lid];
        delete state.others[lid];
        state.fixtures = o.fixtures;
        state.results = o.results;
        state.league = lid;
        state.country = leagueDef(lid).country;
        rebuildCalendar(state, oldN);
        state.teamState = {};
        for (const id of state.leagues[lid]) state.teamState[id] = { form: recentForm(state, id), injury: null };
      }
      state.startRating = state.teams[newId].rating;
      state.lastPlayed = null;
      state.rotate = false;
      // What the new board expects from here.
      const pos = table(state).findIndex((r) => r.id === newId) + 1;
      b.E = b.E || pos;
    }
    const def = leagueDef(leagueOf(state, newId) || state.league);
    state.news.unshift({ md: state.results.length, label: "Job", type: "good",
      text: midSeason ? `You are the new manager of ${state.teams[newId].name} (${def.name}).`
        : `You will take charge of ${state.teams[newId].name} for the ${seasonLabel(state.season + 1)} season.` });
    return true;
  }

  // Last results of a club in your division, as form letters.
  function recentForm(state, id) {
    const out = [];
    for (const md of state.results) {
      for (const m of md) {
        if (m.h !== id && m.a !== id) continue;
        const my = m.h === id ? m.hg : m.ag, their = m.h === id ? m.ag : m.hg;
        out.push(my > their ? "W" : my < their ? "L" : "D");
      }
    }
    return out.slice(-10);
  }

  // After moving to a division with a different number of matchdays: keep
  // every cup and European event in order, and space the new division's
  // matchdays among them by how far through the season each one falls.
  function rebuildCalendar(state, oldN) {
    const n = state.fixtures.length, k = state.results.length;
    const others = (evs) => evs.filter((e) => e.type !== "league").map((e) => ({ e, frac: e.after / oldN }));
    const merge = (evs, from, to) => {
      const out = [];
      let i = 0;
      for (let md = from; md < to; md++) {
        while (i < evs.length && (evs[i].frac <= md / n || md === n - 1)) out.push(evs[i++].e);
        out.push({ type: "league", md });
      }
      while (i < evs.length) out.push(evs[i++].e);
      return out;
    };
    const done = merge(others(state.cal.slice(0, state.calIdx)), 0, k);
    const rest = merge(others(state.cal.slice(state.calIdx)), k, n);
    state.cal = done.concat(rest);
    state.calIdx = done.length;
    for (const e of state.cal) if (e.type !== "league") e.after = clamp(Math.round((e.after / oldN) * n), 0, n - 1);
  }

  // ---- Archive: seasons, honours and records ------------------------------

  function leagueResults(state, lid) {
    return lid === state.league ? state.results : state.others[lid].results;
  }

  function positionHistory(state, lid) {
    return Leagues.positionHistory(state, lid);
  }

  // Week-by-week positions are archived as one character per matchday.
  const encodePos = (arr) => arr.map((p) => String.fromCharCode(64 + p)).join("");
  const decodePos = (v) => (typeof v === "string" ? [...v].map((ch) => ch.charCodeAt(0) - 64) : v || []);

  function archiveSeason(state, tables, moves, playoffLogs, nlUp, series = {}) {
    const entry = { season: state.season, me: state.myTeam, myLeague: state.league, tables: {}, positions: {}, bigWins: {}, playoffs: {}, euroPlayoffs: {}, cups: {}, moves, nlUp };
    for (const l of Leagues.DIV_ORDER.map(leagueDef)) {
      entry.tables[l.id] = tables[l.id].map((r) => {
        const f = state.fin[r.id], h = f.hist[f.hist.length - 1] || seasonResult(f);
        return { id: r.id, p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.pts, ded: r.ded || 0,
          rev: Math.round(h.revenue * 10) / 10, wages: Math.round(f.acc.wages * 10) / 10, profit: Math.round(h.profit * 10) / 10, bank: Math.round(f.bank * 10) / 10 };
      });
      const pos = positionHistory(state, l.id);
      entry.positions[l.id] = Object.fromEntries(Object.entries(pos).map(([id, arr]) => [id, encodePos(arr)]));
      let big = null;
      leagueResults(state, l.id).forEach((md, i) => md.forEach((m) => {
        const margin = Math.abs(m.hg - m.ag);
        if (!big || margin > big.margin || (margin === big.margin && m.hg + m.ag > big.hg + big.ag)) big = { ...m, md: i + 1, margin };
      }));
      entry.bigWins[l.id] = big;
      const po = playoffLogs[l.id];
      if (po) entry.playoffs[l.id] = { winner: po.winner, runnerUp: po.finalists.find((id) => id !== po.winner) };
    }
    for (const list of Object.values(series)) {
      for (const x of list) {
        if (x.kind === "promotion") entry.playoffs[x.lid] = { winner: x.winner };
        if (x.kind === "europe") entry.euroPlayoffs[x.lid] = { winner: x.winner };
      }
    }
    entry.europe = Europe.archiveEntry(state);
    for (const c of ALL_CUPS) {
      const cup = state.cups[c.id];
      const exits = {};
      for (const [id, o] of Object.entries(cup.out)) exits[id] = o.round;
      entry.cups[c.id] = { winner: cup.winner, runnerUp: cup.runnerUp, exits };
    }
    (state.archive = state.archive || []).push(entry);
  }

  // How far a club got in a cup: "Winners", "Final", "QF", "R3"… or null.
  function cupReach(cupId, record, id) {
    if (!record) return null;
    if (record.winner === id) return "Winners";
    if (!(id in record.exits)) return null;
    const r = cupDef(cupId).rounds[record.exits[id]];
    return r.short === "SF2" ? "SF" : r.short;
  }

  // The domestic cups a club enters (England: FA Cup and EFL Cup).
  const cupsFor = (state, id) => Leagues.COUNTRY[state.teams[id].country].cupIds;

  // Season-by-season record and honours for any club.
  function clubHistory(state, id) {
    const myCups = cupsFor(state, id);
    const seasons = (state.archive || []).map((a) => {
      const lid = Leagues.DIV_ORDER.find((x) => a.tables[x] && a.tables[x].some((r) => r.id === id));
      const cups = Object.fromEntries(myCups.map((c) => [c, cupReach(c, a.cups[c], id)]));
      const europe = Europe.reachFrom(a.europe, id);
      if (!lid) return { season: a.season, lid: null, cups, europe, nonLeague: true, up: a.nlUp.includes(id) };
      const pos = a.tables[lid].findIndex((r) => r.id === id) + 1;
      return {
        season: a.season, lid, pos, row: a.tables[lid][pos - 1], cups, europe,
        up: a.moves.up[lid].includes(id), down: a.moves.down[lid].includes(id),
        playoffWin: a.playoffs[lid] && a.playoffs[lid].winner === id,
        positions: decodePos(a.positions[lid][id]),
      };
    });
    const honours = { titles: {}, promotions: 0, relegations: 0, playoffWins: 0, cups: {}, finals: {}, europe: {} };
    for (const s of seasons) {
      if (s.lid && s.pos === 1) honours.titles[s.lid] = (honours.titles[s.lid] || 0) + 1;
      if (s.up) honours.promotions++;
      if (s.down) honours.relegations++;
      if (s.playoffWin) honours.playoffWins++;
      for (const c of myCups) {
        if (s.cups[c] === "Winners") honours.cups[c] = (honours.cups[c] || 0) + 1;
        else if (s.cups[c] === "Final") honours.finals[c] = (honours.finals[c] || 0) + 1;
      }
      if (s.europe && s.europe.won) honours.europe[s.europe.comp] = (honours.europe[s.europe.comp] || 0) + 1;
    }
    honours.uefaSuper = (state.archive || []).filter((a) => a.cups.USC && a.cups.USC.winner === id).length;
    return { seasons, honours, cups: myCups };
  }

  // Champions, play-off winners and cup winners in a country for every completed
  // season, plus the European winners.
  function rollOfHonour(state, cid = state.country) {
    const c = Leagues.COUNTRY[cid];
    return (state.archive || []).map((a) => ({
      season: a.season,
      champions: Object.fromEntries(c.divisions.map((lid) => [lid, a.tables[lid] ? a.tables[lid][0].id : null])),
      playoffs: Object.fromEntries(Object.entries(a.playoffs).filter(([lid]) => c.divisions.includes(lid)).map(([lid, p]) => [lid, p.winner])),
      cups: Object.fromEntries(c.cupIds.map((id) => [id, a.cups[id] ? a.cups[id].winner : null])),
      europe: { ...(a.europe ? a.europe.winners : {}), USC: a.cups.USC ? a.cups.USC.winner : null },
    }));
  }

  // Single-season records per division, plus the biggest win.
  function records(state, lids = Leagues.DIV_ORDER) {
    const out = {};
    for (const l of lids.map(leagueDef)) {
      const best = {};
      const consider = (key, value, id, season, better) => {
        if (!best[key] || better(value, best[key].value)) best[key] = { value, id, season };
      };
      let bigWin = null;
      for (const a of state.archive || []) {
        for (const r of a.tables[l.id] || []) {
          consider("mostPoints", r.pts, r.id, a.season, (x, y) => x > y);
          consider("fewestPoints", r.pts, r.id, a.season, (x, y) => x < y);
          consider("mostGoals", r.gf, r.id, a.season, (x, y) => x > y);
          consider("fewestConceded", r.ga, r.id, a.season, (x, y) => x < y);
          consider("mostWins", r.w, r.id, a.season, (x, y) => x > y);
        }
        const b = a.bigWins && a.bigWins[l.id];
        if (b && (!bigWin || b.margin > bigWin.margin || (b.margin === bigWin.margin && b.hg + b.ag > bigWin.hg + bigWin.ag))) {
          bigWin = { ...b, season: a.season };
        }
      }
      out[l.id] = { ...best, bigWin };
    }
    return out;
  }

  // ---- Analysis: you vs your division --------------------------------------

  const STEADY = { form: false, injury: false };

  // Every club in your division: effective ratings, results and spending.
  function divisionReport(state) {
    const lid = state.league;
    const tbl = table(state);
    return tbl.map((row, i) => {
      const id = row.id;
      const s = strength(state, id, STEADY);
      const homeRows = { p: 0, pts: 0 }, awayRows = { p: 0, pts: 0 };
      for (const md of state.results) {
        for (const m of md) {
          if (m.h !== id && m.a !== id) continue;
          const home = m.h === id;
          const my = home ? m.hg : m.ag, their = home ? m.ag : m.hg;
          const r = home ? homeRows : awayRows;
          r.p++;
          r.pts += my > their ? 3 : my === their ? 1 : 0;
        }
      }
      return {
        id, pos: i + 1, att: s.att, def: s.def, row,
        gfPer: row.p ? row.gf / row.p : null, gaPer: row.p ? row.ga / row.p : null, ppg: row.p ? row.pts / row.p : null,
        homePpg: homeRows.p ? homeRows.pts / homeRows.p : null, awayPpg: awayRows.p ? awayRows.pts / awayRows.p : null,
        invest: id === state.myTeam ? { ...state.invest } : { ...state.ai[id].invest },
      };
    });
  }

  // Expected league points from the remaining fixtures (no form or injuries).
  function expectedPoints(state, bonus = 0) {
    const me = state.myTeam;
    let pts = 0;
    for (const md of state.fixtures.slice(state.results.length)) {
      const f = md.find((x) => x.h === me || x.a === me);
      if (!f) continue; // a bye, or split-phase fixtures not drawn yet
      const mine = { ...STEADY, bonus };
      const [sh, sa] = pair(state, f.h, f.a, f.h === me ? mine : STEADY, f.a === me ? mine : STEADY);
      const p = Engine.outcomeProbs(Engine.expectedGoals(sh, sa));
      pts += f.h === me ? 3 * p.win + p.draw : 3 * p.loss + p.draw;
    }
    return pts;
  }

  // Rating lost per match to injuries, on average: crisis chance × size × length.
  function injuryDrag(medical) {
    return INJURY_CHANCE * (1 - 0.7 * medical) * 3.5 * 4 * (1 - 0.5 * medical);
  }

  // What the next slice of money would buy in each category, in expected
  // league points over the rest of the season.
  function investmentAdvice(state) {
    const def = leagueDef(state.league);
    const step = Math.round(def.budgetBase * 0.1 * 100) / 100;
    const fx0 = effects(state);
    const ep0 = expectedPoints(state);
    const tw = transferWindow(state);
    const remaining = state.fixtures.length - state.results.length;
    const items = INVESTMENTS.map((d) => {
      const saved = state.invest[d.id];
      state.invest[d.id] = saved + step;
      const fx1 = effects(state);
      let points = 0;
      if (d.id === "medical") points = expectedPoints(state, injuryDrag(fx0.medical) - injuryDrag(fx1.medical)) - ep0;
      else if (d.id !== "academy") points = expectedPoints(state) - ep0;
      state.invest[d.id] = saved;
      const available = state.phase === "season" ? d.group !== "transfer" || tw.open : state.phase === "playoffs" && d.group !== "transfer";
      return {
        id: d.id, name: d.name, icon: d.icon, step, points, perMillion: points / step,
        gain: fx1[d.id] - fx0[d.id], effectLabel: d.effectLabel(fx1[d.id] - fx0[d.id]),
        spent: saved, available, nextSeason: d.id === "academy",
        opensIn: d.group === "transfer" && !tw.open ? tw.opensIn : null,
      };
    });
    return { step, remaining, expected: ep0, items, cash: cash(state) };
  }

  // ---- Saved careers ------------------------------------------------------
  // Storage lives in js/careers.js; this brings a loaded career up to date.

  // A saved career ready to play, or null if it's from an incompatible version.
  function upgrade(st) {
    if (!st || st.version !== VERSION) return null;
    migrate(st);
    return st;
  }

  // Careers saved before the European expansion can't be continued.
  function hasOldSave() {
    try { return !!(localStorage.getItem("pyramid-manager.save.v2") || localStorage.getItem("pyramid-manager.save.v1")); } catch (e) { return false; }
  }

  // Older saves: add what later versions introduced.
  function migrate(st) {
    // Stadiums: capacities, fan bases and gate stats.
    for (const t of Object.values(st.teams)) {
      if (t.capacity == null) Object.assign(t, stadiumFor(t.short, tierOf(st, t.id)));
    }
    st.stadium = st.stadium || { project: null };
    st.stadium.gate = st.stadium.gate || { games: 0, crowd: 0, demand: 0, revenue: 0, soldOut: 0 };
    st.stadium.spent = st.stadium.spent || 0;
    if (!st.fin) {
      // Old saves: open accounts for every club, keeping any unspent money.
      st.fin = {};
      st.deduct = {};
      st.deductWhy = {};
      st.invest = st.invest || zeroInvest();
      st.locked = st.locked || zeroInvest();
      for (const ids of Object.values(st.leagues)) {
        for (const id of ids) {
          const f = newFinances(st, id);
          const old = id === st.myTeam ? (st.funds || 0) - sum(st.invest) : st.ai[id] ? (st.ai[id].funds || 0) - sum(st.ai[id].invest) : 0;
          f.bank += Math.max(0, old);
          f.credit = Math.round(forecast(st, id).revenue * FINANCE.credit * 10) / 10;
          f.bankHist = [f.bank];
        }
      }
    }
    // Tactics, managers and boards: every club gets a manager, your board
    // sets an objective for the rest of this season.
    if (!st.tactics) Tactics.initUser(st);
    if (!st.mgr) {
      Managers.init(st, { keepStyle: true });
      Managers.seasonStart(st, { keepConf: true });
    }
    // The long run, live matches, super cups and investors.
    for (const t of Object.values(st.teams)) if (t.age == null) t.age = newSquadAge();
    for (const [id, f] of Object.entries(st.fin)) if (f.brandBase == null && st.teams[id]) f.brandBase = baseBrand(st.teams[id]);
    for (const c of ALL_CUPS) {
      if (st.cups && !st.cups[c.id]) st.cups[c.id] = { id: c.id, round: c.rounds.length, alive: [], ties: [], history: [], winner: null, runnerUp: null, out: {} };
    }
    st.prefs = st.prefs || { halftime: true };
    st.disc = st.disc || {};
    // Saved before a new season's first game by a version that carried fatigue
    // (and the record by formation) over the summer: clear them now.
    if (st.tactics && st.phase === "season" && st.results && !st.results.length && !st.calIdx) { st.tactics.fat = 0; st.tactics.log = {}; }
    // A match saved at half-time by an earlier version: carry on from there.
    if (st.live && st.live.first) {
      const o = st.live;
      st.live = {
        h: o.h, a: o.a, kind: o.kind, neutral: o.neutral, rot: o.rot || {}, ref: o.ref || 1, pre: o.pre, lu0: o.lu1, derby: o.derby || null,
        min: 45, hg: o.first.hg, ag: o.first.ag, ht: [o.first.hg, o.first.ag], events: o.first.events, yc: o.yc || [0, 0], down: o.down || [0, 0],
        xgAcc: [o.xg1.home, o.xg1.away], possAcc: (o.poss1 || 50) * 45, react: o.react, pause: { kind: "ht", min: 45 },
      };
      st.live.stats = o.stats1 || null;
    }
    if (typeof Achievements !== "undefined" && st.job) Achievements.update(st);
    // Careers that ended with relegation out of the Football League carry on
    // at a new club.
    if (st.phase === "gameover" && st.summary) {
      st.phase = "summary";
      st.summary.gameOver = false;
      st.job.prompt = { kind: "sacked", offers: Managers.offersFor(st, "sacked"), summer: true, relegatedOut: true };
    }
  }

  const internal = {
    leagueFixtures, strength, settle, credit, leagueOf, tierOf, crowdFor, matchdayYield, table, clubFx, commitSpending,
    playGame, pair, squadChange, finishOf,
  };

  return {
    internal, ALL_CUPS, hasOldSave, decodePos, cupsFor, moneyOf,
    newGame, nextSeason, advance, setInvestment, canAdjust, transferWindow,
    effects, clubFx, strength, preview, nextMyEvent, table, project, cash, spent,
    leagueDef, invDef, cupDef, styleDef, leagueOf, fmtMoney, seasonLabel, formValue, pendingSpend,
    cupStatus, aiCash, development, upgrade, VERSION,
    pair, suggestTactics, setTactics, respondJob, takeJob, cupBracket, pendingDecision,
    positionHistory, clubHistory, rollOfHonour, records, cupReach, divisionReport, investmentAdvice, expectedPoints,
    ticketDemand, crowdFor, stadiumOptions, buildStadium, seatCost, ticketYield,
    forecast, projectedBank, projectedSeason, rulesStatus, safeToSpend, accountLines, wageBill, matchdayYield, seasonResult, saleOptions, sellPlayers, INCOME_LINES,
    kickOff, resumeLive, liveOdds, CARDS_PER_MATCH, derbyOf, derbiesOf, ageWord, ageEffect, PEAK_AGE, respondOffer, investorAmbition, INVESTOR_TYPES, SUPER_CUPS,
    // Kept for tests and older harnesses: play until your next match.
    playMatchday: advance, playPlayoffMatch: advance,
  };
})();
