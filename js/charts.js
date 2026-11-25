// Small SVG charts rendered into a container. Colours come from the --viz-*
// CSS tokens so light and dark themes both work. Each chart takes a `tip`
// object ({ show(x, y, html), hide() }) for hover tooltips.

const Charts = (() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function ticks(n, every) {
    const out = [1];
    for (let v = every; v < n; v += every) out.push(v);
    if (out[out.length - 1] !== n) out.push(n);
    return out;
  }

  // Push labels apart vertically so they don't overlap.
  function spread(labels, minGap, lo, hi) {
    labels.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + minGap);
    const over = labels.length ? labels[labels.length - 1].y - hi : 0;
    if (over > 0) labels.forEach((l) => { l.y -= over; });
    for (let i = labels.length - 2; i >= 0; i--) labels[i].y = Math.min(labels[i].y, labels[i + 1].y - minGap);
    labels.forEach((l) => { l.y = Math.max(l.y, lo); });
    return labels;
  }

  // League position by matchday. Position 1 is at the top.
  //   n: clubs in the division, length: matchdays played
  //   series: [{ label, color, values }] highlighted, direct-labelled lines
  //   context: [{ label, values }] faint lines for every other club
  //   bands: [{ from, to, color, label }] zone shading
  function bump(el, { n, length, series, context = [], bands = [], tip }) {
    if (!length) {
      el.innerHTML = `<p class="muted small">Positions appear after the first matchday.</p>`;
      return;
    }
    const W = Math.max(300, el.clientWidth || 600);
    const H = Math.max(240, Math.min(440, n * 15 + 40));
    const m = { l: 30, r: series.length ? Math.min(170, W * 0.3) : 12, t: 10, b: 26 };
    const short = (s) => (s.length > 20 ? s.slice(0, 19) + "…" : s);
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const x = (i) => m.l + (length === 1 ? iw / 2 : (i / (length - 1)) * iw);
    const y = (p) => m.t + ((p - 1) / (n - 1)) * ih;
    const half = ih / (n - 1) / 2;
    const path = (vals) => vals.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join("");

    const bandSvg = bands.map((b) =>
      `<rect x="${m.l}" y="${(y(b.from) - half).toFixed(1)}" width="${iw}" height="${(y(b.to) - y(b.from) + 2 * half).toFixed(1)}" fill="var(${b.color})" opacity="0.09"/>`).join("");
    const yTicks = ticks(n, 5).map((p) =>
      `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(p)}" y2="${y(p)}" class="viz-grid"/>
       <text x="${m.l - 8}" y="${y(p) + 4}" text-anchor="end" class="viz-axis">${p}</text>`).join("");
    const xEvery = length > 30 ? 10 : 5;
    const xTicks = ticks(length, xEvery).map((md) =>
      `<text x="${x(md - 1)}" y="${H - 8}" text-anchor="middle" class="viz-axis">${md === 1 ? "MD 1" : md}</text>`).join("");
    const ctx = context.map((c) => `<path d="${path(c.values)}" class="viz-context-line"/>`).join("");
    const lines = series.map((s) => `<path d="${path(s.values)}" fill="none" stroke="${s.color}" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>`).join("");
    const ends = series.map((s) => {
      const i = s.values.length - 1;
      return `<circle cx="${x(i)}" cy="${y(s.values[i])}" r="4" fill="${s.color}" class="viz-ring"/>`;
    }).join("");
    const labels = spread(series.map((s) => ({ s, y: y(s.values[s.values.length - 1]) + 4 })), 14, m.t + 8, m.t + ih + 4)
      .map((l) => `<text x="${x(length - 1) + 9}" y="${l.y.toFixed(1)}" class="viz-label">${esc(short(l.s.label))} · ${l.s.values[l.s.values.length - 1]}</text>`).join("");

    el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="viz" role="img"
        aria-label="League position by matchday${series.length ? ": " + esc(series.map((s) => `${s.label} now ${s.values[s.values.length - 1]}`).join(", ")) : ""}">
      ${bandSvg}${yTicks}${xTicks}${ctx}${lines}${ends}${labels}
      <line class="viz-cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>
      <g class="viz-hover"></g>
      <rect x="${m.l - 6}" y="0" width="${iw + 12}" height="${H}" fill="transparent" class="viz-hit"/>
    </svg>`;

    const svg = el.querySelector("svg");
    const cross = svg.querySelector(".viz-cross");
    const hover = svg.querySelector(".viz-hover");
    const hit = svg.querySelector(".viz-hit");
    hit.addEventListener("mousemove", (e) => {
      const r = svg.getBoundingClientRect();
      const i = Math.max(0, Math.min(length - 1, Math.round(((e.clientX - r.left - m.l) / iw) * (length - 1))));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      hover.innerHTML = series.map((s) => `<circle cx="${x(i)}" cy="${y(s.values[i])}" r="5" fill="${s.color}" class="viz-ring"/>`).join("");
      const rows = series.slice().sort((a, b) => a.values[i] - b.values[i])
        .map((s) => `<div class="tip-row"><i style="background:${s.color}"></i>${esc(s.label)}<b>${s.values[i]}</b></div>`).join("");
      tip.show(r.left + x(i), r.top + m.t, `<div class="tip-title">Matchday ${i + 1}</div>${rows || ""}`);
    });
    hit.addEventListener("mouseleave", () => {
      cross.setAttribute("visibility", "hidden");
      hover.innerHTML = "";
      tip.hide();
    });
  }

  // Attack vs defence scatter. One highlighted point (`me`), the rest neutral.
  function scatter(el, { points, xLabel, yLabel, avgX, avgY, tip }) {
    const W = Math.max(280, el.clientWidth || 500);
    const H = Math.round(Math.min(360, Math.max(260, W * 0.62)));
    const m = { l: 44, r: 14, t: 14, b: 38 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const pad = 1.5;
    const x0 = Math.floor(Math.min(...xs) - pad), x1 = Math.ceil(Math.max(...xs) + pad);
    const y0 = Math.floor(Math.min(...ys) - pad), y1 = Math.ceil(Math.max(...ys) + pad);
    const x = (v) => m.l + ((v - x0) / (x1 - x0)) * iw;
    const y = (v) => m.t + ih - ((v - y0) / (y1 - y0)) * ih;
    const step = (lo, hi) => { const span = hi - lo; return span > 24 ? 5 : span > 10 ? 2 : 1; };
    const tickVals = (lo, hi) => { const s = step(lo, hi), out = []; for (let v = Math.ceil(lo / s) * s; v <= hi; v += s) out.push(v); return out; };
    const grid = tickVals(x0, x1).map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${m.t + ih}" class="viz-grid"/><text x="${x(v)}" y="${m.t + ih + 15}" text-anchor="middle" class="viz-axis">${v}</text>`).join("")
      + tickVals(y0, y1).map((v) => `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(v)}" y2="${y(v)}" class="viz-grid"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" class="viz-axis">${v}</text>`).join("");
    const avg = `<line x1="${x(avgX)}" x2="${x(avgX)}" y1="${m.t}" y2="${m.t + ih}" class="viz-avg"/>
      <line x1="${m.l}" x2="${m.l + iw}" y1="${y(avgY)}" y2="${y(avgY)}" class="viz-avg"/>`;
    const corner = (txt, cx, cy, anchor) => `<text x="${cx}" y="${cy}" text-anchor="${anchor}" class="viz-corner">${txt}</text>`;
    const corners = corner("Strong at both ends", m.l + iw - 4, m.t + 12, "end")
      + corner("Weak at both ends", m.l + 4, m.t + ih - 6, "start")
      + corner("Tight but blunt", m.l + 4, m.t + 12, "start")
      + corner("Dangerous but leaky", m.l + iw - 4, m.t + ih - 6, "end");
    const others = points.filter((p) => !p.me).map((p) => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="4.5" class="viz-dot viz-ring"/>`).join("");
    const mine = points.filter((p) => p.me).map((p) => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="6.5" fill="var(--viz-1)" class="viz-ring"/>
      <text x="${x(p.x) + (x(p.x) > m.l + iw - 60 ? -10 : 10)}" y="${y(p.y) - 8}" text-anchor="${x(p.x) > m.l + iw - 60 ? "end" : "start"}" class="viz-label">${esc(p.label)}</text>`).join("");
    el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="viz" role="img" aria-label="${esc(xLabel)} against ${esc(yLabel)} for each club">
      ${grid}${avg}${corners}${others}${mine}
      <text x="${m.l + iw / 2}" y="${H - 4}" text-anchor="middle" class="viz-axis-title">${esc(xLabel)} →</text>
      <text transform="translate(12 ${m.t + ih / 2}) rotate(-90)" text-anchor="middle" class="viz-axis-title">${esc(yLabel)} →</text>
      <circle class="viz-hl viz-ring" r="7" visibility="hidden" fill="none" stroke="var(--text)" stroke-width="1.5"/>
    </svg>`;
    const svg = el.querySelector("svg");
    const hl = svg.querySelector(".viz-hl");
    svg.addEventListener("mousemove", (e) => {
      const r = svg.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = null, bestD = 16 * 16;
      for (const p of points) {
        const d = (x(p.x) - mx) ** 2 + (y(p.y) - my) ** 2;
        if (d < bestD) { best = p; bestD = d; }
      }
      if (!best) { hl.setAttribute("visibility", "hidden"); tip.hide(); return; }
      hl.setAttribute("cx", x(best.x)); hl.setAttribute("cy", y(best.y)); hl.setAttribute("visibility", "visible");
      tip.show(r.left + x(best.x), r.top + y(best.y) - 6, best.tip);
    });
    svg.addEventListener("mouseleave", () => { hl.setAttribute("visibility", "hidden"); tip.hide(); });
  }

  // Two values per row on a shared scale: `a` (you) vs `b` (division average).
  function dotPlot(el, { rows, aName, bName, fmt, tip }) {
    const W = Math.max(280, el.clientWidth || 500);
    const rowH = 30;
    const m = { l: Math.min(150, W * 0.36), r: 16, t: 6, b: 22 };
    const H = m.t + m.b + rows.length * rowH;
    const iw = W - m.l - m.r;
    const max = Math.max(...rows.flatMap((r) => [r.a, r.b]), 0.001) * 1.08;
    const x = (v) => m.l + (v / max) * iw;
    const body = rows.map((r, i) => {
      const cy = m.t + i * rowH + rowH / 2;
      const lo = Math.min(r.a, r.b), hi = Math.max(r.a, r.b);
      return `<g class="viz-row" data-i="${i}">
        <rect x="0" y="${cy - rowH / 2}" width="${W}" height="${rowH}" fill="transparent"/>
        <text x="${m.l - 10}" y="${cy + 4}" text-anchor="end" class="viz-row-label">${esc(r.label)}</text>
        <line x1="${m.l}" x2="${m.l + iw}" y1="${cy}" y2="${cy}" class="viz-grid"/>
        <line x1="${x(lo)}" x2="${x(hi)}" y1="${cy}" y2="${cy}" class="viz-span"/>
        <circle cx="${x(r.b)}" cy="${cy}" r="5" class="viz-dot viz-ring"/>
        <circle cx="${x(r.a)}" cy="${cy}" r="5.5" fill="var(--viz-1)" class="viz-ring"/>
      </g>`;
    }).join("");
    el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="viz" role="img" aria-label="${esc(aName)} compared with ${esc(bName)}">
      ${body}
      <text x="${m.l}" y="${H - 6}" class="viz-axis">${fmt(0)}</text>
      <text x="${m.l + iw}" y="${H - 6}" text-anchor="end" class="viz-axis">${fmt(max)}</text>
    </svg>`;
    el.querySelectorAll(".viz-row").forEach((g) => {
      g.addEventListener("mousemove", () => {
        const r = rows[+g.dataset.i];
        const b = g.getBoundingClientRect();
        const cx = el.querySelector("svg").getBoundingClientRect().left + x(Math.max(r.a, r.b));
        tip.show(cx, b.top + 4, `<div class="tip-title">${esc(r.label)}</div>
          <div class="tip-row"><i style="background:var(--viz-1)"></i>${esc(aName)}<b>${fmt(r.a)}</b></div>
          <div class="tip-row"><i class="ctx"></i>${esc(bName)}<b>${fmt(r.b)}</b></div>`);
      });
      g.addEventListener("mouseleave", () => tip.hide());
    });
  }

  // One series over the season with dashed reference lines (e.g. zero, credit limit).
  function line(el, { values, refs = [], fmt, tip, color = "var(--viz-1)", xLabel = (i) => (i ? `MD ${i}` : "Start"), label = "Bank balance over the season" }) {
    if (values.length < 2) {
      el.innerHTML = `<p class="muted small">The chart fills in as the season is played.</p>`;
      return;
    }
    const W = Math.max(280, el.clientWidth || 500), H = 220;
    const m = { l: 58, r: 96, t: 12, b: 26 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const all = values.concat(refs.map((r) => r.value));
    let lo = Math.min(...all), hi = Math.max(...all);
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad; hi += pad;
    const n = values.length;
    const x = (i) => m.l + (i / (n - 1)) * iw;
    const y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;
    const ticks = [lo + pad, (lo + hi) / 2, hi - pad];
    const grid = ticks.map((v) => `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(v)}" y2="${y(v)}" class="viz-grid"/>
      <text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" class="viz-axis">${esc(fmt(v))}</text>`).join("");
    const refSvg = refs.map((r) => `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(r.value)}" y2="${y(r.value)}" class="viz-avg"/>
      <text x="${m.l + iw + 6}" y="${y(r.value) + 4}" class="viz-axis">${esc(r.label)}</text>`).join("");
    const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const last = values[n - 1];
    el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="viz" role="img" aria-label="${esc(label)}, now ${esc(fmt(last))}">
      ${grid}${refSvg}
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2.25" stroke-linejoin="round"/>
      <circle cx="${x(n - 1)}" cy="${y(last)}" r="4" fill="${color}" class="viz-ring"/>
      <text x="${x(0)}" y="${H - 8}" class="viz-axis">${esc(xLabel(0))}</text>
      <text x="${x(n - 1)}" y="${H - 8}" text-anchor="end" class="viz-axis">${esc(xLabel(n - 1))}</text>
      <line class="viz-cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>
      <circle class="viz-hl viz-ring" r="5" fill="${color}" visibility="hidden"/>
      <rect x="${m.l}" y="0" width="${iw}" height="${H}" fill="transparent" class="viz-hit"/>
    </svg>`;
    const svg = el.querySelector("svg"), cross = svg.querySelector(".viz-cross"), hl = svg.querySelector(".viz-hl");
    svg.querySelector(".viz-hit").addEventListener("mousemove", (e) => {
      const r = svg.getBoundingClientRect();
      const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left - m.l) / iw) * (n - 1))));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      hl.setAttribute("cx", x(i)); hl.setAttribute("cy", y(values[i])); hl.setAttribute("visibility", "visible");
      tip.show(r.left + x(i), r.top + y(values[i]) - 6, `<div class="tip-title">${esc(xLabel(i))}</div><div>${esc(fmt(values[i]))}</div>`);
    });
    svg.querySelector(".viz-hit").addEventListener("mouseleave", () => {
      cross.setAttribute("visibility", "hidden"); hl.setAttribute("visibility", "hidden"); tip.hide();
    });
  }

  return { bump, scatter, dotPlot, line };
})();
