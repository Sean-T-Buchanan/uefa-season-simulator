// UI: renders game state into the page and wires up controls.

(() => {
  const $ = (s) => document.querySelector(s);
  const money = Game.fmtMoney;
  const pct = (p) => `${Math.round(p * 100)}%`;

  let state = null;
  let setupCountry = "ENG";
  let setupLeague = "PL";
  let selectedTeam = null;
  let lastResult = null;
  let sideTab = "table";
  let projTimer = null;
  let saveTimer = null;
  let projection = null;
  let viewLeague = null; // division shown in the Table and Clubs tabs
  let page = "club";     // club | analysis | records
  let recView = { season: null, lid: null, sel: null, club: null };
  let euroView = null; // competition shown on the Europe page
  let cupView = { cid: null, cup: null }; // country and cup shown on the Cups page

  // ---- Helpers ------------------------------------------------------------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function inkFor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#111" : "#fff";
  }

  // Club crest if one is bundled, otherwise a coloured circle with the short code.
  function badge(team, size = "") {
    const key = team.id || team.short;
    if (CRESTS.has(key)) {
      return `<span class="badge crest ${size}" aria-hidden="true"><img src="${CREST_DIR}${key}.png" alt="" loading="lazy"></span>`;
    }
    return `<span class="badge ${size}" style="background:${team.color};color:${inkFor(team.color)}" aria-hidden="true">${esc(team.short)}</span>`;
  }

  const team = (id) => state.teams[id];
  const total = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const isMine = (m) => m.h === state.myTeam || m.a === state.myTeam;
  // True while matches are still to be played (regular season or play-offs).
  const active = () => state.phase === "season" || state.phase === "playoffs" || state.phase === "postseason";

  // Careers save automatically: straight after a match, a moment after other changes.
  function saveNow() {
    clearTimeout(saveTimer);
    if (!state) return Promise.resolve(false);
    const status = $("#save-status");
    return Careers.save(state).then((ok) => {
      if (status) status.textContent = ok === false ? "⚠️ Not saved" : "Saved";
      return ok;
    });
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }

  function ago(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    if (s < 86400 * 7) return `${Math.round(s / 86400)} day${s < 86400 * 1.5 ? "" : "s"} ago`;
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  // A yes/no question in the confirm dialog. Resolves to true on OK.
  function confirmBox(title, text, ok) {
    const dlg = $("#confirm-dialog");
    $("#confirm-title").textContent = title;
    $("#confirm-text").textContent = text;
    $("#confirm-ok").textContent = ok;
    return new Promise((resolve) => {
      const done = (v) => { dlg.close(); resolve(v); };
      $("#confirm-ok").onclick = () => done(true);
      $("#confirm-cancel").onclick = () => done(false);
      dlg.oncancel = () => resolve(false);
      dlg.showModal();
    });
  }

  // A reputation (0–100) as five stars.
  const stars =(rep) => "★".repeat(Math.max(1, Math.round(rep / 20))) + "☆".repeat(5 - Math.max(1, Math.round(rep / 20)));

  // League positions that lead to Europe in a top flight, from the country's
  // current UEFA ranking: { ucl: Champions League places, total: all places }.
  function euroZones(def) {
    const ranking = state ? Europe.ranking(state).filter((r) => !r.banned) : [];
    const rank = ranking.findIndex((r) => r.cid === def.country) + 1 || Leagues.RANK[def.country] || 55;
    if (!rank || def.country === "RUS") return { ucl: 0, total: 0 };
    const slots = Europe.accessFor(rank).filter((x) => typeof x.src === "number");
    return { ucl: slots.filter((x) => x.comp === "UCL").length, total: slots.length };
  }

  // Zone of a finishing position: { cls, label } for table colouring.
  function zoneOf(def, pos, n) {
    const z = def.zones;
    if (def.tier === 1) {
      const e = euroZones(def);
      if (pos <= e.ucl) return { cls: "z-up", label: "Champions League" };
      if (pos <= e.total) return { cls: "z-eu", label: "Europe" };
      if (z.relPlayoff && pos === z.relPlayoff) return { cls: "z-po", label: "Relegation play-off" };
    } else {
      if (pos <= (z.autoUp || 0)) return { cls: "z-up", label: "Promotion" };
      if (z.playoff && pos >= z.playoff[0] && pos <= z.playoff[1]) return { cls: "z-po", label: "Play-offs" };
    }
    if (z.down && pos > n - z.down) return { cls: "z-down", label: "Relegation" };
    return { cls: "", label: "" };
  }

  function zoneLegend(def) {
    const z = def.zones;
    const items = def.tier === 1
      ? [["--zone-up", "Champions League"], ["--zone-eu", "Europe"], ...(z.relPlayoff ? [["--zone-po", "Relegation play-off"]] : []), ...(z.down ? [["--zone-down", "Relegation"]] : [])]
      : [["--zone-up", "Promotion"], ["--zone-po", "Play-offs"], ...(z.down ? [["--zone-down", def.tier === 4 ? "Relegation (out of EFL)" : "Relegation"]] : [])];
    return `<div class="zone-legend">${items.map(([c, l]) => `<span style="--c:var(${c})">${l}</span>`).join("")}</div>`;
  }

  // Clubs in a division as { id, name, short, rating, color } from the data.
  function divisionClubs(lid) {
    const def = Game.leagueDef(lid);
    return def.teams.map((t) => ({ id: def.country === "ENG" ? t[1] : `${def.country}_${t[1]}`, name: t[0], short: t[1], rating: t[2], color: t[3] }));
  }

  // ---- Setup screen -------------------------------------------------------

  function resetView() {
    page = "club";
    lastResult = null;
    viewLeague = null;
    euroView = null;
    projection = null;
    cupView = { cid: null, cup: null };
    recView = { season: null, lid: null, sel: null, club: null };
  }

  function showSetup() {
    resetView();
    $("#game").hidden = true;
    $("#setup").hidden = false;
    renderCareers();
    renderSetup();
  }

  // ---- Careers --------------------------------------------------------------

  function renderCareers(message = "") {
    const el = $("#career-list");
    Careers.list().then((list) => {
      const note = message ? `<div class="alert ${message.startsWith("⚠️") ? "warn" : ""}">${esc(message)}</div>` : "";
      if (!list.length) {
        el.innerHTML = note + (Game.hasOldSave()
          ? `<p class="muted small">Your previous career was saved before the European expansion and can't be continued. Pick a club below to start a new one.</p>`
          : `<p class="muted small">No saved careers yet. Pick a club below to start one: it's saved automatically as you play, and you can keep as many careers as you like.</p>`);
        return;
      }
      el.innerHTML = note + list.map(careerCard).join("");
    });
  }

  function careerCard(m) {
    const club = { id: m.club, short: m.short, color: m.color };
    const status = m.phase === "retired" ? "Retired" : m.phase === "summary" ? "Season complete" : m.mdTotal ? `Matchday ${m.md}/${m.mdTotal}` : "";
    const details = [Game.seasonLabel(m.season), status, m.pos && m.phase === "season" ? ordinal(m.pos) : "",
      `${m.seasons} season${m.seasons === 1 ? "" : "s"} completed`, m.trophies ? `🏆 ${m.trophies}` : "", m.clubs > 1 ? `${m.clubs} clubs` : ""].filter(Boolean);
    return `<div class="career-card" data-career="${esc(m.id)}">
      ${badge(club, "lg")}
      <div class="grow">
        <div class="career-name">${esc(m.name)}</div>
        <div class="small">${m.manager ? `${esc(m.manager)} · ` : ""}${esc(m.clubName)} · ${m.flag} ${esc(m.leagueName)}${m.rep != null ? ` · <span data-tip="Manager reputation ${m.rep}/100">${stars(m.rep)}</span>` : ""}</div>
        <div class="muted small">${details.join(" · ")}</div>
        <div class="muted tiny">Last played ${ago(m.updated)}</div>
      </div>
      <div class="career-btns">
        <button class="btn primary small" data-act="open">Continue</button>
        <button class="btn ghost small" data-act="rename">Rename</button>
        <button class="btn ghost small" data-act="copy" data-tip="Make a copy to try something different. The original stays as it is.">Copy</button>
        <button class="btn ghost small" data-act="export" data-tip="Download this career as a file: a backup, or to move it to another browser">Export</button>
        <button class="btn ghost small danger-text" data-act="delete">Delete</button>
      </div>
    </div>`;
  }

  function openCareer(id) {
    Careers.load(id).then((st) => {
      if (!st) { renderCareers("⚠️ That career couldn't be loaded."); return; }
      state = st;
      resetView();
      showGame();
    });
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("#career-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    const card = e.target.closest("[data-career]");
    if (!b || !card) return;
    const id = card.dataset.career;
    const name = card.querySelector(".career-name").textContent;
    const act = b.dataset.act;
    if (act === "open") openCareer(id);
    else if (act === "copy") Careers.duplicate(id).then((m) => renderCareers(m ? `Copied: “${m.name}”.` : "⚠️ That career couldn't be copied."));
    else if (act === "export") {
      Careers.exportText(id).then((text) => {
        if (text) download(`${name.replace(/[^\w\- ]+/g, "").trim() || "career"}.pyramid-manager.json`, text);
      });
    } else if (act === "delete") {
      confirmBox("Delete this career?", `“${name}” will be deleted for good. Export it first if you might want it back.`, "Delete")
        .then((ok) => { if (ok) Careers.remove(id).then(() => renderCareers()); });
    } else if (act === "rename") {
      const dlg = $("#rename-dialog");
      const input = $("#rename-input");
      input.value = name;
      $("#rename-form").onsubmit = (ev) => {
        ev.preventDefault();
        dlg.close();
        if (input.value.trim()) Careers.rename(id, input.value).then(() => renderCareers());
      };
      $("#rename-cancel").onclick = () => dlg.close();
      dlg.showModal();
      input.select();
    }
  });

  $("#import-btn").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    file.text().then((text) => Careers.importText(text))
      .then((m) => renderCareers(`Imported: “${m.name}”.`))
      .catch((err) => renderCareers(`⚠️ ${err.message}`));
  });

  // Club finances for the picker, from a throwaway career.
  let previewState = null;
  function clubPreview(id) {
    if (!previewState) previewState = Game.newGame(LEAGUES[0].teams[0][1]);
    return Game.forecast(previewState, id);
  }

  function renderSetup() {
    const sel0 = $("#country-select");
    if (!sel0.options.length) {
      sel0.innerHTML = Leagues.COUNTRY_ORDER.filter((cid) => Leagues.COUNTRY[cid].divisions.length)
        .map((cid) => `<option value="${cid}">${Leagues.COUNTRY[cid].flag} ${esc(Leagues.COUNTRY[cid].name)}</option>`).join("");
    }
    sel0.value = setupCountry;
    const divs = Leagues.COUNTRY[setupCountry].divisions;
    if (!divs.includes(setupLeague)) setupLeague = divs[0];
    $("#league-tabs").innerHTML = divs.map((lid) => {
      const l = Game.leagueDef(lid);
      return `<button role="tab" data-league="${lid}" class="${lid === setupLeague ? "active" : ""}" aria-selected="${lid === setupLeague}">${esc(l.name)}</button>`;
    }).join("");
    const rows = divisionClubs(setupLeague).sort((a, b) => b.rating - a.rating);
    const n = rows.length;
    $("#team-grid").innerHTML = rows.map((c, i) => {
      // Season forecast for the club (turnover and wage bill).
      const fc = clubPreview(c.id);
      const tier = i < n * 0.2 ? "Favourite" : i < n * 0.5 ? "Contender" : i < n * 0.8 ? "Underdog" : "Long shot";
      return `
        <button class="team-card ${selectedTeam === c.id ? "selected" : ""}" data-team="${c.id}">
          ${badge(c)}
          <div class="grow">
            <div class="name">${esc(c.name)}</div>
            <div class="meta">${tier}<br><span style="white-space:nowrap">Turnover ${money(fc.revenue)}</span> · <span style="white-space:nowrap">Wages ${money(fc.costs.wages)}</span></div>
          </div>
          <span class="rating-pill num" title="Squad rating">${c.rating}</span>
        </button>`;
    }).join("");
    const sel = selectedTeam && previewState && previewState.teams[selectedTeam];
    $("#setup-selection").innerHTML = sel ? `Manage <strong>${esc(sel.name)}</strong>?` : "Select a club to manage.";
    $("#start-btn").disabled = !sel;
  }

  $("#country-select").addEventListener("change", (e) => {
    setupCountry = e.target.value;
    setupLeague = Leagues.COUNTRY[setupCountry].divisions[0];
    renderSetup();
  });

  $("#league-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-league]");
    if (!b) return;
    setupLeague = b.dataset.league;
    renderSetup();
  });
  $("#team-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-team]");
    if (!b) return;
    selectedTeam = b.dataset.team;
    renderSetup();
  });
  $("#start-btn").addEventListener("click", () => {
    if (!selectedTeam) return;
    const name = $("#manager-name").value.trim();
    state = Game.newGame(selectedTeam, { name, sackable: $("#sackable").checked });
    Careers.stamp(state, state.teams[selectedTeam].name);
    resetView();
    saveNow();
    showGame();
  });

  // ---- Game screen --------------------------------------------------------

  function showGame() {
    $("#setup").hidden = true;
    $("#game").hidden = false;
    $("#save-status").textContent = "";
    window.scrollTo(0, 0);
    showPage("club");
    renderAll();
    if (Game.pendingDecision(state)) showJobDialog();
    else if (state.phase === "summary") showSummary();
  }

  function renderAll() {
    renderTopbar();
    renderResources();
    renderStrength();
    renderBoard();
    renderStadium();
    renderMatchCard();
    renderTactics();
    renderLatest();
    renderNews();
    renderSide();
    scheduleProjection(0);
    renderPage();
  }

  // Back to the careers screen (the career is saved first).
  $("#careers-btn").addEventListener("click", () => {
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    saveNow().then(() => { state = null; selectedTeam = null; showSetup(); window.scrollTo(0, 0); });
  });

  function myPosition() {
    return Game.table(state).findIndex((r) => r.id === state.myTeam) + 1;
  }

  function renderTopbar() {
    const t = team(state.myTeam);
    const def = Game.leagueDef(state.league);
    const who = state.job && state.job.name ? `${esc(state.job.name)} · ` : "";
    $("#club-id").innerHTML = `${badge(t)}<div><div class="name">${esc(t.name)}</div><div class="sub">${who}${Game.seasonLabel(state.season)} · ${Leagues.COUNTRY[def.country].flag} ${esc(def.name)}</div></div>`;
    const played = state.results.length;
    const conf = Math.round(Managers.board(state, state.myTeam).conf);
    const stats = [
      state.phase === "playoffs"
        ? ["Stage", "Play-offs"]
        : ["Matchday", `${Math.min(played + (state.phase === "season" ? 1 : 0), state.fixtures.length)} / ${state.fixtures.length}`],
      ["Position", played ? ordinal(myPosition()) : "—"],
      ["Available", money(Game.cash(state))],
      ["Squad rating", t.rating.toFixed(1)],
      ["Board", `<span class="${conf < 25 ? "neg" : ""}" data-tip="Board confidence: ${Managers.security(conf).toLowerCase()}">${conf}%</span>`],
    ];
    $("#topbar-stats").innerHTML = stats.map(([l, v]) =>
      `<div class="stat"><div class="label">${l}</div><div class="value num">${v}</div></div>`).join("");
  }

  // ---- Resources ----------------------------------------------------------

  function renderResources() {
    const tw = Game.transferWindow(state);
    const chip = $("#window-chip");
    chip.textContent = state.phase === "playoffs" ? "🏆 Play-offs · transfers closed"
      : state.phase !== "season" ? "Season over" : tw.open ? `🟢 ${tw.name}` : "🔒 Transfer window closed";
    chip.className = `chip ${tw.open && state.phase === "season" ? "open" : ""}`;

    $("#alloc-list").innerHTML = INVESTMENTS.map((d) => `
      <div class="alloc" data-id="${d.id}">
        <div class="alloc-top">
          <span class="alloc-name">${d.icon} ${esc(d.name)}</span>
          <span class="alloc-amount num"></span>
        </div>
        <div class="alloc-desc">${esc(d.desc)}</div>
        <input type="range" min="0" step="any" aria-label="${esc(d.name)} spend">
        <div class="alloc-bottom">
          <span class="alloc-effect"></span>
          <span class="lock-note"></span>
        </div>
      </div>`).join("");
    updateResourceValues();
  }

  function updateResourceValues() {
    const e = Game.effects(state);
    const tw = Game.transferWindow(state);
    const cash = Game.cash(state);
    const max = Math.max(Game.spent(state) + cash, 0.01);
    const fin = state.fin[state.myTeam];
    const safe = Game.safeToSpend(state);
    const end = Game.projectedBank(state, state.myTeam);
    $("#cash").innerHTML = `
      <div><div class="big num">${money(Math.max(0, cash))}</div><div class="label">available to spend</div>
        <div class="safe small">Safe to spend <b class="num">${money(safe)}</b></div></div>
      <div class="right num">Bank ${money(fin.bank)} · credit ${money(fin.credit)}<br>
        <span class="${end < 0 ? "neg" : ""}" data-tip="Your bank balance at the end of the league season if you spend nothing more">Season-end forecast ${money(end)}</span>
        ${fin.embargo ? `<br><span class="neg">⛔ Transfer embargo</span>` : ""}</div>`;

    for (const d of INVESTMENTS) {
      const row = document.querySelector(`.alloc[data-id="${d.id}"]`);
      const input = row.querySelector("input");
      const can = Game.canAdjust(state, d.id);
      const v = state.invest[d.id], locked = state.locked[d.id];
      input.max = max;
      input.value = v;
      input.disabled = !can;
      input.style.setProperty("--val", `${(v / max) * 100}%`);
      input.style.setProperty("--locked", `${(locked / max) * 100}%`);
      row.classList.toggle("disabled", !can);
      row.querySelector(".alloc-amount").textContent = money(v);
      row.querySelector(".alloc-effect").textContent = d.effectLabel(e[d.id]);
      let note = "";
      if (state.live) note = "⏸ Locked until full time";
      else if (active() && d.group === "transfer" && !tw.open) {
        note = tw.opensIn ? `🔒 Window opens in ${tw.opensIn} MD` : "🔒 Window closed";
      } else if (locked > 0) {
        note = `🔒 ${money(locked)} committed`;
      }
      row.querySelector(".lock-note").textContent = note;
    }
  }

  function onInvestmentChanged() {
    if (page === "analysis") renderAnalysis();
    if (page === "finances") renderFinances();
    updateResourceValues();
    renderStrength();
    renderStadium();
    renderMatchCard();
    renderTopbar();
    if (sideTab === "fixtures") renderSide();
    scheduleProjection();
    scheduleSave();
  }

  $("#alloc-list").addEventListener("input", (e) => {
    const row = e.target.closest(".alloc");
    if (!row || !active()) return;
    Game.setInvestment(state, row.dataset.id, parseFloat(e.target.value));
    onInvestmentChanged();
  });

  const BALANCED = { attack: 0.28, midfield: 0.14, defence: 0.28, coaching: 0.1, medical: 0.07, stadium: 0.05, academy: 0.08 };
  $("#preset-balanced").addEventListener("click", () => {
    if (!active()) return;
    const open = INVESTMENTS.filter((d) => Game.canAdjust(state, d.id));
    const total = open.reduce((a, d) => a + BALANCED[d.id], 0);
    const amount = Game.safeToSpend(state);
    for (const d of open) Game.setInvestment(state, d.id, state.invest[d.id] + amount * BALANCED[d.id] / total);
    onInvestmentChanged();
  });
  $("#preset-clear").addEventListener("click", () => {
    if (!active()) return;
    for (const d of INVESTMENTS) Game.setInvestment(state, d.id, 0);
    onInvestmentChanged();
  });

  function renderStrength() {
    const base = team(state.myTeam).rating;
    const s = Game.strength(state, state.myTeam);
    const ts = state.teamState[state.myTeam];
    const tile = (label, v, d) => `
      <div class="tile">
        <div class="label">${label}</div>
        <div class="value num">${v.toFixed(1)}</div>
        <div class="delta num ${d < 0 ? "neg" : ""}">${d >= 0 ? "+" : ""}${d.toFixed(1)} vs base</div>
      </div>`;
    const form = Game.formValue(ts ? ts.form : []);
    const fat = Tactics.fatigue(state, state.myTeam);
    const tired = fat > Tactics.FATIGUE_FREE + 0.5;
    const bans = (ts && ts.bans) || [];
    const banAmt = Math.min(3, bans.reduce((t, b) => t + b.amt, 0));
    const cond = ts && ts.injury ? "🤕 Injuries" : bans.length ? "🚫 Suspension" : fat >= 5 ? "🥵 Exhausted" : tired ? "😮‍💨 Tiring" : form > 0.4 ? "🔥 In form" : form < -0.4 ? "📉 Poor form" : "✅ Fit";
    const sub = ts && ts.injury ? `${ts.injury.matches} MD left` : bans.length ? `−${banAmt.toFixed(1)} · ${Math.max(...bans.map((b) => b.left))} match${Math.max(...bans.map((b) => b.left)) === 1 ? "" : "es"} left` : tired ? `Fatigue ${fat.toFixed(1)}/${Tactics.MAX_FATIGUE}` : `Form ${form >= 0 ? "+" : ""}${form.toFixed(1)}`;
    const me = team(state.myTeam);
    const age = me.age || 26.5;
    const aeff = Game.ageEffect(age);
    const golden = me.golden ? ` A golden generation is coming through (+${me.golden.boost.toFixed(1)} a season, ${me.golden.left} more season${me.golden.left === 1 ? "" : "s"}).` : "";
    $("#strength").classList.add("four");
    $("#strength").innerHTML =
      tile("Attack", s.att, s.att - base) + tile("Defence", s.def, s.def - base) +
      `<div class="tile" data-tip="Average age of your squad. Squads improve until about ${Game.PEAK_AGE[0]}, peak until about ${Game.PEAK_AGE[1]} and then decline. Every summer they age a year; signings and academy graduates bring it down, and a title-winning squad tends to stay together and grow old.${golden}">
        <div class="label">Squad age</div>
        <div class="value num">${age.toFixed(1)}${me.golden ? " 🌱" : ""}</div>
        <div class="delta ${aeff < 0 ? "neg" : ""}">${Game.ageWord(age)}${aeff ? ` · ${signed(aeff)}/yr` : ""}</div>
      </div>` +
      `<div class="tile" data-tip="Includes tactics, familiarity with your formation, fatigue and form. Fatigue builds with high pressing and midweek games, and raises the injury risk.">
        <div class="label">Condition</div>
        <div class="value" style="font-size:14px;margin-top:3px">${cond}</div>
        <div class="delta ${(ts && ts.injury) || bans.length || tired ? "neg" : ""}">${sub}</div>
      </div>`;
  }

  // ---- Board ------------------------------------------------------------------

  function renderBoard() {
    const el = $("#board");
    const J = state.job;
    const b = Managers.board(state, state.myTeam);
    const conf = Math.round(b.conf);
    const cls = conf >= 60 ? "good" : conf >= 40 ? "" : conf >= 25 ? "near" : "over";
    const stint = Managers.currentStint(state);
    el.innerHTML = `
      <div class="panel-head"><h2>Board</h2><span class="chip" data-tip="Your reputation as a manager (out of 100). It decides which clubs want you.">${stars(J.rep)} ${Math.round(J.rep)}</span></div>
      <div class="small">Objective: <b>${esc(b.obj || "—")}</b>${b.E ? ` <span class="muted">(they expect ${ordinal(b.E)})</span>` : ""}</div>
      <div class="meter conf" role="img" aria-label="Board confidence ${conf}%"><span class="${cls}" style="width:${Math.max(2, conf)}%"></span></div>
      <div class="small board-line"><span>Confidence <b class="num">${conf}%</b> · ${Managers.security(b.conf)}</span>${J.sackable ? "" : `<span class="muted" data-tip="You chose a career where the board can't sack you">🛡️ job safe</span>`}</div>
      <div class="muted small">${b.n ? `League: ${b.pts} pts from ${b.n} games, ${signed(b.pts - b.xp)} against the odds. ` : ""}In charge since ${Game.seasonLabel(stint.season)}${stint.md ? `, MD${stint.md}` : ""}: W${stint.w} D${stint.d} L${stint.l}.</div>
      ${state.offer && state.phase !== "summary" ? offerHtml(state.offer) : ""}`;
    wireOffer(el, renderAll);
  }

  // An investment offer for your club, with Accept / Turn down.
  function offerHtml(o) {
    const T = Game.INVESTOR_TYPES[o.type];
    const strings = o.ambition ? `The board will expect ${o.ambition === 1 ? "one place" : `${o.ambition} places`} higher for the next three seasons.` : "No change to the board's expectations.";
    return `<div class="invest-offer">
      <div class="io-head">💼 <b>${esc(o.name)}</b> <span class="chip">${esc(T.label)}</span></div>
      <div class="small">${esc(o.pitch)}</div>
      <div class="small io-terms"><span>Now <b class="num">${money(o.now)}</b></span><span>Every season <b class="num">${money(o.yearly)}</b></span>${o.interest ? `<span>Interest <b class="num neg">−${money(o.interest)}</b>/season</span>` : ""}</div>
      <div class="muted small">${strings}</div>
      <div class="io-actions"><button class="btn small primary" data-offer="1">Accept</button><button class="btn small ghost" data-offer="0">Turn down</button></div>
    </div>`;
  }
  function wireOffer(el, then) {
    el.querySelectorAll("[data-offer]").forEach((b) => {
      b.onclick = () => { Game.respondOffer(state, b.dataset.offer === "1"); saveNow(); then(); };
    });
  }

  // ---- Stadium ----------------------------------------------------------------

  const seats = (n) => Math.round(n).toLocaleString("en-GB");

  function renderStadium() {
    const el = $("#stadium");
    const me = state.myTeam;
    const t = team(me);
    const g = state.stadium.gate;
    const demandNow = Game.ticketDemand(state, me, 1);
    const avgCrowd = g.games ? g.crowd / g.games : Game.crowdFor(state, me, 1);
    const avgDemand = g.games ? g.demand / g.games : demandNow;
    const turnedAway = avgDemand - t.capacity;
    const perFan = Game.ticketYield(state, me);
    const homeGames = state.fixtures.length / 2;
    const p = state.stadium.project;
    const payback = (extraSeats, cost) => {
      const filled = Math.min(extraSeats, Math.max(0, demandNow - t.capacity));
      const perSeason = (filled * perFan * homeGames) / 1e6;
      return perSeason > 0 ? cost / perSeason : null;
    };
    const demandLine = turnedAway > t.capacity * 0.02
      ? `Demand is about <b>${seats(avgDemand)}</b> a game, so roughly <b>${seats(turnedAway)}</b> fans miss out each week. More seats would sell.`
      : `Demand is about <b>${seats(avgDemand)}</b> a game, so the ground is ${Math.round((avgCrowd / t.capacity) * 100)}% full. Extra seats won't sell until demand grows (promotion, a good run, or Fans & Matchday spending).`;
    const options = Game.stadiumOptions(state).map((o) => {
      const pb = payback(o.seats, o.cost);
      return `<div class="stad-opt">
        <div class="stad-top"><span class="name">${esc(o.name)} <span class="muted">+${seats(o.seats)}</span></span><span class="num cost">${money(o.cost)}</span></div>
        <div class="muted small">${esc(o.desc)} ${pb ? `Pays back in about <b>${pb < 1 ? "<1" : pb.toFixed(1)}</b> season${pb >= 1 && pb < 1.05 ? "" : "s"} at current demand.` : "No payback at current demand."}</div>
        <button class="btn small" data-build="${o.id}" ${o.blocked ? "disabled" : ""}>${o.blocked ? esc(o.blocked) : "Build"}</button>
      </div>`;
    }).join("");
    el.innerHTML = `
      <div class="panel-head"><h2>Stadium</h2><span class="muted small">£${perFan} per fan per game</span></div>
      <div class="strength stad-tiles">
        <div class="tile"><div class="label">Capacity</div><div class="value num">${seats(t.capacity)}</div></div>
        <div class="tile"><div class="label">Avg crowd</div><div class="value num">${seats(avgCrowd)}</div>
          <div class="delta">${g.games ? `${g.soldOut}/${g.games} sell-outs` : "forecast"}</div></div>
        <div class="tile"><div class="label">Gate money</div><div class="value num">${money(g.revenue)}</div><div class="delta">this season</div></div>
      </div>
      <p class="small stad-demand">${demandLine}</p>
      ${p ? `<div class="stad-project">🏗️ <b>${esc(p.name)}</b> under way (+${seats(p.seats)} seats). ${p.opensSeason > state.season ? `Opens ${Game.seasonLabel(p.opensSeason)}.` : `Opens after matchday ${p.opensMd}.`}</div>` : ""}
      <div class="stad-opts">${options}</div>`;
    el.querySelectorAll("[data-build]").forEach((b) => {
      b.onclick = () => {
        if (Game.buildStadium(state, b.dataset.build)) { saveNow(); renderAll(); }
      };
    });
  }

  // ---- Match centre -------------------------------------------------------

  function wdlBar(p, cls, label) {
    const seg = (k, v, name) => `<div class="seg ${k}" style="flex-grow:${Math.max(v, 0.001)}" data-tip="${name} ${pct(v)}">${v >= 0.08 ? pct(v) : ""}</div>`;
    return `<div class="wdl-row ${cls}"><div class="label">${label}</div>
      <div class="wdl" role="img" aria-label="${label}: win ${pct(p.win)}, draw ${pct(p.draw)}, loss ${pct(p.loss)}">
        ${seg("w", p.win, "Win")}${seg("d", p.draw, "Draw")}${seg("l", p.loss, "Loss")}
      </div></div>`;
  }

  function resultFlash() {
    if (!lastResult) return "";
    const m = lastResult;
    const opp = team(m.home ? m.a : m.h);
    const my = m.home ? m.hg : m.ag, their = m.home ? m.ag : m.hg;
    const verb = { W: "Won", D: "Drew", L: "Lost" }[m.res];
    const where = m.neutral ? "against" : m.home ? "vs" : "at";
    let text = `${verb} ${my}–${their} ${where} ${esc(opp.name)}`;
    if (m.kind !== "league") {
      const prefix = m.kind === "cup" || m.kind === "euro" ? `${m.cupName} ${m.roundName.toLowerCase()}` : m.roundName;
      text = `${prefix}: ${text}${m.aet && !m.pens ? " after extra time" : ""}`;
      if (m.pens) text += m.through ? ", won on penalties" : ", lost on penalties";
      if (m.kind === "playoff" && m.round != null) {
        if (m.round === 1) text += m.through ? " — through to Wembley!" : " — knocked out.";
        if (m.round === 2 && m.through) text += " — PROMOTED!";
      } else if (m.through !== undefined) {
        text += m.through ? (m.final ? " — WINNERS! 🏆" : " — through!") : (m.final ? " — runners-up." : " — knocked out.");
      }
    }
    const res = m.through !== undefined && m.res === "D" ? (m.through ? "W" : "L") : m.res;
    return `<div class="result-flash"><span class="res ${res}">${res}</span><span>${text}</span></div>`;
  }

  // ---- Match reports: goal times, stats, half-time ----------------------------

  const minText = (e) => `${e.min}${e.plus ? `+${e.plus}` : ""}′`;
  const HOW = { penalty: "penalty", header: "header", "free kick": "free kick", "long range": "from distance", "own goal": "own goal" };

  // A match report: the score, goals minute by minute and the stats.
  // `rep` is state.lastMatch (or the half-time picture); `opts.ht` for half-time.
  function matchReportHtml(rep, opts = {}) {
    const h = team(rep.h), a = team(rep.a);
    const hg = opts.ht ? rep.ht[0] : rep.hg, ag = opts.ht ? rep.ht[1] : rep.ag;
    const events = rep.events.map((e) => {
      const t = e.side === "h" ? h : a;
      const mine = t.id === state.myTeam ? "mine" : "";
      if (e.card) {
        const what = e.card === "Y" ? "🟨 Booking" : e.card === "2Y" ? "🟨🟥 Second booking: sent off" : "🟥 Straight red: sent off";
        return `<li class="ev card ${e.card === "Y" ? "yc" : "rc"} ${e.side} ${mine}" data-t="${e.min + e.plus / 10}">
          <span class="ev-min num">${minText(e)}</span>${badge(t, "sm")}<span class="ev-txt">${what} <span class="muted">· ${esc(t.short)}</span></span></li>`;
      }
      return `<li class="ev goal ${e.side} ${mine}" data-t="${e.min + e.plus / 10}">
        <span class="ev-min num">${minText(e)}</span>${badge(t, "sm")}<span class="ev-txt">⚽ ${esc(t.name)}${e.how ? ` <span class="muted">· ${HOW[e.how] || e.how}</span>` : ""}</span></li>`;
    }).join("");
    const s = rep.stats;
    const bar = (label, v, fmt = (x) => x) => {
      const tot = v[0] + v[1] || 1;
      return `<div class="st-row"><span class="num">${fmt(v[0])}</span><div class="st-bar" aria-label="${label}: ${fmt(v[0])} to ${fmt(v[1])}">
        <i style="width:${(v[0] / tot) * 100}%"></i></div><span class="num">${fmt(v[1])}</span><span class="st-label">${label}</span></div>`;
    };
    const pens = rep.shootout ? `<div class="rep-note">${esc((rep.pens === "h" ? h : a).name)} win ${Math.max(...rep.shootout)}–${Math.min(...rep.shootout)} on penalties</div>` : rep.aet ? `<div class="rep-note">After extra time</div>` : "";
    const react = rep.react ? reactText(rep.react) : "";
    return `<div class="report ${opts.ht ? "ht" : ""}" data-final="${hg}-${ag}">
      <div class="rep-head">
        <span class="rep-team">${badge(h, "md")}<span>${esc(h.short)}</span></span>
        <span class="rep-score num"><b class="sc">${hg} – ${ag}</b><span class="rep-clock muted small">${opts.clock || (opts.ht ? "Half-time" : rep.aet ? "AET" : "Full time")}</span></span>
        <span class="rep-team right"><span>${esc(a.short)}</span>${badge(a, "md")}</span>
      </div>
      ${!opts.ht && rep.ht ? `<div class="rep-sub muted small">Half-time ${rep.ht[0]}–${rep.ht[1]}${rep.derby ? ` · 🔥 ${esc(rep.derby)}` : ""}</div>` : opts.ht && rep.derby ? `<div class="rep-sub muted small">🔥 ${esc(rep.derby)}</div>` : ""}
      ${events ? `<ul class="ev-list">${events}</ul>` : `<p class="muted small ev-none">${opts.ht ? "No goals yet." : "No goals."}</p>`}
      ${pens}
      ${!opts.ht && react ? `<div class="rep-note muted">${react}</div>` : ""}
      <div class="stats">${bar("Possession", s.poss, (x) => `${x}%`)}${bar("xG", s.xg, (x) => x.toFixed(1))}${bar("Shots", s.shots)}${bar("On target", s.onTarget)}${s.yellow ? bar("Yellow cards", s.yellow) : ""}${s.red && (s.red[0] || s.red[1]) ? bar("Red cards", s.red) : ""}</div>
    </div>`;
  }

  // The other manager's change of approach (at half-time or after a
  // sending-off), as news at a stop (`now`) or in the report afterwards.
  function reactText(r, now = false) {
    const t = team(r.id);
    const m = Managers.of(state, r.id);
    const who = m ? `${esc(m.name)} (${esc(t.name)})` : esc(t.name);
    const red = r.why === "red";
    if (now) {
      if (red) return r.ment === "att" ? `📋 ${who} is sending the team forward to make the extra man count.`
        : r.ment === "def" ? `📋 ${who} has told the team to sit deep and hold on with fewer men.`
        : `📋 ${who} has reorganised into a balanced shape after the sending-off.`;
      return r.ment === "att" ? `📋 ${who} is sending the team forward for the second half: expect them to be more attacking.`
        : r.ment === "def" ? `📋 ${who} wants to protect the lead: expect them to sit deeper after the break.`
        : `📋 ${who} is going back to a balanced approach after the break.`;
    }
    if (red) return r.ment === "att" ? `📋 ${who} went for it with the extra man.` : r.ment === "def" ? `📋 ${who} sat deep after the sending-off.` : `📋 ${who} reorganised after the sending-off.`;
    return r.ment === "att" ? `📋 ${who} went for it after the break: more attacking.` : r.ment === "def" ? `📋 ${who} sat deeper after the break to protect the lead.` : `📋 ${who} went back to a balanced approach after the break.`;
  }

  // Reveal a report minute by minute: goals appear as the clock runs from
  // `from` to the end. Skippable; harmless if the card is re-rendered.
  let animTimer = null;
  function animateReport(from, onDone, until = null) {
    clearInterval(animTimer);
    const el = document.querySelector("#match-card .report");
    if (!el) { if (onDone) onDone(); return; }
    const evs = [...el.querySelectorAll(".ev")];
    const sc = el.querySelector(".sc"), clock = el.querySelector(".rep-clock");
    const finalClock = clock.textContent;
    const flash = document.querySelector("#match-card .result-flash");
    const end = until != null ? until : Math.max(90, ...evs.map((e) => +e.dataset.t));
    const goalsTo = (t) => {
      let h = 0, a = 0;
      evs.forEach((e) => { if (+e.dataset.t <= t && e.classList.contains("goal")) { if (e.classList.contains("h")) h++; else a++; } });
      return [h, a];
    };
    el.classList.add("anim");
    if (flash) flash.classList.add("hold");
    const skip = document.createElement("button");
    skip.className = "btn small ghost rep-skip";
    skip.textContent = "Skip";
    el.querySelector(".rep-head").after(skip);
    let t = from;
    const finish = () => {
      clearInterval(animTimer);
      evs.forEach((e) => e.classList.add("shown"));
      sc.textContent = el.dataset.final.replace("-", " – ");
      clock.textContent = finalClock;
      el.classList.remove("anim");
      if (flash) flash.classList.remove("hold");
      skip.remove();
      if (onDone) onDone();
    };
    skip.onclick = finish;
    const step = () => {
      if (!document.body.contains(el)) { clearInterval(animTimer); return; }
      t += 1;
      evs.forEach((e) => { if (+e.dataset.t <= t) e.classList.add("shown"); });
      const [h, a] = goalsTo(t);
      sc.textContent = `${h} – ${a}`;
      clock.textContent = `${Math.min(t, end)}′`;
      if (t >= end) finish();
    };
    evs.forEach((e) => { if (+e.dataset.t <= from) e.classList.add("shown"); });
    const [h0, a0] = goalsTo(from);
    sc.textContent = `${h0} – ${a0}`;
    clock.textContent = `${from}′`;
    animTimer = setInterval(step, 38);
  }

  // The report for your last match, if it's the one in the result flash.
  function lastReport() {
    const r = state.lastMatch, m = lastResult;
    if (!r || !m || r.h !== m.h || r.a !== m.a) return "";
    return matchReportHtml(r);
  }

  // Half-time: the score, the first half, your odds from here, and the second half to play.
  // A stop in your match (half-time or a sending-off): the score, what has
  // happened, what the numbers mean, your odds from here, and play on.
  function renderLivePause(card) {
    const live = state.live;
    const f = Game.nextMyEvent(state);
    const odds = Game.liveOdds(state);
    const league = f.kind === "league";
    const info = league ? null : knockoutInfo(f);
    const pause = live.pause || { kind: "ht", min: 45 };
    const red = pause.kind === "red";
    const rep = { h: live.h, a: live.a, ht: [live.hg, live.ag], events: live.events.slice().sort((x, y) => x.min - y.min || x.plus - y.plus),
      stats: live.stats || { poss: [50, 50], xg: live.xgAcc || [0, 0], shots: [0, 0], onTarget: [0, 0] }, derby: live.derby };
    const home = live.h === state.myTeam;
    const mine = home ? live.hg - live.ag : live.ag - live.hg;
    const short = odds.numbers.short; // >0: you have fewer players
    const men = (n) => ["eleven", "ten", "nine", "eight"][Math.min(3, n)];
    const lastRed = red ? live.events.filter((e) => e.card === "R" || e.card === "2Y").sort((x, y) => y.min - x.min)[0] : null;
    const redSide = lastRed ? (lastRed.side === "h" ? live.h : live.a) : null;
    const head = red ? `🟥 ${minText(lastRed)} ${redSide === state.myTeam ? "You're down to" : `${esc(team(redSide).name)} are down to`} ${men((redSide === live.h ? live.down[0] : live.down[1]))} men`
      : "⏸ Half-time";
    const pctChange = (x) => `${x >= 1 ? "+" : "−"}${Math.round(Math.abs(x - 1) * 100)}%`;
    const fewer = (n) => (n === 1 ? "a man" : `${n} men`);
    const numbers = short > 0
      ? `With ${fewer(short)} fewer, your scoring rate is <b>${pctChange(odds.numbers.mine)}</b> and theirs <b>${pctChange(odds.numbers.theirs)}</b> for the rest of the match with the set-ups as they are. Sitting deep (Defensive) limits the damage but you'll rarely score; attacking leaves gaps.`
      : short < 0
        ? `With ${fewer(-short)} more, your scoring rate is <b>${pctChange(odds.numbers.mine)}</b> and theirs <b>${pctChange(odds.numbers.theirs)}</b> for the rest of the match with the set-ups as they are. Going for it (Attacking) makes the most of the extra man.`
        : "";
    const mood = (mine > 0 ? "You're ahead." : mine < 0 ? "You're behind." : "All square.");
    card.innerHTML = `
      <div class="match-head">
        <h2 style="margin:0">${head}</h2>
        <span class="muted small">${league ? `Matchday ${f.md + 1}` : info.title}</span>
      </div>
      ${matchReportHtml(rep, { ht: true, clock: red ? `${pause.min}′` : "Half-time" })}
      ${live.react ? `<div class="ht-react">${reactText(live.react, true)}</div>` : ""}
      ${numbers ? `<div class="numbers-note small">${numbers}</div>` : ""}
      <p class="small" style="margin:10px 0 6px"><b>${mood}</b> Change your formation, mentality or pressing in the Tactics panel, then play on. The odds below update as you do.</p>
      ${wdlBar(odds, "", "From here")}
      <div class="wdl-legend"><span style="--c:var(--win)">Win</span><span style="--c:var(--draw)">Draw</span><span style="--c:var(--loss)">Loss</span></div>
      ${odds.through != null ? `<div class="advance"><span class="label">Chance of ${f.final ? "winning it" : "going through"}</span><span class="value num">${pct(odds.through)}</span></div>` : ""}
      <div class="play-actions"><button class="btn primary" id="play-on">${red ? "Play on" : "Play second half"}</button></div>`;
    $("#play-on").onclick = playOn;
  }

  // Play on from a stop: to the next stop, or to full time (then the rest of the round is played).
  function playOn() {
    const from = state.live.min;
    if (Game.resumeLive(state)) {
      saveNow();
      renderAll();
      animateReport(from, null, state.live.min);
    } else play(1, from);
  }

  const firstLegText = (l) => `1st leg: ${esc(team(l.h).name)} ${l.hg}–${l.ag} ${esc(team(l.a).name)}`;

  // Title, context line, "chance of…" label and play-button text for knockout ties.
  function knockoutInfo(f) {
    if (f.kind === "euro") {
      const lp = !f.legOne && !f.firstLeg && !f.final;
      const context = f.final ? "One match · extra time and penalties if level"
        : f.firstLeg ? `${firstLegText(f.firstLeg)} · level on aggregate goes to extra time and penalties`
        : f.legOne ? "Two legs · the 2nd leg is at the other ground"
        : "League phase · top 8 into the round of 16, 9th–24th into the knockout play-offs";
      return {
        title: `⭐ ${esc(f.compName)} · ${esc(f.name)}`, context,
        adv: lp ? null : f.final ? `Chance of winning the ${f.compName}` : "Chance of going through",
        play: `Play ${f.name.toLowerCase().replace(/, (1st|2nd) leg/, " ($1 leg)")}`,
      };
    }
    if (f.kind === "post") {
      const context = f.firstLeg ? `${firstLegText(f.firstLeg)} · level on aggregate goes to extra time`
        : f.legOne ? "Two legs · the 2nd leg is at the other ground" : "One match · extra time if level";
      return { title: `🏆 ${esc(f.series)} · ${esc(f.name)}`, context, adv: f.final ? "Chance of winning the tie" : "Chance of going through", play: `Play ${f.name.toLowerCase()}` };
    }
    if (f.kind === "playoff") {
      const context = f.round === 1 ? `${firstLegText(f.firstLeg)} · level on aggregate goes to extra time and penalties`
        : f.round === 2 ? "One match for promotion · a draw goes to extra time and penalties"
        : "Two legs · the higher seed is at home in the 2nd leg";
      return { title: `🏆 Play-offs · ${esc(f.name)}`, context, adv: f.round < 2 ? "Chance of reaching the final" : "Chance of promotion", play: `Play ${f.name.toLowerCase()}` };
    }
    const def = Game.cupDef(f.cup);
    let context;
    if (f.firstLeg) context = `${firstLegText(f.firstLeg)} · level on aggregate goes straight to penalties`;
    else if (f.legOne) context = "Two legs · the 2nd leg is at the other ground";
    else {
      const rule = f.extraTime ? "extra time and penalties if level" : "straight to penalties if level";
      context = f.neutral ? `${f.country === "ENG" ? "At Wembley" : "Neutral venue"} · ${rule}` : rule[0].toUpperCase() + rule.slice(1);
    }
    const adv = f.final ? `Chance of winning the ${def.name}` : f.legOne || f.firstLeg ? "Chance of reaching the final" : "Chance of reaching the next round";
    return { title: `🏆 ${def.name} · ${esc(f.name)}`, context, adv, play: `Play ${def.short} ${f.name.toLowerCase()}` };
  }

  function renderMatchCard() {
    const card = $("#match-card");
    if (state.phase === "retired") {
      card.innerHTML = `<h2>Career over</h2>
        <p class="muted">You retired from management. Your record stays in the History tab and on the Records page.</p>
        <div class="play-actions"><button class="btn primary" id="to-careers">Back to your careers</button></div>`;
      $("#to-careers").onclick = () => $("#careers-btn").click();
      return;
    }
    if (Game.pendingDecision(state)) {
      const p = state.job.prompt;
      card.innerHTML = `${resultFlash()}
        <h2>${p.kind === "sacked" ? "You've been sacked" : "A club wants to talk to you"}</h2>
        <p class="muted">${p.kind === "sacked" ? "Choose your next club (or retire) to carry on." : `${esc(team(p.offers[0].club).name)} have asked for permission to speak to you.`}</p>
        <div class="play-actions"><button class="btn primary" id="open-job">${p.kind === "sacked" ? "See job offers" : "Hear them out"}</button></div>`;
      $("#open-job").onclick = showJobDialog;
      return;
    }
    if (!active()) {
      card.innerHTML = `${resultFlash()}${lastReport()}
        <h2>Season complete</h2>
        <p class="muted">You finished ${ordinal(state.summary.pos)} in the ${Game.leagueDef(state.summary.league).name}.</p>
        <div class="play-actions"><button class="btn primary" id="open-summary">View season review</button></div>`;
      $("#open-summary").onclick = showSummary;
      return;
    }
    if (state.live) { renderLivePause(card); return; }
    const pv = Game.preview(state);
    const f = pv.fixture;
    const h = team(f.h), a = team(f.a);
    const lineupOf = (id) => (id === state.myTeam ? pv.tactics.mine : pv.tactics.theirs);
    const side = (t, isHome) => {
      const lu = lineupOf(t.id);
      const m = Managers.of(state, t.id);
      const boss = t.id === state.myTeam ? (state.job.name ? esc(state.job.name) : "You") : m ? esc(m.name) : "Caretaker";
      return `
      <div class="side-team ${t.id === state.myTeam ? "me" : ""}">
        ${badge(t, "xl")}
        <div class="name">${esc(t.name)}</div>
        <div class="tag">${f.neutral ? "Neutral venue" : isHome ? "Home" : "Away"} · rating ${t.rating.toFixed(0)}</div>
        <div class="tag">${Tactics.FORM[lu.form].name} · ${Tactics.MENT[lu.ment].name.toLowerCase()} · ${boss}</div>
      </div>`;
    };
    const league = f.kind === "league";
    const info = league ? null : knockoutInfo(f);
    const hint = league && state.calIdx === 0
      ? `<p class="muted small" style="margin:12px 0 0">Spend your budget before kick-off. Transfers are only possible in the summer and January windows, and money is committed once a match is played.</p>`
      : state.phase === "playoffs"
        ? `<p class="muted small" style="margin:10px 0 0">The transfer window is shut, but you can still put money into coaching, sports science and the stadium before each match.</p>`
        : "";
    const rotation = f.kind === "cup" && !f.super ? `
      <div class="rotation">
        <span class="label">Team selection</span>
        <div class="seg-ctl" role="group" aria-label="Team selection">
          <button data-rot="0" class="${state.rotate ? "" : "active"}" aria-pressed="${!state.rotate}">Full strength</button>
          <button data-rot="1" class="${state.rotate ? "active" : ""}" aria-pressed="${state.rotate}">Rotate squad</button>
        </div>
        <span class="muted small">Rotating fields a weaker side but rules out injuries ahead of your league games.</span>
      </div>` : "";
    const advance = league || !info.adv ? "" : `
      <div class="advance">
        <span class="label">${info.adv}</span>
        <span class="value num">${pct(pv.advance.withInv)}</span>
        <span class="muted small">${pct(pv.advance.base)} without spending</span>
      </div>`;
    const ht = state.prefs && state.prefs.halftime;
    const first = ht ? "Kick off" : league ? `Play matchday ${f.md + 1}` : esc(info.play);
    const actions = (state.phase === "playoffs"
      ? `<button class="btn primary" id="play-1">${ht ? first : esc(info.play)}</button>
         <button class="btn" id="play-all">Sim rest of play-offs</button>`
      : `<button class="btn primary" id="play-1">${first}</button>
         <button class="btn" id="play-5">Sim 5</button>
         <button class="btn" id="play-all">Sim to end</button>`)
      + `<label class="ht-opt small" data-tip="Watch your match and stop at half-time and whenever someone is sent off, to change your tactics. Sim 5 and Sim to end always play straight through (your assistant reacts to red cards)."><input type="checkbox" id="ht-pref" ${ht ? "checked" : ""}> Stop at half-time and red cards</label>`;
    const derby = Game.derbyOf(f.h, f.a);
    card.innerHTML = `
      ${resultFlash()}
      ${lastReport()}
      <div class="match-head">
        <h2 style="margin:0">${league ? `Matchday ${f.md + 1} of ${state.fixtures.length}` : info.title}</h2>
        <span class="muted small">${league ? "Next fixture" : info.context}</span>
      </div>
      ${derby ? `<div class="derby-tag" data-tip="Derbies draw bigger crowds and count for more with the board, and the underdog raises its game">🔥 ${esc(derby.name)}${derby.heat === 3 ? " · one of Europe's fiercest" : ""}</div>` : ""}
      <div class="fixture">${side(h, true)}<div class="vs">VS</div>${side(a, false)}</div>
      ${rotation}
      ${wdlBar(pv.withInv, "", "With your spending")}
      ${wdlBar(pv.base, "base", "Without spending")}
      <div class="wdl-legend"><span style="--c:var(--win)">Win</span><span style="--c:var(--draw)">${league ? "Draw" : "Draw (after 90 min)"}</span><span style="--c:var(--loss)">Loss</span></div>
      ${advance}
      ${hint}
      <div class="play-actions">${actions}</div>`;
    $("#play-1").onclick = () => (state.prefs && state.prefs.halftime ? kickOff() : play(1));
    if ($("#play-5")) $("#play-5").onclick = () => play(5);
    $("#play-all").onclick = () => play(Infinity);
    $("#ht-pref").onchange = (e) => { state.prefs = { ...(state.prefs || {}), halftime: e.target.checked }; renderMatchCard(); scheduleSave(); };
    card.querySelectorAll("[data-rot]").forEach((b) => {
      b.onclick = () => { state.rotate = b.dataset.rot === "1"; renderMatchCard(); renderTactics(); scheduleSave(); };
    });
  }

  // Play n of your matches (cup rounds you're not in are simulated on the way).
  // Stops for a job decision, or when a transfer window opens.
  // Kick off your next match: the first half is played and you stop at half-time.
  function kickOff() {
    if (!Game.kickOff(state)) return play(1);
    lastResult = null;
    saveNow();
    renderAll();
    animateReport(0, null, state.live.min);
  }

  function play(n, fromMin = null) {
    let r = null;
    const phase = state.phase;
    const club = state.myTeam;
    const startMin = fromMin != null ? fromMin : state.live ? state.live.min : 0;
    if (state.live && n > 1) n = 1; // finish the match you're watching first
    for (let i = 0; i < n && state.phase === phase && !Game.pendingDecision(state); i++) {
      const wasOpen = Game.transferWindow(state).open;
      r = Game.advance(state) || r;
      // Stop multi-sims when a transfer window opens so the player can act.
      if (n > 1 && phase === "season" && !wasOpen && state.phase === "season" && Game.transferWindow(state).open) break;
    }
    lastResult = state.myTeam === club ? r : null;
    saveNow();
    renderAll();
    const after = () => {
      if (Game.pendingDecision(state)) showJobDialog();
      else if (!active()) showSummary();
    };
    // A single match is shown minute by minute (from half-time if you stopped there).
    if (n === 1 && lastResult && document.querySelector("#match-card .report")) animateReport(startMin, after);
    else after();
  }

  // ---- Jobs: sacked, approached, offers --------------------------------------

  function offerCard(o) {
    const t = team(o.club);
    const lid = Game.leagueOf(state, o.club);
    const def = Game.leagueDef(lid);
    const tbl = Game.internal.leagueFixtures(state, lid).results.length ? Game.table(state, lid) : null;
    const pos = tbl ? tbl.findIndex((r) => r.id === o.club) + 1 : 0;
    const b = Managers.board(state, o.club);
    const m = Managers.of(state, o.club);
    const fin = state.fin[o.club];
    return `<div class="offer-card">
      ${badge(t, "lg")}
      <div class="grow">
        <div class="name">${esc(t.name)}</div>
        <div class="small">${Leagues.COUNTRY[def.country].flag} ${esc(def.name)}${pos ? ` · ${ordinal(pos)} of ${tbl.length}` : ""} · squad rating ${t.rating.toFixed(0)}</div>
        <div class="muted small">Turnover about ${money(Game.forecast(state, o.club).revenue)} · bank ${money(fin.bank)} · ${o.vacant || !m ? "the post is vacant" : `${esc(m.name)} would make way`}</div>
        ${b.obj && state.phase === "season" ? `<div class="muted small">Board objective: ${esc(Managers.lcFirst(b.obj))}</div>` : ""}
      </div>
      <button class="btn primary small" data-take="${o.club}">Take the job</button>
    </div>`;
  }

  function takeJob(clubId) {
    const before = state.phase;
    if (!Game.respondJob(state, clubId)) return;
    if (before === "season") {
      lastResult = null;
      viewLeague = null;
      euroView = null;
      cupView = { cid: null, cup: null };
      projection = null;
    }
    saveNow();
    $("#job-dialog").close();
    renderAll();
    if (state.phase === "summary") showSummary();
    window.scrollTo(0, 0);
  }

  function retire() {
    confirmBox("Retire from management?", "Your career ends here. It stays in your careers list, but you can't play on.", "Retire").then((ok) => {
      if (!ok) return;
      Game.respondJob(state, "retire");
      saveNow();
      $("#job-dialog").close();
      $("#summary-dialog").close();
      renderAll();
    });
  }

  // A decision in the season: you've been sacked, or a club has approached you.
  function showJobDialog() {
    const J = state.job, p = J.prompt;
    if (!p) return;
    const dlg = $("#job-dialog");
    const sacked = p.kind === "sacked";
    const here = team(state.myTeam).name;
    dlg.innerHTML = `
      <h2>${sacked ? "You've been sacked" : `${esc(team(p.offers[0].club).name)} want you`}</h2>
      <p class="muted">${sacked
        ? `The board at ${esc(here)} has lost faith in you. A few clubs would give you a chance. Your reputation: ${Math.round(J.rep)}/100.`
        : `They've sacked their manager and asked to speak to you. Take the job and you start straight away; turn it down and you stay at ${esc(here)}.`}</p>
      <div class="offer-list">${p.offers.map(offerCard).join("")}</div>
      <div class="dialog-actions">${sacked
        ? `<button class="btn ghost danger-text" id="job-retire">Retire instead</button>`
        : `<button class="btn ghost" id="job-decline">Stay at ${esc(here)}</button>`}</div>`;
    dlg.querySelectorAll("[data-take]").forEach((b) => { b.onclick = () => takeJob(b.dataset.take); });
    if (sacked) $("#job-retire").onclick = retire;
    else {
      $("#job-decline").onclick = () => {
        Game.respondJob(state, null);
        saveNow();
        dlg.close();
        renderAll();
      };
    }
    // A sacking can't be dismissed with Escape.
    dlg.oncancel = (e) => { if (sacked) e.preventDefault(); };
    if (!dlg.open) dlg.showModal();
  }

  // ---- Tactics ----------------------------------------------------------------

  // A small pitch with a formation's players (their own goal at the bottom).
  function pitchSvg(formId, cls = "") {
    const f = Tactics.FORM[formId];
    const n = f.lines.length;
    const dots = [[50, 91]];
    f.lines.forEach((k, li) => {
      const y = 75 - (li * 57) / Math.max(1, n - 1);
      const margin = k >= 4 ? 12 : k === 3 ? 24 : 36;
      for (let i = 0; i < k; i++) dots.push([k === 1 ? 50 : margin + ((100 - 2 * margin) * i) / (k - 1), y]);
    });
    return `<svg class="pitch ${cls}" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="2" y="2" width="96" height="96" rx="5" class="pitch-bg"/>
      <line x1="2" y1="50" x2="98" y2="50" class="pitch-line"/><circle cx="50" cy="50" r="11" class="pitch-line"/>
      <rect x="27" y="80" width="46" height="18" class="pitch-line"/><rect x="27" y="2" width="46" height="18" class="pitch-line"/>
      ${dots.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" class="pitch-dot"/>`).join("")}</svg>`;
  }

  const modText = (o) => (o.att === 0 && o.def === 0 ? "Even" : `ATT ${signed(o.att)} · DEF ${signed(o.def)}`);

  function renderTactics() {
    const el = $("#tactics");
    const t = state.tactics;
    const playing = active() && !Game.pendingDecision(state);
    const pv = playing ? Game.preview(state) : null;
    const famPct = (id) => Math.round(Tactics.familiarity(state, state.myTeam, id) * 100);
    const forms = Tactics.FORMATIONS.map((f) => {
      const rec = t.log[f.id];
      const tip = `${f.desc} Familiarity ${famPct(f.id)}%.${rec ? ` This season: W${rec.w} D${rec.d} L${rec.l}.` : ""}`;
      return `<button class="form-card ${f.id === t.form ? "active" : ""}" data-form="${f.id}" aria-pressed="${f.id === t.form}" data-tip="${esc(tip)}">
        ${pitchSvg(f.id)}
        <span class="fname">${f.name}</span>
        <span class="fmods">${modText(f)}</span>
        <span class="fam" role="img" aria-label="Familiarity ${famPct(f.id)}%"><i style="width:${famPct(f.id)}%"></i></span>
      </button>`;
    }).join("");
    const seg = (list, cur, attr) => `<div class="seg-ctl" role="group">${list.map((x) =>
      `<button data-${attr}="${x.id}" class="${x.id === cur ? "active" : ""}" aria-pressed="${x.id === cur}" data-tip="${esc(x.desc)}">${x.name}</button>`).join("")}</div>`;
    const fat = t.fat || 0;
    const m = Tactics.mods(state, state.myTeam, t);
    const costs = [m.famCost > 0.05 ? `unfamiliar shape −${m.famCost.toFixed(1)}` : "", m.tired > 0.05 ? `tired legs −${m.tired.toFixed(1)}` : ""].filter(Boolean);
    let matchup = "";
    if (pv) {
      const opp = pv.fixture.opp, th = pv.tactics.theirs, mu = pv.tactics.matchup;
      const mgr = Managers.of(state, opp);
      const reasons = [
        ...mu.pros.map(([v, r]) => `<li class="pro"><b class="num">+${v.toFixed(1)}</b><span>You: ${esc(r)}</span></li>`),
        ...mu.cons.map(([v, r]) => `<li class="con"><b class="num">−${v.toFixed(1)}</b><span>Them: ${esc(r)}</span></li>`),
      ];
      matchup = `<div class="matchup">
        <div class="mu-opp">${pitchSvg(th.form, "theirs")}
          <div class="small"><div class="mu-title">Scouting ${esc(team(opp).name)}</div>
            Expected: <b>${Tactics.FORM[th.form].name}</b>, ${Tactics.MENT[th.ment].name.toLowerCase()}, ${Tactics.PRESS[th.press].name.toLowerCase()}.
            <div class="muted">${mgr ? `${esc(mgr.name)} usually plays ${Tactics.FORM[mgr.form].name}${mgr.flex >= 0.35 ? " but adapts to the opponent" : " and rarely changes it"}.` : "A caretaker is in charge."}</div></div>
        </div>
        <div class="mu-edge ${mu.edge > 0.05 ? "pos" : mu.edge < -0.05 ? "neg" : ""}" data-tip="Rating points your set-up gains (or loses) against theirs, in both attack and defence"><span class="label">Tactical edge</span><span class="value num">${signed(mu.edge)}</span></div>
        <ul class="mu-reasons">${reasons.join("") || `<li class="muted">The shapes cancel out: no edge either way.</li>`}</ul>
      </div>`;
    }
    el.innerHTML = `
      <div class="panel-head"><h2>Tactics</h2>${pv ? `<button class="btn small" id="tac-auto" data-tip="Your assistant picks the formation and mentality with the best odds for this match, allowing for familiarity">Assistant's pick</button>` : ""}</div>
      <div class="form-grid">${forms}</div>
      <div class="tac-rows">
        <div class="tac-row"><span class="label">Mentality</span>${seg(Tactics.MENTALITIES, t.ment, "ment")}</div>
        <div class="tac-row"><span class="label">Pressing</span>${seg(Tactics.PRESSING, t.press, "press")}
          <span class="muted small">${Tactics.condition(fat)} · fatigue ${fat.toFixed(1)}/${Tactics.MAX_FATIGUE}</span></div>
      </div>
      <p class="muted small tac-note">Your set-up: ATT ${signed(m.att)} · DEF ${signed(m.def)}${costs.length ? ` (including ${costs.join(", ")})` : ""}. New formations take a few matches to learn: the bar under each shows how well your players know it.</p>
      ${matchup}
      <div id="tac-msg" class="small tac-msg" aria-live="polite"></div>`;
    el.querySelectorAll("[data-form]").forEach((b) => { b.onclick = () => changeTactics({ form: b.dataset.form }); });
    el.querySelectorAll("[data-ment]").forEach((b) => { b.onclick = () => changeTactics({ ment: b.dataset.ment }); });
    el.querySelectorAll("[data-press]").forEach((b) => { b.onclick = () => changeTactics({ press: b.dataset.press }); });
    if ($("#tac-auto")) {
      $("#tac-auto").onclick = () => {
        const best = Game.suggestTactics(state);
        if (!best) return;
        changeTactics({ form: best.form, ment: best.ment });
        const what = best.metric === "points" ? `${best.value.toFixed(2)} expected points` : `${pct(best.value)} chance of going through`;
        $("#tac-msg").textContent = `Assistant's pick: ${Tactics.FORM[best.form].name}, ${Tactics.MENT[best.ment].name.toLowerCase()} (${what}).`;
      };
    }
  }

  function changeTactics(changes) {
    Game.setTactics(state, changes);
    tipApi.hide();
    renderTactics();
    renderMatchCard();
    renderStrength();
    if (sideTab === "fixtures") renderSide();
    scheduleProjection();
    scheduleSave();
  }

  // ---- Outlook ------------------------------------------------------------

  function scheduleProjection(delay = 200) {
    clearTimeout(projTimer);
    const playoffView = state.phase === "playoffs" || (!active() && state.playoff);
    $("#outlook-title").textContent = playoffView ? "Play-off bracket" : "Season outlook";
    $("#outlook-sub").textContent = state.phase === "season" ? "300 simulations of the remaining fixtures" : "";
    if (playoffView) {
      $("#outlook").innerHTML = bracketHtml(state.playoff);
      return;
    }
    if (state.phase !== "season") {
      $("#outlook").innerHTML = `<p class="muted">${state.phase === "retired" ? "Your career is over." : "The season is over: see the season review."}</p>`;
      return;
    }
    projTimer = setTimeout(() => {
      projection = Game.project(state);
      renderOutlook();
    }, delay);
  }

  function renderOutlook() {
    if (!projection || state.phase !== "season") return;
    const def = Game.leagueDef(state.league);
    const n = state.leagues[state.league].length;
    const { withInv: w, base: b } = projection;
    const expPos = (pr) => pr.positions.reduce((a, p, i) => a + p * (i + 1), 0);
    const sum = (pr, from, to) => pr.positions.slice(from - 1, to).reduce((a, p) => a + p, 0);
    const z = def.zones;
    const ez = def.tier === 1 ? euroZones(def) : null;
    const top = def.tier === 1
      ? { label: ez.ucl ? `Top ${ez.ucl}` : "Top 2", w: sum(w, 1, ez.ucl || 2), b: sum(b, 1, ez.ucl || 2) }
      : { label: "Auto promotion", w: sum(w, 1, z.autoUp), b: sum(b, 1, z.autoUp) };
    const second = def.tier === 1
      ? { label: "Title", w: w.positions[0], b: b.positions[0] }
      : { label: "Play-offs", w: sum(w, z.playoff[0], z.playoff[1]), b: sum(b, z.playoff[0], z.playoff[1]) };
    // Leagues without relegation: show the chance of a European place instead.
    const rel = z.down
      ? { label: "Relegation", w: sum(w, n - z.down + 1, n), b: sum(b, n - z.down + 1, n) }
      : { label: "Europe", w: sum(w, 1, ez ? ez.total : 0), b: sum(b, 1, ez ? ez.total : 0) };
    const delta = (x, y, unit = "") => {
      const d = x - y;
      return `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(unit ? 0 : 1)}${unit}`;
    };
    const tile = (label, value, sub) => `<div class="tile-stat"><div class="label">${label}</div><div class="value num">${value}</div><div class="sub">${sub}</div></div>`;

    const maxP = Math.max(...w.positions, 0.01);
    const bars = w.positions.map((p, i) => {
      const zc = zoneOf(def, i + 1, n);
      return { p, b: b.positions[i], pos: i + 1, zc };
    });

    $("#outlook").innerHTML = `
      <div class="tiles">
        ${tile("Projected points", w.avgPts.toFixed(0), `<b>${delta(w.avgPts, b.avgPts)}</b> from spending`)}
        ${tile("Expected finish", ordinal(Math.round(expPos(w))), `${ordinal(Math.round(expPos(b)))} without spending`)}
        ${tile(`${top.label} / ${second.label}`, `${pct(top.w)} / ${pct(second.w)}`, `${pct(top.b)} / ${pct(second.b)} without`)}
        ${tile(rel.label, pct(rel.w), `${pct(rel.b)} without spending`)}
      </div>
      <div class="dist">
        <div class="dist-title">Chance of each finishing position (with your spending)</div>
        <div class="dist-bars">
          ${bars.map((x) => `<div class="dist-bar" data-tip="${ordinal(x.pos)}: ${(x.p * 100).toFixed(1)}% · without spending ${(x.b * 100).toFixed(1)}%"><span style="height:${(x.p / maxP) * 100}%"></span></div>`).join("")}
        </div>
        <div class="dist-zones">${bars.map((x) => `<i style="${x.zc.cls ? `background:var(--zone-${x.zc.cls.slice(2)})` : ""}"></i>`).join("")}</div>
        <div class="dist-axis"><span>1st</span><span>${ordinal(Math.ceil(n / 2))}</span><span>${ordinal(n)}</span></div>
        ${zoneLegend(def)}
      </div>`;
  }

  function bracketHtml(po) {
    const z = Game.leagueDef(state.league).zones;
    const seed = (id) => ordinal(po.seeds.indexOf(id) + z.playoff[0]);
    const cell = (g) => `<span class="g num">${g == null ? "–" : g}</span>`;
    const line = (id, goals, out) => `
      <div class="br-team ${id === state.myTeam ? "mine" : ""} ${out ? "out" : ""}">
        ${badge(team(id), "sm")}<span class="nm">${esc(team(id).name)}</span><span class="seed">${seed(id)}</span>${goals.map(cell).join("")}
      </div>`;
    const note = (m, winner) => m && (m.pens || m.aet)
      ? `<div class="br-note">${m.pens ? `${esc(team(winner).name)} win on penalties` : "After extra time"}</div>` : "";
    const ties = po.ties.map((t, i) => {
      const [l1, l2] = t.legs;
      const hiAgg = l1 ? l1.ag + (l2 ? l2.hg : 0) : null;
      const loAgg = l1 ? l1.hg + (l2 ? l2.ag : 0) : null;
      return `<div class="br-card">
        <div class="br-head"><span>Semi-final ${i + 1}</span><span class="g">1st</span><span class="g">2nd</span><span class="g">Agg</span></div>
        ${line(t.hi, [l1 && l1.ag, l2 && l2.hg, hiAgg], t.winner && t.winner !== t.hi)}
        ${line(t.lo, [l1 && l1.hg, l2 && l2.ag, loAgg], t.winner && t.winner !== t.lo)}
        ${note(l2, t.winner)}
      </div>`;
    }).join("");
    let final;
    if (po.final) {
      const m = po.final.match;
      final = `<div class="br-card final">
        <div class="br-head"><span>Final · Wembley</span><span class="g">Score</span></div>
        ${line(po.final.a, [m && m.hg], po.winner && po.winner !== po.final.a)}
        ${line(po.final.b, [m && m.ag], po.winner && po.winner !== po.final.b)}
        ${note(m, po.winner)}
        ${po.winner ? `<div class="br-winner">${badge(team(po.winner), "sm")} ${esc(team(po.winner).name)} promoted</div>` : ""}
      </div>`;
    } else {
      final = `<div class="br-card final"><div class="br-head"><span>Final · Wembley</span></div>
        <div class="muted small" style="padding:8px 0">Winners of the two semi-finals meet in a one-off final.</div></div>`;
    }
    return `<div class="bracket">${ties}${final}</div>`;
  }

  // ---- Latest results & news ----------------------------------------------

  const PLAYOFF_NAMES = ["Play-off semi-finals, 1st leg", "Play-off semi-finals, 2nd leg", "Play-off final"];

  function latestRound() {
    const lp = state.lastPlayed;
    if (!lp) return null;
    if (lp.type === "league") return { name: `Matchday ${lp.md + 1}`, matches: state.results[lp.md] };
    if (lp.type === "cup") {
      const def = Game.cupDef(lp.cup);
      const h = state.cups[lp.cup].history.find((x) => x.round === lp.round);
      return { name: `${def.name} ${def.rounds[lp.round].name.toLowerCase()}`, matches: h.ties };
    }
    if (lp.type === "euro") {
      const c = Europe.COMPS.find((x) => x.id === lp.comp);
      const name = lp.stage === "LP" ? `league phase, matchday ${lp.md + 1}` : `${(Europe.QUAL_NAMES[lp.stage] || Europe.KO_NAMES[lp.stage]).toLowerCase()}${lp.stage === "F" ? "" : `, leg ${lp.leg}`}`;
      return { name: `${c.name} ${name}`, matches: lp.games };
    }
    if (lp.type === "post") return { name: "Play-offs", matches: lp.games || [] };
    const po = state.playoff;
    const matches = lp.round === 2 ? [po.final.match] : po.ties.map((t) => t.legs[lp.round]);
    return { name: PLAYOFF_NAMES[lp.round], matches };
  }

  // 🟥 for each player a side had sent off.
  const redMark = (m, i) => (m.rc && m.rc[i] ? `<span class="rc-mark" data-tip="${m.rc[i]} sent off">${"🟥".repeat(Math.min(3, m.rc[i]))}</span>` : "");

  function renderLatest() {
    const lr = latestRound();
    if (!lr) {
      $("#latest").innerHTML = `<p class="muted">No matches played yet.</p>`;
      return;
    }
    const sorted = lr.matches.slice().sort((x, y) => isMine(y) - isMine(x));
    $("#latest").innerHTML = `<div class="muted small" style="margin-bottom:6px">${lr.name}</div>
      <div class="results-list">${sorted.map((m) => `
        <div class="result-row ${isMine(m) ? "mine" : ""}">
          <span class="h">${redMark(m, 0)}<span class="nm">${esc(team(m.h).name)}</span>${badge(team(m.h), "md")}</span>
          <span class="score num" ${m.crowd ? `data-tip="Crowd ${seats(m.crowd)}"` : ""}>${m.hg} – ${m.ag}${m.pens ? " p" : m.aet ? " aet" : ""}</span>
          <span class="a">${badge(team(m.a), "md")}<span class="nm">${esc(team(m.a).name)}</span>${redMark(m, 1)}</span>
        </div>`).join("")}</div>`;
  }

  function renderNews() {
    $("#news").innerHTML = state.news.map((n) =>
      `<li class="${n.type}"><span class="md">${n.label || (n.md ? `MD${n.md}` : "Pre")}</span><span>${esc(n.text)}</span></li>`).join("");
  }

  // ---- Side panel (table / fixtures / cups / clubs / history) -------------

  $("#side-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    sideTab = b.dataset.tab;
    document.querySelectorAll("#side-tabs button").forEach((x) => x.classList.toggle("active", x === b));
    renderSide();
  });
  $("#side-content").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (!b) return;
    viewLeague = b.dataset.view;
    renderSide();
  });

  const viewLid = () => (viewLeague && state.leagues[viewLeague] ? viewLeague : state.league);

  // Country picker and division buttons, shared by the Table and Clubs tabs.
  function countryOptions(selected) {
    return Leagues.COUNTRY_ORDER.filter((c) => Leagues.COUNTRY[c].divisions.length)
      .map((c) => `<option value="${c}" ${c === selected ? "selected" : ""}>${Leagues.COUNTRY[c].flag} ${esc(Leagues.COUNTRY[c].name)}</option>`).join("");
  }

  function leagueSwitch(cur = viewLid(), attr = "data-view") {
    const cid = Game.leagueDef(cur).country;
    const divs = Leagues.COUNTRY[cid].divisions;
    return `<div class="lg-pick"><select ${attr}-country aria-label="Country">${countryOptions(cid)}</select>
      ${divs.length > 1 ? `<div class="lg-switch" role="group" aria-label="Division">${divs.map((lid) => {
        const l = Game.leagueDef(lid);
        return `<button ${attr}="${lid}" class="${lid === cur ? "active" : ""}" aria-pressed="${lid === cur}">${esc(l.short)}${lid === state.league ? " ★" : ""}</button>`;
      }).join("")}</div>` : ""}</div>`;
  }

  $("#side-content").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-view-country]");
    if (!sel) return;
    viewLeague = Leagues.COUNTRY[sel.value].divisions[0];
    renderSide();
  });

  function renderSide() {
    const el = $("#side-content");
    const views = { table: tableHtml, fixtures: fixturesHtml, cups: cupsHtml, clubs: clubsHtml, managers: managersHtml, history: historyHtml };
    el.innerHTML = views[sideTab]();
  }

  function tableHtml() {
    const lid = viewLid();
    const def = Game.leagueDef(lid);
    const rows = Game.table(state, lid);
    const n = rows.length;
    return `${leagueSwitch()}<table class="ltable">
      <thead><tr><th class="c-pos">#</th><th class="team-col">Team</th><th class="c-n">P</th><th class="c-n hide-sm">W</th><th class="c-n hide-sm">D</th><th class="c-n hide-sm">L</th><th class="c-gd">GD</th><th class="c-pts">Pts</th><th class="c-form hide-sm">Form</th></tr></thead>
      <tbody>${rows.map((r, i) => {
        const t = team(r.id);
        // Split leagues: a heading row where each group starts.
        const split = def.format && def.format.split;
        const head = split && r.group != null && (i === 0 || rows[i - 1].group !== r.group)
          ? `<tr class="group-row"><td colspan="9">${esc(split.groups[r.group].name)}</td></tr>` : "";
        return `${head}<tr class="${zoneOf(def, i + 1, n).cls} ${r.id === state.myTeam ? "mine" : ""}">
          <td class="pos num">${i + 1}</td>
          <td class="team-col"><div class="t">${badge(t, "md")}<span title="${esc(t.name)}">${esc(t.name)}</span></div></td>
          <td class="num">${r.p}</td><td class="num hide-sm">${r.w}</td><td class="num hide-sm">${r.d}</td><td class="num hide-sm">${r.l}</td>
          <td class="num">${r.gd > 0 ? "+" : ""}${r.gd}</td><td class="num pts">${r.pts}${r.ded ? `<sup class="ded" data-tip="${esc((state.deductWhy[r.id] || [`−${r.ded} points`]).join(", "))}">*</sup>` : ""}</td>
          <td class="hide-sm"><span class="form">${r.form.slice(-5).map((x) => `<i class="${x}">${x}</i>`).join("")}</span></td>
        </tr>`;
      }).join("")}</tbody></table>${zoneLegend(def)}`;
  }

  function winChance(f, home) {
    const steady = { form: false, injury: false };
    const [sh, sa] = Game.pair(state, f.h, f.a, steady, steady);
    const p = Engine.outcomeProbs(Engine.expectedGoals(sh, sa, !!f.neutral));
    const w = home ? p.win : p.loss, l = home ? p.loss : p.win;
    return `<span class="prob num" data-tip="Win ${pct(w)} · Draw ${pct(p.draw)} · Loss ${pct(l)}">Win ${pct(w)}</span>`;
  }

  // Your season: league fixtures and the cup ties you've been drawn in.
  function fixturesHtml() {
    const me = state.myTeam;
    const next = Game.nextMyEvent(state);
    const row = (label, venue, opp, right, isNext, cup) => `
      <div class="fx-row ${isNext ? "next" : ""} ${cup ? "cup" : ""}">
        <span class="md">${label}</span><span class="venue">${venue}</span>${badge(opp, "sm")}
        <span>${esc(opp.name)}</span>${right}</div>`;
    const rows = state.cal.map((ev) => {
      if (ev.type === "euro") {
        const mm = Europe.myMatch(state, ev);
        if (!mm) return "";
        const home = mm.f.h === me;
        const opp = team(home ? mm.f.a : mm.f.h);
        let right;
        if (mm.game) {
          const g = mm.game, my = home ? g.hg : g.ag, their = home ? g.ag : g.hg;
          const res = mm.tie && mm.tie.winner && (ev.stage === "F" || ev.leg === 2) ? (mm.tie.winner === me ? "W" : "L") : my > their ? "W" : my < their ? "L" : "D";
          right = `<span class="res ${res} num">${my}–${their}${g.pens ? " p" : g.aet ? " aet" : ""}</span>`;
        } else right = winChance(mm.f, home);
        const c = Europe.COMPS.find((x) => x.id === ev.comp);
        const tag = ev.stage === "LP" ? `${c.short} ${ev.md + 1}` : `${c.short} ${ev.stage}${ev.stage === "F" ? "" : ev.leg}`;
        const isNext = next && next.kind === "euro" && next.comp === ev.comp && next.name === Europe.stageName(ev);
        return row(tag, mm.f.neutral ? "N" : home ? "H" : "A", opp, right, isNext, true);
      }
      if (ev.type === "league") {
        const f = state.fixtures[ev.md].find(isMine);
        if (!f) return "";
        const home = f.h === me;
        let right;
        if (ev.md < state.results.length) {
          const m = state.results[ev.md].find(isMine);
          const my = home ? m.hg : m.ag, their = home ? m.ag : m.hg;
          const res = my > their ? "W" : my < their ? "L" : "D";
          right = `<span class="res ${res} num">${my}–${their}</span>`;
        } else {
          right = winChance(f, home);
        }
        const isNext = next && next.kind === "league" && next.md === ev.md;
        return row(`MD${ev.md + 1}`, home ? "H" : "A", team(home ? f.a : f.h), right, isNext, false);
      }
      const cup = state.cups[ev.cup];
      const r = Game.cupDef(ev.cup).rounds[ev.round];
      const played = ev.round < cup.round;
      const t = played ? cup.history.find((x) => x.round === ev.round).ties.find(isMine)
        : ev.round === cup.round ? cup.ties.find(isMine) : null;
      if (!t) return "";
      const home = t.h === me;
      let right;
      if (played) {
        const my = home ? t.hg : t.ag, their = home ? t.ag : t.hg;
        const res = t.winner ? (t.winner === me ? "W" : "L") : my > their ? "W" : my < their ? "L" : "D";
        right = `<span class="res ${res} num">${my}–${their}${t.pens ? " p" : t.aet ? " aet" : ""}</span>`;
      } else {
        right = winChance({ ...t, neutral: r.neutral }, home);
      }
      const isNext = next && next.kind === "cup" && next.cup === ev.cup && next.round === ev.round;
      return row(`${Game.cupDef(ev.cup).tag} ${r.short}`, r.neutral ? "N" : home ? "H" : "A", team(home ? t.a : t.h), right, isNext, true);
    });
    return `<div class="fixture-list">${rows.join("")}</div>`;
  }

  function cupsHtml() {
    const me = state.myTeam;
    const eu = Europe.summaryFor(state, me);
    const europe = `<section class="cup-block">
      <div class="panel-head"><h2>Europe</h2>${eu ? `<span class="chip open">${esc(eu.name)}</span>` : `<span class="chip">Not in Europe this season</span>`}</div>
      <p class="small">${eu ? `${esc(eu.name)}: ${esc(eu.text)}. ` : ""}See the <a href="#" data-goto="europe">Europe page</a> for tables, draws and the UEFA rankings.</p>
    </section>`;
    // Super cups only if you're in them.
    const mineCups = Game.cupsFor(state, me).concat(["USC"]).map(Game.cupDef)
      .filter((c) => !c.super || ["in", "won", "out", "waiting"].includes(Game.cupStatus(state, c.id).state));
    return mineCups.map((c) => {
      const cup = state.cups[c.id];
      const st = Game.cupStatus(state, c.id);
      const roundName = (i) => c.rounds[i].name.replace(/, [12](st|nd) leg$/, "").toLowerCase();
      const status = {
        won: `<span class="chip open">🏆 Winners</span>`,
        out: `<span class="chip">Out · ${st.round != null ? roundName(st.round) : ""}</span>`,
        in: `<span class="chip open">Still in${cup.round < c.rounds.length ? ` · ${roundName(cup.round)} next` : ""}</span>`,
        waiting: `<span class="chip">Enters in the ${st.round != null ? roundName(st.round) : ""}</span>`,
        none: `<span class="chip">Not entered</span>`,
      }[st.state];
      const path = cup.history.map((h) => {
        const t = h.ties.find(isMine);
        if (!t) return "";
        const home = t.h === me;
        const my = home ? t.hg : t.ag, their = home ? t.ag : t.hg;
        const res = t.winner ? (t.winner === me ? "W" : "L") : my > their ? "W" : my < their ? "L" : "D";
        return `<div class="fx-row"><span class="md">${c.rounds[h.round].short}</span><span class="venue">${c.rounds[h.round].neutral ? "N" : home ? "H" : "A"}</span>
          ${badge(team(home ? t.a : t.h), "sm")}<span>${esc(team(home ? t.a : t.h).name)}</span>
          <span class="res ${res} num">${my}–${their}${t.pens ? " p" : t.aet ? " aet" : ""}</span></div>`;
      }).join("");
      const last = cup.history[cup.history.length - 1];
      const ties = last ? last.ties.slice().sort((x, y) => isMine(y) - isMine(x)) : [];
      const latest = last ? `
        <div class="muted small" style="margin:10px 0 4px">${c.rounds[last.round].name} results</div>
        <div class="results-list compact">${ties.map((m) => `
          <div class="result-row ${isMine(m) ? "mine" : ""}">
            <span class="h ${m.winner && m.winner !== m.h ? "lost" : ""}">${esc(team(m.h).name)}</span>
            <span class="score num">${m.hg} – ${m.ag}${m.pens ? " p" : m.aet ? " aet" : ""}</span>
            <span class="${m.winner && m.winner !== m.a ? "lost" : ""}">${esc(team(m.a).name)}</span>
          </div>`).join("")}</div>` : `<p class="muted small">${playedWhen(c.id, roundName(0))}</p>`;
      const winner = cup.winner ? `<div class="br-winner">${badge(team(cup.winner), "sm")} ${esc(team(cup.winner).name)} won the ${c.name}</div>` : "";
      return `<section class="cup-block">
        <div class="panel-head"><h2>${c.name}</h2>${status}</div>
        <p class="small" style="margin:0 0 8px">${c.country === "EUR" ? `<a href="#" data-goto="europe">See the Europe page →</a>` : `<a href="#" data-goto="cups" data-cup="${c.id}">See the ${esc(c.name)} ${c.super && c.rounds.length === 1 ? "match" : "bracket"} →</a>`}</p>
        ${winner}
        ${path ? `<div class="fixture-list">${path}</div>` : ""}
        ${latest}
      </section>`;
    }).join("") + europe;
  }

  function clubsHtml() {
    const lid = viewLid();
    const rows = state.leagues[lid].map((id) => {
      const mine = id === state.myTeam;
      const ai = state.ai[id];
      const fx = Game.clubFx(state, id) || {};
      const boost = ((fx.attack || 0) + (fx.defence || 0)) / 2 + (fx.midfield || 0) + (fx.coaching || 0);
      return {
        id, mine, boost, ai,
        spent: mine ? Game.spent(state) : total(ai.invest),
        cash: state.fin[id].bank,
      };
    }).sort((x, y) => y.boost - x.boost);
    const scout = (r) => (r >= 0.75 ? "Shrewd" : r >= 0.55 ? "Average" : "Wasteful");
    return `${leagueSwitch()}
      <p class="muted small" style="margin:0 0 8px">How every club is using its money this season. Boost is the rating gained from spending (average of attack and defence).</p>
      <table class="ltable clubs">
        <thead><tr><th class="team-col">Club</th><th class="c-style">Approach</th><th class="c-money">Spent</th><th class="c-money hide-sm">Bank</th><th class="c-gd hide-sm" data-tip="Average squad age">Age</th><th class="c-gd">Boost</th></tr></thead>
        <tbody>${rows.map((r) => {
          const t = team(r.id);
          const style = r.mine ? null : Game.styleDef(r.ai.style);
          const event = r.ai && r.ai.event === "takeover" ? " 💰" : r.ai && r.ai.event === "crisis" ? " ⚠️" : "";
          const ground = ` Capacity ${seats(t.capacity)}${r.ai && r.ai.project ? `, expanding by ${seats(r.ai.project.seats)} next season` : ""}.`;
          const tip = r.mine ? `Your club.${ground}` : `${style.desc} Recruitment: ${scout(r.ai.recruit).toLowerCase()}.${r.ai.event === "takeover" ? " New owners this season." : r.ai.event === "crisis" ? " In financial trouble." : ""}${ground}`;
          return `<tr class="${r.mine ? "mine" : ""}">
            <td class="team-col"><div class="t">${badge(t, "md")}<span title="${esc(t.name)}">${esc(t.name)}</span></div></td>
            <td class="c-style" data-tip="${esc(tip)}">${r.mine ? "You" : `${style.name}${event}`}<div class="muted tiny">${r.mine ? "" : scout(r.ai.recruit)}</div></td>
            <td class="num">${money(r.spent)}</td><td class="num hide-sm ${r.cash < 0 ? "neg" : ""}">${money(r.cash)}</td>
            <td class="num hide-sm" data-tip="${esc(`${Game.ageWord(t.age || 26.5)} squad${t.golden ? ", with a golden generation coming through" : ""}`)}">${(t.age || 26.5).toFixed(1)}${t.golden ? " 🌱" : ""}</td>
            <td class="num pts">+${r.boost.toFixed(1)}</td>
          </tr>`;
        }).join("")}</tbody></table>
      <div class="zone-legend"><span>💰 takeover</span><span>⚠️ financial trouble</span><span>🌱 golden generation</span></div>`;
  }

  function careerHtml() {
    const J = state.job;
    const rows = J.stints.slice().reverse().map((st) => {
      const t = team(st.club);
      const from = `${Game.seasonLabel(st.season)}${st.md ? ` (MD${st.md})` : ""}`;
      const to = st.end ? `${Game.seasonLabel(st.end.season)}${st.end.md ? ` (MD${st.end.md})` : ""}` : "now";
      const games = st.w + st.d + st.l;
      return `<div class="stint ${st.end ? "" : "current"}">
        ${badge(t, "md")}
        <div class="grow"><div class="top"><span>${esc(t.name)}</span><span class="muted small">${from} – ${to}</span></div>
          <div class="muted small num">${games ? `P${games} W${st.w} D${st.d} L${st.l} · ${Math.round((st.w / games) * 100)}% wins` : "No games yet"}${st.why ? ` · ${st.why === "Left" ? "moved on" : st.why.toLowerCase()}` : ""}</div>
          ${st.trophies.length ? `<div class="small up-txt">🏆 ${st.trophies.map(esc).join(", ")}</div>` : ""}</div>
      </div>`;
    }).join("");
    return `<section class="cup-block"><div class="panel-head"><h2>Managerial career</h2><span class="chip" data-tip="Your reputation (out of 100)">${stars(J.rep)} ${Math.round(J.rep)}</span></div>
      <p class="small" style="margin:0 0 8px"><a href="#" data-goto="manager">Trophy cabinet, achievements and derbies →</a></p>
      <div class="stint-list">${rows}</div></section>`;
  }

  function historyHtml() {
    const career = careerHtml();
    if (!state.history.length) return `${career}<p class="muted small" style="margin-top:12px">Season-by-season records appear here after your first season.</p>`;
    const trophies = state.history.reduce((a, h) => a + (h.cups || []).filter((c) => c.won).length + (h.pos === 1 ? 1 : 0), 0);
    return `${career}<section class="cup-block">${trophies ? `<div class="trophies">🏆 × ${trophies} trophies</div>` : ""}
      <div class="history-list">${state.history.slice().reverse().map((h) => `
      <div class="history-row">
        <div class="top"><span>${h.season} · ${h.club ? `${esc(team(h.club).name)}, ` : ""}${Game.leagueDef(h.league).name}</span><span class="num">${ordinal(h.pos)}</span></div>
        <div class="muted small num">${h.pts} pts · W${h.w} D${h.d} L${h.l}</div>
        <div class="small">${esc(h.outcome)}</div>
        ${(h.cups || []).map((c) => `<div class="small ${c.won ? "up-txt" : "muted"}">${c.won ? "🏆 " : ""}${esc(c.name)}: ${esc(c.text)}</div>`).join("")}
      </div>`).join("")}</div></section>`;
  }

  // Every manager in a division: shape, reputation and how safe their job is,
  // plus the comings and goings.
  function managersHtml() {
    const lid = viewLid();
    const me = state.myTeam;
    const J = state.job;
    const rows = Game.table(state, lid).map((r, i) => {
      const id = r.id, mine = id === me;
      const m = Managers.of(state, id), b = Managers.board(state, id);
      const t = team(id);
      const name = mine ? (J.name ? esc(J.name) : "You") : m ? esc(m.name) : `<span class="muted">Caretaker</span>`;
      const nat = !mine && m && Leagues.COUNTRY[m.nat] ? Leagues.COUNTRY[m.nat].flag : "";
      const shape = mine ? state.tactics.form : m ? m.form : "442";
      const rep = mine ? J.rep : m ? m.rep : null;
      const sec = Managers.security(b.conf);
      const repText = rep != null ? ` · reputation ${stars(rep)} ${Math.round(rep)}` : "";
      const tip = mine ? `You${repText} · objective: ${b.obj || "—"} · confidence ${Math.round(b.conf)}%` : m
        ? `${m.name}, ${Managers.age(state, m)}${repText} · in charge since ${Game.seasonLabel(m.since)} · career W${m.w} D${m.d} L${m.l}${m.trophies ? ` · ${m.trophies} trophies` : ""} · tactical quality ${m.tac >= 0 ? "+" : ""}${m.tac.toFixed(1)} · plays ${Tactics.FORM[m.form].name}, plan B ${Tactics.FORM[m.alt].name} · objective: ${b.obj || "—"} · confidence ${Math.round(b.conf)}%`
        : "No manager: a caretaker is in charge";
      return `<tr class="${mine ? "mine" : ""}">
        <td class="pos num">${i + 1}</td>
        <td class="team-col"><div class="t">${badge(t, "md")}<span title="${esc(t.name)}">${esc(t.name)}</span></div></td>
        <td class="c-mgr" data-tip="${esc(tip)}">${nat} ${name}</td>
        <td class="c-shape">${Tactics.FORM[shape].name}</td>
        <td class="c-sec"><span class="sec ${sec.toLowerCase().replace(" ", "-")}">${sec}</span></td>
      </tr>`;
    }).join("");
    const ids = new Set(state.leagues[lid]);
    const sentence = (e) => {
      const club = esc(team(e.club).name), name = esc(e.name);
      if (e.type === "hired") return e.mgr === "you" ? `${club} appointed you` : `${club} appointed ${name}`;
      if (e.type === "retired") return `${name} retired as ${club} manager`;
      if (e.type === "left") return `${name} left ${club} for another job`;
      if (e.why === "replaced") return `${club} let ${name} go to appoint ${e.by === "you" ? "you" : "a new manager"}`;
      return `${club} sacked ${name}${e.why === "season" ? " at the end of the season" : ""}`;
    };
    const events = state.mgr.events.filter((e) => ids.has(e.club) && e.season >= state.season - 1).slice(0, 16).map((e) =>
      `<li class="${e.type === "hired" ? "info" : "bad"}"><span class="md">${e.season === state.season ? (e.md ? `MD${e.md}` : "Pre") : Game.seasonLabel(e.season)}</span><span>${badge(team(e.club), "sm")} ${sentence(e)}</span></li>`).join("");
    return `${leagueSwitch()}
      <p class="muted small" style="margin:0 0 8px">Job security is the board's confidence in each manager. Boards that lose faith sack them; hover a name for their record.</p>
      <table class="ltable managers">
        <thead><tr><th class="c-pos">#</th><th class="team-col">Club</th><th class="c-mgr">Manager</th><th class="c-shape">Shape</th><th class="c-sec">Job</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <h3 class="sub-head">Comings and goings</h3>
      ${events ? `<ul class="news mgr-events">${events}</ul>` : `<p class="muted small">No managerial changes in this division yet.</p>`}`;
  }

  // ---- Season summary -----------------------------------------------------

  function showSummary() {
    const s = state.summary;
    if (!s) return;
    const dlg = $("#summary-dialog");
    const def = Game.leagueDef(s.league);
    const r = s.row;
    const tile = (label, value) => `<div class="tile-stat"><div class="label">${label}</div><div class="value num" style="font-size:18px">${value}</div></div>`;
    const names = (ids) => ids.map((id) => esc(team(id).name)).join(", ") || "—";
    const dev = s.development.mine;
    const fin = s.finance;
    const rules = fin.rules;

    dlg.innerHTML = `
      <div class="summary-hero">
        ${badge(team(state.myTeam), "lg")}
        <div class="pos">${ordinal(s.pos)}</div>
        <div class="muted">${Game.seasonLabel(s.season)} ${def.name}</div>
        <div class="outcome" style="color:${s.promoted || s.pos === 1 ? "var(--win)" : s.relegated ? "var(--loss)" : "var(--text)"}">${esc(s.outcome)}</div>
      </div>
      <div class="summary-grid">
        ${tile("Points", r.pts)}${tile("Record", `${r.w}-${r.d}-${r.l}`)}${tile("Goal diff", (r.gd > 0 ? "+" : "") + r.gd)}${tile("Result", `<span class="${fin.profit < 0 ? "neg" : ""}">${fin.profit < 0 ? "−" : "+"}${money(Math.abs(fin.profit))}</span>`)}
      </div>
      <div class="summary-section"><h3>Cup runs</h3>
        <div class="small">${s.cups.map((c) => `<div class="${c.won ? "up-txt" : ""}">${c.won ? "🏆 " : ""}<strong>${esc(c.name)}:</strong> ${esc(c.text)}${!c.won && c.winner ? ` · won by ${esc(team(c.winner).name)}` : ""}</div>`).join("")}
        ${fin.acc.cups ? `<div class="muted">Cup prize money and gate receipts: ${money(fin.acc.cups)}</div>` : ""}</div>
      </div>
      ${s.gate && s.gate.games ? `<div class="summary-section"><h3>Stadium</h3><div class="small">
        Gate receipts ${money(s.gate.revenue)} from ${s.gate.games} league home games: average crowd ${seats(s.gate.crowd / s.gate.games)}
        (${Math.round((s.gate.crowd / s.gate.games / s.gate.capacity) * 100)}% of ${seats(s.gate.capacity)}), ${s.gate.soldOut} sell-out${s.gate.soldOut === 1 ? "" : "s"}.
        ${s.gate.demand / s.gate.games > s.gate.capacity * 1.02 ? ` About ${seats(s.gate.demand / s.gate.games - s.gate.capacity)} fans a game couldn't get tickets.` : ""}
        ${state.stadium.project ? ` ${esc(state.stadium.project.name)} (+${seats(state.stadium.project.seats)}) opens next season.` : ""}</div></div>` : ""}
      ${s.playoffs && s.playoffs.length ? `<div class="summary-section"><h3>Play-offs</h3><div class="small">${s.playoffs.map(esc).join("<br>")}</div></div>` : ""}
      <div class="summary-section"><h3>Around the pyramid</h3>
        <div class="move-grid">${s.movements.map((m) => `
          <span class="lg">${Game.leagueDef(m.league).name}</span>
          <span>${m.up.length ? `<span class="up-txt">▲ ${names(m.up)}</span><br>` : ""}<span class="down-txt">▼ ${names(m.down)}</span></span>`).join("")}
          ${s.nlUp.length ? `<span class="lg">National League</span><span class="up-txt">▲ ${names(s.nlUp)}</span>` : ""}
        </div>
        ${s.movements.length ? "" : `<p class="muted small">No promotion or relegation is modelled in this league.</p>`}
      </div>
      ${s.europe || s.europeNext ? `<div class="summary-section"><h3>Europe</h3><div class="small">
        ${s.europe ? `${s.europe.won ? "🏆 " : ""}<strong>${esc(s.europe.name)}:</strong> ${esc(s.europe.text)}<br>` : ""}
        ${s.europeNext ? `Next season: ${esc(s.europeNext)}.` : "No European football next season."}</div></div>` : ""}
      ${jobSection(s)}
      ${state.offer && state.offer.when === "summer" ? `<div class="summary-section"><h3>Investors</h3><p class="small" style="margin:0 0 6px">Your season has caught the eye of investors.</p>${offerHtml(state.offer)}</div>` : ""}
      ${s.achievements && s.achievements.length ? `<div class="summary-section"><h3>Achievements unlocked</h3><div class="ach-mini">${Achievements.all(state).filter((a) => s.achievements.includes(a.id)).map((a) => `<span class="chip" data-tip="${esc(a.desc)}">${a.icon} ${esc(a.name)}</span>`).join("")}</div></div>` : ""}
      ${s.gameOver ? `
        <div class="summary-section"><p>Relegation to the National League ends your Football League career. The board has decided to part ways.</p></div>
        <div class="dialog-actions"><button class="btn primary" id="sum-new">Back to your careers</button></div>` : `
        <div class="summary-section"><h3>Finances</h3>
          <div class="small">Revenue ${money(fin.revenue)}, costs ${money(fin.costs)}: a ${fin.profit < 0 ? "loss" : "profit"} of <strong>${money(Math.abs(fin.profit))}</strong>.
          ${fin.owner ? `Your owner put in ${money(fin.owner)}. ` : ""}Bank balance now <strong class="${fin.bank < 0 ? "neg" : ""}">${money(fin.bank)}</strong>.<br>
          ${rules.breach ? `<span class="down-txt">⛔ ${esc(rules.breach)}</span>`
            : rules.ps ? `Profitability & Sustainability: ${money(Math.max(0, -rules.ps.total))} of losses over ${rules.ps.seasons} season${rules.ps.seasons === 1 ? "" : "s"} (limit ${money(rules.ps.limit)}). ✅`
            : rules.scmp ? `Squad costs were ${Math.round(rules.scmp.ratio * 100)}% of turnover (cap ${Math.round(rules.scmp.cap * 100)}%). ✅` : ""}
          ${fin.parachuteNext ? `<br>Parachute payment next season: ${money(fin.parachuteNext)}.` : ""}
          ${fin.europeNext ? `<br>European football next season: about ${money(fin.europeNext)} extra.` : ""}</div>
        </div>
        <div class="summary-section"><h3>Next season</h3>
          <div class="small">${dev.age != null
            ? `Squad development: signings ${signed(dev.signings)}, academy ${signed(dev.academy)}, squad age ${dev.age.toFixed(1)} (${Game.ageWord(dev.age).toLowerCase()}, ${signed(dev.ageEffect)})${dev.golden ? `, golden generation ${signed(dev.golden)}` : ""} = <b>${signed(dev.total)}</b>.`
            : `Squad development ${signed(dev.total)}.`}
          Your rivals averaged ${signed(s.development.leagueAvg)}, and ratings are measured against your division (± a little luck).</div>
        </div>
        <div class="dialog-actions">
          ${state.phase === "retired" ? "" : `<button class="btn ghost" id="sum-close">Close</button>`}
          ${state.phase === "retired" ? `<button class="btn primary" id="sum-careers">Back to your careers</button>`
            : `<button class="btn primary" id="sum-next" ${state.job.prompt ? "disabled" : ""}>${state.job.prompt ? "Choose a club first" : `Start ${Game.seasonLabel(s.season + 1)} season${state.job.pendingMove ? ` at ${esc(team(state.job.pendingMove.club).name)}` : ""}`}</button>`}
        </div>`}`;
    wireOffer(dlg, () => { showSummary(); renderBoard(); });
    if (!dlg.open) dlg.showModal();
    // Sacked over the summer: the review can't be dismissed until you choose.
    dlg.oncancel = (e) => { if (state && state.job.prompt) e.preventDefault(); };
    dlg.querySelectorAll("[data-take]").forEach((b) => { b.onclick = () => { Game.respondJob(state, b.dataset.take); saveNow(); showSummary(); }; });
    if ($("#sum-stay")) $("#sum-stay").onclick = () => { state.job.pendingMove = null; saveNow(); showSummary(); };
    if ($("#sum-retire")) $("#sum-retire").onclick = retire;
    if (s.gameOver) {
      $("#sum-new").onclick = () => { dlg.close(); $("#careers-btn").click(); };
    } else if (state.phase === "retired") {
      $("#sum-careers").onclick = () => { dlg.close(); $("#careers-btn").click(); };
    } else {
      $("#sum-close").onclick = () => dlg.close();
      $("#sum-next").onclick = () => {
        if (state.job.prompt) return;
        Game.nextSeason(state);
        resetView();
        saveNow();
        dlg.close();
        showPage("club");
        renderAll();
        window.scrollTo(0, 0);
      };
    }
  }

  // The board's verdict, your reputation and any job offers, in the season review.
  function jobSection(s) {
    const j = s.job;
    if (!j || !state.job) return "";
    const J = state.job;
    const head = `<div class="small"><b>${esc(j.verdict)}</b> ${j.objective ? `Objective: ${esc(Managers.lcFirst(j.objective))}${j.expected ? ` (expected ${ordinal(j.expected)})` : ""}. ` : ""}
      Reputation ${Math.round(j.rep)} (${j.repChange >= 0 ? "+" : "−"}${Math.abs(Math.round(j.repChange))}).
      ${j.changes ? `${j.changes} managerial change${j.changes === 1 ? "" : "s"} in your division this season.` : ""}</div>`;
    let offers = "";
    if (J.prompt && J.prompt.kind === "sacked") {
      offers = `<p class="small down-txt">${J.prompt.relegatedOut ? "Your club has dropped out of the Football League." : "You've lost your job."} Choose where to manage next season:</p>
        <div class="offer-list">${J.prompt.offers.map(offerCard).join("")}</div>
        <div class="dialog-actions" style="margin-top:8px"><button class="btn ghost danger-text" id="sum-retire">Retire instead</button></div>`;
    } else if (J.pendingMove) {
      offers = `<p class="small up-txt">You'll take charge of <b>${esc(team(J.pendingMove.club).name)}</b> next season.</p>
        ${J.pendingMove.why === "Left" ? `<button class="btn small ghost" id="sum-stay">Stay at ${esc(team(state.myTeam).name)} instead</button>` : ""}`;
    } else if (J.summerOffers && J.summerOffers.length) {
      offers = `<p class="small">Other clubs want you for next season:</p><div class="offer-list">${J.summerOffers.map(offerCard).join("")}</div>`;
    }
    return `<div class="summary-section"><h3>Your job</h3>${head}${offers}</div>`;
  }

  // ---- Pages ----------------------------------------------------------------

  const VIZ = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
  const fmt1 = (v) => (v == null ? "—" : v.toFixed(1));
  const fmt2 = (v) => (v == null ? "—" : v.toFixed(2));
  const signed = (v, d = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(d)}`;

  $("#page-nav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-page]");
    if (b) showPage(b.dataset.page);
  });

  function showPage(p) {
    page = p;
    document.querySelectorAll("#page-nav button").forEach((b) => {
      const on = b.dataset.page === p;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    $("#page-club").hidden = p !== "club";
    $("#page-analysis").hidden = p !== "analysis";
    $("#page-records").hidden = p !== "records";
    $("#page-finances").hidden = p !== "finances";
    $("#page-cups").hidden = p !== "cups";
    $("#page-europe").hidden = p !== "europe";
    $("#page-manager").hidden = p !== "manager";
    tipApi.hide();
    renderPage();
    window.scrollTo(0, 0);
  }

  function renderPage() {
    if (page === "analysis") renderAnalysis();
    else if (page === "records") renderRecords();
    else if (page === "finances") renderFinances();
    else if (page === "cups") renderCups();
    else if (page === "europe") renderEurope();
    else if (page === "manager") renderManager();
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state && page !== "club") renderPage(); }, 150);
  });

  // Zone shading for position charts.
  function zoneBands(def, n) {
    const z = def.zones;
    const bands = def.tier === 1
      ? [{ from: 1, to: z.europe, color: "--zone-up" }]
      : [{ from: 1, to: z.autoUp, color: "--zone-up" }, { from: z.playoff[0], to: z.playoff[1], color: "--zone-po" }];
    bands.push({ from: n - z.down + 1, to: n, color: "--zone-down" });
    return bands;
  }

  // ---- Analysis page --------------------------------------------------------

  // Fair-play table: league bookings and sendings-off this season, cleanest first
  // (a yellow is one point, a red three).
  function disciplineHtml() {
    const me = state.myTeam, disc = state.disc || {};
    const rows = state.leagues[state.league].map((id) => ({ id, y: (disc[id] || [0, 0])[0], r: (disc[id] || [0, 0])[1] }))
      .map((x) => ({ ...x, pts: x.y + 3 * x.r })).sort((a, b) => a.pts - b.pts || a.r - b.r);
    const played = state.results.length;
    const avgY = rows.reduce((t, x) => t + x.y, 0) / (rows.length || 1);
    const mineRow = rows.find((x) => x.id === me), pos = rows.indexOf(mineRow) + 1;
    const cc = Game.CARDS_PER_MATCH[Game.leagueDef(state.league).country];
    return `<div class="panel">
      <div class="panel-head"><h2>Discipline</h2><span class="muted small">League games · a yellow is 1 point, a red 3</span></div>
      <p class="small" style="margin:0 0 8px">${played ? `${esc(team(me).name)} are <b>${ordinal(pos)}</b> of ${rows.length} on fair play: ${mineRow.y} yellow${mineRow.y === 1 ? "" : "s"} and ${mineRow.r} red${mineRow.r === 1 ? "" : "s"} (division average ${avgY.toFixed(0)} yellows).` : "No league games played yet."}
        Referees here show about ${(cc || 4.4).toFixed(1)} yellow cards a match. Defensive set-ups, high pressing and derbies bring more; a straight red is a three-match ban, a second booking one match, and a fifth booking one match.</p>
      <div class="table-scroll"><table class="ltable disc-table">
        <thead><tr><th class="c-pos">#</th><th class="team-col">Club</th><th class="num">🟨</th><th class="num">🟥</th><th class="num">Pts</th></tr></thead>
        <tbody>${rows.map((x, i) => `<tr class="${x.id === me ? "mine" : ""}"><td class="pos num">${i + 1}</td>
          <td class="team-col"><div class="t">${badge(team(x.id), "sm")}<span>${esc(team(x.id).name)}</span></div></td>
          <td class="num">${x.y}</td><td class="num">${x.r}</td><td class="num pts">${x.pts}</td></tr>`).join("")}</tbody></table></div>
    </div>`;
  }

  function renderAnalysis() {
    const el = $("#page-analysis");
    const me = state.myTeam;
    const def = Game.leagueDef(state.league);
    const rep = Game.divisionReport(state);
    const mine = rep.find((r) => r.id === me);
    const others = rep.filter((r) => r.id !== me);
    const n = rep.length;
    const played = mine.row.p;
    const avg = (key, list = rep) => {
      const v = list.map((r) => r[key]).filter((x) => x != null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    const rank = (key, higher = true) => mine[key] == null ? null
      : 1 + rep.filter((r) => r[key] != null && (higher ? r[key] > mine[key] : r[key] < mine[key])).length;
    const tile = (label, value, r, avgText) => `
      <div class="tile-stat"><div class="label">${label}</div><div class="value num">${value}</div>
      <div class="sub">${r ? `<b>${ordinal(r)}</b> of ${n} · ` : ""}avg ${avgText}</div></div>`;

    const attR = rank("att"), defR = rank("def");
    const gfR = rank("gfPer"), gaR = rank("gaPer", false);
    const tiles = [
      tile("Attack rating", fmt1(mine.att), attR, fmt1(avg("att"))),
      tile("Defence rating", fmt1(mine.def), defR, fmt1(avg("def"))),
      tile("Scored per game", fmt2(mine.gfPer), gfR, fmt2(avg("gfPer"))),
      tile("Conceded per game", fmt2(mine.gaPer), gaR, fmt2(avg("gaPer"))),
      tile("Home points / game", fmt2(mine.homePpg), rank("homePpg"), fmt2(avg("homePpg"))),
      tile("Away points / game", fmt2(mine.awayPpg), rank("awayPpg"), fmt2(avg("awayPpg"))),
    ].join("");

    // Where to invest next.
    const adv = Game.investmentAdvice(state);
    const valued = adv.items.filter((i) => !i.nextSeason);
    const maxPts = Math.max(...valued.map((i) => i.points), 0.01);
    const avail = valued.filter((i) => i.available).sort((a, b) => b.points - a.points);
    const bestAvail = avail[0];
    const bestAll = valued.slice().sort((a, b) => b.points - a.points)[0];
    const rows = adv.items.slice().sort((a, b) => (a.nextSeason - b.nextSeason) || (b.points - a.points)).map((i) => {
      const best = bestAvail && i.id === bestAvail.id && adv.remaining > 0;
      const lock = !i.available ? (i.opensIn ? `🔒 opens in ${i.opensIn} MD` : "🔒 closed") : "";
      const amount = Math.min(adv.step, adv.cash);
      const pts = i.nextSeason
        ? `<span class="muted">next season</span>`
        : `<div class="bar"><span style="width:${Math.max(0, (i.points / maxPts) * 100)}%"></span></div><b>${signed(i.points)}</b>`;
      return `<tr class="${best ? "best" : ""} ${i.available ? "" : "locked"}">
        <td>${i.icon} ${esc(i.name)}</td>
        <td>${esc(i.effectLabel)}</td>
        <td><div class="pts">${pts}</div></td>
        <td class="act">${lock || `<button class="btn small" data-add="${i.id}" ${amount < 0.01 ? "disabled" : ""}>Add ${money(amount)}</button>`}</td>
      </tr>`;
    }).join("");

    // Takeaways.
    const take = [];
    take.push(`Your attack is <b>${ordinal(attR)}</b> and your defence <b>${ordinal(defR)}</b> of ${n} in the ${def.name} (ratings include everyone's spending).`);
    if (played >= 3) take.push(`You score ${fmt2(mine.gfPer)} goals a game (${ordinal(gfR)}) and concede ${fmt2(mine.gaPer)} (${ordinal(gaR)}).`);
    if (mine.homePpg != null && mine.awayPpg != null && Math.abs(mine.homePpg - mine.awayPpg) >= 0.7) {
      take.push(mine.homePpg > mine.awayPpg
        ? `You're far stronger at home (${fmt2(mine.homePpg)} points a game) than away (${fmt2(mine.awayPpg)}). Stadium & Fans spending builds on that.`
        : `You're picking up more points away (${fmt2(mine.awayPpg)} a game) than at home (${fmt2(mine.homePpg)}).`);
    }
    const under = INVESTMENTS.map((d) => ({ d, me: mine.invest[d.id], avg: avg("x", others.map((o) => ({ x: o.invest[d.id] }))) }))
      .filter((x) => x.avg > def.budgetBase * 0.05 && x.me < x.avg * 0.5)
      .sort((a, b) => (b.avg - b.me) - (a.avg - a.me)).slice(0, 2);
    under.forEach((u) => take.push(`You've spent less than your rivals on ${esc(u.d.name)}: ${money(u.me)} against a division average of ${money(u.avg)}.`));
    if (adv.remaining > 0 && bestAvail) {
      take.push(`Best value right now: <b>${esc(bestAvail.name)}</b>. The next ${money(adv.step)} is worth about ${signed(bestAvail.points)} expected points over your last ${adv.remaining} league games.`);
      if (bestAll && !bestAll.available && bestAll.points > bestAvail.points * 1.2) {
        take.push(`When the transfer window ${bestAll.opensIn ? `opens in ${bestAll.opensIn} matchdays` : "next opens"}, ${esc(bestAll.name)} would be worth ${signed(bestAll.points)}.`);
      }
    } else if (adv.remaining === 0) {
      take.push("No league matches are left this season, so spending can only help in the play-offs.");
    }
    const capacity = team(me).capacity;
    const demandNow = Game.ticketDemand(state, me, 1);
    if (demandNow > capacity * 1.03) {
      take.push(`Your ${seats(capacity)}-seat ground sells out, with roughly ${seats(demandNow - capacity)} more fans wanting tickets each game. See the Stadium panel for expansion paybacks.`);
    } else if (demandNow < capacity * 0.75) {
      take.push(`Your ground is only about ${Math.round((demandNow / capacity) * 100)}% full. A good run, promotion or Fans & Matchday spending would grow crowds, but expansion won't pay.`);
    }
    take.push(adv.cash >= adv.step
      ? `You have ${money(adv.cash)} unspent.`
      : `You have ${money(Math.max(0, adv.cash))} left. Wins, home gates and cup runs top this up during the season.`);
    const academy = adv.items.find((i) => i.nextSeason);
    if (academy) take.push(`Academy money doesn't help this season, but the next ${money(adv.step)} adds about ${signed(academy.gain)} to your rating next season.`);

    const spendRows = INVESTMENTS.map((d) => ({ label: d.name, a: mine.invest[d.id], b: avg("x", others.map((o) => ({ x: o.invest[d.id] }))) || 0 }));
    const posHist = Game.positionHistory(state, state.league);

    el.innerHTML = `
      <div class="page-head">
        <h1>How ${esc(team(me).name)} compare</h1>
        <p class="muted">${Game.seasonLabel(state.season)} ${def.name} · after ${played} league game${played === 1 ? "" : "s"} · ratings exclude form and injuries</p>
      </div>
      <div class="tiles six">${tiles}</div>
      <div class="grid-2">
        <div class="panel">
          <h2>Key takeaways</h2>
          <ul class="takeaways">${take.map((t) => `<li>${t}</li>`).join("")}</ul>
        </div>
        <div class="panel">
          <div class="panel-head"><h2>Where to invest next</h2><span class="muted small">${money(adv.step)} per step</span></div>
          <p class="muted small" style="margin:0 0 8px">Expected league points the next ${money(adv.step)} in each area would add over your remaining ${adv.remaining} matches, allowing for diminishing returns. You're currently expected to take ${adv.expected.toFixed(0)} more points.</p>
          <table class="advice">
            <thead><tr><th>Area</th><th>Next ${money(adv.step)} buys</th><th>Expected points</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div class="grid-2">
        <div class="panel">
          <h2>Attack vs defence</h2>
          <p class="muted small" style="margin:0 0 6px">Every club in the division. Dashed lines are the division averages; up and to the right is better.</p>
          <div id="an-scatter"></div>
        </div>
        <div class="panel">
          <h2>Spending vs your division</h2>
          <div class="legend"><span style="--c:var(--viz-1)">${esc(team(me).name)}</span><span style="--c:var(--viz-dot)">Division average</span></div>
          <div id="an-spend"></div>
        </div>
      </div>
      <div class="panel">
        <h2>Your league position, week by week</h2>
        ${zoneLegend(def)}
        <div id="an-bump"></div>
      </div>
      ${disciplineHtml()}`;

    Charts.scatter($("#an-scatter"), {
      xLabel: "Attack rating", yLabel: "Defence rating", avgX: avg("att"), avgY: avg("def"), tip: tipApi,
      points: rep.map((r) => ({
        x: r.att, y: r.def, me: r.id === me, label: team(r.id).name,
        tip: `<div class="tip-title">${esc(team(r.id).name)}</div><div>${ordinal(r.pos)} · ATT ${fmt1(r.att)} · DEF ${fmt1(r.def)}</div>`,
      })),
    });
    Charts.dotPlot($("#an-spend"), { rows: spendRows, aName: team(me).name, bName: "Division average", fmt: money, tip: tipApi });
    Charts.bump($("#an-bump"), {
      n, length: posHist[me].length, tip: tipApi, bands: zoneBands(def, n),
      series: [{ label: team(me).name, color: VIZ[0], values: posHist[me] }],
      context: rep.filter((r) => r.id !== me).map((r) => ({ values: posHist[r.id] })),
    });
    el.querySelectorAll("[data-add]").forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.add;
        Game.setInvestment(state, id, state.invest[id] + Math.min(adv.step, Game.cash(state)));
        onInvestmentChanged();
      };
    });
  }

  // ---- Finances page --------------------------------------------------------

  const LINE_NAMES = {
    broadcast: "TV & central payments", merit: "Merit payment", parachute: "Parachute payment", europe: "European football",
    commercial: "Commercial & sponsorship", matchday: "Matchday (gates)", cups: "Cup prize money & gates", sales: "Player sales",
    wages: "Wages", operations: "Running costs", spending: "Spending on squad & staff", stadium: "Stadium work", owner: "Owner funding",
  };
  const signedMoney = money;

  function renderFinances() {
    const el = $("#page-finances");
    const me = state.myTeam;
    const f = state.fin[me];
    const lid = state.league, def = Game.leagueDef(lid);
    const lines = Game.accountLines(state, me);
    const total = (list, k) => list.reduce((t, l) => t + l[k], 0);
    const revSo = total(lines.income, "sofar"), revFc = total(lines.income, "forecast");
    const costSo = total(lines.costs, "sofar"), costFc = total(lines.costs, "forecast");
    const end = Game.projectedBank(state, me);
    const safe = Game.safeToSpend(state);
    const rules = Game.rulesStatus(state, me);
    const wagesFc = lines.costs.find((l) => l.key === "wages").forecast;

    const alerts = [];
    if (state.deduct[me]) alerts.push(["bad", `⛔ Points deduction this season: ${esc((state.deductWhy[me] || []).join(", "))}.`]);
    if (f.embargo) alerts.push(["bad", "⛔ Transfer embargo this season: you can't sign players."]);
    if (f.admin) alerts.push(["bad", "⛔ The club went into administration this season."]);
    if (end < -f.credit * 0.25) alerts.push(["bad", `⚠️ You're forecast to finish ${money(-end)} overdrawn. If the bank goes past your ${money(f.credit)} credit line with no way back, the club goes into administration (−${FINANCE.administration[lid]} points).`]);
    else if (end < 0) alerts.push(["warn", `⚠️ You're forecast to finish the season ${money(-end)} overdrawn. That's within your credit line, but it carries into next season.`]);
    if (rules.kind === "ps" && rules.room < 0) alerts.push(["bad", `⚠️ On course to break Profitability & Sustainability rules: losses of ${money(rules.loss)} against a ${money(rules.limit)} limit. That means a points deduction next season.`]);
    if (rules.kind === "scmp" && rules.room < 0) alerts.push(["bad", `⚠️ Squad costs are heading for ${Math.round(rules.ratio * 100)}% of turnover (cap ${Math.round(rules.cap * 100)}%). That means a transfer embargo next season.`]);

    const tile = (label, value, sub, cls = "") => `<div class="tile-stat"><div class="label">${label}</div><div class="value num ${cls}">${value}</div><div class="sub">${sub}</div></div>`;
    const row = (l, cls = "") => `<tr class="${cls}"><td>${LINE_NAMES[l.key]}</td><td class="num">${money(l.sofar)}</td><td class="num">${money(l.forecast)}</td></tr>`;
    const ruleCard = rules.kind === "none"
      ? `<p class="small">No spending limits are modelled in the ${esc(def.name)}. Run out of money with no way back, though, and the club still goes into administration.</p>`
      : rules.kind === "ps"
      ? `<p class="small">The ${def.name} allows losses of up to <b>${money(rules.limit)}</b> over three seasons. Owner funding, academy spending and stadium work don't count as losses. Breaking the limit costs up to ${FINANCE.ps[lid].max} points.</p>
         <div class="meter"><span style="width:${Math.min(100, Math.max(0, (rules.loss / rules.limit) * 100))}%" class="${rules.room < 0 ? "over" : rules.room < rules.limit * 0.2 ? "near" : ""}"></span></div>
         <p class="small num">Forecast losses: <b>${money(Math.max(0, rules.loss))}</b> (this season plus ${rules.pastSeasons} before) · headroom <b class="${rules.room < 0 ? "neg" : ""}">${signedMoney(rules.room)}</b></p>`
      : `<p class="small">${def.name} clubs must keep squad costs (wages plus transfer spending) under <b>${Math.round(rules.cap * 100)}%</b> of turnover plus owner funding. Breaking the cap means a transfer embargo next season.</p>
         <div class="meter"><span style="width:${Math.min(100, (rules.ratio / rules.cap) * 100)}%" class="${rules.room < 0 ? "over" : rules.ratio > rules.cap * 0.9 ? "near" : ""}"></span></div>
         <p class="small num">Forecast: <b>${Math.round(rules.ratio * 100)}%</b> (${money(rules.squadCost)} of ${money(rules.turnover)}) · room for <b class="${rules.room < 0 ? "neg" : ""}">${signedMoney(rules.room)}</b> more on players</p>`;

    const sales = Game.saleOptions(state).map((o) => `
      <div class="stad-opt">
        <div class="stad-top"><span class="name">${esc(o.name)}</span><span class="num cost">+${money(o.fee)}</span></div>
        <div class="muted small">Squad rating −${o.points}. Wages fall by ${money(o.saving)} a season.</div>
        <button class="btn small" data-sell="${o.id}" ${o.blocked ? "disabled" : ""}>${o.blocked ? esc(o.blocked) : "Sell"}</button>
      </div>`).join("");

    const clubs = state.leagues[lid].map((id) => {
      const fc = Game.forecast(state, id), fin = state.fin[id];
      return { id, fc, fin, wagePct: fc.costs.wages / fc.revenue };
    }).sort((a, b) => b.fc.revenue - a.fc.revenue);
    const clubRows = clubs.map((c) => {
      const tags = [
        state.deduct[c.id] ? `<span class="tag bad" data-tip="${esc((state.deductWhy[c.id] || []).join(", "))}">−${state.deduct[c.id]} pts</span>` : "",
        c.fin.embargo ? `<span class="tag bad">embargo</span>` : "",
        c.fin.admin ? `<span class="tag bad">administration</span>` : "",
        c.fin.parachuteNow ? `<span class="tag">parachute</span>` : "",
        c.fin.europe ? `<span class="tag">Europe</span>` : "",
        state.ai[c.id] && state.ai[c.id].event === "takeover" ? `<span class="tag">💰 takeover</span>` : "",
      ].join("");
      return `<tr class="${c.id === me ? "mine" : ""}">
        <td class="team-col"><div class="t">${badge(team(c.id), "sm")}<span>${esc(team(c.id).name)}</span></div></td>
        <td class="num">${money(c.fc.revenue)}</td><td class="num">${money(c.fc.costs.wages)}</td>
        <td class="num hide-sm">${Math.round(c.wagePct * 100)}%</td><td class="num hide-sm">${money(c.fin.owner)}</td>
        <td class="num ${c.fin.bank < 0 ? "neg" : ""}">${money(c.fin.bank)}</td><td class="tags">${tags}</td></tr>`;
    }).join("");

    el.innerHTML = `
      <div class="page-head">
        <h1>${esc(team(me).name)} finances</h1>
        <p class="muted">${Game.seasonLabel(state.season)} ${def.name} · "So far" is money booked this season; "Forecast" is the full season if you spend nothing more</p>
      </div>
      ${alerts.map(([cls, t]) => `<div class="alert ${cls}">${t}</div>`).join("")}
      <div class="tiles">
        ${tile("Bank balance", money(f.bank), `credit line ${money(f.credit)}`, f.bank < 0 ? "neg" : "")}
        ${tile("Available to spend", money(Math.max(0, Game.cash(state))), `safe to spend <b>${money(safe)}</b>`)}
        ${tile("Season-end forecast", money(end), "bank balance if you spend nothing more", end < 0 ? "neg" : "")}
        ${tile("Wage bill", money(wagesFc), `${Math.round((wagesFc / revFc) * 100)}% of turnover`)}
      </div>
      <div class="grid-2">
        <div class="panel">
          <h2>Income and spending</h2>
          <table class="accounts">
            <thead><tr><th></th><th class="num">So far</th><th class="num">Forecast</th></tr></thead>
            <tbody>
              ${lines.income.filter((l) => l.forecast > 0.005 || l.sofar > 0.005).map((l) => row(l)).join("")}
              <tr class="total"><td>Revenue</td><td class="num">${money(revSo)}</td><td class="num">${money(revFc)}</td></tr>
              ${lines.costs.filter((l) => l.forecast > 0.005 || l.sofar > 0.005).map((l) => row(l)).join("")}
              <tr class="total"><td>Costs</td><td class="num">${money(costSo)}</td><td class="num">${money(costFc)}</td></tr>
              <tr class="result"><td>Profit / loss</td><td class="num ${revSo - costSo < 0 ? "neg" : ""}">${signedMoney(revSo - costSo)}</td><td class="num ${revFc - costFc < 0 ? "neg" : ""}">${signedMoney(revFc - costFc)}</td></tr>
              ${row(lines.owner)}
            </tbody>
          </table>
          <p class="muted small">Revenue forecasts assume a mid-season average crowd and no further cup or sale income. Wages rise or fall with your squad rating: signings that stick put up next season's wage bill.</p>
        </div>
        <div class="panel">
          <h2>Bank balance this season</h2>
          <div id="fin-bank"></div>
          <h2 style="margin-top:16px">Financial rules</h2>
          ${ruleCard}
        </div>
      </div>
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h2>Sell players</h2><span class="muted small">Only in a transfer window</span></div>
          <p class="muted small" style="margin:0 0 8px">Raise money now and cut your wage bill, at the cost of squad quality.</p>
          <div class="stad-opts">${sales}</div>
        </div>
        <div class="panel">
          <h2>Where the money comes from</h2>
          <p class="small">Your owner puts in about <b>${money(f.owner)}</b> a season. TV money, commercial income and owner funding arrive in equal parts each matchday, and wages and running costs go out the same way. Gate money comes in with each home game, and ${def.tier === 1 ? "merit payments (£3m per place) are paid at the end of the season" : "promotion would bring much bigger TV money"}.</p>
          <p class="small">${f.parachuteNow ? `You're receiving a <b>${money(f.parachuteNow)}</b> parachute payment this season. ` : ""}${f.europe ? `European football is worth about <b>${money(f.europe)}</b> this season. ` : ""}If the bank goes past your credit line and the forecast shows no way back, the club goes into administration.</p>
          <h2 style="margin-top:16px">Owners & investors</h2>
          ${(f.investors || []).length ? `<ul class="plain-list inv-list">${f.investors.map((x) => `<li>💼 <b>${esc(x.name)}</b> <span class="muted">· ${esc(Game.INVESTOR_TYPES[x.type].label.toLowerCase())} since ${Game.seasonLabel(x.season)}</span><br>
            <span class="small">Put in ${money(x.now)}, plus ${money(x.yearly)} a season${x.interest ? `; interest ${money(x.interest)} a season until ${Game.seasonLabel(x.until)}` : ""}.</span></li>`).join("")}</ul>`
            : `<p class="muted small">No outside investors yet. Success attracts them, especially in the lower divisions: win promotion or top a lower division and offers may come.</p>`}
          ${state.offer ? offerHtml(state.offer) : ""}
        </div>
      </div>
      <div class="panel">
        <h2>${def.name} finances</h2>
        <div class="table-scroll"><table class="ltable fin-table">
          <thead><tr><th class="team-col">Club</th><th class="c-money">Turnover</th><th class="c-money">Wages</th><th class="c-n hide-sm">W/T</th><th class="c-money hide-sm">Owner</th><th class="c-money">Bank</th><th class="c-tags"></th></tr></thead>
          <tbody>${clubRows}</tbody>
        </table></div>
        <p class="muted small">Season forecasts. W/T is wages as a share of turnover.</p>
      </div>`;

    Charts.line($("#fin-bank"), {
      values: f.bankHist, fmt: signedMoney, tip: tipApi,
      refs: [{ value: 0, label: "£0" }, { value: -f.credit, label: "Credit limit" }],
    });
    el.querySelectorAll("[data-sell]").forEach((b) => {
      b.onclick = () => { if (Game.sellPlayers(state, b.dataset.sell)) { saveNow(); renderAll(); } };
    });
    wireOffer(el, renderAll);
  }

  // ---- Brackets -------------------------------------------------------------
  // A bracket is columns of matches (Game.cupBracket, Europe.bracket). Each
  // match in a column is fed by one (feed 1) or two (feed 2) matches in the
  // column before; rows are laid out so connectors line up.

  function bracketMatch(m, opts) {
    const me = state.myTeam;
    const side = (id, goals, seed) => {
      if (!id) {
        const label = seed ? `${ordinal(seed)} in the league phase` : "To be decided";
        return `<div class="bk-team tbd"><span class="bk-crest"></span><span class="nm">${label}</span><span class="g"></span></div>`;
      }
      const t = team(id);
      const cls = [id === me ? "mine" : "", m.winner && m.winner !== id ? "out" : "", m.winner === id ? "won" : "", m.prov ? "prov" : ""].join(" ");
      const flag = opts.flags ? `${Leagues.COUNTRY[t.country].flag} ` : "";
      return `<div class="bk-team ${cls}">${badge(t, "md")}<span class="nm" title="${esc(t.name)}">${flag}${esc(t.name)}</span><span class="g num">${goals == null ? "" : goals}</span></div>`;
    };
    const legs = m.legs.length > 1 ? m.legs.map((g) => `${team(g.h).short} ${g.hg}–${g.ag} ${team(g.a).short}`).join(" · ")
      : m.legs.length && opts.twoLegs && !m.winner ? `1st leg: ${team(m.legs[0].h).short} ${m.legs[0].hg}–${m.legs[0].ag} ${team(m.legs[0].a).short}` : "";
    const how = m.note === "pens" ? "won on penalties" : m.note === "aet" ? "after extra time" : "";
    const tip = [legs, how, m.prov ? "Provisional: from the league-phase table as it stands" : ""].filter(Boolean).join(" · ");
    const mine = m.a === me || m.b === me;
    return `<div class="bk-match ${mine ? "mine" : ""}" ${tip ? `data-tip="${esc(tip)}"` : ""}>
      ${side(m.a, m.ga, m.seedA)}${side(m.b, m.gb, m.seedB)}
      ${m.note ? `<span class="bk-note">${m.note === "pens" ? "pens" : "aet"}</span>` : ""}</div>`;
  }

  function bracketHtml(br, opts = {}) {
    const leaves = Math.max(...br.cols.map((c) => c.matches.length));
    const heads = br.cols.map((col, c) => `<div class="bk-head" style="grid-column:${c + 1}">${esc(col.name)}</div>`).join("");
    const cells = br.cols.map((col, c) => {
      const span = leaves / col.matches.length;
      return col.matches.map((m, j) => {
        const join = c === 0 ? "" : col.feed === 1 ? "j1" : "j2";
        return `<div class="bk-cell ${join}" style="grid-column:${c + 1};grid-row:${j * span + 2} / span ${span}">${bracketMatch(m, { ...opts, twoLegs: col.short === "SF" || col.short === "KOPO" || col.short === "R16" || col.short === "QF" ? opts.twoLegKO : false })}</div>`;
      }).join("");
    }).join("");
    const winner = br.winner ? `<div class="br-winner">${badge(team(br.winner), "md")} ${esc(team(br.winner).name)} win the ${esc(opts.name || "cup")}</div>` : "";
    return `<div class="bk-scroll"><div class="bk" style="--cols:${br.cols.length};grid-template-rows:auto repeat(${leaves}, var(--bk-row))">${heads}${cells}</div></div>${winner}`;
  }

  // A list of ties (earlier rounds of a cup).
  function tieListHtml(ties, flags = false) {
    const cell = (id) => `<div class="t">${badge(team(id), "md")}<span title="${esc(team(id).name)}">${flags ? `${Leagues.COUNTRY[team(id).country].flag} ` : ""}${esc(team(id).name)}</span></div>`;
    return ties.map((m) => {
      const played = m.ga != null;
      const note = m.note === "pens" ? " p" : m.note === "aet" ? " aet" : "";
      const legs = m.legs.length > 1 ? `<br><span class="muted tiny">${m.legs.map((g) => `${g.hg}–${g.ag}`).join(", ")}</span>` : "";
      return `<div class="tie ${m.a === state.myTeam || m.b === state.myTeam ? "mine" : ""}">
        <span class="${m.winner && m.winner !== m.a ? "lost" : ""}">${cell(m.a)}</span>
        <span class="score num">${played ? `${m.ga}–${m.gb}${note}${legs}` : "v"}</span>
        <span class="${m.winner && m.winner !== m.b ? "lost" : ""}">${cell(m.b)}</span></div>`;
    }).join("");
  }

  // ---- Cups page ------------------------------------------------------------

  // When a cup's first round is played, as a sentence.
  function playedWhen(cupId, round) {
    const ev = state.cal.find((e) => e.type === "cup" && e.cup === cupId);
    if (!ev) return Game.cupDef(cupId).super ? "Not played this season: the line-up comes from last season's champions and cup winners." : "No more rounds this season.";
    return ev.after === 0 ? `The ${round} is played before the first matchday.` : `The ${round} is played after matchday ${ev.after}.`;
  }

  function renderCups() {
    const el = $("#page-cups");
    const me = state.myTeam;
    const cid = cupView.cid && Leagues.COUNTRY[cupView.cid] ? cupView.cid : state.country;
    const ids = Leagues.COUNTRY[cid].cupIds;
    // Default: a cup you're still in, else the first.
    const live = ids.find((id) => ["in", "waiting"].includes(Game.cupStatus(state, id).state) && cid === state.country);
    const cupId = ids.includes(cupView.cup) ? cupView.cup : live || ids[0];
    cupView = { cid, cup: cupId };
    const def = Game.cupDef(cupId);
    const cup = state.cups[cupId];
    const br = Game.cupBracket(state, cupId);
    const roundName = (i) => def.rounds[i].name.replace(/, [12](st|nd) leg$/, "");
    const st = cid === state.country ? Game.cupStatus(state, cupId) : null;
    const status = cup.winner ? `Won by ${esc(team(cup.winner).name)}`
      : cup.round < def.rounds.length ? `Next: ${roundName(cup.round).toLowerCase()} · ${cup.alive.length + (cup.byes || []).length} clubs left` : "";
    const mine = st ? { won: "🏆 You won it", out: st.round === def.rounds.length - 1 ? "You lost the final" : `You went out in the ${st.round != null ? roundName(st.round).toLowerCase() : ""}`, in: "You're still in", waiting: `You enter in the ${st.round != null ? roundName(st.round).toLowerCase() : ""}`, none: "" }[st.state] : "";
    const countryOpts = Leagues.COUNTRY_ORDER.filter((c) => Leagues.COUNTRY[c].cupIds.length)
      .map((c) => `<option value="${c}" ${c === cid ? "selected" : ""}>${Leagues.COUNTRY[c].flag} ${esc(Leagues.COUNTRY[c].name)}</option>`).join("");
    const holders = (state.archive || []).slice().reverse().filter((a) => a.cups[cupId] && a.cups[cupId].winner).slice(0, 6)
      .map((a) => `<li><span class="muted">${Game.seasonLabel(a.season)}</span> ${badge(team(a.cups[cupId].winner), "sm")} ${esc(team(a.cups[cupId].winner).name)}</li>`).join("");
    const earlier = br.earlier.slice().reverse().map((r) => {
      const hasMine = r.ties.some((m) => m.a === me || m.b === me);
      return `<details ${hasMine || r.upcoming ? "open" : ""}><summary>${esc(r.name)}${r.upcoming ? " · drawn, still to play" : ""} · ${r.ties.length} ties</summary>
        <div class="ties">${tieListHtml(r.ties)}</div></details>`;
    }).join("");
    el.innerHTML = `
      <div class="page-head">
        <h1>Domestic cups</h1>
        <p class="muted">${Game.seasonLabel(state.season)} · every country's cup, round by round. From the last 16 the draw is made as a fixed bracket, so you can see the path to the final.</p>
      </div>
      <div class="controls">
        <select id="cup-country" aria-label="Country">${countryOpts}</select>
        ${ids.length > 1 ? `<div class="lg-switch" role="group" aria-label="Cup">${ids.map((id) => `<button data-cupid="${id}" class="${id === cupId ? "active" : ""}" aria-pressed="${id === cupId}">${esc(Game.cupDef(id).name)}</button>`).join("")}</div>` : ""}
      </div>
      <div class="panel">
        <div class="panel-head"><h2>${esc(def.name)}</h2><span class="muted small">${status}${mine ? ` · <b>${mine}</b>` : ""}</span></div>
        ${br.fixed ? "" : `<p class="muted small" style="margin:0 0 8px">The bracket is drawn once ${br.cols[0].matches.length * 2} clubs are left. Until then each round is drawn at random.</p>`}
        ${bracketHtml(br, { name: def.name, twoLegKO: true })}
      </div>
      <div class="grid-2">
        <div class="panel"><h2>Earlier rounds</h2>${earlier || `<p class="muted small">${def.super ? (cup.winner ? "A one-off match: no earlier rounds." : playedWhen(cupId, roundName(0).toLowerCase())) : playedWhen(cupId, roundName(0).toLowerCase())}</p>`}</div>
        <div class="panel"><h2>Recent winners</h2>${holders ? `<ul class="plain-list">${holders}</ul>` : `<p class="muted small">Winners appear here at the end of each season.</p>`}</div>
      </div>`;
    $("#cup-country").onchange = (e) => { cupView = { cid: e.target.value, cup: null }; renderCups(); };
    el.querySelectorAll("[data-cupid]").forEach((b) => { b.onclick = () => { cupView.cup = b.dataset.cupid; renderCups(); }; });
  }

  // ---- Europe page ----------------------------------------------------------

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (!g || !state) return;
    e.preventDefault();
    if (g.dataset.cup) cupView = { cid: Game.cupDef(g.dataset.cup).country, cup: g.dataset.cup };
    showPage(g.dataset.goto);
  });

  const flagOf = (id) => Leagues.COUNTRY[team(id).country].flag;
  const clubCell = (id) => `<div class="t">${badge(team(id), "md")}<span title="${esc(team(id).name)}">${flagOf(id)} ${esc(team(id).name)}</span></div>`;

  // "Club A 3–2 Club B" with aggregate, extra time and penalties noted.
  function tieLine(t) {
    if (!t.games.length) return `<div class="tie">${clubCell(t.lo)}<span class="score num">v</span>${clubCell(t.hi)}</div>`;
    const goals = (id) => t.games.reduce((a, g) => a + (g.h === id ? g.hg : g.a === id ? g.ag : 0), 0);
    const last = t.games[t.games.length - 1];
    const note = last.pens ? ` (${esc(team(t.winner).short)} pens)` : last.aet ? " aet" : "";
    const legs = t.games.length > 1 ? `<span class="muted tiny">${t.games.map((g) => `${g.hg}–${g.ag}`).join(", ")}</span>` : "";
    return `<div class="tie ${isMine({ h: t.hi, a: t.lo }) ? "mine" : ""}">
      <span class="${t.winner && t.winner !== t.hi ? "lost" : ""}">${clubCell(t.hi)}</span>
      <span class="score num">${goals(t.hi)}–${goals(t.lo)}${note}<br>${legs}</span>
      <span class="${t.winner && t.winner !== t.lo ? "lost" : ""}">${clubCell(t.lo)}</span></div>`;
  }

  function renderEurope() {
    const el = $("#page-europe");
    const me = state.myTeam;
    const s = state.euro.season;
    const mine = Europe.summaryFor(state, me);
    if (!euroView) euroView = mine ? mine.comp : "UCL";
    const c = Europe.COMPS.find((x) => x.id === euroView);
    const comp = s.comps[euroView];

    // League phase table.
    let lpHtml;
    if (comp.lp) {
      const rows = Europe.lpTable(state, euroView);
      lpHtml = `<table class="ltable euro-lp">
        <thead><tr><th class="c-pos">#</th><th class="team-col">Club</th><th class="c-n">P</th><th class="c-n hide-sm">W</th><th class="c-n hide-sm">D</th><th class="c-n hide-sm">L</th><th class="c-gd">GD</th><th class="c-pts">Pts</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr class="${i < 8 ? "z-up" : i < 24 ? "z-po" : "z-down"} ${r.id === me ? "mine" : ""}">
          <td class="pos num">${i + 1}</td><td class="team-col">${clubCell(r.id)}</td>
          <td class="num">${r.p}</td><td class="num hide-sm">${r.w}</td><td class="num hide-sm">${r.d}</td><td class="num hide-sm">${r.l}</td>
          <td class="num">${r.gd > 0 ? "+" : ""}${r.gd}</td><td class="num pts">${r.pts}</td></tr>`).join("")}</tbody></table>
        <div class="zone-legend"><span style="--c:var(--zone-up)">Round of 16</span><span style="--c:var(--zone-po)">Knockout play-offs</span><span style="--c:var(--zone-down)">Eliminated</span></div>`;
    } else {
      lpHtml = `<p class="muted small">The league-phase draw is made once qualifying is over. Already in: ${comp.lpDirect.length} clubs.</p>
        <div class="chips-list">${comp.lpDirect.map((id) => `<span class="chip">${flagOf(id)} ${esc(team(id).name)}</span>`).join("")}</div>`;
    }

    // Knockout bracket.
    const br = Europe.bracket(state, euroView);
    const koNote = br.started ? "" : br.provisional
      ? "Provisional: the bracket as it would be if the league phase ended today. 1st–8th go straight to the round of 16; 9th–24th play off for the other places."
      : "The bracket fills in during the league phase. 1st–8th go straight to the round of 16; 9th–24th play off for the other places.";

    // Qualifying rounds, by path.
    const pathName = { CP: "Champions path", LP: "League path", MAIN: "Qualifying" };
    const qualHtml = Object.values(comp.paths).map((p) => {
      const rounds = Europe.QUAL.map((k) => p.rounds[k]).filter((r) => r.drawn && r.ties.length);
      if (!rounds.length) return "";
      return `<div class="qual-path">${p.id === "MAIN" ? "" : `<h3>${pathName[p.id]}</h3>`}${rounds.map((r) => `
        <details ${r.ties.some((t) => t.hi === me || t.lo === me) ? "open" : ""}><summary>${Europe.QUAL_NAMES[r.key]} · ${r.ties.length} ties${r.byes.length ? ` · ${r.byes.length} byes` : ""}</summary>
          <div class="ties">${r.ties.map(tieLine).join("")}</div></details>`).join("")}</div>`;
    }).join("") || `<p class="muted small">No qualifying ties drawn yet.</p>`;

    // Association ranking.
    const ranking = Europe.ranking(state);
    const places = (rank, cid) => {
      if (cid === "RUS") return "Suspended";
      if (cid === "LIE") return "UECL: cup winner";
      const slots = Europe.accessFor(rank);
      const count = (id) => slots.filter((x) => x.comp === id).length;
      return ["UCL", "UEL", "UECL"].map((id) => `${id} ${count(id)}`).join(" · ");
    };
    let r = 0;
    const rankRows = ranking.map((x) => {
      if (!x.banned) r++;
      const cn = Leagues.COUNTRY[x.cid];
      return `<tr class="${x.cid === state.country ? "mine" : ""}"><td class="pos num">${x.banned ? "–" : r}</td>
        <td class="team-col">${cn ? cn.flag : ""} ${esc(cn ? cn.name : x.cid)}</td>
        ${x.seasons.map((v) => `<td class="num hide-sm">${v.toFixed(1)}</td>`).join("")}<td class="num pts">${x.total.toFixed(1)}</td>
        <td class="small">${places(r, x.cid)}</td></tr>`;
    }).join("");

    const roll = state.euro.history.slice().reverse();
    // The UEFA Super Cup: Champions League winners v Europa League winners.
    const usc = state.cups.USC;
    const uscTie = usc && usc.history.length ? usc.history[0].ties[0] : usc && usc.ties[0];
    const uscWinner = (season) => { const a = (state.archive || []).find((x) => x.season === season); return a && a.cups.USC ? a.cups.USC.winner : null; };
    const uscHtml = uscTie ? `<div class="usc-line small"><b>UEFA Super Cup ${Game.seasonLabel(state.season)}:</b> ${clubCell(uscTie.h)}
      <span class="score num">${uscTie.hg != null ? `${uscTie.hg}–${uscTie.ag}${uscTie.pens ? " (pens)" : ""}` : "v"}</span> ${clubCell(uscTie.a)}
      ${usc.winner ? `<span class="up-txt">🏆 ${esc(team(usc.winner).name)}</span>` : `<span class="muted">before the first matchday</span>`}</div>` : "";
    el.innerHTML = `
      <div class="page-head">
        <h1>European competitions</h1>
        <p class="muted">${Game.seasonLabel(state.season)} · ${mine ? `${esc(team(me).name)}: ${esc(mine.name)}, ${esc(mine.text.toLowerCase())}` : `${esc(team(me).name)} aren't in Europe this season`}</p>
      </div>
      <div class="tabs" role="tablist">${Europe.COMPS.map((x) => `<button role="tab" data-euro="${x.id}" class="${x.id === euroView ? "active" : ""}" aria-selected="${x.id === euroView}">${x.name}</button>`).join("")}</div>
      <div class="panel">
        <div class="panel-head"><h2>Knockout bracket</h2><span class="muted small">Two legs until the one-off final</span></div>
        ${koNote ? `<p class="muted small" style="margin:0 0 8px">${koNote}</p>` : ""}
        ${bracketHtml(br, { flags: true, name: c.name, twoLegKO: true })}
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h2>League phase</h2><span class="muted small">${c.lpMatches} matches each</span></div>${lpHtml}</div>
        <div class="panel"><h2>Qualifying</h2>${qualHtml}</div>
      </div>
      <div class="grid-2">
        <div class="panel"><h2>UEFA association ranking</h2>
          <p class="muted small" style="margin:0 0 8px">Points per club entered, over five seasons. The ranking decides how many European places each league gets.</p>
          <div class="table-scroll" style="max-height:520px"><table class="ltable rank-table">
            <thead><tr><th class="c-pos">#</th><th class="team-col">Association</th>${[5, 4, 3, 2, 1].map((k) => `<th class="c-gd hide-sm">−${k}</th>`).join("")}<th class="c-pts">Total</th><th class="c-places">Places</th></tr></thead>
            <tbody>${rankRows}</tbody></table></div></div>
        <div class="panel"><h2>Roll of honour</h2>
          ${uscHtml}
          ${roll.length ? `<div class="table-scroll"><table class="roll"><thead><tr><th>Season</th>${Europe.COMPS.map((x) => `<th>${x.name}</th>`).join("")}<th>Super Cup</th></tr></thead>
            <tbody>${roll.map((h) => `<tr><td>${Game.seasonLabel(h.season)}</td>${Europe.COMPS.map((x) => `<td>${h.winners[x.id] ? clubCell(h.winners[x.id]) : "—"}</td>`).join("")}<td>${uscWinner(h.season) ? clubCell(uscWinner(h.season)) : "—"}</td></tr>`).join("")}</tbody></table></div>`
          : `<p class="muted small">Winners are added at the end of each season. Holders: ${Europe.COMPS.map((x) => state.euro.holders[x.id] ? `${x.name} – ${esc(team(state.euro.holders[x.id]).name)}` : "").filter(Boolean).join("; ")}.</p>`}
        </div>
      </div>`;
    el.querySelectorAll("[data-euro]").forEach((b) => { b.onclick = () => { euroView = b.dataset.euro; renderEurope(); }; });
  }

  // ---- Manager page -----------------------------------------------------------
  // Your whole career: trophy cabinet, clubs, reputation, achievements, derbies.

  const EURO_NAMES = ["Champions League", "Europa League", "Conference League", "UEFA Super Cup"];
  function trophyIcon(name, league) {
    if (league) return "👑";
    if (name === "Champions League") return "⭐";
    if (EURO_NAMES.includes(name)) return "🌟";
    if (Game.SUPER_CUPS.some((c) => c.name === name)) return "🛡️";
    return "🏆";
  }

  // Every trophy you've won: [{ name, icon, wins: [{ season, club }] }], biggest first.
  function trophyCabinet() {
    const groups = new Map();
    const add = (name, season, club, league = false, tier = 1) => {
      const g = groups.get(name) || { name, icon: trophyIcon(name, league), league, tier, wins: [] };
      g.wins.push({ season, club });
      groups.set(name, g);
    };
    for (const h of state.history) {
      if (h.pos === 1) add(Game.leagueDef(h.league).name, h.season, h.club || state.myTeam, true, Game.leagueDef(h.league).tier);
      for (const c of h.cups || []) if (c.won) add(c.name, h.season, h.club || state.myTeam);
    }
    // Won this season, before the season review.
    const label = Game.seasonLabel(state.season);
    if (!state.history.length || state.history[state.history.length - 1].season !== label) {
      for (const t of Managers.currentStint(state).trophies) if (t.endsWith(label)) add(t.slice(0, -label.length - 1), label, state.myTeam);
    }
    // Champions League, top-flight titles, other European trophies, cups, lower-league titles, super cups.
    const rank = (g) => (g.name === "Champions League" ? 0 : g.league ? (g.tier === 1 ? 1 : 4) : EURO_NAMES.includes(g.name) ? 2 : g.icon === "🛡️" ? 5 : 3);
    return [...groups.values()].sort((a, b) => rank(a) - rank(b) || b.wins.length - a.wins.length);
  }

  function renderManager() {
    const el = $("#page-manager");
    const J = state.job;
    const stints = J.stints;
    const P = stints.reduce((a, s) => a + s.w + s.d + s.l, 0), W = stints.reduce((a, s) => a + s.w, 0);
    const D = stints.reduce((a, s) => a + s.d, 0), L = stints.reduce((a, s) => a + s.l, 0);
    const cabinet = trophyCabinet();
    const total = cabinet.reduce((a, g) => a + g.wins.length, 0);
    const clubsN = new Set(stints.map((s) => s.club)).size;
    const tile = (label, value, sub = "") => `<div class="tile-stat"><div class="label">${label}</div><div class="value num">${value}</div>${sub ? `<div class="muted tiny">${sub}</div>` : ""}</div>`;

    const cab = cabinet.length ? cabinet.map((g) => `<div class="trophy">
        <div class="tr-icon">${g.icon}</div>
        <div class="tr-body"><div class="tr-name">${esc(g.name)} <span class="tr-count num">×${g.wins.length}</span></div>
          <div class="tr-wins">${g.wins.map((w) => `<span class="tr-win" data-tip="${esc(team(w.club).name)}">${badge(team(w.club), "sm")}${w.season}</span>`).join("")}</div></div>
      </div>`).join("") : `<p class="muted small">The cabinet is empty for now. Every league title, cup and European trophy you win goes here.</p>`;

    // Clubs: one row per spell, with the best league finish there.
    const best = {};
    for (const h of state.history) {
      const c = h.club || state.myTeam, tier = Game.leagueDef(h.league).tier;
      const cur = best[c];
      if (!cur || tier < cur.tier || (tier === cur.tier && h.pos < cur.pos)) best[c] = { tier, pos: h.pos, league: h.league, season: h.season };
    }
    const clubRows = stints.slice().reverse().map((st) => {
      const t = team(st.club), g = st.w + st.d + st.l, b = best[st.club];
      const to = st.end ? Game.seasonLabel(st.end.season) : "now";
      return `<tr class="${st.end ? "" : "mine"}"><td class="team-col"><div class="t">${badge(t, "md")}<span>${esc(t.name)}</span></div></td>
        <td>${Game.seasonLabel(st.season)} – ${to}</td><td class="num">${g}</td><td class="num">${st.w}-${st.d}-${st.l}</td>
        <td class="num">${g ? Math.round((st.w / g) * 100) + "%" : "—"}</td>
        <td class="hide-sm">${b ? `${b.pos === 1 ? "Champions" : ordinal(b.pos)}, ${esc(Game.leagueDef(b.league).name)} <span class="muted">(${b.season})</span>` : "—"}</td>
        <td class="small">${st.trophies.length ? `🏆 ${st.trophies.length}` : ""}${st.why ? ` <span class="muted">${st.why === "Left" ? "moved on" : esc(st.why.toLowerCase())}</span>` : ""}</td></tr>`;
    }).join("");

    // Reputation, season by season (recorded from this version on).
    const repHist = state.history.filter((h) => h.rep != null);
    const repVals = repHist.map((h) => h.rep).concat(state.phase === "summary" ? [] : [Math.round(J.rep)]);
    const repLabels = repHist.map((h) => h.season).concat(state.phase === "summary" ? [] : [`${Game.seasonLabel(state.season)} (now)`]);

    const ach = Achievements.all(state);
    const got = ach.filter((a) => a.when);
    const achHtml = ach.slice().sort((a, b) => !!b.when - !!a.when).map((a) => `<div class="ach ${a.when ? "got" : ""}">
        <span class="ach-icon">${a.icon}</span><div><div class="ach-name">${esc(a.name)}</div><div class="muted tiny">${esc(a.desc)}</div>
        ${a.when ? `<div class="tiny up-txt">Unlocked ${esc(a.when)}</div>` : ""}</div></div>`).join("");

    const derbies = Object.entries(J.derbies || {}).map(([k, r]) => { const [name, club, opp] = k.split("|"); return { name, club, opp, ...r }; })
      .sort((a, b) => b.w + b.d + b.l - (a.w + a.d + a.l));
    const derbyHtml = derbies.length ? `<table class="ltable"><thead><tr><th>Derby</th><th class="team-col">Your club</th><th class="team-col hide-sm">Against</th><th class="num">W-D-L</th></tr></thead>
      <tbody>${derbies.map((d) => `<tr><td>🔥 ${esc(d.name)}</td><td class="team-col"><div class="t">${badge(team(d.club), "sm")}<span>${esc(team(d.club).name)}</span></div></td>
        <td class="team-col hide-sm"><div class="t">${badge(team(d.opp), "sm")}<span>${esc(team(d.opp).name)}</span></div></td><td class="num">${d.w}-${d.d}-${d.l}</td></tr>`).join("")}</tbody></table>`
      : `<p class="muted small">Derbies you play are recorded here from now on. ${(() => { const d = Game.derbiesOf(state.myTeam); return d.length ? `${esc(team(state.myTeam).name)}'s: ${d.map((x) => `${esc(x.name)} (v ${esc(team(x.opp).name)})`).join(", ")}.` : `${esc(team(state.myTeam).name)} have no named derby.`; })()}</p>`;

    el.innerHTML = `
      <div class="page-head">
        <h1>${J.name ? esc(J.name) : "Your managerial career"}</h1>
        <p class="muted">${state.history.length} completed season${state.history.length === 1 ? "" : "s"} · ${clubsN} club${clubsN === 1 ? "" : "s"} · now at ${esc(team(state.myTeam).name)} · reputation ${stars(J.rep)} ${Math.round(J.rep)}</p>
      </div>
      <div class="summary-grid mgr-tiles">
        ${tile("Matches", P)}${tile("Record", `${W}-${D}-${L}`)}${tile("Win rate", P ? `${Math.round((W / P) * 100)}%` : "—")}${tile("Trophies", total)}${tile("Achievements", `${got.length}/${ach.length}`)}
      </div>
      <div class="panel"><div class="panel-head"><h2>Trophy cabinet</h2><span class="muted small">${total} trophies</span></div><div class="cabinet">${cab}</div></div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h2>Reputation</h2><span class="muted small">Out of 100: it decides which clubs want you</span></div>
          <div id="mgr-rep"></div>
          ${repVals.length < 2 ? "" : `<p class="muted tiny">Recorded at the end of each season${repHist.length < state.history.length ? ` (from ${repHist[0] ? repHist[0].season : "this season"}: earlier seasons were played before it was tracked)` : ""}.</p>`}</div>
        <div class="panel"><h2>Derby record</h2>${derbyHtml}</div>
      </div>
      <div class="panel"><h2>Clubs managed</h2>
        <div class="table-scroll"><table class="ltable mgr-clubs"><thead><tr><th class="team-col">Club</th><th>Seasons</th><th class="num">P</th><th class="num">W-D-L</th><th class="num">Win %</th><th class="hide-sm">Best finish</th><th></th></tr></thead>
        <tbody>${clubRows}</tbody></table></div></div>
      <div class="panel"><div class="panel-head"><h2>Achievements</h2><span class="muted small">${got.length} of ${ach.length} unlocked</span></div>
        <div class="ach-grid">${achHtml}</div></div>`;
    const repEl = $("#mgr-rep");
    if (repVals.length < 2) repEl.innerHTML = `<p class="muted small">Your reputation is ${Math.round(J.rep)}. It's charted season by season from the end of this season on.</p>`;
    else Charts.line(repEl, { values: repVals, fmt: (v) => String(Math.round(v)), tip: tipApi, xLabel: (i) => repLabels[i], label: "Your reputation, season by season" });
  }

  // ---- Records page ---------------------------------------------------------

  function euroNowText(id) {
    const e = Europe.summaryFor(state, id);
    return e ? `${Europe.COMPS.find((c) => c.id === e.comp).short}: ${esc(e.text)}` : "—";
  }

  function cupNow(id, cupId) {
    const cup = state.cups[cupId];
    if (cup.winner === id) return "Winners";
    if (id in cup.out) return Game.cupReach(cupId, { winner: null, exits: { [id]: cup.out[id].round } }, id);
    return cup.alive.includes(id) ? "In" : null;
  }

  function renderRecords() {
    const el = $("#page-records");
    const archive = state.archive || [];
    const archivedNow = archive.length && archive[archive.length - 1].season === state.season;
    const seasonOpts = [...(archivedNow ? [] : [state.season]), ...archive.map((a) => a.season).reverse()];
    if (!seasonOpts.includes(recView.season)) recView.season = seasonOpts[0];
    const season = recView.season;
    const arch = archive.find((a) => a.season === season);
    const live = !arch;
    const lid = recView.lid || state.league;
    const def = Game.leagueDef(lid);
    const tbl = live ? Game.table(state, lid) : arch.tables[lid];
    const pos = live ? Game.positionHistory(state, lid)
      : Object.fromEntries(Object.entries(arch.positions[lid]).map(([id, v]) => [id, Game.decodePos(v)]));
    const ids = tbl.map((r) => r.id);
    const n = ids.length;
    const me = state.myTeam;

    // Highlighted clubs: you (slot 1, always) plus up to three picks.
    const key = `${season}-${lid}`;
    if (!recView.sel || recView.sel.key !== key) {
      const leader = ids[0];
      recView.sel = { key, ids: leader !== me ? [leader] : ids[1] ? [ids[1]] : [] };
    }
    const picks = recView.sel.ids.filter((id) => ids.includes(id) && id !== me).slice(0, 3);
    const series = [];
    if (ids.includes(me)) series.push({ id: me, label: team(me).name, color: VIZ[0], values: pos[me] });
    picks.forEach((id, i) => series.push({ id, label: team(id).name, color: VIZ[i + 1], values: pos[id] }));
    const shown = new Set(series.map((x) => x.id));
    const length = pos[ids[0]] ? pos[ids[0]].length : 0;

    const chips = series.map((x) => `<span class="sel-chip" style="--c:${x.color}"><i></i>${esc(x.label)}${x.id === me ? "" : `<button data-unsel="${x.id}" aria-label="Remove ${esc(x.label)}">×</button>`}</span>`).join("");
    const addOpts = ids.filter((id) => !shown.has(id)).map((id) => `<option value="${id}">${esc(team(id).name)}</option>`).join("");

    // Roll of honour for a country (completed seasons, plus the current one).
    const rcid = recView.cid || state.country;
    const rc = Leagues.COUNTRY[rcid];
    const roll = Game.rollOfHonour(state, rcid).reverse();
    const euroNow = Object.fromEntries(Europe.COMPS.map((c) => [c.id, state.euro.season.comps[c.id].winner]));
    euroNow.USC = state.cups.USC && state.cups.USC.winner;
    const EURO_COLS = [...Europe.COMPS, { id: "USC", name: "UEFA Super Cup" }];
    const who = (id) => id ? `<div class="who ${id === me ? "mine" : ""}">${badge(team(id), "sm")}${esc(team(id).name)}</div>` : `<span class="muted">—</span>`;
    const liveRow = archivedNow ? "" : `<tr class="live">
      <td>${Game.seasonLabel(state.season)}<br><span class="tiny">in progress</span></td>
      ${rc.divisions.map((lid) => `<td>${state.results.length ? `<span class="tiny">Leading</span>${who(Game.table(state, lid)[0].id)}` : "—"}</td>`).join("")}
      ${rc.cupIds.map((id) => `<td>${who(state.cups[id].winner)}</td>`).join("")}
      ${EURO_COLS.map((c) => `<td>${who(euroNow[c.id])}</td>`).join("")}</tr>`;
    const rollRows = roll.map((r) => `<tr>
      <td>${Game.seasonLabel(r.season)}</td>
      ${rc.divisions.map((lid) => `<td>${who(r.champions[lid])}${r.playoffs[lid] ? `<div class="po">Play-offs: ${esc(team(r.playoffs[lid]).name)}</div>` : ""}</td>`).join("")}
      ${rc.cupIds.map((id) => `<td>${who(r.cups[id])}</td>`).join("")}
      ${EURO_COLS.map((c) => `<td>${who(r.europe[c.id])}</td>`).join("")}</tr>`).join("");

    // Club history.
    const clubId = recView.club && state.teams[recView.club] ? recView.club : me;
    const hist = Game.clubHistory(state, clubId);
    const hon = hist.honours;
    const honourChips = [
      ...Object.entries(hon.titles).map(([l, c]) => `🏆 ${Game.leagueDef(l).name} champions ×${c}`),
      ...Object.entries(hon.europe).map(([c, k]) => `⭐ ${Europe.COMPS.find((x) => x.id === c).name} ×${k}`),
      hon.uefaSuper ? `⭐ UEFA Super Cup ×${hon.uefaSuper}` : "",
      ...hist.cups.filter((c) => hon.cups[c]).map((c) => `🏆 ${Game.cupDef(c).name} ×${hon.cups[c]}`),
      ...hist.cups.filter((c) => hon.finals[c]).map((c) => `${Game.cupDef(c).name} runners-up ×${hon.finals[c]}`),
      hon.promotions ? `▲ Promoted ×${hon.promotions}` : "",
      hon.playoffWins ? `Play-off winners ×${hon.playoffWins}` : "",
      hon.relegations ? `▼ Relegated ×${hon.relegations}` : "",
    ].filter(Boolean);
    const clubLid = Game.leagueOf(state, clubId);
    const nowRow = archivedNow || !clubLid ? "" : (() => {
      const t = Game.table(state, clubLid);
      const i = t.findIndex((r) => r.id === clubId), r = t[i];
      return `<tr class="live ${clubId === me ? "mine" : ""}"><td>${Game.seasonLabel(state.season)}</td><td>${Game.leagueDef(clubLid).short}</td>
        <td class="num">${r.p ? ordinal(i + 1) : "—"}</td><td class="num">${r.pts}</td><td>${r.w}-${r.d}-${r.l}</td><td>${r.gf}–${r.ga}</td>
        ${hist.cups.map((c) => `<td>${cupNow(clubId, c) || "—"}</td>`).join("")}<td>${euroNowText(clubId)}</td><td>in progress</td></tr>`;
    })();
    const histRows = hist.seasons.slice().reverse().map((x) => x.lid
      ? `<tr><td>${Game.seasonLabel(x.season)}</td><td>${Game.leagueDef(x.lid).short}</td><td class="num">${ordinal(x.pos)}</td><td class="num">${x.row.pts}</td>
          <td>${x.row.w}-${x.row.d}-${x.row.l}</td><td>${x.row.gf}–${x.row.ga}</td>${hist.cups.map((c) => `<td>${x.cups[c] || "—"}</td>`).join("")}<td>${x.europe ? `${x.europe.won ? "🏆 " : ""}${Europe.COMPS.find((c) => c.id === x.europe.comp).short}: ${esc(x.europe.text)}` : "—"}</td>
          <td>${x.pos === 1 ? "🏆 Champions" : ""}${x.up ? `<span class="up-txt">▲ ${x.playoffWin ? "Play-offs" : "Promoted"}</span>` : ""}${x.down ? `<span class="down-txt">▼ Relegated</span>` : ""}</td></tr>`
      : `<tr><td>${Game.seasonLabel(x.season)}</td><td>—</td><td class="num">—</td><td class="num">—</td><td>—</td><td>—</td>${hist.cups.map((c) => `<td>${x.cups[c] || "—"}</td>`).join("")}<td>—</td><td>${x.up ? `<span class="up-txt">▲ Promoted</span>` : ""}</td></tr>`).join("");
    const groups = [
      ...Leagues.DIV_ORDER.map((lid) => { const d = Game.leagueDef(lid); return [`${Leagues.COUNTRY[d.country].flag} ${d.name}`, state.leagues[lid]]; }),
      ["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Non-league", [...state.pool, ...state.nonLeague]],
      ...Object.entries(state.outside || {}).map(([cid, ids]) => [`${Leagues.COUNTRY[cid].flag} ${Leagues.COUNTRY[cid].name}`, ids]),
    ];
    const clubOpts = groups.map(([name, list]) => `<optgroup label="${esc(name)}">${list.slice().sort((a, b) => team(a).name.localeCompare(team(b).name))
      .map((id) => `<option value="${id}" ${id === clubId ? "selected" : ""}>${esc(team(id).name)}</option>`).join("")}</optgroup>`).join("");

    // Single-season records.
    const recs = Game.records(state, rc.divisions);
    const recLine = (what, r, unit) => r ? `<div class="rec-line"><span class="what">${what}</span><span class="val">${r.value}${unit}</span>
      <span class="who">${badge(team(r.id), "sm")}${esc(team(r.id).name)} <span class="muted">· ${Game.seasonLabel(r.season)}</span></span></div>` : "";
    const recCards = archive.length ? rc.divisions.map(Game.leagueDef).map((l) => {
      const r = recs[l.id];
      const b = r.bigWin;
      return `<div class="rec-card"><h3>${l.name}</h3>
        ${recLine("Most points", r.mostPoints, " pts")}${recLine("Fewest points", r.fewestPoints, " pts")}
        ${recLine("Most wins", r.mostWins, "")}${recLine("Most goals", r.mostGoals, "")}${recLine("Fewest conceded", r.fewestConceded, "")}
        ${b ? `<div class="rec-line"><span class="what">Biggest win</span><span class="val">${Math.max(b.hg, b.ag)}–${Math.min(b.hg, b.ag)}</span>
          <span class="who">${esc(team(b.hg > b.ag ? b.h : b.a).name)} ${b.hg > b.ag ? "vs" : "at"} ${esc(team(b.hg > b.ag ? b.a : b.h).name)} <span class="muted">· ${Game.seasonLabel(b.season)}</span></span></div>` : ""}
      </div>`;
    }).join("") : `<p class="muted">Records appear once the first season is complete.</p>`;

    el.innerHTML = `
      <div class="page-head">
        <h1>Records & honours</h1>
        <p class="muted">${archive.length} completed season${archive.length === 1 ? "" : "s"} on record · every league, cup and European competition</p>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>League position, week by week</h2></div>
        <div class="controls">
          <select id="rec-season" aria-label="Season">${seasonOpts.map((y) => `<option value="${y}" ${y === season ? "selected" : ""}>${Game.seasonLabel(y)}${y === state.season && !archivedNow ? " (current)" : ""}</option>`).join("")}</select>
          ${leagueSwitch(lid, "data-recl")}
          ${chips}
          ${picks.length < 3 && addOpts ? `<select id="rec-add" aria-label="Add a club to the chart"><option value="">+ Compare a club…</option>${addOpts}</select>` : ""}
        </div>
        ${zoneLegend(def)}
        <div id="rec-bump"></div>
      </div>
      <div class="panel">
          <div class="panel-head"><h2>Roll of honour</h2><select id="rec-country" aria-label="Country">${countryOptions(rcid)}</select></div>
          <div class="table-scroll"><table class="roll">
            <thead><tr><th>Season</th>${rc.divisions.map((lid) => `<th>${esc(Game.leagueDef(lid).name)}</th>`).join("")}${rc.cupIds.map((id) => `<th>${esc(Game.cupDef(id).name)}</th>`).join("")}${EURO_COLS.map((c) => `<th>${c.name}</th>`).join("")}</tr></thead>
            <tbody>${liveRow}${rollRows}</tbody>
          </table></div>
          ${roll.length ? "" : `<p class="muted small">Champions and cup winners are added here at the end of each season.</p>`}
      </div>
      <div class="panel">
          <div class="panel-head"><h2>Club history</h2>
            <div class="club-pick"><select id="rec-club" aria-label="Club">${clubOpts}</select></div>
          </div>
          <p class="muted small" style="margin:6px 0 0">Ground capacity ${seats(team(clubId).capacity)}</p>
          <div class="honours">${honourChips.length ? honourChips.map((h) => `<span class="chip">${h}</span>`).join("") : `<span class="muted small">No honours yet.</span>`}</div>
          <div class="table-scroll"><table class="club-hist">
            <thead><tr><th>Season</th><th>Div</th><th class="num">Pos</th><th class="num">Pts</th><th>W-D-L</th><th>Goals</th>${hist.cups.map((c) => `<th>${esc(Game.cupDef(c).short)}</th>`).join("")}<th>Europe</th><th></th></tr></thead>
            <tbody>${nowRow}${histRows}</tbody>
          </table></div>
      </div>
      <div class="panel">
        <h2>Season records · ${rc.flag} ${esc(rc.name)}</h2>
        <div class="records-grid">${recCards}</div>
      </div>`;

    Charts.bump($("#rec-bump"), {
      n, length, tip: tipApi, bands: zoneBands(def, n),
      series: series.map((x) => ({ label: x.label, color: x.color, values: x.values })),
      context: ids.filter((id) => !shown.has(id)).map((id) => ({ values: pos[id] })),
    });
    $("#rec-season").onchange = (e) => { recView.season = +e.target.value; renderRecords(); };
    el.querySelectorAll("[data-recl]").forEach((b) => { b.onclick = () => { recView.lid = b.dataset.recl; renderRecords(); }; });
    const rlc = el.querySelector("[data-recl-country]");
    if (rlc) rlc.onchange = (e) => { recView.lid = Leagues.COUNTRY[e.target.value].divisions[0]; renderRecords(); };
    $("#rec-country").onchange = (e) => { recView.cid = e.target.value; renderRecords(); };
    el.querySelectorAll("[data-unsel]").forEach((b) => {
      b.onclick = () => { recView.sel.ids = recView.sel.ids.filter((id) => id !== b.dataset.unsel); renderRecords(); };
    });
    if ($("#rec-add")) $("#rec-add").onchange = (e) => { if (e.target.value) { recView.sel.ids.push(e.target.value); renderRecords(); } };
    $("#rec-club").onchange = (e) => { recView.club = e.target.value; renderRecords(); };
  }

  // ---- Tooltip ------------------------------------------------------------

  const tip = $("#tooltip");
  function placeTip(x, y) {
    tip.hidden = false;
    const half = tip.offsetWidth / 2 + 8;
    tip.style.left = `${Math.min(Math.max(x, half), window.innerWidth - half)}px`;
    tip.style.top = `${Math.max(y, tip.offsetHeight + 16)}px`;
  }
  // Used by charts: `html` must already be escaped.
  const tipApi = {
    show(x, y, html) { tip.innerHTML = html; placeTip(x, y); },
    hide() { tip.hidden = true; },
  };
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(".viz")) return;
    const t = e.target.closest("[data-tip]");
    if (!t) { tip.hidden = true; return; }
    const r = t.getBoundingClientRect();
    tip.textContent = t.dataset.tip;
    placeTip(r.left + r.width / 2, r.top);
  });
  document.addEventListener("scroll", () => { tip.hidden = true; }, true);

  // ---- Boot ---------------------------------------------------------------

  showSetup();
})();
