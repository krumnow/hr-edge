let DATA = null;
let currentTab = "top";
let openId = null;

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

function toggleCard(id) {
  openId = openId === id ? null : id;
  renderList();
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
    const id = `${r.batter_id || r.batter}-${i}`;
    const isOpen = openId === id;
    const rankCls = i < 5 ? "rank top" : "rank";
    const wxCls = wxClass(r.weather_mult);
    const wxLabel = r.weather_mult >= 1.03 ? "Helping" : r.weather_mult <= 0.98 ? "Hurting" : "Neutral";

    return `
      <div class="card ${isOpen ? "open" : ""}" onclick="toggleCard('${id}')">
        <div class="rank-row">
          <div class="${rankCls}">${i + 1}</div>
          <div class="main">
            <div class="name">${r.batter} <span class="chevron">${isOpen ? "▾" : "›"}</span></div>
            <div class="meta">${r.team} vs ${r.opp_pitcher || "TBD"} · ${r.park}</div>
            <div class="metrics">
              <div class="metric">xHR <b>${fmt(r.xhr_rate, 3)}</b></div>
              <div class="metric ${wxCls}">Wx <b>${fmt(r.weather_mult, 3)}</b></div>
              <div class="metric fair">Fair <b>${r.fair_odds || "—"}</b></div>
            </div>
          </div>
          <div class="exp">
            <div class="exp-val">${fmt(r.exp_hr_4pa, 3)}</div>
            <div class="exp-label">Exp HR</div>
          </div>
        </div>

        ${isOpen ? `
        <div class="detail">
          <div class="detail-grid">
            <div class="d-item">
              <div class="d-label">Bats</div>
              <div class="d-val">${r.bat_hand || "—"}</div>
            </div>
            <div class="d-item">
              <div class="d-label">Barrel Rate</div>
              <div class="d-val">${r.barrel_rate ? fmt(r.barrel_rate, 1) + "%" : "—"}</div>
            </div>
            <div class="d-item">
              <div class="d-label">Season HR Rate</div>
              <div class="d-val">${fmt(r.hr_rate, 3)} <span class="d-sub">(${r.hr || 0} HR / ${r.pa || "—"} PA)</span></div>
            </div>
            <div class="d-item">
              <div class="d-label">xHR Rate</div>
              <div class="d-val">${fmt(r.xhr_rate, 3)}</div>
            </div>
            <div class="d-item">
              <div class="d-label">Avg Exit Velo</div>
              <div class="d-val">${r.avg_ev ? fmt(r.avg_ev, 1) + " mph" : "—"}</div>
            </div>
            <div class="d-item">
              <div class="d-label">Opp Pitcher HR/9</div>
              <div class="d-val">${fmt(r.opp_hr9, 2)}</div>
            </div>
            <div class="d-item">
              <div class="d-label">Park Factor</div>
              <div class="d-val">${fmt(r.park_factor, 2)}×</div>
            </div>
            <div class="d-item">
              <div class="d-label">Weather</div>
              <div class="d-val ${wxCls}">${fmt(r.weather_mult, 3)}× <span class="d-sub">${wxLabel}</span></div>
            </div>
            <div class="d-item">
              <div class="d-label">Conditions</div>
              <div class="d-val">${r.temp_f || "—"}°F · ${r.wind_mph != null ? r.wind_mph + " mph" : "—"}</div>
            </div>
            <div class="d-item">
              <div class="d-label">P(HR) per PA</div>
              <div class="d-val">${fmt(r.p_hr_pa, 3)}</div>
            </div>
            <div class="d-item">
              <div class="d-label">Expected HR (4 PA)</div>
              <div class="d-val green">${fmt(r.exp_hr_4pa, 3)}</div>
            </div>
            <div class="d-item">
              <div class="d-label">P(HR in game)</div>
              <div class="d-val">${r.p_game_pct != null ? r.p_game_pct + "%" : "—"}</div>
            </div>
            <div class="d-item">
              <div class="d-label">Fair Odds</div>
              <div class="d-val green">${r.fair_odds || "—"}</div>
            </div>
          </div>
        </div>
        ` : ""}
      </div>`;
  }).join("");
}

function renderWeather() {
  const list = document.getElementById("list");
  const weatherPanel = document.getElementById("weatherPanel");
  list.style.display = "none";
  weatherPanel.style.display = "block";

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
  openId = null;
  render();
});

document.getElementById("search").addEventListener("input", () => {
  if (currentTab === "weather") return;
  openId = null;
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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

load();
