import { byId, setLabelText, setSelectOptionText, setText } from "../core/dom.js";
import { getLanguage, registerTranslationApplier, t } from "../core/i18n.js";
import { formatNumber } from "../core/utils.js";

const TYPE_KEYS = [
  "length",
  "area",
  "volume",
  "weight",
  "speed",
  "temperature",
  "pressure",
  "energy",
  "data",
  "power",
  "time",
  "angle",
];

const TYPE_LABEL_KEYS = {
  length: "length",
  area: "area",
  volume: "volume",
  weight: "weight",
  speed: "speed",
  temperature: "temperature",
  pressure: "pressure",
  energy: "energy",
  data: "dataUnits",
  power: "powerUnits",
  time: "timeUnits",
  angle: "angleUnits",
};

const DEFAULT_TYPE = "length";
const DEFAULT_PRECISION = 6;
const PRECISION_MIN = 2;
const PRECISION_MAX = 12;
let converterInitialized = false;

const IDS = {
  type: "conv-type",
  value: "conv-val",
  precision: "conv-precision",
  precisionValue: "conv-precision-value",
  from: "conv-from",
  to: "conv-to",
  presets: "conv-presets",
  result: "conv-result",
};

const UNIT_DEFS = {
  length: {
    mode: "factor",
    defaults: ["m", "km"],
    presets: [
      ["m", "ft"],
      ["km", "mile"],
      ["mile", "km"],
    ],
    units: {
      m: { unitsPerBase: 1, labels: { en: "m", ru: "м" } },
      km: { unitsPerBase: 0.001, labels: { en: "km", ru: "км" } },
      cm: { unitsPerBase: 100, labels: { en: "cm", ru: "см" } },
      mm: { unitsPerBase: 1000, labels: { en: "mm", ru: "мм" } },
      in: { unitsPerBase: 39.3700787402, labels: { en: "inch", ru: "дюйм" } },
      ft: { unitsPerBase: 3.280839895, labels: { en: "ft", ru: "фут" } },
      yd: { unitsPerBase: 1.0936132983, labels: { en: "yd", ru: "ярд" } },
      mile: { unitsPerBase: 0.0006213711922, labels: { en: "mile", ru: "миля" } },
      nmi: { unitsPerBase: 0.000539956803, labels: { en: "nautical mile", ru: "мор. миля" } },
    },
  },
  area: {
    mode: "factor",
    defaults: ["m2", "ha"],
    presets: [
      ["m2", "ft2"],
      ["ha", "acre"],
    ],
    units: {
      m2: { unitsPerBase: 1, labels: { en: "m²", ru: "м²" } },
      km2: { unitsPerBase: 0.000001, labels: { en: "km²", ru: "км²" } },
      cm2: { unitsPerBase: 10000, labels: { en: "cm²", ru: "см²" } },
      mm2: { unitsPerBase: 1000000, labels: { en: "mm²", ru: "мм²" } },
      ft2: { unitsPerBase: 10.763910417, labels: { en: "ft²", ru: "ft²" } },
      yd2: { unitsPerBase: 1.195990046, labels: { en: "yd²", ru: "yd²" } },
      acre: { unitsPerBase: 0.000247105381, labels: { en: "acre", ru: "акр" } },
      ha: { unitsPerBase: 0.0001, labels: { en: "ha", ru: "га" } },
    },
  },
  volume: {
    mode: "factor",
    defaults: ["l", "gal"],
    presets: [
      ["l", "gal"],
      ["m3", "l"],
    ],
    units: {
      l: { unitsPerBase: 1, labels: { en: "l", ru: "л" } },
      ml: { unitsPerBase: 1000, labels: { en: "ml", ru: "мл" } },
      m3: { unitsPerBase: 0.001, labels: { en: "m³", ru: "м³" } },
      cm3: { unitsPerBase: 1000, labels: { en: "cm³", ru: "см³" } },
      gal: { unitsPerBase: 0.2641720524, labels: { en: "gal", ru: "gal" } },
      qt: { unitsPerBase: 1.0566882094, labels: { en: "qt", ru: "qt" } },
    },
  },
  weight: {
    mode: "factor",
    defaults: ["kg", "lb"],
    presets: [
      ["kg", "lb"],
      ["g", "oz"],
    ],
    units: {
      kg: { unitsPerBase: 1, labels: { en: "kg", ru: "кг" } },
      g: { unitsPerBase: 1000, labels: { en: "g", ru: "г" } },
      mg: { unitsPerBase: 1000000, labels: { en: "mg", ru: "мг" } },
      t: { unitsPerBase: 0.001, labels: { en: "t", ru: "т" } },
      lb: { unitsPerBase: 2.2046226218, labels: { en: "lb", ru: "lb" } },
      oz: { unitsPerBase: 35.27396195, labels: { en: "oz", ru: "oz" } },
    },
  },
  speed: {
    mode: "factor",
    defaults: ["km/h", "m/s"],
    presets: [
      ["km/h", "m/s"],
      ["mph", "km/h"],
    ],
    units: {
      "m/s": { unitsPerBase: 1, labels: { en: "m/s", ru: "м/с" } },
      "km/h": { unitsPerBase: 3.6, labels: { en: "km/h", ru: "км/ч" } },
      mph: { unitsPerBase: 2.2369362921, labels: { en: "mph", ru: "mph" } },
      knot: { unitsPerBase: 1.9438444924, labels: { en: "knot", ru: "уз" } },
      mach: { unitsPerBase: 0.0029154519, labels: { en: "Mach", ru: "Mach" } },
    },
  },
  temperature: {
    mode: "transform",
    defaults: ["C", "F"],
    presets: [
      ["C", "F"],
      ["F", "C"],
      ["C", "K"],
    ],
    units: {
      C: { labels: { en: "°C", ru: "°C" } },
      F: { labels: { en: "°F", ru: "°F" } },
      K: { labels: { en: "K", ru: "K" } },
    },
    toBase(value, from) {
      if (from === "C") return value;
      if (from === "F") return ((value - 32) * 5) / 9;
      return value - 273.15;
    },
    fromBase(value, to) {
      if (to === "C") return value;
      if (to === "F") return (value * 9) / 5 + 32;
      return value + 273.15;
    },
  },
  pressure: {
    mode: "factor",
    defaults: ["bar", "psi"],
    presets: [
      ["bar", "psi"],
      ["atm", "mmhg"],
    ],
    units: {
      pa: { unitsPerBase: 1, labels: { en: "Pa", ru: "Па" } },
      kpa: { unitsPerBase: 0.001, labels: { en: "kPa", ru: "кПа" } },
      bar: { unitsPerBase: 0.00001, labels: { en: "bar", ru: "бар" } },
      atm: { unitsPerBase: 0.0000098692326672, labels: { en: "atm", ru: "атм" } },
      psi: { unitsPerBase: 0.00014503773773, labels: { en: "psi", ru: "psi" } },
      mmhg: { unitsPerBase: 0.007500616827, labels: { en: "mmHg", ru: "мм рт. ст." } },
    },
  },
  energy: {
    mode: "factor",
    defaults: ["kj", "kcal"],
    presets: [
      ["kj", "kcal"],
      ["kwh", "kj"],
    ],
    units: {
      j: { unitsPerBase: 1, labels: { en: "J", ru: "Дж" } },
      kj: { unitsPerBase: 0.001, labels: { en: "kJ", ru: "кДж" } },
      cal: { unitsPerBase: 0.23900573614, labels: { en: "cal", ru: "кал" } },
      kcal: { unitsPerBase: 0.00023900573614, labels: { en: "kcal", ru: "ккал" } },
      wh: { unitsPerBase: 0.00027777777778, labels: { en: "Wh", ru: "Вт·ч" } },
      kwh: { unitsPerBase: 2.7777777778e-7, labels: { en: "kWh", ru: "кВт·ч" } },
    },
  },
  data: {
    mode: "factor",
    defaults: ["mbit", "mbyte"],
    presets: [
      ["mbit", "mbyte"],
      ["gbit", "gbyte"],
      ["mibit", "mibyte"],
      ["gibit", "gibyte"],
    ],
    units: {
      bit: { unitsPerBase: 1, labels: { en: "bit", ru: "бит" } },
      byte: { unitsPerBase: 0.125, labels: { en: "byte", ru: "байт" } },
      kbit: { unitsPerBase: 0.001, labels: { en: "kilobit", ru: "килобит" } },
      kibit: { unitsPerBase: 1 / 1024, labels: { en: "kibibit", ru: "кибибит" } },
      kbyte: { unitsPerBase: 0.000125, labels: { en: "kilobyte", ru: "килобайт" } },
      kibyte: { unitsPerBase: 1 / 8192, labels: { en: "kibibyte", ru: "кибибайт" } },
      mbit: { unitsPerBase: 1e-6, labels: { en: "megabit", ru: "мегабит" } },
      mibit: { unitsPerBase: 1 / (1024 ** 2), labels: { en: "mebibit", ru: "мебибит" } },
      mbyte: { unitsPerBase: 1.25e-7, labels: { en: "megabyte", ru: "мегабайт" } },
      mibyte: { unitsPerBase: 1 / (8 * 1024 ** 2), labels: { en: "mebibyte", ru: "мебибайт" } },
      gbit: { unitsPerBase: 1e-9, labels: { en: "gigabit", ru: "гигабит" } },
      gibit: { unitsPerBase: 1 / (1024 ** 3), labels: { en: "gibibit", ru: "гибибит" } },
      gbyte: { unitsPerBase: 1.25e-10, labels: { en: "gigabyte", ru: "гигабайт" } },
      gibyte: { unitsPerBase: 1 / (8 * 1024 ** 3), labels: { en: "gibibyte", ru: "гибибайт" } },
      tbit: { unitsPerBase: 1e-12, labels: { en: "terabit", ru: "терабит" } },
      tibit: { unitsPerBase: 1 / (1024 ** 4), labels: { en: "tebibit", ru: "тебибит" } },
      tbyte: { unitsPerBase: 1.25e-13, labels: { en: "terabyte", ru: "терабайт" } },
      tibyte: { unitsPerBase: 1 / (8 * 1024 ** 4), labels: { en: "tebibyte", ru: "тебибайт" } },
      pbit: { unitsPerBase: 1e-15, labels: { en: "petabit", ru: "петабит" } },
      pibit: { unitsPerBase: 1 / (1024 ** 5), labels: { en: "pebibit", ru: "пебибит" } },
      pbyte: { unitsPerBase: 1.25e-16, labels: { en: "petabyte", ru: "петабайт" } },
      pibyte: { unitsPerBase: 1 / (8 * 1024 ** 5), labels: { en: "pebibyte", ru: "пебибайт" } },
    },
  },
  power: {
    mode: "factor",
    defaults: ["w", "kw"],
    presets: [
      ["w", "kw"],
      ["kw", "hp"],
      ["w", "btu_min"],
    ],
    units: {
      w: { unitsPerBase: 1, labels: { en: "watt", ru: "ватт" } },
      kw: { unitsPerBase: 0.001, labels: { en: "kilowatt", ru: "киловатт" } },
      hp: { unitsPerBase: 1 / 745.6998715822702, labels: { en: "horsepower (US)", ru: "лошадиная сила (США)" } },
      ftlb_min: { unitsPerBase: 44.253728956635, labels: { en: "foot-pound/min", ru: "фут-фунты в минуту" } },
      btu_min: { unitsPerBase: 0.056869027210884, labels: { en: "BTU/min", ru: "БТЕ/мин" } },
    },
  },
  time: {
    mode: "factor",
    defaults: ["s", "min"],
    presets: [
      ["ms", "s"],
      ["min", "h"],
      ["day", "week"],
      ["day", "year"],
    ],
    units: {
      us: { unitsPerBase: 1000000, labels: { en: "microsecond", ru: "микросекунда" } },
      ms: { unitsPerBase: 1000, labels: { en: "millisecond", ru: "миллисекунда" } },
      s: { unitsPerBase: 1, labels: { en: "second", ru: "секунда" } },
      min: { unitsPerBase: 1 / 60, labels: { en: "minute", ru: "минута" } },
      h: { unitsPerBase: 1 / 3600, labels: { en: "hour", ru: "час" } },
      day: { unitsPerBase: 1 / 86400, labels: { en: "day", ru: "день" } },
      week: { unitsPerBase: 1 / 604800, labels: { en: "week", ru: "неделя" } },
      year: { unitsPerBase: 1 / 31557600, labels: { en: "year", ru: "год" } },
    },
  },
  angle: {
    mode: "factor",
    defaults: ["deg", "rad"],
    presets: [
      ["deg", "rad"],
      ["rad", "deg"],
      ["deg", "grad"],
    ],
    units: {
      deg: { unitsPerBase: 1, labels: { en: "degrees", ru: "градусы" } },
      rad: { unitsPerBase: Math.PI / 180, labels: { en: "radians", ru: "радианы" } },
      grad: { unitsPerBase: 10 / 9, labels: { en: "gradians", ru: "градианы" } },
    },
  },
};

function getElements() {
  return {
    type: byId(IDS.type),
    value: byId(IDS.value),
    precision: byId(IDS.precision),
    precisionValue: byId(IDS.precisionValue),
    from: byId(IDS.from),
    to: byId(IDS.to),
    presets: byId(IDS.presets),
    result: byId(IDS.result),
  };
}

function getTypeDefinition(type) {
  return UNIT_DEFS[type] || UNIT_DEFS[DEFAULT_TYPE];
}

function getCurrentType(elements) {
  const selected = String(elements.type?.value || DEFAULT_TYPE);
  return UNIT_DEFS[selected] ? selected : DEFAULT_TYPE;
}

function getUnitLabel(type, unit) {
  const language = getLanguage();
  const labels = getTypeDefinition(type).units?.[unit]?.labels;
  return labels?.[language] || labels?.en || unit;
}

function getUnitOptionText(type, unit) {
  const label = getUnitLabel(type, unit);
  return label === unit ? unit : `${unit} (${label})`;
}

function setSelectOptions(selectEl, options) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  options.forEach((option) => {
    selectEl.add(new Option(option.label, option.value));
  });
}

function readInputNumber(inputEl) {
  if (!inputEl) return null;
  const raw = String(inputEl.value || "").trim();
  if (raw === "") return null;
  const normalized = raw.replace(",", ".");
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function readPrecision(inputEl) {
  if (!inputEl) return DEFAULT_PRECISION;
  const parsed = Number.parseInt(String(inputEl.value || ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_PRECISION;
  return Math.max(PRECISION_MIN, Math.min(PRECISION_MAX, parsed));
}

function formatSmart(n, precision = DEFAULT_PRECISION) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1000000 || abs < 0.000001) {
    return n.toExponential(Math.min(precision, 8));
  }
  if (abs >= 1) {
    return formatNumber(n, { maximumFractionDigits: precision });
  }
  return formatNumber(n, {
    maximumFractionDigits: Math.min(precision + 2, 12),
  });
}

function convertValue(type, from, to, value) {
  const definition = getTypeDefinition(type);
  if (!definition.units[from] || !definition.units[to]) return null;

  if (definition.mode === "transform") {
    const baseValue = definition.toBase(value, from);
    const result = definition.fromBase(baseValue, to);
    return Number.isFinite(result) ? result : null;
  }

  const fromUnitsPerBase = definition.units[from].unitsPerBase;
  const toUnitsPerBase = definition.units[to].unitsPerBase;
  const baseValue = value / fromUnitsPerBase;
  const result = baseValue * toUnitsPerBase;
  return Number.isFinite(result) ? result : null;
}

function computeConversionModel(type, from, to, value, precision) {
  const result = convertValue(type, from, to, value);
  if (result === null) return null;
  const rate = value !== 0 ? result / value : null;
  return {
    valueText: formatSmart(value, precision),
    resultText: formatSmart(result, precision),
    rateText: rate === null ? null : formatSmart(rate, precision),
    fromLabel: getUnitLabel(type, from),
    toLabel: getUnitLabel(type, to),
  };
}

function renderConversionResult(elements, model) {
  if (!elements.result) return;
  if (!model) {
    elements.result.textContent = "—";
    return;
  }

  const line1 = document.createTextNode(`${model.valueText} ${model.fromLabel}`);
  const line2 = document.createTextNode(`= ${model.resultText} ${model.toLabel}`);
  const fragment = document.createDocumentFragment();
  fragment.append(line1, document.createElement("br"), line2);

  if (model.rateText !== null) {
    const rate = document.createElement("span");
    rate.className = "small-text";
    rate.textContent = `${t("rateLabel")}: 1 ${model.fromLabel} = ${model.rateText} ${model.toLabel}`;
    fragment.append(document.createElement("br"), rate);
  }

  elements.result.replaceChildren(fragment);
}

function applyTypeDefaults(elements, type) {
  const definition = getTypeDefinition(type);
  if (!elements.from || !elements.to) return;
  const availableUnits = Object.keys(definition.units);
  const [defaultFrom, defaultTo] = definition.defaults;
  elements.from.value = availableUnits.includes(defaultFrom)
    ? defaultFrom
    : availableUnits[0];
  elements.to.value = availableUnits.includes(defaultTo)
    ? defaultTo
    : availableUnits[Math.min(1, availableUnits.length - 1)] || availableUnits[0];
}

function ensureValidSelectedUnits(elements, type) {
  const definition = getTypeDefinition(type);
  const availableUnits = Object.keys(definition.units);
  if (!elements.from || !elements.to || !availableUnits.length) return;
  if (!availableUnits.includes(elements.from.value)) {
    elements.from.value = availableUnits[0];
  }
  if (!availableUnits.includes(elements.to.value)) {
    elements.to.value = availableUnits[Math.min(1, availableUnits.length - 1)] || availableUnits[0];
  }
}

function renderConverterPresets(type) {
  const elements = getElements();
  if (!elements.presets || !elements.from || !elements.to) return;
  elements.presets.innerHTML = "";

  const definition = getTypeDefinition(type);
  definition.presets.forEach(([from, to]) => {
    if (!definition.units[from] || !definition.units[to]) return;
    const button = document.createElement("button");
    button.className = "preset-chip";
    button.type = "button";
    button.textContent = `${getUnitLabel(type, from)} → ${getUnitLabel(type, to)}`;
    button.addEventListener("click", () => {
      elements.from.value = from;
      elements.to.value = to;
      convertUnit();
    });
    elements.presets.append(button);
  });
}

function populateUnitSelects(elements, type) {
  const definition = getTypeDefinition(type);
  const options = Object.keys(definition.units).map((unit) => ({
    value: unit,
    label: getUnitOptionText(type, unit),
  }));
  setSelectOptions(elements.from, options);
  setSelectOptions(elements.to, options);
}

export function updateConvUnits() {
  const elements = getElements();
  if (!elements.type || !elements.from || !elements.to) return;
  const type = getCurrentType(elements);
  const definition = getTypeDefinition(type);
  const prevFrom = elements.from.value;
  const prevTo = elements.to.value;

  populateUnitSelects(elements, type);
  if (definition.units[prevFrom] && definition.units[prevTo]) {
    elements.from.value = prevFrom;
    elements.to.value = prevTo;
  } else {
    applyTypeDefaults(elements, type);
  }
  renderConverterPresets(type);
  convertUnit();
}

export function swapConvUnits() {
  const elements = getElements();
  if (!elements.from || !elements.to) return;
  if (!elements.from.value || !elements.to.value) return;
  [elements.from.value, elements.to.value] = [elements.to.value, elements.from.value];
  convertUnit();
}

export function convertUnit() {
  const elements = getElements();
  if (!elements.type || !elements.from || !elements.to) return;

  const type = getCurrentType(elements);
  ensureValidSelectedUnits(elements, type);

  const precision = readPrecision(elements.precision);
  if (elements.precisionValue) elements.precisionValue.textContent = String(precision);

  const value = readInputNumber(elements.value);
  if (value === null) {
    renderConversionResult(elements, null);
    return;
  }

  const model = computeConversionModel(
    type,
    elements.from.value,
    elements.to.value,
    value,
    precision,
  );
  renderConversionResult(elements, model);
}

function applyConverterTranslations() {
  setText("title-converter", t("converterTitle"));
  setLabelText("conv-precision", t("precision"));
  TYPE_KEYS.forEach((key) => {
    setSelectOptionText(IDS.type, key, t(TYPE_LABEL_KEYS[key] || key));
  });
  updateConvUnits();
}

export function initConverter() {
  if (!converterInitialized) {
    registerTranslationApplier(applyConverterTranslations);
    converterInitialized = true;
  }
  updateConvUnits();
}
