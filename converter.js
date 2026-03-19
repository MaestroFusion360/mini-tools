import { byId, setLabelText, setSelectOptionText, setText } from "./dom.js";
import { registerTranslationApplier, getLanguage, t } from "./i18n.js";
import { formatNumber } from "./utils.js";

const unitLabels = {
  en: {
    length: {
      m: "m",
      km: "km",
      cm: "cm",
      mm: "mm",
      in: "inch",
      ft: "ft",
      yd: "yd",
      mile: "mile",
      nmi: "nautical mile",
    },
    area: {
      m2: "m²",
      km2: "km²",
      cm2: "cm²",
      mm2: "mm²",
      ft2: "ft²",
      yd2: "yd²",
      acre: "acre",
      ha: "ha",
    },
    volume: { l: "l", ml: "ml", m3: "m³", cm3: "cm³", gal: "gal", qt: "qt" },
    weight: { kg: "kg", g: "g", mg: "mg", t: "t", lb: "lb", oz: "oz" },
    speed: {
      "m/s": "m/s",
      "km/h": "km/h",
      mph: "mph",
      knot: "knot",
      mach: "Mach",
    },
    temperature: { C: "°C", F: "°F", K: "K" },
    pressure: {
      pa: "Pa",
      kpa: "kPa",
      bar: "bar",
      atm: "atm",
      psi: "psi",
      mmhg: "mmHg",
    },
    energy: {
      j: "J",
      kj: "kJ",
      cal: "cal",
      kcal: "kcal",
      wh: "Wh",
      kwh: "kWh",
    },
  },
  ru: {
    length: {
      m: "м",
      km: "км",
      cm: "см",
      mm: "мм",
      in: "дюйм",
      ft: "фут",
      yd: "ярд",
      mile: "миля",
      nmi: "мор. миля",
    },
    area: {
      m2: "м²",
      km2: "км²",
      cm2: "см²",
      mm2: "мм²",
      ft2: "ft²",
      yd2: "yd²",
      acre: "акр",
      ha: "га",
    },
    volume: { l: "л", ml: "мл", m3: "м³", cm3: "см³", gal: "gal", qt: "qt" },
    weight: { kg: "кг", g: "г", mg: "мг", t: "т", lb: "lb", oz: "oz" },
    speed: {
      "m/s": "м/с",
      "km/h": "км/ч",
      mph: "mph",
      knot: "уз",
      mach: "Mach",
    },
    temperature: { C: "°C", F: "°F", K: "K" },
    pressure: {
      pa: "Па",
      kpa: "кПа",
      bar: "бар",
      atm: "атм",
      psi: "psi",
      mmhg: "мм рт. ст.",
    },
    energy: {
      j: "Дж",
      kj: "кДж",
      cal: "кал",
      kcal: "ккал",
      wh: "Вт⋅ч",
      kwh: "кВт⋅ч",
    },
  },
};

const unitData = {
  length: {
    m: 1,
    km: 0.001,
    cm: 100,
    mm: 1000,
    in: 39.3700787402,
    ft: 3.280839895,
    yd: 1.0936132983,
    mile: 0.0006213711922,
    nmi: 0.000539956803,
  },
  area: {
    m2: 1,
    km2: 0.000001,
    cm2: 10000,
    mm2: 1000000,
    ft2: 10.763910417,
    yd2: 1.195990046,
    acre: 0.000247105381,
    ha: 0.0001,
  },
  volume: {
    l: 1,
    ml: 1000,
    m3: 0.001,
    cm3: 1000,
    gal: 0.2641720524,
    qt: 1.0566882094,
  },
  weight: {
    kg: 1,
    g: 1000,
    mg: 1000000,
    t: 0.001,
    lb: 2.2046226218,
    oz: 35.27396195,
  },
  speed: {
    "m/s": 1,
    "km/h": 3.6,
    mph: 2.2369362921,
    knot: 1.9438444924,
    mach: 0.0029154519,
  },
  temperature: { C: "C", F: "F", K: "K" },
  pressure: {
    pa: 1,
    kpa: 0.001,
    bar: 0.00001,
    atm: 0.0000098692326672,
    psi: 0.00014503773773,
    mmhg: 0.007500616827,
  },
  energy: {
    j: 1,
    kj: 0.001,
    cal: 0.23900573614,
    kcal: 0.00023900573614,
    wh: 0.00027777777778,
    kwh: 2.7777777778e-7,
  },
};

const converterPresets = {
  length: [
    ["m", "ft"],
    ["km", "mile"],
    ["mile", "km"],
  ],
  area: [
    ["m2", "ft2"],
    ["ha", "acre"],
  ],
  volume: [
    ["l", "gal"],
    ["m3", "l"],
  ],
  weight: [
    ["kg", "lb"],
    ["g", "oz"],
  ],
  speed: [
    ["km/h", "m/s"],
    ["mph", "km/h"],
  ],
  temperature: [
    ["C", "F"],
    ["F", "C"],
    ["C", "K"],
  ],
  pressure: [
    ["bar", "psi"],
    ["atm", "mmhg"],
  ],
  energy: [
    ["kj", "kcal"],
    ["kwh", "kj"],
  ],
};

function unitText(type, key) {
  const labels = unitLabels[getLanguage()]?.[type] || unitLabels.en[type] || {};
  return `${key} (${labels[key] || key})`;
}

function renderConverterPresets(type) {
  const holder = byId("conv-presets");
  holder.innerHTML = "";
  (converterPresets[type] || []).forEach(([from, to]) => {
    const labels =
      unitLabels[getLanguage()]?.[type] || unitLabels.en[type] || {};
    const btn = document.createElement("button");
    btn.className = "preset-chip";
    btn.type = "button";
    btn.textContent = `${labels[from] || from} → ${labels[to] || to}`;
    btn.onclick = () => {
      byId("conv-from").value = from;
      byId("conv-to").value = to;
      convertUnit();
    };
    holder.appendChild(btn);
  });
}

export function updateConvUnits() {
  const type = byId("conv-type").value;
  const fromSel = byId("conv-from");
  const toSel = byId("conv-to");
  fromSel.innerHTML = "";
  toSel.innerHTML = "";

  Object.keys(unitData[type]).forEach((u) => {
    fromSel.add(new Option(unitText(type, u), u));
    toSel.add(new Option(unitText(type, u), u));
  });

  const defaults = {
    length: ["m", "km"],
    area: ["m2", "ha"],
    volume: ["l", "gal"],
    weight: ["kg", "lb"],
    speed: ["km/h", "m/s"],
    temperature: ["C", "F"],
    pressure: ["bar", "psi"],
    energy: ["kj", "kcal"],
  };

  fromSel.value = defaults[type][0];
  toSel.value = defaults[type][1];
  renderConverterPresets(type);
  convertUnit();
}

export function swapConvUnits() {
  const fromSel = byId("conv-from");
  const toSel = byId("conv-to");
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  convertUnit();
}

function formatSmart(n, precision = 6) {
  if (!isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1000000 || abs < 0.000001)
    return n.toExponential(Math.min(precision, 8));
  if (abs >= 1) return formatNumber(n, { maximumFractionDigits: precision });
  return formatNumber(n, {
    maximumFractionDigits: Math.min(precision + 2, 12),
  });
}

export function convertUnit() {
  const type = byId("conv-type").value;
  const from = byId("conv-from").value;
  const to = byId("conv-to").value;
  const val = parseFloat(byId("conv-val").value) || 0;
  const precision = parseInt(byId("conv-precision").value, 10) || 6;
  byId("conv-precision-value").textContent = precision;
  let res;

  if (type === "temperature") {
    let c;
    if (from === "C") c = val;
    else if (from === "F") c = ((val - 32) * 5) / 9;
    else c = val - 273.15;
    if (to === "C") res = c;
    else if (to === "F") res = (c * 9) / 5 + 32;
    else res = c + 273.15;
  } else {
    const base = val / unitData[type][from];
    res = base * unitData[type][to];
  }

  const reverseRate = val !== 0 ? res / val : null;
  const labels = unitLabels[getLanguage()]?.[type] || unitLabels.en[type] || {};
  byId("conv-result").innerHTML =
    `${formatSmart(val, precision)} ${labels[from] || from}<br>` +
    `= ${formatSmart(res, precision)} ${labels[to] || to}` +
    (reverseRate !== null
      ? `<br><span class="small-text">${t("rateLabel")}: 1 ${labels[from] || from} = ${formatSmart(reverseRate, precision)} ${labels[to] || to}</span>`
      : "");
}

function applyConverterTranslations() {
  setText("title-converter", t("converterTitle"));
  setLabelText("conv-precision", t("precision"));
  setSelectOptionText("conv-type", "length", t("length"));
  setSelectOptionText("conv-type", "area", t("area"));
  setSelectOptionText("conv-type", "volume", t("volume"));
  setSelectOptionText("conv-type", "weight", t("weight"));
  setSelectOptionText("conv-type", "speed", t("speed"));
  setSelectOptionText("conv-type", "temperature", t("temperature"));
  setSelectOptionText("conv-type", "pressure", t("pressure"));
  setSelectOptionText("conv-type", "energy", t("energy"));
  updateConvUnits();
}

export function initConverter() {
  registerTranslationApplier(applyConverterTranslations);
  updateConvUnits();
}
