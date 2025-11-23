// game.js

// === TEMEL SABİTLER ===
const MAP_WIDTH = 8;
const MAP_HEIGHT = 6;
const STORAGE_KEY = "TextCityMasterSave_v1";

const SEASONS = ["İlkbahar", "Yaz", "Sonbahar", "Kış"];

// Bölgeler (zonelar)
const ZONES = {
  empty: {
    id: "empty",
    name: "Boş",
    type: "none",
    baseHousing: 0,
    baseJobs: 0,
    baseTax: 0,
    baseProduction: 0,
    basePollution: 0,
    maintenance: 0
  },
  residential: {
    id: "residential",
    name: "Konut",
    type: "residential",
    baseHousing: 60,
    baseJobs: 5,
    baseTax: 20,
    baseProduction: 0,
    basePollution: 2,
    maintenance: 8
  },
  commercial: {
    id: "commercial",
    name: "Ticari",
    type: "commercial",
    baseHousing: 0,
    baseJobs: 25,
    baseTax: 35,
    baseProduction: 10,
    basePollution: 4,
    maintenance: 10
  },
  industrial: {
    id: "industrial",
    name: "Sanayi",
    type: "industrial",
    baseHousing: 0,
    baseJobs: 40,
    baseTax: 45,
    baseProduction: 35,
    basePollution: 10,
    maintenance: 14
  },
  agriculture: {
    id: "agriculture",
    name: "Tarım",
    type: "agriculture",
    baseHousing: 0,
    baseJobs: 15,
    baseTax: 15,
    baseProduction: 40,
    basePollution: -2,
    maintenance: 6
  },
  forest: {
    id: "forest",
    name: "Orman / Yeşil",
    type: "forest",
    baseHousing: 0,
    baseJobs: 3,
    baseTax: 5,
    baseProduction: 5,
    basePollution: -10,
    maintenance: 4
  },
  park: {
    id: "park",
    name: "Park / Rekreasyon",
    type: "park",
    baseHousing: 0,
    baseJobs: 5,
    baseTax: 2,
    baseProduction: 0,
    basePollution: -6,
    maintenance: 5
  },
  utility: {
    id: "utility",
    name: "Altyapı / Hizmet",
    type: "utility",
    baseHousing: 0,
    baseJobs: 10,
    baseTax: 8,
    baseProduction: 0,
    basePollution: 4,
    maintenance: 12
  }
};

// Hava olayları
const WEATHER_TYPES = [
  {
    id: "sunny",
    name: "Güneşli",
    moodDelta: +2,
    productionMod: 1.0,
    disasterRiskMod: 1.0
  },
  {
    id: "rain",
    name: "Yağmurlu",
    moodDelta: 0,
    productionMod: 1.05,
    disasterRiskMod: 1.1
  },
  {
    id: "storm",
    name: "Fırtına",
    moodDelta: -4,
    productionMod: 0.8,
    disasterRiskMod: 1.4
  },
  {
    id: "drought",
    name: "Kuraklık",
    moodDelta: -3,
    productionMod: 0.7,
    disasterRiskMod: 1.3
  },
  {
    id: "snow",
    name: "Karlı",
    moodDelta: -1,
    productionMod: 0.9,
    disasterRiskMod: 1.2
  }
];

// Afetler
const DISASTERS = [
  {
    id: "fire",
    name: "Büyük Yangın",
    baseChance: 0.02,
    tilesHit: 2,
    moneyLoss: 2000,
    moodDelta: -8
  },
  {
    id: "flood",
    name: "Sel Baskını",
    baseChance: 0.015,
    tilesHit: 2,
    moneyLoss: 2500,
    moodDelta: -6
  },
  {
    id: "earthquake",
    name: "Deprem",
    baseChance: 0.007,
    tilesHit: 3,
    moneyLoss: 5000,
    moodDelta: -12
  },
  {
    id: "epidemic",
    name: "Salgın Hastalık",
    baseChance: 0.012,
    tilesHit: 0,
    moneyLoss: 1500,
    moodDelta: -10
  },
  {
    id: "riot",
    name: "Toplumsal Olay",
    baseChance: 0.01,
    tilesHit: 0,
    moneyLoss: 1000,
    moodDelta: -9
  }
];

// Politikalar
const POLICIES = {
  greenCity: {
    id: "greenCity",
    name: "Yeşil Şehir",
    desc: "Orman ve park etkisi artar, sanayi kirliliği cezalandırılır.",
    upkeep: 150,
    modifiers: {
      pollutionGlobal: -4,
      happinessGlobal: +3,
      industrialPollutionExtra: +3
    }
  },
  industryBoost: {
    id: "industryBoost",
    name: "Sanayi Teşviki",
    desc: "Sanayi üretimi ve vergi artar, mutluluk düşer.",
    upkeep: 200,
    modifiers: {
      industrialProductionMod: 1.25,
      industrialTaxMod: 1.2,
      happinessGlobal: -4
    }
  },
  lowTaxes: {
    id: "lowTaxes",
    name: "Düşük Vergi Sözü",
    desc: "Mutluluk artar, vergi geliri hafif azalır.",
    upkeep: 0,
    modifiers: {
      taxModGlobal: 0.9,
      happinessGlobal: +4
    }
  },
  highServices: {
    id: "highServices",
    name: "Güçlü Belediye Hizmetleri",
    desc: "Mutluluk ve sağlık artar, bakım masrafı yükselir.",
    upkeep: 350,
    modifiers: {
      maintenanceModGlobal: 1.25,
      happinessGlobal: +5
    }
  },
  trafficPolicy: {
    id: "trafficPolicy",
    name: "Toplu Taşıma Atağı",
    desc: "Trafik yükü azalır, masraf artar.",
    upkeep: 180,
    modifiers: {
      trafficGlobal: -10
    }
  }
};

// Altyapı / özel binalar
const INFRASTRUCTURE = {
  hospital: {
    id: "hospital",
    name: "Şehir Hastanesi",
    desc: "Sağlık ve mutluluğu artırır, salgın riskini azaltır.",
    buildCost: 12000,
    upkeep: 260,
    modifiers: {
      happinessGlobal: +5,
      epidemicRiskMod: 0.5
    }
  },
  school: {
    id: "school",
    name: "Eğitim Kampüsü",
    desc: "Uzun vadede üretim ve vergi verimliliğini artırır.",
    buildCost: 9000,
    upkeep: 220,
    modifiers: {
      productionModGlobal: 1.08,
      taxModGlobal: 1.04
    }
  },
  fireStation: {
    id: "fireStation",
    name: "İtfaiye Merkezi",
    desc: "Yangın hasarını ve riskini azaltır.",
    buildCost: 8000,
    upkeep: 180,
    modifiers: {
      fireRiskMod: 0.5
    }
  },
  floodBarrier: {
    id: "floodBarrier",
    name: "Sel Setleri",
    desc: "Sel ihtimalini ciddi azaltır.",
    buildCost: 7000,
    upkeep: 140,
    modifiers: {
      floodRiskMod: 0.4
    }
  },
  powerPlant: {
    id: "powerPlant",
    name: "Ana Güç Santrali",
    desc: "Enerji kapasitesini yükseltir, kirliliği arttırır.",
    buildCost: 11000,
    upkeep: 260,
    modifiers: {
      powerCapacity: +400,
      pollutionGlobal: +6
    }
  },
  waterPlant: {
    id: "waterPlant",
    name: "Su Arıtma Tesisi",
    desc: "Su kapasitesini arttırır, kirliliği azaltır.",
    buildCost: 9500,
    upkeep: 220,
    modifiers: {
      waterCapacity: +350,
      pollutionGlobal: -5
    }
  }
};

// === OYUN DURUMU ===
let state = null;
let selectedTile = null;
let currentWeather = WEATHER_TYPES[0];
let currentSeasonIndex = 0;

// === YARDIMCI FONKSİYONLAR ===
function rand() {
  return Math.random();
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// === LOG ===
const logContainer = () => document.getElementById("logContainer");

function addLog(message, type = "info") {
  const container = logContainer();
  if (!container) return;
  const div = document.createElement("div");
  div.classList.add("log-entry");
  if (type === "good") div.classList.add("log-good");
  else if (type === "bad") div.classList.add("log-bad");
  else if (type === "warning") div.classList.add("log-warning");
  else if (type === "neutral") div.classList.add("log-neutral");
  else div.classList.add("log-info");
  div.textContent = message;
  container.prepend(div);

  // 80 kaydı aşmasın
  while (container.children.length > 80) {
    container.removeChild(container.lastChild);
  }
}

// === YENİ OYUN OLUŞTUR ===
function createEmptyMap() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({
        x,
        y,
        zone: "empty",
        level: 0,
        pollution: 0,
        localHappiness: 0
      });
    }
    map.push(row);
  }
  return map;
}

function defaultState() {
  return {
    day: 1,
    money: 50000,
    population: 0,
    employmentRate: 0,
    unemployed: 0,
    happiness: 50,
    environment: 0,
    trafficLoad: 10,
    powerUsage: 0,
    waterUsage: 0,
    powerCapacity: 200,
    waterCapacity: 200,

    // Vergiler
    taxes: {
      residential: 10,
      commercial: 12,
      industrial: 15
    },

    // Son tur özeti
    lastTurn: {
      taxIncome: 0,
      productionIncome: 0,
      maintenanceCost: 0,
      netIncome: 0,
      populationDelta: 0,
      happinessDelta: 0
    },

    map: createEmptyMap(),

    policiesActive: {},
    infrastructureBuilt: {},

    statsHistory: []
  };
}

// === KAYDET / YÜKLE ===
function saveGame() {
  try {
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
    addLog("Oyun kaydedildi.", "good");
  } catch (e) {
    console.error(e);
    addLog("Oyun kaydı sırasında hata oluştu.", "bad");
  }
}

function loadGame() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      addLog("Kayıtlı oyun bulunamadı.", "warning");
      return;
    }
    const parsed = JSON.parse(data);
    state = parsed;
    // Güvenlik için bazı alanları garanti altına al
    if (!state.map) state.map = createEmptyMap();
    if (!state.taxes) {
      state.taxes = { residential: 10, commercial: 12, industrial: 15 };
    }
    if (!state.lastTurn) {
      state.lastTurn = {
        taxIncome: 0,
        productionIncome: 0,
        maintenanceCost: 0,
        netIncome: 0,
        populationDelta: 0,
        happinessDelta: 0
      };
    }
    if (!state.policiesActive) state.policiesActive = {};
    if (!state.infrastructureBuilt) state.infrastructureBuilt = {};
    if (!state.statsHistory) state.statsHistory = [];

    addLog("Kayıtlı oyun yüklendi.", "good");
    renderAll();
  } catch (e) {
    console.error(e);
    addLog("Kayıt yüklenirken hata oluştu.", "bad");
  }
}

function resetSave() {
  localStorage.removeItem(STORAGE_KEY);
  addLog("Kayıt dosyası silindi.", "warning");
}

// === HARİTA RENDER ===
function renderMap() {
  const container = document.getElementById("mapContainer");
  container.innerHTML = "";

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("map-row");

    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = state.map[y][x];
      const cell = document.createElement("div");
      cell.classList.add("map-cell");

      if (selectedTile && selectedTile.x === x && selectedTile.y === y) {
        cell.classList.add("selected");
      }

      const label = document.createElement("div");
      label.classList.add("cell-label");
      label.textContent = String.fromCharCode(65 + y) + (x + 1);

      const zoneDiv = document.createElement("div");
      zoneDiv.classList.add("cell-zone");
      const zone = ZONES[tile.zone] || ZONES.empty;
      zoneDiv.textContent = zone.name;

      zoneDiv.classList.add("zone-" + zone.id);

      if (tile.level > 0 && tile.zone !== "empty") {
        zoneDiv.textContent += " Lv" + tile.level;
      }

      cell.appendChild(label);
      cell.appendChild(zoneDiv);

      cell.addEventListener("click", () => {
        selectedTile = { x, y };
        renderTileDetails();
        renderMap();
      });

      rowDiv.appendChild(cell);
    }
    container.appendChild(rowDiv);
  }
}

// === SEÇİLİ ALAN ===
function renderTileDetails() {
  const container = document.getElementById("selectedTileDetails");

  if (!selectedTile) {
    container.textContent = "Hiçbir kare seçili değil. Haritadan bir kareye tıkla.";
    return;
  }

  const tile = state.map[selectedTile.y][selectedTile.x];
  const zone = ZONES[tile.zone] || ZONES.empty;

  const housing = zone.baseHousing * (1 + tile.level * 0.4);
  const jobs = zone.baseJobs * (1 + tile.level * 0.5);
  const prod = zone.baseProduction * (1 + tile.level * 0.6);
  const pollution = zone.basePollution + tile.level * 2;

  container.innerHTML = `
    <h3>Kare: ${String.fromCharCode(65 + tile.y)}${tile.x + 1}</h3>
    <div class="tile-meta">
      Bölge: <strong>${zone.name}</strong> ${tile.zone !== "empty" ? "(Seviye " + tile.level + ")" : ""}
    </div>
    <div class="tile-stats">
      Barınma Kapasitesi: <strong>${housing.toFixed(0)}</strong><br>
      İş Kapasitesi: <strong>${jobs.toFixed(0)}</strong><br>
      Günlük Üretim: <strong>${prod.toFixed(0)}</strong><br>
      Yerel Kirlilik: <strong>${pollution}</strong><br>
    </div>
    <div class="tile-stats">
      Toplam Bölge Sayısı: 
      Konut ${countZone("residential")}, Ticari ${countZone("commercial")}, Sanayi ${countZone("industrial")}, Tarım ${countZone("agriculture")}, Orman ${countZone("forest")}
    </div>
    <div class="tile-actions">
      ${tile.zone !== "residential" ? `<button class="btn" data-action="setZone" data-zone="residential">Konut</button>` : ""}
      ${tile.zone !== "commercial" ? `<button class="btn" data-action="setZone" data-zone="commercial">Ticari</button>` : ""}
      ${tile.zone !== "industrial" ? `<button class="btn" data-action="setZone" data-zone="industrial">Sanayi</button>` : ""}
      ${tile.zone !== "agriculture" ? `<button class="btn" data-action="setZone" data-zone="agriculture">Tarım</button>` : ""}
      ${tile.zone !== "forest" ? `<button class="btn" data-action="setZone" data-zone="forest">Orman</button>` : ""}
      ${tile.zone !== "park" ? `<button class="btn" data-action="setZone" data-zone="park">Park</button>` : ""}
      ${tile.zone !== "utility" ? `<button class="btn" data-action="setZone" data-zone="utility">Altyapı</button>` : ""}
      ${tile.zone !== "empty" ? `<button class="btn btn-ghost" data-action="bulldoze">Boşalt</button>` : ""}
      ${tile.zone !== "empty" ? `<button class="btn btn-primary" data-action="upgrade">Yükselt (₺${1000 + tile.level * 800})</button>` : ""}
    </div>
  `;

  const buttons = container.querySelectorAll("button[data-action]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      if (action === "setZone") {
        const zoneId = btn.getAttribute("data-zone");
        setTileZone(tile.x, tile.y, zoneId);
      } else if (action === "upgrade") {
        upgradeTile(tile.x, tile.y);
      } else if (action === "bulldoze") {
        bulldozeTile(tile.x, tile.y);
      }
    });
  });
}

function countZone(zoneId) {
  let count = 0;
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (state.map[y][x].zone === zoneId) count++;
    }
  }
  return count;
}

// === BÖLGE İŞLEMLERİ ===
function setTileZone(x, y, zoneId) {
  const tile = state.map[y][x];
  const zone = ZONES[zoneId];
  if (!zone) return;
  const cost = 500;
  if (state.money < cost) {
    addLog("Yetersiz bakiye: Bölge atamak için en az ₺" + cost + " gerekir.", "bad");
    return;
  }
  state.money -= cost;
  tile.zone = zoneId;
  tile.level = 0;
  tile.pollution = 0;
  tile.localHappiness = 0;
  addLog(`${String.fromCharCode(65 + y)}${x + 1} karası ${zone.name} bölgesine dönüştürüldü. (₺${cost})`, "info");
  renderAll();
}

function upgradeTile(x, y) {
  const tile = state.map[y][x];
  if (tile.zone === "empty") return;
  if (tile.level >= 3) {
    addLog("Bu alan zaten azami seviyede.", "warning");
    return;
  }
  const cost = 1000 + tile.level * 800;
  if (state.money < cost) {
    addLog("Yetersiz bakiye: Yükseltme için ₺" + cost + " gerekir.", "bad");
    return;
  }
  state.money -= cost;
  tile.level++;
  addLog(`${String.fromCharCode(65 + y)}${x + 1} alanı seviye ${tile.level} oldu. (₺${cost})`, "good");
  renderAll();
}

function bulldozeTile(x, y) {
  const tile = state.map[y][x];
  if (tile.zone === "empty") return;
  tile.zone = "empty";
  tile.level = 0;
  tile.pollution = 0;
  tile.localHappiness = 0;
  addLog(`${String.fromCharCode(65 + y)}${x + 1} alanı boşaltıldı.`, "neutral");
  renderAll();
}

// === STATSLAR ===
function renderStats() {
  document.getElementById("dayDisplay").textContent = state.day;
  document.getElementById("seasonDisplay").textContent = SEASONS[currentSeasonIndex];
  document.getElementById("weatherDisplay").textContent = currentWeather.name;

  document.getElementById("moneyDisplay").textContent =
    "₺ " + state.money.toLocaleString("tr-TR");

  document.getElementById("populationDisplay").textContent =
    state.population.toLocaleString("tr-TR");

  document.getElementById("employmentDisplay").textContent =
    `${state.employmentRate.toFixed(1)}% (işsiz ${state.unemployed.toLocaleString("tr-TR")})`;

  document.getElementById("happinessDisplay").textContent =
    `${state.happiness.toFixed(1)}%`;

  let envLabel = "Dengeli";
  if (state.environment < -20) envLabel = "Ağır Kirli";
  else if (state.environment < 0) envLabel = "Kirli";
  else if (state.environment > 20) envLabel = "Çok Temiz";
  else if (state.environment > 0) envLabel = "Temiz";

  document.getElementById("environmentDisplay").textContent = envLabel;

  let trafficLabel = "Akıcı";
  if (state.trafficLoad > 70) trafficLabel = "Kilit (Kızgın Sürücüler)";
  else if (state.trafficLoad > 40) trafficLabel = "Yoğun";
  else if (state.trafficLoad > 20) trafficLabel = "Orta";

  document.getElementById("trafficDisplay").textContent = trafficLabel;

  const powerText = `${state.powerUsage.toFixed(0)} / ${state.powerCapacity.toFixed(0)}`;
  const waterText = `${state.waterUsage.toFixed(0)} / ${state.waterCapacity.toFixed(0)}`;

  document.getElementById("powerDisplay").textContent = powerText;
  document.getElementById("waterDisplay").textContent = waterText;

  // Ekonomi
  document.getElementById("taxIncomeDisplay").textContent =
    "₺ " + state.lastTurn.taxIncome.toFixed(0);
  document.getElementById("productionIncomeDisplay").textContent =
    "₺ " + state.lastTurn.productionIncome.toFixed(0);
  document.getElementById("maintenanceCostDisplay").textContent =
    "₺ " + state.lastTurn.maintenanceCost.toFixed(0);
  document.getElementById("netIncomeDisplay").textContent =
    "₺ " + state.lastTurn.netIncome.toFixed(0);

  // Vergiler
  const taxResidentialInput = document.getElementById("taxResidential");
  const taxCommercialInput = document.getElementById("taxCommercial");
  const taxIndustrialInput = document.getElementById("taxIndustrial");

  taxResidentialInput.value = state.taxes.residential;
  taxCommercialInput.value = state.taxes.commercial;
  taxIndustrialInput.value = state.taxes.industrial;

  document.getElementById("taxResidentialValue").textContent =
    state.taxes.residential;
  document.getElementById("taxCommercialValue").textContent =
    state.taxes.commercial;
  document.getElementById("taxIndustrialValue").textContent =
    state.taxes.industrial;

  // Tur özeti
  const t = state.lastTurn;
  const turnSummary = document.getElementById("turnSummary");
  turnSummary.textContent =
    `Son Tur: Gelir ₺${(t.taxIncome + t.productionIncome).toFixed(0)} ` +
    `| Gider ₺${t.maintenanceCost.toFixed(0)} ` +
    `| Net ₺${t.netIncome.toFixed(0)} ` +
    `| Nüfus Δ ${t.populationDelta.toFixed(0)} ` +
    `| Mutluluk Δ ${t.happinessDelta.toFixed(1)}`;
}

// === POLİTİKALAR ve ALTYAPI ===
function renderPolicies() {
  const container = document.getElementById("policiesContainer");
  container.innerHTML = "";
  for (const key in POLICIES) {
    const p = POLICIES[key];
    const card = document.createElement("div");
    card.classList.add("policy-card");
    if (state.policiesActive[p.id]) {
      card.classList.add("policy-active");
    }
    card.innerHTML = `
      <div class="policy-title">${p.name}</div>
      <div class="policy-desc">${p.desc}</div>
      <div class="policy-status">
        Günlük Maliyet: ₺${p.upkeep} | Durum: 
        <strong>${state.policiesActive[p.id] ? "Aktif" : "Pasif"}</strong>
      </div>
    `;
    card.addEventListener("click", () => togglePolicy(p.id));
    container.appendChild(card);
  }
}

function renderInfrastructure() {
  const container = document.getElementById("infrastructureContainer");
  container.innerHTML = "";
  for (const key in INFRASTRUCTURE) {
    const i = INFRASTRUCTURE[key];
    const active = !!state.infrastructureBuilt[i.id];
    const card = document.createElement("div");
    card.classList.add("infra-card");
    if (active) card.classList.add("infra-active");
    card.innerHTML = `
      <div class="infra-title">${i.name}</div>
      <div class="infra-desc">${i.desc}</div>
      <div class="infra-status">
        Yapım Maliyeti: ₺${i.buildCost} | Günlük: ₺${i.upkeep} | 
        <strong>${active ? "Kurulu" : "Kurulmamış"}</strong>
      </div>
    `;
    card.addEventListener("click", () => buildInfrastructure(i.id));
    container.appendChild(card);
  }
}

function togglePolicy(policyId) {
  const p = POLICIES[policyId];
  if (!p) return;

  if (state.policiesActive[policyId]) {
    state.policiesActive[policyId] = false;
    addLog(`${p.name} politikası devre dışı bırakıldı.`, "warning");
  } else {
    state.policiesActive[policyId] = true;
    addLog(`${p.name} politikası devreye alındı.`, "good");
  }
  renderAll();
}

function buildInfrastructure(infraId) {
  const infra = INFRASTRUCTURE[infraId];
  if (!infra) return;
  if (state.infrastructureBuilt[infraId]) {
    addLog(`${infra.name} zaten kurulmuş.`, "warning");
    return;
  }
  if (state.money < infra.buildCost) {
    addLog(`Yetersiz bakiye: ${infra.name} için ₺${infra.buildCost} gerekir.`, "bad");
    return;
  }
  state.money -= infra.buildCost;
  state.infrastructureBuilt[infraId] = true;
  addLog(`${infra.name} inşa edildi. Şehir kapasiteniz gelişti.`, "good");
  applyInfrastructureStaticEffects();
  renderAll();
}

function applyInfrastructureStaticEffects() {
  // Power & water capacity and pollution from infra
  let basePower = 200;
  let baseWater = 200;
  let pollution = 0;

  for (const id in INFRASTRUCTURE) {
    if (!state.infrastructureBuilt[id]) continue;
    const inf = INFRASTRUCTURE[id];
    const m = inf.modifiers || {};
    if (m.powerCapacity) basePower += m.powerCapacity;
    if (m.waterCapacity) baseWater += m.waterCapacity;
    if (m.pollutionGlobal) pollution += m.pollutionGlobal;
  }

  state.powerCapacity = basePower;
  state.waterCapacity = baseWater;
  state.environment += pollution;
}

// === EKONOMİ, NÜFUS, MUTLULUK HESAPLARI ===
function aggregatePolicyModifiers() {
  const mod = {
    pollutionGlobal: 0,
    happinessGlobal: 0,
    industrialPollutionExtra: 0,
    industrialProductionMod: 1.0,
    industrialTaxMod: 1.0,
    taxModGlobal: 1.0,
    maintenanceModGlobal: 1.0,
    trafficGlobal: 0,
    productionModGlobal: 1.0,
    fireRiskMod: 1.0,
    floodRiskMod: 1.0,
    epidemicRiskMod: 1.0
  };

  for (const id in POLICIES) {
    if (!state.policiesActive[id]) continue;
    const p = POLICIES[id];
    const m = p.modifiers || {};
    for (const k in m) {
      if (typeof mod[k] === "number") {
        if (k.endsWith("Mod") || k.endsWith("Rate") || k.endsWith("Global")) {
          // Çarpan şeklinde veya ek şeklinde olabilir
          if (k.endsWith("Mod")) {
            mod[k] *= m[k];
          } else {
            mod[k] += m[k];
          }
        } else {
          mod[k] += m[k];
        }
      }
    }
  }

  // Altyapı etkileri (risk mod vb.)
  for (const id in INFRASTRUCTURE) {
    if (!state.infrastructureBuilt[id]) continue;
    const inf = INFRASTRUCTURE[id];
    const m = inf.modifiers || {};
    if (m.fireRiskMod) mod.fireRiskMod *= m.fireRiskMod;
    if (m.floodRiskMod) mod.floodRiskMod *= m.floodRiskMod;
    if (m.epidemicRiskMod) mod.epidemicRiskMod *= m.epidemicRiskMod;
    if (m.productionModGlobal) mod.productionModGlobal *= m.productionModGlobal;
    if (m.taxModGlobal) mod.taxModGlobal *= m.taxModGlobal;
    if (m.pollutionGlobal) mod.pollutionGlobal += m.pollutionGlobal;
    if (m.happinessGlobal) mod.happinessGlobal += m.happinessGlobal;
    if (m.trafficGlobal) mod.trafficGlobal += m.trafficGlobal;
  }

  return mod;
}

function simulateEconomyAndPopulation() {
  const policyMod = aggregatePolicyModifiers();

  let totalHousing = 0;
  let totalJobs = 0;
  let totalProductionValue = 0;
  let totalPollution = 0;
  let totalMaintenance = 0;
  let baseTaxResidential = 0;
  let baseTaxCommercial = 0;
  let baseTaxIndustrial = 0;

  let powerUsage = 0;
  let waterUsage = 0;
  let trafficLoad = 10;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = state.map[y][x];
      const zone = ZONES[tile.zone] || ZONES.empty;
      const levelFactor = 1 + tile.level * 0.4;
      const levelFactorJobs = 1 + tile.level * 0.5;
      const levelFactorProd = 1 + tile.level * 0.6;

      const housing = zone.baseHousing * levelFactor;
      const jobs = zone.baseJobs * levelFactorJobs;
      let prod = zone.baseProduction * levelFactorProd;

      let pollution = zone.basePollution + tile.level * 2;

      if (zone.type === "industrial" && policyMod.industrialPollutionExtra) {
        pollution += policyMod.industrialPollutionExtra;
      }

      let maintenance = zone.maintenance * (1 + tile.level * 0.25);

      // Enerji/su/trafik yükü
      if (zone.type !== "none") {
        powerUsage += (zone.type === "industrial" ? 9 : zone.type === "commercial" ? 6 : 3) * levelFactor;
        waterUsage += (zone.type === "industrial" ? 7 : zone.type === "commercial" ? 4 : 3) * levelFactor;
        trafficLoad += (zone.type === "industrial" ? 3 : zone.type === "commercial" ? 2 : 1) * levelFactor;
      }

      totalHousing += housing;
      totalJobs += jobs;
      totalProductionValue += prod;
      totalPollution += pollution;
      totalMaintenance += maintenance;

      // Vergi tabanları
      const taxBase = (housing * 0.4 + jobs * 1.2 + prod * 0.8) / 10;
      if (zone.type === "residential") baseTaxResidential += taxBase;
      if (zone.type === "commercial") baseTaxCommercial += taxBase;
      if (zone.type === "industrial") baseTaxIndustrial += taxBase;
    }
  }

  // Mevcut nüfus ve değişimi
  const previousPopulation = state.population;

  let targetPopulation = totalHousing * (0.9 + rand() * 0.2); // kapasitenin %80-110'u arası, şehir cazibesine göre
  targetPopulation *= clamp(state.happiness / 75, 0.5, 1.4);

  // Enerji/su yetersizliği cezaları
  const energyRatio = state.powerCapacity > 0 ? clamp(state.powerCapacity / Math.max(powerUsage, 1), 0.4, 1.3) : 0.5;
  const waterRatio = state.waterCapacity > 0 ? clamp(state.waterCapacity / Math.max(waterUsage, 1), 0.4, 1.3) : 0.5;
  const infraRatio = Math.min(energyRatio, waterRatio);

  targetPopulation *= infraRatio;

  // Trafik cezası
  trafficLoad += (targetPopulation / 800);
  const trafficImpact = clamp(1 - (trafficLoad / 120), 0.4, 1.1);
  targetPopulation *= trafficImpact;

  const newPopulation =
    previousPopulation + (targetPopulation - previousPopulation) * 0.2; // yumuşak geçiş
  state.population = Math.max(0, newPopulation);

  // İşsizlik
  const jobsAvailable = totalJobs * 0.95;
  const employed = Math.min(jobsAvailable, state.population);
  const unemployed = Math.max(0, state.population - employed);
  const employmentRate = state.population > 0 ? (employed / state.population) * 100 : 0;

  state.employmentRate = employmentRate;
  state.unemployed = unemployed;

  // Vergiler
  const tRes = state.taxes.residential / 100;
  const tCom = state.taxes.commercial / 100;
  const tInd = state.taxes.industrial / 100;

  let taxIncome =
    baseTaxResidential * tRes +
    baseTaxCommercial * tCom +
    baseTaxIndustrial * tInd;

  // Politika/altyapı çarpanları
  taxIncome *= policyMod.taxModGlobal || 1.0;
  totalProductionValue *= (policyMod.productionModGlobal || 1.0);

  // Sanayi üretim/tax mod
  if (policyMod.industrialProductionMod || policyMod.industrialTaxMod) {
    // basitçe toplam üretim ve vergiye küçük ekstra bonus eklenmiş kabul ediyoruz
    taxIncome *= policyMod.industrialTaxMod || 1.0;
    totalProductionValue *= policyMod.industrialProductionMod || 1.0;
  }

  // Hava koşulları
  totalProductionValue *= currentWeather.productionMod;

  // Politikadan gelen bakım çarpanı
  totalMaintenance *= policyMod.maintenanceModGlobal || 1.0;

  // Politikaların günlük giderleri
  let policiesUpkeep = 0;
  for (const id in POLICIES) {
    if (!state.policiesActive[id]) continue;
    policiesUpkeep += POLICIES[id].upkeep;
  }

  // Altyapı günlük giderleri
  let infraUpkeep = 0;
  for (const id in INFRASTRUCTURE) {
    if (!state.infrastructureBuilt[id]) continue;
    infraUpkeep += INFRASTRUCTURE[id].upkeep;
  }

  const maintenanceCost = totalMaintenance + policiesUpkeep + infraUpkeep;

  const productionIncome = totalProductionValue * 1.1;
  const totalIncome = taxIncome + productionIncome;
  const netIncome = totalIncome - maintenanceCost;

  // Kasa
  state.money += netIncome;

  // Çevre ve trafik
  state.environment += totalPollution * 0.03;
  state.environment += policyMod.pollutionGlobal || 0;
  state.trafficLoad = trafficLoad + (policyMod.trafficGlobal || 0);

  // Enerji/su
  state.powerUsage = powerUsage;
  state.waterUsage = waterUsage;

  // Son tur kayıtları
  state.lastTurn.taxIncome = taxIncome;
  state.lastTurn.productionIncome = productionIncome;
  state.lastTurn.maintenanceCost = maintenanceCost;
  state.lastTurn.netIncome = netIncome;
  state.lastTurn.populationDelta = state.population - previousPopulation;
}

function simulateHappiness() {
  const policyMod = aggregatePolicyModifiers();

  let happinessDelta = 0;

  // İşsizlik
  const unemploymentRate =
    state.population > 0 ? (state.unemployed / state.population) * 100 : 0;
  if (unemploymentRate > 10) {
    happinessDelta -= (unemploymentRate - 10) * 0.1;
  }

  // Çevre
  if (state.environment < -15) happinessDelta -= 3;
  else if (state.environment < 0) happinessDelta -= 1;
  else if (state.environment > 25) happinessDelta += 3;
  else if (state.environment > 5) happinessDelta += 1;

  // Trafik
  if (state.trafficLoad > 70) happinessDelta -= 4;
  else if (state.trafficLoad > 40) happinessDelta -= 2;

  // Enerji/Su yetersizliği
  if (state.powerUsage > state.powerCapacity) happinessDelta -= 4;
  if (state.waterUsage > state.waterCapacity) happinessDelta -= 4;

  // Hava durumu
  happinessDelta += currentWeather.moodDelta;

  // Politikalar & altyapı
  happinessDelta += policyMod.happinessGlobal || 0;

  // Vergi seviyesi
  const avgTax =
    (state.taxes.residential + state.taxes.commercial + state.taxes.industrial) / 3;
  if (avgTax > 18) happinessDelta -= (avgTax - 18) * 0.2;
  else if (avgTax < 8) happinessDelta += (8 - avgTax) * 0.15;

  state.happiness = clamp(state.happiness + happinessDelta, 0, 100);
  state.lastTurn.happinessDelta = happinessDelta;
}

// === HAVA ve AFETLER ===
function rollWeather() {
  const dayInSeason = (state.day - 1) % 30;
  currentSeasonIndex = Math.floor((state.day - 1) / 30) % 4;

  // Mevsime göre ağırlıklandırma basit olsun
  let candidates = [];
  if (SEASONS[currentSeasonIndex] === "Yaz") {
    candidates = ["sunny", "sunny", "sunny", "storm", "drought", "rain"];
  } else if (SEASONS[currentSeasonIndex] === "Kış") {
    candidates = ["snow", "snow", "snow", "sunny", "storm", "rain"];
  } else {
    candidates = ["sunny", "sunny", "rain", "rain", "storm", "snow"];
  }

  const chosenId = choice(candidates);
  currentWeather = WEATHER_TYPES.find((w) => w.id === chosenId) || WEATHER_TYPES[0];

  // Ufak flavor log
  if (dayInSeason === 0) {
    addLog(`Yeni mevsim: ${SEASONS[currentSeasonIndex]}.`, "info");
  }
  addLog(`Bugünün hava durumu: ${currentWeather.name}.`, "neutral");
}

function rollDisasters() {
  const policyMod = aggregatePolicyModifiers();
  const logs = [];

  DISASTERS.forEach((d) => {
    let chance = d.baseChance * currentWeather.disasterRiskMod;

    if (d.id === "fire" && policyMod.fireRiskMod) {
      chance *= policyMod.fireRiskMod;
    }
    if (d.id === "flood" && policyMod.floodRiskMod) {
      chance *= policyMod.floodRiskMod;
    }
    if (d.id === "epidemic" && policyMod.epidemicRiskMod) {
      chance *= policyMod.epidemicRiskMod;
    }

    // Şehir büyüdükçe oranı biraz arttır
    chance *= 1 + state.population / 6000;

    if (rand() < chance) {
      applyDisaster(d);
    }
  });

  if (logs.length > 0) {
    logs.forEach((x) => addLog(x, "bad"));
  }
}

function applyDisaster(disaster) {
  let message = `${disaster.name} şehri vurdu! `;

  state.money -= disaster.moneyLoss;
  state.happiness = clamp(state.happiness + disaster.moodDelta, 0, 100);

  if (disaster.tilesHit > 0) {
    for (let i = 0; i < disaster.tilesHit; i++) {
      const x = randInt(0, MAP_WIDTH - 1);
      const y = randInt(0, MAP_HEIGHT - 1);
      const tile = state.map[y][x];
      if (tile.zone === "empty") continue;
      if (tile.level > 0 && rand() < 0.5) {
        tile.level--;
        message += ` ${String.fromCharCode(65 + y)}${x + 1} alanı hasar aldı (Seviye düştü).`;
      } else {
        tile.zone = "empty";
        tile.level = 0;
        tile.pollution = 0;
        message += ` ${String.fromCharCode(65 + y)}${x + 1} tamamen yıkıldı.`;
      }
    }
  } else {
    // Salgın / toplumsal olay gibi
    const loss = state.population * 0.05;
    state.population = Math.max(0, state.population - loss);
    message += `Nüfus ${loss.toFixed(0)} kişi azaldı.`;
  }

  addLog(message, "bad");
}

// === TURU BİTİR ===
function endTurn() {
  state.day += 1;

  rollWeather();
  simulateEconomyAndPopulation();
  simulateHappiness();
  rollDisasters();
  applyInfrastructureStaticEffects(); // kapasite güncel

  // Otomatik ufak kayıt
  if (state.day % 5 === 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Auto save failed", e);
    }
  }

  // History kaydı
  state.statsHistory.push({
    day: state.day,
    population: state.population,
    money: state.money,
    happiness: state.happiness,
    environment: state.environment
  });
  if (state.statsHistory.length > 200) {
    state.statsHistory.shift();
  }

  renderAll();
}

// === OLAY BAĞLANTILARI ===
function bindUI() {
  document.getElementById("btnEndTurn").addEventListener("click", () => {
    endTurn();
  });

  document.getElementById("btnNewGame").addEventListener("click", () => {
    if (confirm("Yeni oyun başlatmak istediğine emin misin? Mevcut ilerleme kaydedilmemiş olabilir.")) {
      state = defaultState();
      selectedTile = null;
      currentWeather = WEATHER_TYPES[0];
      currentSeasonIndex = 0;
      addLog("Yeni şehir kurulumuna başlandı.", "info");
      renderAll();
    }
  });

  document.getElementById("btnSave").addEventListener("click", () => {
    saveGame();
  });

  document.getElementById("btnLoad").addEventListener("click", () => {
    loadGame();
  });

  document.getElementById("btnReset").addEventListener("click", () => {
    if (confirm("Kayıtlı oyunu tamamen silmek istiyor musun?")) {
      resetSave();
    }
  });

  document.getElementById("btnClearLog").addEventListener("click", () => {
    const container = logContainer();
    container.innerHTML = "";
  });

  // Vergi sliderları
  document.getElementById("taxResidential").addEventListener("input", (e) => {
    state.taxes.residential = parseInt(e.target.value, 10);
    renderStats();
  });
  document.getElementById("taxCommercial").addEventListener("input", (e) => {
    state.taxes.commercial = parseInt(e.target.value, 10);
    renderStats();
  });
  document.getElementById("taxIndustrial").addEventListener("input", (e) => {
    state.taxes.industrial = parseInt(e.target.value, 10);
    renderStats();
  });
}

// === TÜM EKRANI GÜNCELLE ===
function renderAll() {
  renderMap();
  renderTileDetails();
  renderStats();
  renderPolicies();
  renderInfrastructure();
}

// === BAŞLAT ===
function initGame() {
  state = defaultState();
  bindUI();
  applyInfrastructureStaticEffects();
  addLog("TextCity Master'a hoş geldin. Haritadan alan seçip bölge belirleyerek başla!", "info");
  renderAll();
}

document.addEventListener("DOMContentLoaded", initGame);
