/* ============================================================================
   Small SVG helpers — no chart library, so this stays dependency-free and
   works as a plain static GitHub Pages site.
   ============================================================================ */
const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function makeScale(domain, range) {
  const [d0, d1] = domain, [r0, r1] = range;
  return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

let tooltipEl = null;
function getTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "chart-tooltip";
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}
function showTooltip(evt, html) {
  const t = getTooltip();
  t.innerHTML = html;
  t.style.left = (evt.pageX + 14) + "px";
  t.style.top = (evt.pageY - 14) + "px";
  t.classList.add("is-visible");
}
function hideTooltip() {
  if (tooltipEl) tooltipEl.classList.remove("is-visible");
}

/* ============================================================================
   CHART 1 — Cohort life-course ribbon (hero + Part III)
   Each cohort is one line: % Protestant at each point that specific birth
   cohort was re-measured, as it ages.
   ============================================================================ */
function drawCohortRibbon(mountId, opts = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const w = mount.clientWidth || 520;
  const h = opts.height || 300;
  const margin = { top: 20, right: 18, bottom: 34, left: 34 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: h, role: "img" });
  mount.innerHTML = "";
  mount.appendChild(svg);

  const x = makeScale([2000, 2025], [margin.left, margin.left + innerW]);
  const y = makeScale([7, 15.5], [margin.top + innerH, margin.top]);

  // gridlines (y)
  [8, 10, 12, 14].forEach((v) => {
    const ly = y(v);
    svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + innerW, y1: ly, y2: ly, stroke: "var(--ink-line)", "stroke-width": 1 }));
    const lbl = svgEl("text", { x: margin.left - 8, y: ly + 4, "text-anchor": "end", class: "chart-axis-label" });
    lbl.textContent = v + "%";
    lbl.setAttribute("font-family", "var(--font-mono)");
    lbl.setAttribute("font-size", "10.5");
    lbl.setAttribute("fill", "var(--text-on-ink-dim)");
    svg.appendChild(lbl);
  });
  // x axis years
  [2000, 2005, 2010, 2015, 2020, 2025].forEach((yr) => {
    const lx = x(yr);
    const lbl = svgEl("text", { x: lx, y: h - 10, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--text-on-ink-dim)" });
    lbl.textContent = yr;
    svg.appendChild(lbl);
  });

  const signalCohorts = new Set(["Turned 15–19 in 2010", "Turned 15–19 in 2015", "Turned 15–19 in 2020"]);

  Object.entries(COHORT_LIFECOURSE).forEach(([name, pts]) => {
    const isSignal = signalCohorts.has(name);
    const color = isSignal ? "var(--signal-soft)" : "var(--neutral)";
    if (pts.length > 1) {
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p[0])} ${y(p[2])}`).join(" ");
      const path = svgEl("path", { d, fill: "none", stroke: color, "stroke-width": isSignal ? 2.4 : 1.8, "stroke-linecap": "round", opacity: isSignal ? 0.95 : 0.55 });
      svg.appendChild(path);
    }
    pts.forEach((p) => {
      const c = svgEl("circle", { cx: x(p[0]), cy: y(p[2]), r: isSignal ? 4 : 3, fill: color, opacity: isSignal ? 1 : 0.6, style: "cursor:pointer" });
      c.addEventListener("mousemove", (e) => showTooltip(e, `<strong>${name}</strong><br>${p[0]} · ages ${p[1]} · ${p[2].toFixed(1)}% Protestant`));
      c.addEventListener("mouseleave", hideTooltip);
      svg.appendChild(c);
    });
  });
}

/* ============================================================================
   CHART 2 — Transition toggle (cross-sectional vs cohort-tracked)
   ============================================================================ */
function drawCrossSectional(svg, x, y, margin, innerW, innerH) {
  const ageBands = ["15-19", "20-24", "25-29", "30-34", "35-39", "40-44"];
  const years = [2000, 2010, 2015, 2020, 2025];
  const yearColor = { 2000: "#5B6274", 2010: "#7A8298", 2015: "#8A93A6", 2020: "#C99A3B", 2025: "#B23A2E" };
  const groupW = innerW / ageBands.length;
  const barW = (groupW - 10) / years.length;

  ageBands.forEach((band, gi) => {
    years.forEach((yr, yi) => {
      const val = AGE_PCT_BY_YEAR[yr] && AGE_PCT_BY_YEAR[yr][band];
      if (val === undefined) return;
      const bx = margin.left + gi * groupW + yi * barW + 5;
      const by = y(val);
      const bh = (margin.top + innerH) - by;
      const rect = svgEl("rect", { x: bx, y: by, width: barW - 1.5, height: bh, fill: yearColor[yr], opacity: yr === 2025 ? 1 : 0.85, rx: 1 });
      rect.addEventListener("mousemove", (e) => showTooltip(e, `<strong>${band}</strong><br>${yr}: ${val.toFixed(1)}%`));
      rect.addEventListener("mouseleave", hideTooltip);
      svg.appendChild(rect);
    });
    const lbl = svgEl("text", { x: margin.left + gi * groupW + groupW / 2, y: margin.top + innerH + 20, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "11", fill: "var(--text-on-ink-dim)" });
    lbl.textContent = band;
    svg.appendChild(lbl);
  });
}

function drawCohortView(svg, x, y, margin, innerW, innerH, yZero) {
  const transitions = ["15-19→20-24", "20-24→25-29", "25-29→30-34", "30-34→35-39", "35-39→40-44"];
  const windows = ["2010-2015", "2015-2020", "2020-2025"];
  const windowColor = { "2010-2015": "#7A8298", "2015-2020": "#C99A3B", "2020-2025": "#B23A2E" };
  const groupW = innerW / transitions.length;
  const barW = (groupW - 14) / windows.length;

  // zero line
  svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + innerW, y1: yZero, y2: yZero, stroke: "var(--text-on-ink-dim)", "stroke-width": 1 }));

  transitions.forEach((tr, gi) => {
    windows.forEach((w, wi) => {
      const val = COHORT_TRANSITIONS[w][tr];
      const bx = margin.left + gi * groupW + wi * barW + 7;
      const yv = y(val);
      const top = Math.min(yv, yZero);
      const bh = Math.abs(yv - yZero);
      const isNegAndEarly = val < 0 && w === "2015-2020";
      const fill = val < 0 ? (isNegAndEarly ? "var(--signal-soft)" : "#8E4A42") : windowColor[w];
      const rect = svgEl("rect", { x: bx, y: top, width: barW - 1.5, height: Math.max(bh, 1), fill, rx: 1, opacity: w === "2020-2025" ? 0.55 : 1 });
      rect.addEventListener("mousemove", (e) => showTooltip(e, `<strong>${tr}</strong><br>${w}: ${val > 0 ? "+" : ""}${val.toFixed(2)}pp`));
      rect.addEventListener("mouseleave", hideTooltip);
      svg.appendChild(rect);
    });
    const lbl = svgEl("text", { x: margin.left + gi * groupW + groupW / 2, y: margin.top + innerH + 20, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "10", fill: "var(--text-on-ink-dim)" });
    lbl.textContent = tr.replace("→", "→\u200b");
    svg.appendChild(lbl);
  });
}

function drawTransitionChart(view) {
  const mount = document.getElementById("transition-chart");
  if (!mount) return;
  const w = mount.clientWidth || 620;
  const h = 340;
  const margin = { top: 16, right: 16, bottom: 44, left: 40 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: h });
  mount.innerHTML = "";
  mount.appendChild(svg);

  if (view === "cross") {
    const y = makeScale([0, 15], [margin.top + innerH, margin.top]);
    [0, 5, 10, 15].forEach((v) => {
      const ly = y(v);
      svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + innerW, y1: ly, y2: ly, stroke: "var(--ink-line)", "stroke-width": 1 }));
      const lbl = svgEl("text", { x: margin.left - 8, y: ly + 4, "text-anchor": "end", "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--text-on-ink-dim)" });
      lbl.textContent = v + "%";
      svg.appendChild(lbl);
    });
    drawCrossSectional(svg, null, y, margin, innerW, innerH);
    document.getElementById("transition-caption").textContent = "Each survey year, snapshotted separately. Because a different set of people is measured each time, a slow-building, age-specific shift can look like noise. (Darker gold = 2020, red = 2025.)";
  } else {
    const y = makeScale([-3, 1.5], [margin.top + innerH, margin.top]);
    const yZero = y(0);
    [-3, -2, -1, 0, 1].forEach((v) => {
      const ly = y(v);
      svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + innerW, y1: ly, y2: ly, stroke: "var(--ink-line)", "stroke-width": 1 }));
      const lbl = svgEl("text", { x: margin.left - 8, y: ly + 4, "text-anchor": "end", "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--text-on-ink-dim)" });
      lbl.textContent = (v > 0 ? "+" : "") + v;
      svg.appendChild(lbl);
    });
    drawCohortView(svg, null, y, margin, innerW, innerH, yZero);
    document.getElementById("transition-caption").innerHTML = "Percentage-point change, same cohort, five years later. In the <strong style=\"color:var(--accent)\">2015→2020</strong> window, the two youngest transitions already flip negative — five years before every transition drops together in 2020→2025.";
  }
}

/* ============================================================================
   CHART 3 — Age-band table (Part: not just youth)
   ============================================================================ */
function populateAgeBandTable() {
  const tbody = document.getElementById("age-band-table-body");
  if (!tbody) return;
  AGE_BAND_CHANGE_2020_2025.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.band}</td><td>${row.y2020.toFixed(1)}%</td><td>${row.y2025.toFixed(1)}%</td><td class="row-signal">${row.change.toFixed(1)}pp</td>`;
    tbody.appendChild(tr);
  });
}

/* ============================================================================
   CHART 4 — Education gradient (small line)
   ============================================================================ */
function drawEducationChart() {
  const mount = document.getElementById("education-chart");
  if (!mount) return;
  const w = mount.clientWidth || 340;
  const h = 190;
  const margin = { top: 16, right: 20, bottom: 28, left: 36 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: h });
  mount.innerHTML = "";
  mount.appendChild(svg);

  const years = [2010, 2020, 2025];
  const vals = years.map((yr) => BY_EDUCATION.christian_university_grads[yr]);
  const x = makeScale([2010, 2025], [margin.left, margin.left + innerW]);
  const y = makeScale([20, 34], [margin.top + innerH, margin.top]);

  [20, 25, 30].forEach((v) => {
    const ly = y(v);
    svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + innerW, y1: ly, y2: ly, stroke: "var(--paper-line)", "stroke-width": 1 }));
    const lbl = svgEl("text", { x: margin.left - 8, y: ly + 4, "text-anchor": "end", "font-family": "var(--font-mono)", "font-size": "10", fill: "var(--text-on-paper-dim)" });
    lbl.textContent = v + "%";
    svg.appendChild(lbl);
  });

  const d = years.map((yr, i) => `${i === 0 ? "M" : "L"} ${x(yr)} ${y(vals[i])}`).join(" ");
  svg.appendChild(svgEl("path", { d, fill: "none", stroke: "var(--signal)", "stroke-width": 2.4, "stroke-linecap": "round" }));
  years.forEach((yr, i) => {
    const c = svgEl("circle", { cx: x(yr), cy: y(vals[i]), r: 4, fill: "var(--signal)", style: "cursor:pointer" });
    c.addEventListener("mousemove", (e) => showTooltip(e, `<strong>${yr}</strong><br>${vals[i]}% of graduates Christian`));
    c.addEventListener("mouseleave", hideTooltip);
    svg.appendChild(c);
    const lbl = svgEl("text", { x: x(yr), y: h - 8, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--text-on-paper-dim)" });
    lbl.textContent = yr;
    svg.appendChild(lbl);
  });
}

/* ============================================================================
   CHART 5 — 15-19 band: trend-implied growth vs what actually happened
   ============================================================================ */
function drawStallChart(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const w = mount.clientWidth || 480;
  const h = 260;
  const margin = { top: 20, right: 24, bottom: 32, left: 38 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: h });
  mount.innerHTML = "";
  mount.appendChild(svg);

  const x = makeScale([2000, 2015], [margin.left, margin.left + innerW]);
  const y = makeScale([7, 15], [margin.top + innerH, margin.top]);

  [8, 10, 12, 14].forEach((v) => {
    const ly = y(v);
    svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + innerW, y1: ly, y2: ly, stroke: "var(--ink-line)", "stroke-width": 1 }));
    const lbl = svgEl("text", { x: margin.left - 8, y: ly + 4, "text-anchor": "end", "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--text-on-ink-dim)" });
    lbl.textContent = v + "%";
    svg.appendChild(lbl);
  });

  const actualPts = EARLY_SIGNAL_1519.points.filter((p) => p[0] <= 2015);
  const dActual = actualPts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p[0])} ${y(p[1])}`).join(" ");
  svg.appendChild(svgEl("path", { d: dActual, fill: "none", stroke: "var(--text-on-ink-dim)", "stroke-width": 2.4 }));

  // dashed trend-implied branch from 2010 point to the hypothetical 2015 value
  const p2010 = actualPts.find((p) => p[0] === 2010);
  const dTrend = `M ${x(2010)} ${y(p2010[1])} L ${x(2015)} ${y(EARLY_SIGNAL_1519.trendImplied2015)}`;
  svg.appendChild(svgEl("path", { d: dTrend, fill: "none", stroke: "var(--accent)", "stroke-width": 2, "stroke-dasharray": "5,4" }));

  // gap bracket at 2015
  const yActual2015 = y(actualPts.find((p) => p[0] === 2015)[1]);
  const yTrend2015 = y(EARLY_SIGNAL_1519.trendImplied2015);
  svg.appendChild(svgEl("line", { x1: x(2015) + 6, x2: x(2015) + 6, y1: yTrend2015, y2: yActual2015, stroke: "var(--signal-soft)", "stroke-width": 1.5 }));

  actualPts.forEach((p) => {
    const c = svgEl("circle", { cx: x(p[0]), cy: y(p[1]), r: 4, fill: "var(--text-on-ink)", style: "cursor:pointer" });
    c.addEventListener("mousemove", (e) => showTooltip(e, `<strong>${p[0]}</strong><br>${p[1].toFixed(2)}% actual`));
    c.addEventListener("mouseleave", hideTooltip);
    svg.appendChild(c);
  });
  const ghost = svgEl("circle", { cx: x(2015), cy: yTrend2015, r: 4, fill: "none", stroke: "var(--accent)", "stroke-width": 2, style: "cursor:pointer" });
  ghost.addEventListener("mousemove", (e) => showTooltip(e, `<strong>2015, if the 2000–2010 pace had held</strong><br>${EARLY_SIGNAL_1519.trendImplied2015.toFixed(2)}% (implied)`));
  ghost.addEventListener("mouseleave", hideTooltip);
  svg.appendChild(ghost);

  const lbl2015 = svgEl("text", { x: x(2015) + 12, y: (yActual2015 + yTrend2015) / 2 + 4, "font-family": "var(--font-mono)", "font-size": "11.5", fill: "var(--signal-soft)", "font-weight": "600" });
  lbl2015.textContent = `only ${EARLY_SIGNAL_1519.pctOfExpectedPace}% of trend`;
  svg.appendChild(lbl2015);

  [2000, 2005, 2010, 2015].forEach((yr) => {
    const lbl = svgEl("text", { x: x(yr), y: h - 8, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--text-on-ink-dim)" });
    lbl.textContent = yr;
    svg.appendChild(lbl);
  });
}

/* ============================================================================
   CHART 6 — Peak timing: when each age band's growth topped out
   ============================================================================ */
function drawPeakTimingChart(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const w = mount.clientWidth || 480;
  const h = 260;
  const margin = { top: 20, right: 60, bottom: 32, left: 38 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: h });
  mount.innerHTML = "";
  mount.appendChild(svg);

  const x = makeScale([2000, 2025], [margin.left, margin.left + innerW]);
  const y = makeScale([7, 15], [margin.top + innerH, margin.top]);
  const bandKey = { "15-19": "15-19", "20-24": "20-24", "25-29": "25-29" };
  const colors = { "15-19": "var(--signal-soft)", "20-24": "var(--accent)", "25-29": "var(--neutral)" };

  Object.entries(bandKey).forEach(([label, key]) => {
    const series = ["2000", "2010", "2015", "2020", "2025"].map((yr) => [+yr, AGE_PCT_BY_YEAR[yr][key]]);
    const d = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p[0])} ${y(p[1])}`).join(" ");
    svg.appendChild(svgEl("path", { d, fill: "none", stroke: colors[label], "stroke-width": 2.2, opacity: 0.9 }));
    series.forEach((p) => {
      const c = svgEl("circle", { cx: x(p[0]), cy: y(p[1]), r: 3, fill: colors[label], style: "cursor:pointer" });
      c.addEventListener("mousemove", (e) => showTooltip(e, `<strong>${label}</strong><br>${p[0]}: ${p[1].toFixed(2)}%`));
      c.addEventListener("mouseleave", hideTooltip);
      svg.appendChild(c);
    });
    const peak = PEAK_TIMING.find((p) => p.band === label);
    const ring = svgEl("circle", { cx: x(peak.peakYear), cy: y(peak.peakVal), r: 7, fill: "none", stroke: colors[label], "stroke-width": 1.5 });
    svg.appendChild(ring);
    const last = series[series.length - 1];
    const tag = svgEl("text", { x: x(2025) + 8, y: y(last[1]) + 4, "font-family": "var(--font-mono)", "font-size": "11", fill: colors[label], "font-weight": "600" });
    tag.textContent = label;
    svg.appendChild(tag);
  });

  [2000, 2010, 2015, 2020, 2025].forEach((yr) => {
    const lbl = svgEl("text", { x: x(yr), y: h - 8, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "10", fill: "var(--text-on-ink-dim)" });
    lbl.textContent = yr;
    svg.appendChild(lbl);
  });
}


function initToggle() {
  const btns = document.querySelectorAll(".toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      drawTransitionChart(btn.dataset.view);
    });
  });
}

function renderAll() {
  drawCohortRibbon("cohort-ribbon", { height: 320 });
  drawTransitionChart("cross");
  populateAgeBandTable();
  drawEducationChart();
  drawStallChart("stall-chart");
  drawPeakTimingChart("peak-chart");
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  initToggle();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderAll();
    const activeBtn = document.querySelector(".toggle-btn.is-active");
    if (activeBtn) drawTransitionChart(activeBtn.dataset.view);
  }, 200);
});
