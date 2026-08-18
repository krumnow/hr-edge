let DATA = null;
let currentTab = "top";

async function load() {
  try {
    const res = await fetch("./data.json?t=" + Date.now());
    DATA = await res.json();
  } catch (e) {
    document.getElementById("list").innerHTML =
      '<div class="empty">Could not load data.json</div>';
    return;
  }
  document.getElementById("dateBadge").textContent = DATA.date || "Today";
  render();
  maybeShowInstall();
}

function fmt(n, d = 3) {
  if (n === null || n === undefined || n === "") return "—";
  return Number(n).toFixed(d);
}

function wxClass(m) {
  if (m >= 1.03) return "good";
  if (m <= 0.98) return "bad";
  return "warn";
}

function filterSlate() {
  const q = (document.getElementById("search").value || "").toLowerCase().trim();
  let rows = DATA.slate || [];

  if (currentTab === "coors") {
    rows = rows.filter(r => r.park === "COL");
  } else if (currentTab === "hot") {
    rows = rows.filter(r => (r.weather_mult || 1) >= 1.03);
  }

  if (q) {
    rows = rows.filter(r =>
      (r.batter || "").toLowerCase().includes(q) ||
      (r.team || "").toLowerCase().includes(q) ||
      (r.park || "").toLowerCase().includes(q) ||
      (r.opp_pitcher || "").toLowerCase().includes(q)
    );
  }
  return rows;
}

function renderList() {
  const list = document.getElementById("list");
  const weatherPanel = document.getElementById("weatherPanel");
  weatherPanel.style.display = "none";
  list.style.display = "block";

  const rows = filterSlate();
  if (!rows.length) {
    list.innerHTML = '<div class="empty">No matchups found</div>';
    return;
  }

  list.innerHTML = rows.map((r, i) => {
    const rankCls = i < 5 ? "rank top" : "rank";
    const wxCls = wxClass(r.weather_mult);
    return `
      <div class="card">
        <div class="rank-row">
          <div class="${rankCls}">${i + 1}</div>
          <div class="main">
            <div class="name">${r.batter}</div>
            <div class="meta">${r.team} vs ${r.opp_pitcher || "TBD"} · ${r.park}</div>
            <div class="metrics">
              <div class="metric">xHR <b>${fmt(r.xhr_rate, 3)}</b></div>
              <div class="metric ${wxCls}">Wx <b>${fmt(r.weather_mult, 3)}</b></div>
              <div class="metric">${r.temp_f ? r.temp_f + "°" : "—"} · ${r.wind_mph ? r.wind_mph + "mph" : ""}</div>
            </div>
          </div>
          <div class="exp">
            <div class="exp-val">${fmt(r.exp_hr_4pa, 3)}</div>
            <div class="exp-label">Exp HR</div>
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderWeather() {
  const list = document.getElementById("list");
  const weatherPanel = document.getElementById("weatherPanel");
  list.style.display = "none";
  weatherPanel.style.display = "block";

  // Compute mults from slate for each park
  const multByPark = {};
  (DATA.slate || []).forEach(r => {
    if (r.park && r.weather_mult != null) multByPark[r.park] = r.weather_mult;
  });

  const wx = (DATA.weather || []).slice().sort((a, b) => {
    const ma = multByPark[a.park] || 1;
    const mb = multByPark[b.park] || 1;
    return mb - ma;
  });

  weatherPanel.innerHTML = `
    <div class="section-title">Tonight’s Park Weather</div>
    <div class="wx-grid">
      ${wx.map(w => {
        const m = multByPark[w.park] || 1;
        const cls = m >= 1.03 ? "up" : m <= 0.98 ? "down" : "";
        return `
          <div class="wx-card">
            <div class="wx-park">${w.park}</div>
            <div class="wx-line">${w.temp_f}°F · ${w.wind_mph} mph</div>
            <div class="wx-line">Hum ${w.humidity}% · Dir ${w.wind_dir}°</div>
            <div class="wx-mult ${cls}">×${Number(m).toFixed(3)}</div>
          </div>`;
      }).join("")}
    </div>`;
}

function render() {
  if (currentTab === "weather") renderWeather();
  else renderList();
}

document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  currentTab = btn.dataset.tab;
  render();
});

document.getElementById("search").addEventListener("input", () => {
  if (currentTab === "weather") return;
  renderList();
});

function maybeShowInstall() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (!isStandalone) {
    document.getElementById("installHint").classList.add("show");
  }
}

// Service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

load();
