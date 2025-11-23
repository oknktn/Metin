
// OKAN CITY BUILDER – ENGINE 1.0
// Tamamen metin tabanlı, HTML+JS şehir simülasyon motoru

// ==== YARDIMCI FONKSİYONLAR ====
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = () => Math.random();
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ==== SABİTLER ====
const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;
const STORAGE_KEY = "okan_city_builder_v1";
const SEASONS = ["İlkbahar", "Yaz", "Sonbahar", "Kış"];

const ZONES = {
  empty:       { id:"empty",       name:"Boş",      type:"none",        housing:0,  jobs:0,  prod:0,  taxFactor:0,  pollution:0,  maintenance:0,  power:0, water:0 },
  residential: { id:"residential", name:"Konut",    type:"res",         housing:60, jobs:5, prod:0,  taxFactor:1.0, pollution:2,  maintenance:8,  power:3, water:3 },
  commercial:  { id:"commercial",  name:"Ticari",   type:"com",         housing:0,  jobs:25,prod:10, taxFactor:1.2, pollution:4,  maintenance:10, power:5, water:3 },
  industrial:  { id:"industrial",  name:"Sanayi",   type:"ind",         housing:0,  jobs:40,prod:35, taxFactor:1.4, pollution:10, maintenance:14, power:9, water:6 },
  agriculture: { id:"agriculture", name:"Tarım",    type:"agr",         housing:0,  jobs:15,prod:40, taxFactor:0.9, pollution:-3, maintenance:6,  power:2, water:4 },
  forest:      { id:"forest",      name:"Orman",    type:"nature",      housing:0,  jobs:3, prod:5,  taxFactor:0.4, pollution:-12,maintenance:4,  power:1, water:1 },
  park:        { id:"park",        name:"Park",     type:"leisure",     housing:0,  jobs:4, prod:0,  taxFactor:0.3, pollution:-6, maintenance:5,  power:1, water:1 },
  utility:     { id:"utility",     name:"Altyapı",  type:"utility",     housing:0,  jobs:10,prod:0,  taxFactor:0.6, pollution:5,  maintenance:12, power:7, water:4 }
};

const WEATHER_TYPES = [
  { id:"sunny",   name:"Güneşli",   mood:+2, prodMod:1.0,  disasterMod:1.0 },
  { id:"rain",    name:"Yağmurlu",  mood:0,  prodMod:1.05, disasterMod:1.1 },
  { id:"storm",   name:"Fırtına",   mood:-4, prodMod:0.8,  disasterMod:1.4 },
  { id:"drought", name:"Kuraklık",  mood:-3, prodMod:0.7,  disasterMod:1.3 },
  { id:"snow",    name:"Karlı",     mood:-1, prodMod:0.9,  disasterMod:1.2 }
];

const DISASTERS = [
  { id:"fire",      name:"Büyük Yangın",    baseChance:0.02,  tilesHit:2, moneyLoss:4000, moodDelta:-10 },
  { id:"flood",     name:"Sel Baskını",     baseChance:0.015, tilesHit:2, moneyLoss:5000, moodDelta:-7  },
  { id:"earthquake",name:"Deprem",          baseChance:0.007, tilesHit:3, moneyLoss:9000, moodDelta:-15 },
  { id:"epidemic",  name:"Salgın",          baseChance:0.012, tilesHit:0, moneyLoss:3000, moodDelta:-12 },
  { id:"riot",      name:"Toplumsal Olay",  baseChance:0.01,  tilesHit:0, moneyLoss:2000, moodDelta:-9  }
];

// Politikalar
const POLICIES = {
  greenCity: {
    id:"greenCity",
    name:"Yeşil Şehir",
    desc:"Orman/park etkisi artar, sanayi kirliliği cezalandırılır.",
    upkeep:150,
    modifiers:{ pollutionGlobal:-4, happinessGlobal:+3, industrialPollutionExtra:+4 }
  },
  industryBoost: {
    id:"industryBoost",
    name:"Sanayi Teşviki",
    desc:"Sanayi üretimi ve vergi artar, mutluluk düşer.",
    upkeep:240,
    modifiers:{ industrialProdMod:1.3, industrialTaxMod:1.25, happinessGlobal:-5 }
  },
  lowTaxes: {
    id:"lowTaxes",
    name:"Düşük Vergi Sözü",
    desc:"Mutluluk artar, vergi gelirinde hafif azalma.",
    upkeep:0,
    modifiers:{ taxGlobalMod:0.9, happinessGlobal:+4 }
  },
  services: {
    id:"services",
    name:"Güçlü Hizmetler",
    desc:"Bakım masrafı artar, mutluluk yükselir.",
    upkeep:350,
    modifiers:{ maintenanceMod:1.25, happinessGlobal:+6 }
  },
  trafficPlan: {
    id:"trafficPlan",
    name:"Trafik Planı",
    desc:"Trafik yükü azalır, hafif bakım gideri ekler.",
    upkeep:120,
    modifiers:{ trafficGlobal:-15 }
  }
};

// Altyapılar
const INFRASTRUCTURE = {
  hospital: {
    id:"hospital",
    name:"Şehir Hastanesi",
    desc:"Sağlık & mutluluk artar, salgın riski azalır.",
    buildCost:12000, upkeep:260,
    modifiers:{ happinessGlobal:+5, epidemicRiskMod:0.5 }
  },
  school: {
    id:"school",
    name:"Eğitim Kampüsü",
    desc:"Uzun vadede üretim ve vergi verimliliği artar.",
    buildCost:9000, upkeep:220,
    modifiers:{ prodGlobalMod:1.08, taxGlobalMod:1.05 }
  },
  fireStation: {
    id:"fireStation",
    name:"İtfaiye Merkezi",
    desc:"Yangın riski & hasarı azalır.",
    buildCost:8000, upkeep:180,
    modifiers:{ fireRiskMod:0.5 }
  },
  floodBarrier: {
    id:"floodBarrier",
    name:"Sel Setleri",
    desc:"Sel riski ciddi azalır.",
    buildCost:7000, upkeep:140,
    modifiers:{ floodRiskMod:0.4 }
  },
  powerPlant: {
    id:"powerPlant",
    name:"Ana Güç Santrali",
    desc:"Enerji kapasitesi yüksek, kirliliği arttırır.",
    buildCost:11000, upkeep:260,
    modifiers:{ powerCapacity:+450, pollutionGlobal:+6 }
  },
  waterPlant: {
    id:"waterPlant",
    name:"Su Arıtma Tesisi",
    desc:"Su kapasitesi yüksek, kirliliği azaltır.",
    buildCost:9500, upkeep:220,
    modifiers:{ waterCapacity:+380, pollutionGlobal:-5 }
  }
};

// Araştırma ağacı
const RESEARCH = {
  efficientHousing: {
    id:"efficientHousing",
    name:"Verimli Konut",
    desc:"Konutların barınma kapasitesi artar.",
    cost:8000,
    requires:[],
    effect:{ housingBoost:1.25 }
  },
  smartGrid: {
    id:"smartGrid",
    name:"Akıllı Şebeke",
    desc:"Enerji verimliliği artar.",
    cost:9000,
    requires:["efficientHousing"],
    effect:{ powerUsageMod:0.85 }
  },
  agroTech: {
    id:"agroTech",
    name:"Tarım Teknolojisi",
    desc:"Tarım üretimi artar.",
    cost:7000,
    requires:[],
    effect:{ agricultureProdMod:1.3 }
  },
  cleanIndustry: {
    id:"cleanIndustry",
    name:"Temiz Sanayi",
    desc:"Sanayi kirliliği azalır.",
    cost:10000,
    requires:["agroTech"],
    effect:{ industrialPollutionMod:0.7 }
  }
};

// Görevler
const MISSIONS = [
  {
    id:"m1",
    title:"İlk Adım",
    desc:"En az 3 konut ve 2 ticari alan kur.",
    check:(state)=> countZone(state,"residential")>=3 && countZone(state,"commercial")>=2,
    reward:{ money:5000, happiness:+3 }
  },
  {
    id:"m2",
    title:"Sanayi Bölgesi",
    desc:"Toplam 3 sanayi alanına ulaş.",
    check:(state)=> countZone(state,"industrial")>=3,
    reward:{ money:7000, happiness:-1 }
  },
  {
    id:"m3",
    title:"Yeşil Denge",
    desc:"En az 3 orman ve 2 park alanı kur.",
    check:(state)=> countZone(state,"forest")>=3 && countZone(state,"park")>=2,
    reward:{ money:4000, happiness:+5 }
  },
  {
    id:"m4",
    title:"Büyüyen Şehir",
    desc:"Nüfusu 3000'e çıkar.",
    check:(state)=> state.population>=3000,
    reward:{ money:10000, happiness:+4 }
  }
];

// ==== STATE ====
const Game = {
  state: null,
  selectedTile: null,
  currentWeather: WEATHER_TYPES[0],
  currentSeasonIndex: 0
};

// ==== LOG ====
function logContainer(){ return document.getElementById("logContainer"); }

function addLog(msg, type="info"){
  const c = logContainer();
  if(!c) return;
  const div = document.createElement("div");
  div.classList.add("log-entry");
  if(type==="good") div.classList.add("log-good");
  else if(type==="bad") div.classList.add("log-bad");
  else if(type==="warning") div.classList.add("log-warning");
  else if(type==="neutral") div.classList.add("log-neutral");
  else div.classList.add("log-info");
  div.textContent = msg;
  c.prepend(div);
  while(c.children.length>120){ c.removeChild(c.lastChild); }
}

// ==== MAP & STATE ====
function createEmptyMap(){
  const map=[];
  for(let y=0;y<MAP_HEIGHT;y++){
    const row=[];
    for(let x=0;x<MAP_WIDTH;x++){
      row.push({ x,y, zone:"empty", level:0, pollution:0 });
    }
    map.push(row);
  }
  return map;
}

function defaultState(){
  return{
    day:1,
    money:60000,
    population:0,
    happiness:50,
    environment:0,
    traffic:10,
    powerUsed:0,
    powerCap:220,
    waterUsed:0,
    waterCap:220,
    taxes:{ residential:10, commercial:12, industrial:15 },
    lastTurn:{ taxIncome:0, prodIncome:0, maintCost:0, net:0, popDelta:0, happyDelta:0 },
    map:createEmptyMap(),
    policiesActive:{},
    infraBuilt:{},
    researchDone:{},
    missions:{},
    statsHistory:[]
  };
}

// ==== KAYDET / YÜKLE ====
function saveGame(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Game.state));
    addLog("Oyun kaydedildi.","good");
  }catch(e){
    console.error(e);
    addLog("Oyun kaydedilirken hata oluştu.","bad");
  }
}

function loadGame(){
  try{
    const data = localStorage.getItem(STORAGE_KEY);
    if(!data){ addLog("Kayıtlı oyun bulunamadı.","warning"); return; }
    Game.state = JSON.parse(data);
    addLog("Kayıtlı oyun yüklendi.","good");
    renderAll();
  }catch(e){
    console.error(e);
    addLog("Kayıt yüklenirken hata oluştu.","bad");
  }
}

function resetSave(){
  localStorage.removeItem(STORAGE_KEY);
  addLog("Kayıt dosyası silindi.","warning");
}

// ==== YARDIMCI: ZONE SAY ====
function countZone(state, zoneId){
  let c=0;
  state.map.forEach(row=>{
    row.forEach(tile=>{
      if(tile.zone===zoneId) c++;
    });
  });
  return c;
}

// ==== SİMÜLASYON MODÜLLERİ ====

// Hava / Mevsim
const WeatherSystem = {
  roll(state){
    const dayIndex = (state.day-1) % 30;
    Game.currentSeasonIndex = Math.floor((state.day-1)/30) % 4;

    let pool;
    const season = SEASONS[Game.currentSeasonIndex];
    if(season==="Yaz"){
      pool=["sunny","sunny","sunny","storm","drought","rain"];
    }else if(season==="Kış"){
      pool=["snow","snow","sunny","storm","rain"];
    }else{
      pool=["sunny","sunny","rain","rain","storm","snow"];
    }
    const chosenId = choice(pool);
    Game.currentWeather = WEATHER_TYPES.find(w=>w.id===chosenId) || WEATHER_TYPES[0];
    if(dayIndex===0) addLog(`Yeni mevsim: ${season}.`,"info");
    addLog(`Bugün hava: ${Game.currentWeather.name}.`,"neutral");
  },

  mood(){
    return Game.currentWeather.mood;
  },

  prodMod(){
    return Game.currentWeather.prodMod;
  },

  disasterMod(){
    return Game.currentWeather.disasterMod;
  }
};

// Politikalar + altyapı + research birleşik etkiler
function aggregateModifiers(state){
  const mod = {
    pollutionGlobal:0,
    happinessGlobal:0,
    industrialPollutionExtra:0,
    industrialProdMod:1.0,
    industrialTaxMod:1.0,
    taxGlobalMod:1.0,
    maintMod:1.0,
    trafficGlobal:0,
    prodGlobalMod:1.0,
    fireRiskMod:1.0,
    floodRiskMod:1.0,
    epidemicRiskMod:1.0,
    powerCapacityBonus:0,
    waterCapacityBonus:0,
    housingBoost:1.0,
    powerUsageMod:1.0,
    agricultureProdMod:1.0,
    industrialPollutionMod:1.0
  };

  // Politikalar
  for(const id in POLICIES){
    if(!state.policiesActive[id]) continue;
    const p = POLICIES[id];
    const m = p.modifiers || {};
    if(m.pollutionGlobal) mod.pollutionGlobal += m.pollutionGlobal;
    if(m.happinessGlobal) mod.happinessGlobal += m.happinessGlobal;
    if(m.industrialPollutionExtra) mod.industrialPollutionExtra += m.industrialPollutionExtra;
    if(m.industrialProdMod) mod.industrialProdMod *= m.industrialProdMod;
    if(m.industrialTaxMod) mod.industrialTaxMod *= m.industrialTaxMod;
    if(m.taxGlobalMod) mod.taxGlobalMod *= m.taxGlobalMod;
    if(m.maintenanceMod) mod.maintMod *= m.maintenanceMod;
    if(m.trafficGlobal) mod.trafficGlobal += m.trafficGlobal;
  }

  // Altyapılar
  for(const id in INFRASTRUCTURE){
    if(!state.infraBuilt[id]) continue;
    const inf = INFRASTRUCTURE[id];
    const m = inf.modifiers || {};
    if(m.pollutionGlobal) mod.pollutionGlobal += m.pollutionGlobal;
    if(m.happinessGlobal) mod.happinessGlobal += m.happinessGlobal;
    if(m.epidemicRiskMod) mod.epidemicRiskMod *= m.epidemicRiskMod;
    if(m.fireRiskMod) mod.fireRiskMod *= m.fireRiskMod;
    if(m.floodRiskMod) mod.floodRiskMod *= m.floodRiskMod;
    if(m.prodGlobalMod) mod.prodGlobalMod *= m.prodGlobalMod;
    if(m.taxGlobalMod) mod.taxGlobalMod *= m.taxGlobalMod;
    if(m.powerCapacity) mod.powerCapacityBonus += m.powerCapacity;
    if(m.waterCapacity) mod.waterCapacityBonus += m.waterCapacity;
  }

  // Araştırmalar
  for(const id in state.researchDone){
    if(!state.researchDone[id]) continue;
    const r = RESEARCH[id];
    if(!r) continue;
    const e = r.effect || {};
    if(e.housingBoost) mod.housingBoost *= e.housingBoost;
    if(e.powerUsageMod) mod.powerUsageMod *= e.powerUsageMod;
    if(e.agricultureProdMod) mod.agricultureProdMod *= e.agricultureProdMod;
    if(e.industrialPollutionMod) mod.industrialPollutionMod *= e.industrialPollutionMod;
  }

  return mod;
}

// Ekonomi + nüfus + tüketim
function simulateEconomyAndPopulation(state){
  const mod = aggregateModifiers(state);

  let totalHousing=0, totalJobs=0, totalProd=0;
  let totalPoll=0, totalMaint=0;
  let baseTaxRes=0,baseTaxCom=0,baseTaxInd=0;
  let powerUse=0, waterUse=0, trafficLoad=10;

  state.map.forEach(row=>{
    row.forEach(tile=>{
      const zone = ZONES[tile.zone];
      if(!zone) return;
      const lv = tile.level;
      const fHousing = (zone.housing*(1+lv*0.4))*mod.housingBoost;
      const fJobs    = zone.jobs*(1+lv*0.5);
      let fProd      = zone.prod*(1+lv*0.6);
      let fPoll      = zone.pollution + lv*2;
      let maint      = zone.maintenance*(1+lv*0.25);

      if(zone.type==="ind"){
        fProd *= mod.industrialProdMod;
        fPoll *= mod.industrialPollutionMod;
        fPoll += (mod.industrialPollutionExtra||0);
      }
      if(zone.type==="agr") fProd *= mod.agricultureProdMod;

      if(zone.type!=="none"){
        powerUse += zone.power*(1+lv*0.2);
        waterUse += zone.water*(1+lv*0.2);
        trafficLoad += (zone.type==="ind"?3:zone.type==="com"?2:1)*(1+lv*0.2);
      }

      totalHousing += fHousing;
      totalJobs    += fJobs;
      totalProd    += fProd;
      totalPoll    += fPoll;
      totalMaint   += maint;

      const taxBase = (fHousing*0.4 + fJobs*1.2 + fProd*0.8)/12;
      if(zone.type==="res") baseTaxRes += taxBase;
      else if(zone.type==="com") baseTaxCom += taxBase;
      else if(zone.type==="ind") baseTaxInd += taxBase;
    });
  });

  // Vergi oranları
  const tr = state.taxes.residential/100;
  const tc = state.taxes.commercial/100;
  const ti = state.taxes.industrial/100;

  let taxIncome = baseTaxRes*tr + baseTaxCom*tc + baseTaxInd*ti;
  taxIncome *= mod.taxGlobalMod || 1.0;
  taxIncome *= mod.industrialTaxMod || 1.0;

  totalProd *= mod.prodGlobalMod || 1.0;
  totalProd *= WeatherSystem.prodMod();

  totalMaint *= mod.maintMod || 1.0;

  // Politika + altyapı bakım maliyeti
  let polUpkeep=0;
  for(const id in POLICIES){
    if(!state.policiesActive[id]) continue;
    polUpkeep += POLICIES[id].upkeep;
  }
  let infraUpkeep=0;
  for(const id in INFRASTRUCTURE){
    if(!state.infraBuilt[id]) continue;
    infraUpkeep += INFRASTRUCTURE[id].upkeep;
  }

  const maintenanceCost = totalMaint + polUpkeep + infraUpkeep;
  const prodIncome = totalProd*1.1;
  const totalIncome = taxIncome + prodIncome;
  const net = totalIncome - maintenanceCost;

  state.money += net;
  state.environment += totalPoll*0.03 + (mod.pollutionGlobal||0);

  // Enerji / su kapasitesi
  state.powerCap = 220 + mod.powerCapacityBonus;
  state.waterCap = 220 + mod.waterCapacityBonus;

  state.powerUsed = powerUse*mod.powerUsageMod;
  state.waterUsed = waterUse;

  state.traffic = trafficLoad + (mod.trafficGlobal||0);

  // Nüfus
  const prevPop = state.population;
  const energyRatio = state.powerCap>0 ? clamp(state.powerCap/Math.max(state.powerUsed,1),0.4,1.2) : 0.5;
  const waterRatio  = state.waterCap>0 ? clamp(state.waterCap/Math.max(state.waterUsed,1),0.4,1.2) : 0.5;
  const infraRatio = Math.min(energyRatio, waterRatio);
  const moodFactor = clamp(state.happiness/80, 0.5, 1.5);
  let targetPop = totalHousing * 0.9 * moodFactor * infraRatio;

  const trafficImpact = clamp(1 - (state.traffic/140), 0.5, 1.1);
  targetPop *= trafficImpact;

  state.population += (targetPop - state.population)*0.18;

  const jobsAvail = totalJobs*0.95;
  const employed  = Math.min(jobsAvail, state.population);
  const unemployed= Math.max(0, state.population - employed);
  const empRate   = state.population>0 ? (employed/state.population)*100 : 0;

  state.employmentRate = empRate;
  state.unemployed = unemployed;

  state.lastTurn.taxIncome = taxIncome;
  state.lastTurn.prodIncome = prodIncome;
  state.lastTurn.maintCost  = maintenanceCost;
  state.lastTurn.net        = net;
  state.lastTurn.popDelta   = state.population - prevPop;
}

// Mutluluk
function simulateHappiness(state){
  const mod = aggregateModifiers(state);
  let delta = 0;

  const unempRate = state.population>0 ? (state.unemployed/state.population)*100 : 0;
  if(unempRate>10) delta -= (unempRate-10)*0.12;

  if(state.environment<-15) delta -= 3;
  else if(state.environment<0) delta -= 1;
  else if(state.environment>25) delta += 3;
  else if(state.environment>5) delta += 1;

  if(state.traffic>75) delta -= 4;
  else if(state.traffic>45) delta -= 2;

  if(state.powerUsed>state.powerCap) delta -= 4;
  if(state.waterUsed>state.waterCap) delta -= 3;

  delta += WeatherSystem.mood();
  delta += mod.happinessGlobal||0;

  const avgTax = (state.taxes.residential+state.taxes.commercial+state.taxes.industrial)/3;
  if(avgTax>20) delta -= (avgTax-20)*0.2;
  else if(avgTax<8) delta += (8-avgTax)*0.15;

  state.happiness = clamp(state.happiness + delta, 0, 100);
  state.lastTurn.happyDelta = delta;
}

// Afetler
function rollDisasters(state){
  const mod = aggregateModifiers(state);
  DISASTERS.forEach(d=>{
    let chance = d.baseChance * WeatherSystem.disasterMod();
    if(d.id==="fire")      chance *= mod.fireRiskMod || 1.0;
    if(d.id==="flood")     chance *= mod.floodRiskMod || 1.0;
    if(d.id==="epidemic")  chance *= mod.epidemicRiskMod || 1.0;

    chance *= 1 + state.population/7000;

    if(rand()<chance) applyDisaster(state,d);
  });
}

function applyDisaster(state,d){
  let msg = `${d.name} şehri vurdu! `;
  state.money -= d.moneyLoss;
  state.happiness = clamp(state.happiness + d.moodDelta,0,100);

  if(d.tilesHit>0){
    for(let i=0;i<d.tilesHit;i++){
      const x = randInt(0, MAP_WIDTH-1);
      const y = randInt(0, MAP_HEIGHT-1);
      const tile = state.map[y][x];
      if(tile.zone==="empty") continue;
      if(tile.level>0 && rand()<0.5){
        tile.level--;
        msg += ` ${String.fromCharCode(65+y)}${x+1} hasar aldı (seviye düştü).`;
      }else{
        tile.zone="empty";
        tile.level=0;
        tile.pollution=0;
        msg += ` ${String.fromCharCode(65+y)}${x+1} tamamen yıkıldı.`;
      }
    }
  }else{
    const loss = state.population*0.05;
    state.population = Math.max(0,state.population-loss);
    msg += `Nüfus ${loss.toFixed(0)} kişi azaldı.`;
  }
  addLog(msg,"bad");
}

// Görev kontrolü
function checkMissions(state){
  if(!state.missions) state.missions={};
  MISSIONS.forEach(m=>{
    if(state.missions[m.id]==="done") return;
    const ok = m.check(state);
    if(ok && state.missions[m.id]!=="done"){
      state.missions[m.id]="done";
      state.money += m.reward.money || 0;
      if(m.reward.happiness) state.happiness = clamp(state.happiness + m.reward.happiness,0,100);
      addLog(`Görev tamamlandı: ${m.title} (+₺${m.reward.money || 0})`,"good");
    }else if(state.missions[m.id]!=="active"){
      state.missions[m.id]="active";
    }
  });
}

// ==== TURU BİTİR ====
function endTurn(){
  const s = Game.state;
  s.day++;
  WeatherSystem.roll(s);
  simulateEconomyAndPopulation(s);
  simulateHappiness(s);
  rollDisasters(s);
  checkMissions(s);

  // tarihsel istatistik
  s.statsHistory.push({
    day:s.day,
    money:s.money,
    pop:s.population,
    happy:s.happiness,
    env:s.environment
  });
  if(s.statsHistory.length>200) s.statsHistory.shift();

  // autosave
  if(s.day%5===0){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){}
  }

  renderAll();
}

// ==== UI: HARİTA ====
function renderMap(){
  const container = document.getElementById("mapContainer");
  container.innerHTML = "";
  const s = Game.state;

  for(let y=0;y<MAP_HEIGHT;y++){
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("map-row");
    for(let x=0;x<MAP_WIDTH;x++){
      const tile = s.map[y][x];
      const zone = ZONES[tile.zone] || ZONES.empty;

      const cell = document.createElement("div");
      cell.classList.add("map-cell");
      if(Game.selectedTile && Game.selectedTile.x===x && Game.selectedTile.y===y){
        cell.classList.add("selected");
      }

      const label = document.createElement("div");
      label.classList.add("cell-label");
      label.textContent = String.fromCharCode(65+y)+(x+1);

      const zoneDiv = document.createElement("div");
      zoneDiv.classList.add("cell-zone");
      let short="–";
      if(zone.id==="residential") short="R";
      else if(zone.id==="commercial") short="C";
      else if(zone.id==="industrial") short="I";
      else if(zone.id==="agriculture") short="A";
      else if(zone.id==="forest") short="F";
      else if(zone.id==="park") short="P";
      else if(zone.id==="utility") short="U";
      zoneDiv.textContent = short + (tile.zone!=="empty" ? " Lv"+tile.level : "");
      zoneDiv.classList.add("zone-"+zone.id);

      cell.appendChild(label);
      cell.appendChild(zoneDiv);

      cell.addEventListener("click",()=>{
        Game.selectedTile = {x,y};
        renderTileDetails();
        renderMap();
      });

      rowDiv.appendChild(cell);
    }
    container.appendChild(rowDiv);
  }
}

// ==== UI: KARO DETAY ====
function renderTileDetails(){
  const cont = document.getElementById("selectedTileDetails");
  const s = Game.state;
  if(!Game.selectedTile){
    cont.textContent = "Haritadan bir kareye tıkla.";
    return;
  }
  const {x,y} = Game.selectedTile;
  const tile = s.map[y][x];
  const zone = ZONES[tile.zone] || ZONES.empty;

  const housing = zone.housing*(1+tile.level*0.4);
  const jobs    = zone.jobs*(1+tile.level*0.5);
  const prod    = zone.prod*(1+tile.level*0.6);
  const poll    = zone.pollution + tile.level*2;

  cont.innerHTML = `
    <h3>Kare: ${String.fromCharCode(65+y)}${x+1}</h3>
    <div class="tile-meta">
      Bölge: <strong>${zone.name}</strong> ${tile.zone!=="empty" ? "(Seviye "+tile.level+")" : ""}
    </div>
    <div class="tile-stats">
      Barınma Kapasitesi: <strong>${housing.toFixed(0)}</strong><br>
      İş Kapasitesi: <strong>${jobs.toFixed(0)}</strong><br>
      Günlük Üretim: <strong>${prod.toFixed(0)}</strong><br>
      Yerel Kirlilik: <strong>${poll}</strong>
    </div>
    <div class="tile-stats">
      Toplam Bölgeler — 
      Konut ${countZone(s,"residential")},
      Ticari ${countZone(s,"commercial")},
      Sanayi ${countZone(s,"industrial")},
      Tarım ${countZone(s,"agriculture")},
      Orman ${countZone(s,"forest")},
      Park ${countZone(s,"park")}
    </div>
    <div class="tile-actions">
      ${tile.zone!=="residential"?`<button class="btn" data-action="setZone" data-zone="residential">Konut</button>`:""}
      ${tile.zone!=="commercial"?`<button class="btn" data-action="setZone" data-zone="commercial">Ticari</button>`:""}
      ${tile.zone!=="industrial"?`<button class="btn" data-action="setZone" data-zone="industrial">Sanayi</button>`:""}
      ${tile.zone!=="agriculture"?`<button class="btn" data-action="setZone" data-zone="agriculture">Tarım</button>`:""}
      ${tile.zone!=="forest"?`<button class="btn" data-action="setZone" data-zone="forest">Orman</button>`:""}
      ${tile.zone!=="park"?`<button class="btn" data-action="setZone" data-zone="park">Park</button>`:""}
      ${tile.zone!=="utility"?`<button class="btn" data-action="setZone" data-zone="utility">Altyapı Alanı</button>`:""}
      ${tile.zone!=="empty"?`<button class="btn btn-ghost" data-action="bulldoze">Boşalt</button>`:""}
      ${tile.zone!=="empty"?`<button class="btn btn-primary" data-action="upgrade">Yükselt (₺${1000+tile.level*900})</button>`:""}
    </div>
  `;

  cont.querySelectorAll("button[data-action]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const action = btn.getAttribute("data-action");
      if(action==="setZone") setTileZone(x,y,btn.getAttribute("data-zone"));
      else if(action==="upgrade") upgradeTile(x,y);
      else if(action==="bulldoze") bulldozeTile(x,y);
    });
  });
}

// Alan işlemleri
function setTileZone(x,y,zoneId){
  const s = Game.state;
  const tile = s.map[y][x];
  const zone = ZONES[zoneId];
  if(!zone) return;
  const cost = 600;
  if(s.money<cost){
    addLog(`Yetersiz bakiye: Bölge için en az ₺${cost} gerekir.`,"bad");
    return;
  }
  s.money -= cost;
  tile.zone = zoneId;
  tile.level = 0;
  tile.pollution=0;
  addLog(`${String.fromCharCode(65+y)}${x+1} alanı ${zone.name} bölgesine dönüştürüldü. (₺${cost})`,"info");
  renderAll();
}

function upgradeTile(x,y){
  const s = Game.state;
  const tile = s.map[y][x];
  if(tile.zone==="empty") return;
  if(tile.level>=3){
    addLog("Bu alan azami seviyeye ulaşmış.","warning");
    return;
  }
  const cost = 1000 + tile.level*900;
  if(s.money<cost){
    addLog(`Yetersiz bakiye: Yükseltme için ₺${cost} gerekir.`,"bad");
    return;
  }
  s.money -= cost;
  tile.level++;
  addLog(`${String.fromCharCode(65+y)}${x+1} alanı seviye ${tile.level} oldu. (₺${cost})`,"good");
  renderAll();
}

function bulldozeTile(x,y){
  const s = Game.state;
  const tile = s.map[y][x];
  if(tile.zone==="empty") return;
  tile.zone="empty";
  tile.level=0;
  tile.pollution=0;
  addLog(`${String.fromCharCode(65+y)}${x+1} alanı boşaltıldı.`,"neutral");
  renderAll();
}

// ==== UI: STATS ====
function renderStats(){
  const s = Game.state;

  document.getElementById("dayDisplay").textContent = s.day;
  document.getElementById("seasonDisplay").textContent = SEASONS[Game.currentSeasonIndex];
  document.getElementById("weatherDisplay").textContent = Game.currentWeather.name;

  document.getElementById("moneyDisplay").textContent = "₺ " + Math.round(s.money).toLocaleString("tr-TR");
  document.getElementById("populationDisplay").textContent = Math.round(s.population).toLocaleString("tr-TR");
  document.getElementById("employmentDisplay").textContent =
    `${s.employmentRate? s.employmentRate.toFixed(1):"0"}% (işsiz ${Math.round(s.unemployed||0).toLocaleString("tr-TR")})`;

  let envLabel="Dengeli";
  if(s.environment<-20) envLabel="Ağır Kirli";
  else if(s.environment<0) envLabel="Kirli";
  else if(s.environment>20) envLabel="Çok Temiz";
  else if(s.environment>0) envLabel="Temiz";

  document.getElementById("environmentDisplay").textContent = envLabel;

  let trafficLabel="Akıcı";
  if(s.traffic>75) trafficLabel="Kilit";
  else if(s.traffic>45) trafficLabel="Yoğun";
  else if(s.traffic>25) trafficLabel="Orta";

  document.getElementById("trafficDisplay").textContent = trafficLabel;

  document.getElementById("powerDisplay").textContent = `${s.powerUsed.toFixed(0)} / ${s.powerCap.toFixed(0)}`;
  document.getElementById("waterDisplay").textContent = `${s.waterUsed.toFixed(0)} / ${s.waterCap.toFixed(0)}`;
  document.getElementById("happinessDisplay").textContent = `${s.happiness.toFixed(1)}%`;

  const t = s.lastTurn;
  document.getElementById("taxIncomeDisplay").textContent = "₺ " + t.taxIncome.toFixed(0);
  document.getElementById("productionIncomeDisplay").textContent = "₺ " + t.prodIncome.toFixed(0);
  document.getElementById("maintenanceCostDisplay").textContent = "₺ " + t.maintCost.toFixed(0);
  document.getElementById("netIncomeDisplay").textContent = "₺ " + t.net.toFixed(0);

  const tr = document.getElementById("taxResidential");
  const tc = document.getElementById("taxCommercial");
  const ti = document.getElementById("taxIndustrial");
  tr.value = s.taxes.residential;
  tc.value = s.taxes.commercial;
  ti.value = s.taxes.industrial;
  document.getElementById("taxResidentialValue").textContent = s.taxes.residential;
  document.getElementById("taxCommercialValue").textContent = s.taxes.commercial;
  document.getElementById("taxIndustrialValue").textContent = s.taxes.industrial;

  document.getElementById("turnSummary").textContent =
    `Son Tur: Gelir ₺${(t.taxIncome+t.prodIncome).toFixed(0)} | Gider ₺${t.maintCost.toFixed(0)} | Net ₺${t.net.toFixed(0)} | Nüfus Δ ${t.popDelta.toFixed(0)} | Mutluluk Δ ${t.happyDelta.toFixed(1)}`;
}

// ==== UI: POLİTİKA / İNFRA / RESEARCH / MISSION ====
function renderPolicies(){
  const s = Game.state;
  const container = document.getElementById("policiesContainer");
  container.innerHTML = "";
  for(const id in POLICIES){
    const p = POLICIES[id];
    const card = document.createElement("div");
    card.classList.add("policy-card");
    if(s.policiesActive[id]) card.classList.add("policy-active");
    card.innerHTML = `
      <div class="policy-title">${p.name}</div>
      <div class="policy-desc">${p.desc}</div>
      <div class="policy-status">
        Günlük Maliyet: ₺${p.upkeep} | Durum: <strong>${s.policiesActive[id]?"Aktif":"Pasif"}</strong>
      </div>
    `;
    card.addEventListener("click",()=>{
      if(s.policiesActive[id]) s.policiesActive[id]=false;
      else s.policiesActive[id]=true;
      addLog(`${p.name} ${s.policiesActive[id]?"aktifleştirildi.":"kapatıldı."}`, s.policiesActive[id]?"good":"warning");
      renderAll();
    });
    container.appendChild(card);
  }
}

function renderInfrastructure(){
  const s = Game.state;
  const cont = document.getElementById("infrastructureContainer");
  cont.innerHTML = "";
  for(const id in INFRASTRUCTURE){
    const inf = INFRASTRUCTURE[id];
    const active = !!s.infraBuilt[id];
    const card = document.createElement("div");
    card.classList.add("infra-card");
    if(active) card.classList.add("infra-active");
    card.innerHTML = `
      <div class="infra-title">${inf.name}</div>
      <div class="infra-desc">${inf.desc}</div>
      <div class="infra-status">
        Yapım: ₺${inf.buildCost} | Günlük: ₺${inf.upkeep} | <strong>${active?"Kurulu":"Kurulmamış"}</strong>
      </div>
    `;
    card.addEventListener("click",()=>{
      if(active){
        addLog(`${inf.name} zaten kurulu.`,"warning");
        return;
      }
      if(s.money<inf.buildCost){
        addLog(`Yetersiz bakiye: ${inf.name} için ₺${inf.buildCost} gerekir.`,"bad");
        return;
      }
      s.money -= inf.buildCost;
      s.infraBuilt[id]=true;
      addLog(`${inf.name} inşa edildi. Şehir kapasiten gelişti.`,"good");
      renderAll();
    });
    cont.appendChild(card);
  }
}

function renderResearch(){
  const s = Game.state;
  const cont = document.getElementById("researchContainer");
  cont.innerHTML = "";
  for(const id in RESEARCH){
    const r = RESEARCH[id];
    const done = !!s.researchDone[id];

    const reqOK = (r.requires||[]).every(reqId=> s.researchDone[reqId]);
    const card = document.createElement("div");
    card.classList.add("research-card");
    if(done) card.classList.add("research-done");

    const reqText = (r.requires||[]).length>0
      ? "Gereken: " + r.requires.map(reqId=> RESEARCH[reqId]?.name || reqId).join(", ")
      : "Gereken: Yok";

    card.innerHTML = `
      <div class="research-title">${r.name}</div>
      <div class="research-desc">${r.desc}</div>
      <div class="research-status">
        Maliyet: ₺${r.cost} | Durum: <strong>${done?"Tamamlandı": reqOK?"Araştırılabilir":"Kilitli"}</strong><br>
        <span>${reqText}</span>
      </div>
    `;

    card.addEventListener("click",()=>{
      if(done){ addLog(`${r.name} zaten araştırıldı.`,"warning"); return; }
      if(!reqOK){ addLog(`${r.name} için önce ön koşullarını tamamlamalısın.`,"warning"); return; }
      if(s.money<r.cost){ addLog(`Yetersiz bakiye: ${r.name} için ₺${r.cost} gerekir.`,"bad"); return; }
      s.money -= r.cost;
      s.researchDone[id]=true;
      addLog(`${r.name} araştırması tamamlandı. Etkileri devrede.`,"good");
      renderAll();
    });

    cont.appendChild(card);
  }
}

function renderMissions(){
  const s = Game.state;
  const cont = document.getElementById("missionsContainer");
  cont.innerHTML = "";
  MISSIONS.forEach(m=>{
    const status = s.missions[m.id] || "inactive";
    const div = document.createElement("div");
    div.classList.add("mission-item");
    if(status==="done") div.classList.add("mission-done");
    div.innerHTML = `
      <div class="mission-title">${m.title}</div>
      <div class="mission-desc">${m.desc}</div>
      <div class="mission-status">
        Durum: <strong>${status==="done"?"Tamamlandı": status==="active"?"Aktif":"Beklemede"}</strong>
      </div>
    `;
    cont.appendChild(div);
  });
}

// ==== GENEL RENDER ====
function renderAll(){
  renderMap();
  renderTileDetails();
  renderStats();
  renderPolicies();
  renderInfrastructure();
  renderResearch();
  renderMissions();
}

// ==== EVENT BIND ====
function bindUI(){
  document.getElementById("btnEndTurn").addEventListener("click", endTurn);
  document.getElementById("btnNewGame").addEventListener("click",()=>{
    if(confirm("Yeni oyun başlatılsın mı? (Kaydedilmemiş ilerleme kaybolur)")){
      Game.state = defaultState();
      Game.selectedTile = null;
      Game.currentWeather = WEATHER_TYPES[0];
      Game.currentSeasonIndex = 0;
      addLog("Yeni şehir kurulumuna başlandı.","info");
      renderAll();
    }
  });
  document.getElementById("btnSave").addEventListener("click", saveGame);
  document.getElementById("btnLoad").addEventListener("click", loadGame);
  document.getElementById("btnReset").addEventListener("click",()=>{
    if(confirm("Kayıtlı oyunu tamamen silmek istiyor musun?")){
      resetSave();
    }
  });
  document.getElementById("btnClearLog").addEventListener("click",()=>{
    logContainer().innerHTML="";
  });

  document.getElementById("taxResidential").addEventListener("input",e=>{
    Game.state.taxes.residential = parseInt(e.target.value,10);
    renderStats();
  });
  document.getElementById("taxCommercial").addEventListener("input",e=>{
    Game.state.taxes.commercial = parseInt(e.target.value,10);
    renderStats();
  });
  document.getElementById("taxIndustrial").addEventListener("input",e=>{
    Game.state.taxes.industrial = parseInt(e.target.value,10);
    renderStats();
  });
}

// ==== INIT ====
document.addEventListener("DOMContentLoaded",()=>{
  Game.state = defaultState();
  Game.currentWeather = WEATHER_TYPES[0];
  Game.currentSeasonIndex = 0;
  bindUI();
  addLog("Okan City Builder'a hoş geldin. Birkaç konut ve ticari alan kurup ilk görevi tamamla.","info");
  renderAll();
});
