// Achievements: milestones across a whole managerial career. Most are worked
// out from your season-by-season history, so a long career gets credit for
// what it has already done; a few (giant-killings, comebacks, investors) are
// recorded when they happen. Unlocked achievements are kept in state.job.ach
// as { id: season label }.

const Achievements = (() => {
  const EURO = ["Champions League", "Europa League", "Conference League"];

  // Everything the checks need, from the first `k` seasons of your history.
  function context(state, k) {
    const hist = state.history.slice(0, k);
    const J = state.job;
    const country = (h) => Game.leagueDef(h.league).country;
    const tier = (h) => Game.leagueDef(h.league).tier;
    const isPromo = (h) => (h.promoted != null ? h.promoted : /promot/i.test(h.outcome || ""));
    const won = (h) => (h.cups || []).filter((c) => c.won).map((c) => c.name);
    const domesticCup = (h) => {
      const ids = Leagues.COUNTRY[country(h)].cupIds.filter((id) => !Game.cupDef(id).super);
      const names = ids.map((id) => Game.cupDef(id).name);
      return won(h).some((n) => names.includes(n));
    };
    const superCup = (h) => won(h).some((n) => /Super|Shield|Supercopa|Supercoppa|Trophée|Supertaça|Schaal|Pepe Reyes|President's Cup/i.test(n) && !EURO.includes(n));
    const titles = hist.filter((h) => h.pos === 1);
    const trophies = titles.length + hist.reduce((a, h) => a + won(h).length, 0);
    const euroWon = new Set(hist.flatMap((h) => won(h).filter((n) => EURO.includes(n))));
    // Clubs taken up through the divisions without a break.
    const runs = [];
    hist.forEach((h, i) => { if (i === 0 || hist[i - 1].club !== h.club) runs.push([h]); else runs[runs.length - 1].push(h); });
    return {
      hist, titles, trophies, euroWon,
      countries: new Set(hist.map(country)),
      titleCountries: new Set(titles.map(country)),
      clubs: new Set(hist.map((h) => h.club)),
      promos: hist.filter(isPromo).length,
      double: hist.some((h) => h.pos === 1 && tier(h) === 1 && domesticCup(h)),
      treble: hist.some((h) => h.pos === 1 && tier(h) === 1 && domesticCup(h) && won(h).includes("Champions League")),
      superCup: hist.some(superCup),
      l2ToPl: runs.some((r) => r.some((h) => h.league === "L2") && r.some((h, i) => h.league === "PL" && r.slice(0, i).some((x) => x.league === "L2"))),
      ragsToRiches: runs.some((r) => r.some((h, i) => h.pos === 1 && tier(h) === 1 && r.slice(0, i).some((x) => tier(x) >= 2))),
      invincible: hist.some((h) => h.l === 0 && h.w + h.d >= 20),
      centurion: hist.some((h) => h.pts >= 100),
      escape: hist.some((h) => h.E && h.n && h.E >= h.n - 2 && !h.relegated && h.pos <= h.n - 3),
      overachieve: hist.some((h) => h.E && h.E - h.pos >= 8),
      seasons: hist.length,
      rep: Math.max(0, ...hist.map((h) => h.rep || 0)),
      derbyWins: Object.values(J.derbies || {}).reduce((a, r) => a + r.w, 0),
      matches: J.stints.reduce((a, s) => a + s.w + s.d + s.l, 0),
      wins: J.stints.reduce((a, s) => a + s.w, 0),
      feats: J.feats || {},
    };
  }

  // [id, icon, name, description, check(ctx)]; `live: true` checks use running
  // totals (matches, derbies, reputation) rather than the season history.
  const LIST = [
    ["first-win", "👟", "Off the mark", "Win your first match as a manager.", (c) => c.wins > 0, true],
    ["first-trophy", "🏆", "Silverware", "Win your first trophy.", (c) => c.trophies > 0],
    ["promotion", "⬆️", "Going up", "Win promotion.", (c) => c.promos > 0],
    ["promotions-3", "🪜", "Promotion specialist", "Win promotion three times.", (c) => c.promos >= 3],
    ["title", "👑", "Champions", "Win a league title.", (c) => c.titles.length > 0],
    ["titles-5", "🏰", "Dynasty", "Win five league titles.", (c) => c.titles.length >= 5],
    ["title-countries", "🌍", "Conquer the continent", "Win league titles in three different countries.", (c) => c.titleCountries.size >= 3],
    ["double", "✌️", "The Double", "Win a top-flight title and the domestic cup in the same season.", (c) => c.double],
    ["treble", "🔱", "The Treble", "League, domestic cup and Champions League in one season.", (c) => c.treble],
    ["ucl", "⭐", "Kings of Europe", "Win the Champions League.", (c) => c.euroWon.has("Champions League")],
    ["euro-set", "🌟", "The full set", "Win the Champions League, the Europa League and the Conference League.", (c) => EURO.every((n) => c.euroWon.has(n))],
    ["super-cup", "🛡️", "Curtain-raiser", "Win a super cup.", (c) => c.superCup],
    ["l2-to-pl", "🚀", "All the way up", "Take one club from League Two to the Premier League.", (c) => c.l2ToPl],
    ["rags-to-riches", "📈", "Rags to riches", "Win a top-flight title with a club you first managed in a lower division.", (c) => c.ragsToRiches],
    ["invincibles", "🧱", "Invincibles", "Go a whole league season unbeaten.", (c) => c.invincible],
    ["centurions", "💯", "Centurions", "Reach 100 points in a league season.", (c) => c.centurion],
    ["escape", "🧗", "Great escape", "Stay up with a club the board expected to go down.", (c) => c.escape],
    ["overachiever", "🎯", "Punching above your weight", "Finish eight or more places above the board's expectation.", (c) => c.overachieve],
    ["giant-killer", "🪓", "Giant-killer", "Knock a much stronger club (12+ rating points) out of a cup.", (c) => !!c.feats["giant-killer"]],
    ["comeback", "🔄", "Never in doubt", "Win a match after trailing by two goals at half-time.", (c) => !!c.feats.comeback],
    ["derby-king", "🔥", "Derby king", "Win ten derbies.", (c) => c.derbyWins >= 10, true],
    ["investors", "💼", "Money talks", "Bring investors into your club.", (c) => !!c.feats.investors],
    ["journeyman", "🧳", "Journeyman", "Manage five different clubs.", (c) => c.clubs.size >= 5],
    ["globetrotter", "✈️", "Globetrotter", "Manage in three different countries.", (c) => c.countries.size >= 3],
    ["seasons-10", "📅", "A decade in the dugout", "Complete ten seasons.", (c) => c.seasons >= 10],
    ["seasons-25", "🗓️", "Quarter of a century", "Complete 25 seasons.", (c) => c.seasons >= 25],
    ["matches-1000", "🎖️", "A thousand games", "Manage 1,000 matches.", (c) => c.matches >= 1000, true],
    ["world-class", "🌐", "World-class", "Reach a reputation of 90.", (c) => Math.max(c.rep, Math.round(c.liveRep || 0)) >= 90, true],
  ].map(([id, icon, name, desc, check, live]) => ({ id, icon, name, desc, check, live: !!live }));

  // Check every achievement; returns the ones unlocked just now. History-based
  // ones are dated to the season they were first earned.
  function update(state) {
    if (!state.job || !state.history) return [];
    const J = state.job;
    J.ach = J.ach || {};
    const todo = LIST.filter((a) => !J.ach[a.id]);
    if (!todo.length) return [];
    const now = state.history.length;
    const full = context(state, now);
    full.liveRep = J.rep;
    const fresh = [];
    for (const a of todo) {
      if (!a.check(full)) continue;
      let when = state.history.length ? state.history[now - 1].season : Game.seasonLabel(state.season);
      if (a.live) when = Game.seasonLabel(state.season);
      else if (a.id in full.feats) when = full.feats[a.id];
      else {
        for (let k = 1; k <= now; k++) {
          if (a.check(context(state, k))) { when = state.history[k - 1].season; break; }
        }
      }
      J.ach[a.id] = when;
      fresh.push(a);
    }
    return fresh;
  }

  // A one-off feat (giant-killing, comeback, investors), then a check.
  function feat(state, id) {
    const J = state.job;
    if (!J) return [];
    J.feats = J.feats || {};
    if (!J.feats[id]) J.feats[id] = Game.seasonLabel(state.season);
    return update(state);
  }

  // Every achievement with whether (and when) it was unlocked.
  function all(state) {
    const got = (state.job && state.job.ach) || {};
    return LIST.map((a) => ({ id: a.id, icon: a.icon, name: a.name, desc: a.desc, when: got[a.id] || null }));
  }

  return { LIST, update, feat, all };
})();
