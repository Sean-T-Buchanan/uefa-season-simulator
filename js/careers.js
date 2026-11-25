// Saved careers: any number of careers side by side, each with a summary
// (manager, club, division, season, position, trophies) for the careers
// screen. Careers are stored in IndexedDB (a whole of Europe is too big for
// localStorage), with localStorage as a fallback. A career saved by an
// older version (one save slot) is copied into the list the first time it's
// opened; the old copy is left where it was.

const Careers = (() => {
  const DB = "pyramid-manager", STORE = "saves";
  const INDEX = "careers.index";
  const LEGACY = "pyramid-manager.save.v3";
  const LS = "pyramid-manager.";
  const dataKey = (id) => `career:${id}`;

  // ---- Storage ----------------------------------------------------------------

  let dbPromise = null;
  function openDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") { reject(new Error("no indexedDB")); return; }
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function idbGet(k) {
    const db = await openDb();
    return new Promise((resolve) => {
      const r = db.transaction(STORE).objectStore(STORE).get(k);
      r.onsuccess = () => resolve(r.result == null ? null : r.result);
      r.onerror = () => resolve(null);
    });
  }

  async function get(k, lsKey = LS + k) {
    try { const v = await idbGet(k); if (v != null) return v; } catch (e) { /* fall back */ }
    try { return localStorage.getItem(lsKey); } catch (e) { return null; }
  }

  // Write several keys together (null deletes). IndexedDB writes are atomic.
  async function write(entries) {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const os = tx.objectStore(STORE);
        for (const [k, v] of entries) { if (v == null) os.delete(k); else os.put(v, k); }
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      return true;
    } catch (e) {
      try {
        for (const [k, v] of entries) { if (v == null) localStorage.removeItem(LS + k); else localStorage.setItem(LS + k, v); }
        return true;
      } catch (e2) { return false; }
    }
  }

  // Writes run one at a time so the index never loses an update.
  let queue = Promise.resolve();
  const serial = (fn) => (queue = queue.then(fn, fn));

  async function readIndex() {
    const raw = await get(INDEX);
    if (raw == null) return null;
    try { return JSON.parse(raw); } catch (e) { return []; }
  }

  // ---- Summaries --------------------------------------------------------------

  const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  // Trophies won as manager: league titles plus cups (domestic and European).
  function trophies(state) {
    return (state.history || []).reduce((a, h) => a + (h.pos === 1 ? 1 : 0) + (h.cups || []).filter((c) => c.won).length, 0);
  }

  function metaOf(state) {
    const t = state.teams[state.myTeam];
    const def = Game.leagueDef(state.league);
    const played = state.results ? state.results.length : 0;
    let pos = null;
    try { if (played) pos = Game.table(state).findIndex((r) => r.id === state.myTeam) + 1 || null; } catch (e) { /* ignore */ }
    return {
      id: state.career.id, name: state.career.name, created: state.career.created, updated: Date.now(),
      club: state.myTeam, clubName: t.name, short: t.short, color: t.color,
      league: state.league, leagueName: def.name, flag: Leagues.COUNTRY[def.country].flag,
      season: state.season, md: played, mdTotal: state.fixtures ? state.fixtures.length : 0, phase: state.phase, pos,
      seasons: (state.history || []).length, trophies: trophies(state),
      manager: (state.job && state.job.name) || "", rep: state.job ? Math.round(state.job.rep) : null,
      clubs: state.job ? new Set(state.job.stints.map((s) => s.club)).size : 1,
    };
  }

  // Give a state its career identity (new careers, copies and imports).
  function stamp(state, name) {
    state.career = { id: newId(), name: name || state.teams[state.myTeam].name, created: Date.now() };
    return state;
  }

  // ---- Careers ------------------------------------------------------------------

  // Copy a pre-careers save into the list, once.
  let legacyChecked = null;
  function adoptLegacy() {
    if (!legacyChecked) {
      legacyChecked = serial(async () => {
        if ((await readIndex()) != null) return;
        const raw = await get(LEGACY, LEGACY);
        const entries = [];
        const index = [];
        if (raw) {
          try {
            const st = Game.upgrade(JSON.parse(raw));
            if (st) {
              stamp(st, `${st.teams[st.myTeam].name} (saved career)`);
              entries.push([dataKey(st.career.id), JSON.stringify(st)]);
              index.push(metaOf(st));
            }
          } catch (e) { /* unreadable: start an empty list */ }
        }
        entries.push([INDEX, JSON.stringify(index)]);
        await write(entries);
      }).catch(() => {});
    }
    return legacyChecked;
  }

  // Every saved career, most recently played first.
  async function list() {
    await adoptLegacy();
    const idx = (await readIndex()) || [];
    return idx.slice().sort((a, b) => b.updated - a.updated);
  }

  // A career ready to play, or null.
  async function load(id) {
    await adoptLegacy();
    const raw = await get(dataKey(id));
    if (!raw) return null;
    try {
      const st = Game.upgrade(JSON.parse(raw));
      if (st && !st.career) stamp(st);
      if (st) st.career.id = id;
      return st;
    } catch (e) { return null; }
  }

  // Save a career (new careers get an id first). Resolves to true on success.
  // (The legacy check runs first, outside the write queue it also uses.)
  function save(state) {
    if (!state.career) stamp(state);
    const data = JSON.stringify(state);
    const meta = metaOf(state);
    return adoptLegacy().then(() => serial(async () => {
      const idx = ((await readIndex()) || []).filter((m) => m.id !== meta.id);
      idx.push(meta);
      return write([[dataKey(meta.id), data], [INDEX, JSON.stringify(idx)]]);
    }));
  }

  function remove(id) {
    return serial(async () => {
      const idx = ((await readIndex()) || []).filter((m) => m.id !== id);
      return write([[dataKey(id), null], [INDEX, JSON.stringify(idx)]]);
    });
  }

  function rename(id, name) {
    return serial(async () => {
      const idx = (await readIndex()) || [];
      const meta = idx.find((m) => m.id === id);
      if (!meta || !name.trim()) return false;
      meta.name = name.trim();
      const raw = await get(dataKey(id));
      const entries = [[INDEX, JSON.stringify(idx)]];
      if (raw) {
        const st = JSON.parse(raw);
        st.career = { ...(st.career || { id, created: meta.created }), name: meta.name };
        entries.push([dataKey(id), JSON.stringify(st)]);
      }
      return write(entries);
    });
  }

  // A copy of a career to try something different; the original is untouched.
  async function duplicate(id) {
    const st = await load(id);
    if (!st) return null;
    stamp(st, `${st.career.name} (copy)`);
    await save(st);
    return metaOf(st);
  }

  // The career as a JSON file's text, for backups or moving between browsers.
  async function exportText(id) {
    return get(dataKey(id));
  }

  // Add a career from an exported file. Throws if the file isn't one.
  async function importText(text) {
    let st;
    try { st = JSON.parse(text); } catch (e) { throw new Error("That file isn't a saved career."); }
    if (!st || !st.teams || !st.myTeam) throw new Error("That file isn't a saved career.");
    if (!Game.upgrade(st)) throw new Error("That career was saved by an incompatible version of the game.");
    stamp(st, `${(st.career && st.career.name) || st.teams[st.myTeam].name} (imported)`);
    await save(st);
    return metaOf(st);
  }

  return { list, load, save, remove, rename, duplicate, exportText, importText, stamp, metaOf };
})();
