// Tactics: formations, mentality and pressing, how two formations match up,
// tactical familiarity and fatigue. Every club picks a lineup for each match:
// yours comes from your choices, AI clubs' from their manager's preferences
// and the opponent. Game internals are reached through Game.internal.

const Tactics = (() => {
  const G = () => Game.internal;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // att/def: rating change (each formation trades attack for defence, net zero).
  // cm: central midfielders; back: defenders; fwd: forwards;
  // wide: "wingers" (wide forwards), "mid" (wide midfielders) or "backs" (wing-backs only).
  // lines: players per line from the back, for the pitch diagram.
  const FORMATIONS = [
    { id: "442", name: "4-4-2", att: 0, def: 0, cm: 2, back: 4, fwd: 2, wide: "mid", lines: [4, 4, 2],
      desc: "Two banks of four and a strike pair. Simple, solid and hard to break down." },
    { id: "4231", name: "4-2-3-1", att: 0.5, def: -0.5, cm: 3, back: 4, fwd: 1, wide: "wingers", lines: [4, 2, 3, 1],
      desc: "A double pivot shields the defence while three creators support a lone striker." },
    { id: "433", name: "4-3-3", att: 1.5, def: -1.5, cm: 3, back: 4, fwd: 3, wide: "wingers", lines: [4, 3, 3],
      desc: "Wingers stretch the pitch and a midfield three keeps the ball." },
    { id: "343", name: "3-4-3", att: 2.5, def: -2.5, cm: 2, back: 3, fwd: 3, wide: "wingers", lines: [3, 4, 3],
      desc: "All-out attack with a front three. Exposed if the press is beaten." },
    { id: "352", name: "3-5-2", att: 1, def: -1, cm: 3, back: 3, fwd: 2, wide: "backs", lines: [3, 5, 2],
      desc: "Wing-backs provide the width; three central midfielders win the middle." },
    { id: "4141", name: "4-1-4-1", att: -1, def: 1, cm: 3, back: 4, fwd: 1, wide: "mid", lines: [4, 1, 4, 1],
      desc: "A holding midfielder screens a compact back four. Patient and organised." },
    { id: "532", name: "5-3-2", att: -2, def: 2, cm: 3, back: 5, fwd: 2, wide: "backs", lines: [5, 3, 2],
      desc: "Five at the back and two up top to counter-attack." },
    { id: "541", name: "5-4-1", att: -3, def: 3, cm: 2, back: 5, fwd: 1, wide: "mid", lines: [5, 4, 1],
      desc: "Park the bus. Concede little, score little: the underdog's shape." },
  ];
  const FORM = Object.fromEntries(FORMATIONS.map((f) => [f.id, f]));
  // How often AI managers favour each shape.
  const POPULARITY = { 442: 13, 4231: 22, 433: 22, 343: 8, 352: 11, 4141: 11, 532: 8, 541: 5 };

  const MENTALITIES = [
    { id: "def", name: "Defensive", att: -1.5, def: 1.5, desc: "Sit deeper and take fewer risks: fewer goals at both ends. Suits underdogs and protecting a lead." },
    { id: "bal", name: "Balanced", att: 0, def: 0, desc: "No change to the team's natural game." },
    { id: "att", name: "Attacking", att: 1.5, def: -1.5, desc: "Push men forward: more goals at both ends. Suits the stronger side." },
  ];
  const PRESSING = [
    { id: "low", name: "Low block", att: -0.5, def: 0.5, fatigue: -1, desc: "Conserve energy. Players recover between games." },
    { id: "med", name: "Mid press", att: 0, def: 0, fatigue: -0.4, desc: "Press in the middle third. Players recover slowly." },
    { id: "high", name: "High press", att: 1, def: 1, fatigue: 1.2, desc: "Win the ball high up the pitch. Better in both boxes, but players tire and get injured more." },
  ];
  const MENT = Object.fromEntries(MENTALITIES.map((m) => [m.id, m]));
  const PRESS = Object.fromEntries(PRESSING.map((p) => [p.id, p]));

  const MAX_FATIGUE = 8;
  const FATIGUE_FREE = 2;       // fatigue up to this level costs nothing
  const FATIGUE_COST = 0.5;     // rating lost per point of fatigue above that
  const MIDWEEK_FATIGUE = 0.4;  // extra fatigue from a cup or European game
  const FAMILIARITY_COST = 5;   // rating lost at zero familiarity (scaled)
  const FAM_MIN = 0.5, FAM_GAIN = 0.1, FAM_DECAY = 0.015;

  // ---- Matchups -------------------------------------------------------------

  // What formation x enjoys against formation y: [rating, reason].
  function advantages(x, y) {
    const out = [];
    if (x.cm > y.cm) out.push([0.5 * (x.cm - y.cm), `${x.cm} central midfielders against ${y.cm}`]);
    if (x.wide === "wingers" && y.back === 3) out.push([0.8, "wingers attack the space behind the wing-backs"]);
    if (x.wide === "mid" && y.back !== 4) out.push([0.4, "wide midfielders pin back the wing-backs"]);
    if (x.fwd === 2 && y.back === 4) out.push([0.4, "a strike pair occupies both centre-backs"]);
    if (x.fwd === 3 && y.back === 4) out.push([0.3, "a front three stretches a back four"]);
    if (x.back === 3 && y.fwd === 2) out.push([0.5, "three centre-backs mark a strike pair"]);
    if (x.back === 3 && y.fwd === 1) out.push([0.3, "three centre-backs outnumber a lone striker"]);
    if (x.back === 5 && y.fwd === 3) out.push([0.6, "a back five smothers a front three"]);
    return out;
  }

  // Mentality is a cycle: attacking sides seize the initiative against
  // balanced ones, patient sides pick apart a deep block, and a deep block
  // counter-attacks an all-out attack. [rating, reason] for x against y.
  const MENTALITY_EDGE = 0.7;
  function mentalityEdge(x, y) {
    if (x === "att" && y === "bal") return [MENTALITY_EDGE, "attacking intent pins a balanced side back"];
    if (x === "bal" && y === "def") return [MENTALITY_EDGE, "patient build-up picks apart a deep block"];
    if (x === "def" && y === "att") return [MENTALITY_EDGE, "sitting deep invites them on, then hits them on the break"];
    return null;
  }

  // Edge for lineup a against lineup b (antisymmetric): rating points a gains
  // in attack and defence, with the reasons either way. Lineups are
  // { form, ment } (a formation id alone means a balanced mentality).
  function matchup(a, b) {
    const la = typeof a === "string" ? { form: a, ment: "bal" } : a;
    const lb = typeof b === "string" ? { form: b, ment: "bal" } : b;
    const fa = FORM[la.form] || FORM["442"], fb = FORM[lb.form] || FORM["442"];
    const pros = advantages(fa, fb), cons = advantages(fb, fa);
    const mp = mentalityEdge(la.ment, lb.ment), mc = mentalityEdge(lb.ment, la.ment);
    if (mp) pros.push(mp);
    if (mc) cons.push(mc);
    const edge = pros.reduce((t, x) => t + x[0], 0) - cons.reduce((t, x) => t + x[0], 0);
    return { edge, pros, cons };
  }

  // ---- Lineups --------------------------------------------------------------

  // Quick strength estimate (rating plus spending boost), for AI decisions.
  function quickStrength(state, id) {
    const fx = G().clubFx(state, id);
    const boost = fx ? ((fx.attack || 0) + (fx.defence || 0)) / 2 + (fx.midfield || 0) + (fx.coaching || 0) : 0;
    return state.teams[id].rating + boost;
  }

  const DEFAULT = { form: "442", ment: "bal", press: "med" };

  // The lineup a club uses against `opp` (null: its usual set-up).
  function lineup(state, id, opp = null) {
    if (id === state.myTeam && state.tactics) {
      const t = state.tactics;
      return { form: t.form, ment: t.ment, press: t.press };
    }
    const m = Managers.of(state, id);
    if (!m) return { ...DEFAULT };
    const lu = { form: m.form, ment: "bal", press: m.press };
    if (opp && state.teams[opp]) {
      // Flexible managers sit deeper against stronger sides and go for it
      // against weaker ones. Deterministic, so previews match the match.
      const gap = quickStrength(state, opp) - quickStrength(state, id);
      if (m.flex >= 0.35 && gap >= 5) { lu.form = m.alt; if (gap >= 9) lu.ment = "def"; }
      else if (m.flex >= 0.35 && gap <= -6) lu.ment = "att";
    }
    const f = fatigue(state, id);
    if (lu.press === "high" && f > 3) lu.press = "med";
    if (f > 5) lu.press = "low";
    return lu;
  }

  function familiarity(state, id, form) {
    if (id === state.myTeam && state.tactics) return state.tactics.fam[form] != null ? state.tactics.fam[form] : FAM_MIN;
    const m = Managers.of(state, id);
    if (!m) return 1;
    return form === m.form ? 1 : form === m.alt ? 0.9 : 0.7;
  }

  function fatigue(state, id) {
    if (id === state.myTeam && state.tactics) return state.tactics.fat || 0;
    const ai = state.ai && state.ai[id];
    return ai ? ai.fat || 0 : 0;
  }

  const fatiguePenalty = (f) => Math.max(0, f - FATIGUE_FREE) * FATIGUE_COST;

  // Rating changes from a lineup: shape, mentality, pressing, familiarity, fatigue.
  function mods(state, id, lu) {
    const f = FORM[lu.form] || FORM["442"], m = MENT[lu.ment] || MENT.bal, p = PRESS[lu.press] || PRESS.med;
    const famCost = (1 - familiarity(state, id, lu.form)) * FAMILIARITY_COST;
    const tired = fatiguePenalty(fatigue(state, id));
    return {
      att: f.att + m.att + p.att - famCost - tired,
      def: f.def + m.def + p.def - famCost - tired,
      famCost, tired,
    };
  }

  // ---- After a match --------------------------------------------------------

  // Fatigue for both sides; for you, familiarity and your record by formation.
  function afterGame(state, id, lu, opts, res) {
    const p = PRESS[lu.press] || PRESS.med;
    let delta = p.fatigue + (opts.midweek ? MIDWEEK_FATIGUE : 0);
    if (opts.rotated) delta = -1.5;
    if (id === state.myTeam && state.tactics) {
      const t = state.tactics;
      t.fat = clamp((t.fat || 0) + delta, 0, MAX_FATIGUE);
      for (const f of FORMATIONS) {
        const v = t.fam[f.id] != null ? t.fam[f.id] : FAM_MIN;
        t.fam[f.id] = Math.round((f.id === lu.form ? Math.min(1, v + FAM_GAIN) : Math.max(FAM_MIN, v - FAM_DECAY)) * 1000) / 1000;
      }
      const rec = (t.log[lu.form] = t.log[lu.form] || { w: 0, d: 0, l: 0 });
      rec[res.toLowerCase()]++;
      return;
    }
    const ai = state.ai && state.ai[id];
    if (ai) ai.fat = Math.round(clamp((ai.fat || 0) + delta, 0, MAX_FATIGUE) * 100) / 100;
  }

  // Your tactics when you take over a club: its previous shape is familiar.
  function initUser(state, form = null) {
    const f = form || weighted(POPULARITY);
    const fam = {};
    for (const x of FORMATIONS) fam[x.id] = x.id === f ? 1 : x.back === FORM[f].back ? 0.75 : 0.6;
    const fat = state.tactics ? state.tactics.fat || 0 : 0;
    state.tactics = { form: f, ment: "bal", press: "med", fam, fat, log: {} };
  }

  function weighted(w) {
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [k, v] of Object.entries(w)) { r -= v; if (r <= 0) return k; }
    return Object.keys(w)[0];
  }

  // A defensive fallback for a manager's preferred shape.
  function altFor(form) {
    const f = FORM[form];
    if (f.back === 5) return form === "541" ? "532" : "541";
    if (f.back === 3) return "532";
    return Math.random() < 0.6 ? "4141" : "541";
  }

  function condition(f) {
    return f >= 5 ? "Exhausted" : f > FATIGUE_FREE + 0.5 ? "Tiring" : f > 1 ? "Match fit" : "Fresh";
  }

  return {
    FORMATIONS, FORM, MENTALITIES, PRESSING, MENT, PRESS, POPULARITY, MAX_FATIGUE, FATIGUE_FREE,
    matchup, lineup, mods, familiarity, quickStrength, fatigue, fatiguePenalty, afterGame, initUser, weighted, altFor, condition,
  };
})();
