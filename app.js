const tg = window.Telegram?.WebApp;

function readInset(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function combineInset(safeVal, contentVal, fullscreen) {
  const s = readInset(safeVal);
  const c = readInset(contentVal);
  if (!fullscreen) return s + c;
  return Math.max(s, c);
}

function applyTelegramSafeArea() {
  if (!tg) return;

  const safe = tg.safeAreaInset || {};
  const content = tg.contentSafeAreaInset || {};
  const fullscreen = Boolean(tg.isFullscreen);
  const root = document.documentElement;

  const top = combineInset(safe.top, content.top, fullscreen);
  const bottom = combineInset(safe.bottom, content.bottom, fullscreen);
  const left = combineInset(safe.left, content.left, fullscreen);
  const right = combineInset(safe.right, content.right, fullscreen);

  root.style.setProperty("--tg-safe-top", `${top}px`);
  root.style.setProperty("--tg-safe-bottom", `${bottom}px`);
  root.style.setProperty("--tg-safe-left", `${left}px`);
  root.style.setProperty("--tg-safe-right", `${right}px`);
}

function initTelegramApp() {
  if (!tg) return;

  const bg = "#060e1a";
  document.body.classList.add("tg-app");

  tg.ready();
  tg.expand();

  if (typeof tg.requestFullscreen === "function") {
    try {
      tg.requestFullscreen();
    } catch (_) {
      /* older clients */
    }
  }

  if (typeof tg.disableVerticalSwipes === "function") {
    tg.disableVerticalSwipes();
  }

  if (typeof tg.setBackgroundColor === "function") {
    tg.setBackgroundColor(bg);
  }
  if (typeof tg.setHeaderColor === "function") {
    tg.setHeaderColor(bg);
  }
  if (typeof tg.setBottomBarColor === "function") {
    tg.setBottomBarColor(bg);
  }

  applyTelegramSafeArea();

  const scheduleSafeArea = () => {
    applyTelegramSafeArea();
    requestAnimationFrame(applyTelegramSafeArea);
  };

  tg.onEvent("contentSafeAreaChanged", scheduleSafeArea);
  tg.onEvent("safeAreaChanged", scheduleSafeArea);
  tg.onEvent("fullscreenChanged", scheduleSafeArea);
  tg.onEvent("viewportChanged", scheduleSafeArea);
}

initTelegramApp();

const langBtn = document.getElementById("lang-btn");
const modeButtons = document.querySelectorAll(".mode-btn");
const timeButtons = document.querySelectorAll(".time-btn");
const pairButton = document.getElementById("pair-button");
const pairFlagsEl = document.getElementById("pair-flags");
const selectedPairEl = document.getElementById("selected-pair");
const pairModal = document.getElementById("pair-modal");
const pairSearch = document.getElementById("pair-search");
const pairList = document.getElementById("pair-list");
const pairEmpty = document.getElementById("pair-empty");
const signalBtn = document.getElementById("signal-btn");
const signalModal = document.getElementById("signal-modal");
const modalPair = document.getElementById("modal-pair");
const modalFlagsEl = document.getElementById("modal-flags");
const modalDirection = document.getElementById("modal-direction");
const modalDirectionText = document.getElementById("modal-direction-text");
const modalDirectionIcon = document.getElementById("modal-direction-icon");
const modalSuccess = document.getElementById("modal-success");
const modalBar = document.getElementById("modal-bar");
const modalExpiration = document.getElementById("modal-expiration");
const modalExpSub = document.getElementById("modal-exp-sub");
const modalMarket = document.getElementById("modal-market");
const modalTime = document.getElementById("modal-time");
const modalGenerate = document.getElementById("modal-generate");
const modalClose = document.getElementById("modal-close");
const signalGenModal = document.getElementById("signal-gen-modal");
const genIcon = document.getElementById("gen-icon");
const genStepLabel = document.getElementById("gen-step-label");
const genProgressBar = document.getElementById("gen-progress-bar");
const genProgressPct = document.getElementById("gen-progress-pct");
const genStepsEl = document.getElementById("gen-steps");
const marketStatusEl = document.getElementById("market-status");
const pairMarketLabel = document.getElementById("pair-market-label");
const i18nEls = document.querySelectorAll("[data-i18n]");

const PAIR_SYMBOLS_REGULAR = [
  "AUD/CHF",
  "EUR/USD",
  "GBP/JPY",
  "USD/CAD",
  "EUR/GBP",
  "USD/JPY",
  "AUD/USD",
  "NZD/USD",
  "EUR/JPY",
  "GBP/USD",
  "USD/CHF",
  "CAD/JPY",
];

/** Extended list for OTC mode */
const PAIR_SYMBOLS_OTC = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "EUR/GBP",
  "EUR/JPY",
  "EUR/CHF",
  "EUR/AUD",
  "EUR/CAD",
  "EUR/NZD",
  "EUR/SEK",
  "EUR/PLN",
  "EUR/TRY",
  "GBP/JPY",
  "GBP/CHF",
  "GBP/AUD",
  "GBP/CAD",
  "GBP/NZD",
  "GBP/SEK",
  "AUD/JPY",
  "AUD/CHF",
  "AUD/CAD",
  "AUD/NZD",
  "CAD/JPY",
  "CAD/CHF",
  "CHF/JPY",
  "NZD/JPY",
  "NZD/CHF",
  "NZD/CAD",
  "USD/TRY",
  "USD/ZAR",
  "USD/MXN",
  "USD/SGD",
  "USD/HKD",
  "USD/SEK",
  "USD/NOK",
  "USD/DKK",
  "USD/PLN",
];

/** ISO country codes for circle-flags (./flags/{code}.svg) */
const CURRENCY_FLAG = {
  AUD: "au",
  CHF: "ch",
  EUR: "eu",
  USD: "us",
  GBP: "gb",
  JPY: "jp",
  CAD: "ca",
  NZD: "nz",
  TRY: "tr",
  ZAR: "za",
  MXN: "mx",
  SGD: "sg",
  HKD: "hk",
  SEK: "se",
  NOK: "no",
  DKK: "dk",
  PLN: "pl",
};

function getPairSymbolsForMode(mode = state.mode) {
  return mode === "otc" ? PAIR_SYMBOLS_OTC : PAIR_SYMBOLS_REGULAR;
}

const LANG_FLAG = {
  ru: "ru",
  en: "gb",
};

const LANG_STORAGE_KEY = "wander-trade-lang";

function loadSavedLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "ru" || saved === "en") return saved;
  } catch (_) {
    /* private mode / blocked storage */
  }
  return "en";
}

function saveLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (_) {
    /* ignore */
  }
}

let state = {
  mode: "otc",
  pair: "AUD/CHF OTC",
  expiration: "S3",
  lang: loadSavedLang(),
};

const I18N = {
  ru: {
    brandSub: "Торговые сигналы",
    marketStatus: "Статус рынка",
    successRate: "Успешность",
    selectExpiration: "Выберите время экспирации",
    selectPair: "Выберите пару",
    searchPair: "Поиск пары...",
    noPairsFound: "Пары не найдены",
    getSignal: "Получить сигнал",
    directionBuy: "КУПИТЬ",
    directionSell: "ПРОДАТЬ",
    signalGenerated: "Сигнал получен",
    expiration: "Экспирация",
    market: "Рынок:",
    time: "Время:",
    generateNew: "Получить новый сигнал",
    close: "Закрыть",
    expSeconds: "Секунды",
    expMinutes: "Минуты",
    expHours: "Часы",
    marketOpenReal: "Regular · открыт",
    marketClosedReal: "Regular · закрыт",
    marketOpenOtc: "OTC · открыт",
    pairMarketReal: "Рынок Regular",
    pairMarketOtc: "Рынок OTC",
    genConnect: "Подключение к серверам",
    genScan: "Сканирование данных",
    genAi: "Запрос сигнала у нейросети",
    genIndicators: "Расчёт индикаторов",
    genOptimize: "Оптимизация",
  },
  en: {
    brandSub: "Trading Signals",
    marketStatus: "Market Status",
    successRate: "Success Rate",
    selectExpiration: "Select Expiration Time",
    selectPair: "Select pair",
    searchPair: "Search pair...",
    noPairsFound: "No pairs found",
    getSignal: "Get Signal",
    directionBuy: "BUY",
    directionSell: "SELL",
    signalGenerated: "Signal Generated",
    expiration: "Expiration",
    market: "Market:",
    time: "Time:",
    generateNew: "Generate New Signal",
    close: "Close",
    expSeconds: "Seconds",
    expMinutes: "Minutes",
    expHours: "Hours",
    marketOpenReal: "Regular · open",
    marketClosedReal: "Regular · closed",
    marketOpenOtc: "OTC · open",
    pairMarketReal: "Regular Market",
    pairMarketOtc: "OTC Market",
    genConnect: "Connecting to servers",
    genScan: "Scanning market data",
    genAi: "Requesting signal from AI",
    genIndicators: "Calculating indicators",
    genOptimize: "Optimizing parameters",
  },
};

/** Lucide icons — https://lucide.dev */
function lucideGenIcon(inner) {
  return `<svg class="gen-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

const GEN_ICONS = {
  connect: lucideGenIcon(
    '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>'
  ),
  scan: lucideGenIcon(
    '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>'
  ),
  ai: lucideGenIcon(
    '<path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>'
  ),
  indicators: lucideGenIcon(
    '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>'
  ),
  optimize: lucideGenIcon(
    '<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>'
  ),
};

const GEN_STEPS = [
  { i18n: "genConnect", icon: "connect", duration: 900, progressEnd: 20 },
  { i18n: "genScan", icon: "scan", duration: 950, progressEnd: 40 },
  { i18n: "genAi", icon: "ai", duration: 1100, progressEnd: 60 },
  { i18n: "genIndicators", icon: "indicators", duration: 950, progressEnd: 80 },
  { i18n: "genOptimize", icon: "optimize", duration: 1000, progressEnd: 100 },
];

let signalGenerationRunning = false;
let lastSignalDirection = "SHORT";

const DIRECTION_ICON = {
  SHORT: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/></svg>`,
  LONG: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>`,
};

applyLanguage();
updateMarketUI();
updatePairDisplay();

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
    syncPairToMode();
    updateMarketUI();
    renderPairList(pairSearch?.value || "");
    sendToTelegram("mode_changed");
  });
});

timeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    timeButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    state.expiration = button.dataset.time;
    sendToTelegram("expiration_changed");
  });
});

pairButton.addEventListener("click", openPairModal);

pairSearch?.addEventListener("input", () => {
  renderPairList(pairSearch.value);
});

document.querySelectorAll("[data-close-target]").forEach((el) => {
  el.addEventListener("click", () => {
    const id = el.dataset.closeTarget;
    if (id) closeModalById(id);
  });
});

signalBtn.addEventListener("click", async () => {
  if (signalGenerationRunning || isRealMarketClosed()) return;
  pulse(signalBtn);
  sendToTelegram("get_signal_clicked");
  await openSignalModal();
});

modalGenerate.addEventListener("click", async () => {
  if (signalGenerationRunning) return;
  closeModalById("signal-modal");
  await openSignalModal();
  sendToTelegram("generate_new_signal");
});

modalClose.addEventListener("click", () => closeModalById("signal-modal"));

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!pairModal.classList.contains("hidden")) closeModalById("pair-modal");
  else if (!signalModal.classList.contains("hidden")) closeModalById("signal-modal");
});

langBtn.addEventListener("click", () => {
  state.lang = state.lang === "ru" ? "en" : "ru";
  saveLang(state.lang);
  applyLanguage();
  renderPairList(pairSearch?.value || "");
  if (!signalModal.classList.contains("hidden") && modalDirectionText) {
    modalDirectionText.textContent = directionLabel(lastSignalDirection);
  }
  sendToTelegram("language_changed");
});

function formatPair(symbol) {
  return state.mode === "otc" ? `${symbol} OTC` : symbol;
}

function parseSymbol(pair) {
  return pair.replace(/\s+OTC$/i, "").trim();
}

function pairLetter(symbol) {
  return symbol.charAt(0).toUpperCase();
}

function parseCurrencies(symbol) {
  const [base, quote] = parseSymbol(symbol).split("/");
  return { base: base?.trim(), quote: quote?.trim() };
}

function flagSrc(isoCode) {
  return `./flags/${isoCode}.svg`;
}

function pairFlagsHtml(symbol, size = "md") {
  const { base, quote } = parseCurrencies(symbol);
  const baseIso = CURRENCY_FLAG[base];
  const quoteIso = CURRENCY_FLAG[quote];

  if (!baseIso || !quoteIso) {
    return `<span class="pair-flags pair-flags--${size}"><span class="pair-flag-fallback">${pairLetter(symbol)}</span></span>`;
  }

  return `<span class="pair-flags pair-flags--${size}">
      <img class="pair-flag pair-flag--base" src="${flagSrc(baseIso)}" alt="" width="24" height="24" loading="lazy" decoding="async" />
      <img class="pair-flag pair-flag--quote" src="${flagSrc(quoteIso)}" alt="" width="24" height="24" loading="lazy" decoding="async" />
    </span>`;
}

function getPairsForMode() {
  return getPairSymbolsForMode().map((symbol) => formatPair(symbol));
}

function syncPairToMode() {
  const symbol = parseSymbol(state.pair);
  const symbols = getPairSymbolsForMode();
  const validSymbol = symbols.includes(symbol) ? symbol : symbols[0];
  const next = formatPair(validSymbol);
  if (state.pair !== next) {
    state.pair = next;
    updatePairDisplay();
  }
}

function updatePairDisplay() {
  selectedPairEl.textContent = state.pair;
  if (pairFlagsEl) pairFlagsEl.innerHTML = pairFlagsHtml(parseSymbol(state.pair), "md");
}

function selectPair(pair) {
  state.pair = pair;
  updatePairDisplay();
  closeModalById("pair-modal");
  sendToTelegram("pair_changed");
}

function openPairModal() {
  if (pairSearch) {
    pairSearch.value = "";
    pairSearch.placeholder = (I18N[state.lang] || I18N.en).searchPair;
  }
  renderPairList("");
  openModalById("pair-modal");
  setTimeout(() => pairSearch?.focus(), 120);
}

function renderPairList(query) {
  const dict = I18N[state.lang] || I18N.en;
  const q = query.trim().toLowerCase();
  const pairs = getPairsForMode().filter((p) => p.toLowerCase().includes(q));
  const tag = state.mode === "otc" ? dict.pairMarketOtc : dict.pairMarketReal;

  pairList.innerHTML = "";

  pairs.forEach((pair) => {
    const symbol = parseSymbol(pair);
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pair-option" + (pair === state.pair ? " active" : "");
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", pair === state.pair ? "true" : "false");
    btn.innerHTML = `
      ${pairFlagsHtml(symbol, "sm")}
      <span class="pair-option-body">
        <p class="pair-option-name">${pair}</p>
        <p class="pair-option-tag">${tag}</p>
      </span>
      <span class="pair-option-check" aria-hidden="true">✓</span>
    `;
    btn.addEventListener("click", () => selectPair(pair));
    li.appendChild(btn);
    pairList.appendChild(li);
  });

  const isEmpty = pairs.length === 0;
  pairEmpty.classList.toggle("hidden", !isEmpty);
  pairList.classList.toggle("hidden", isEmpty);
}

function openModalById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
}

function closeModalById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
}

/** Blur/dim page content — backdrop-filter fails in Telegram WebView */
function setSignalGenBackdrop(active) {
  document.body.classList.toggle("signal-gen-active", active);
}

function pulse(button) {
  button.style.transform = "scale(0.98)";
  setTimeout(() => {
    button.style.transform = "scale(1)";
  }, 120);
}

function applyLanguage() {
  const dict = I18N[state.lang] || I18N.en;
  document.documentElement.lang = state.lang;
  if (langBtn) {
    const flagImg = langBtn.querySelector(".lang-flag");
    const iso = LANG_FLAG[state.lang] || "gb";
    if (flagImg) flagImg.src = `./flags/${iso}.svg`;
    langBtn.setAttribute(
      "aria-label",
      state.lang === "ru" ? "Переключить на английский" : "Switch to Russian"
    );
  }
  i18nEls.forEach((el) => {
    const key = el.dataset.i18n;
    if (key && dict[key]) el.textContent = dict[key];
  });
  if (pairSearch) pairSearch.placeholder = dict.searchPair;
  updateMarketUI();
}

function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isRealMarketClosed() {
  return state.mode === "real" && isWeekend();
}

function updateSignalAvailability() {
  const marketClosed = isRealMarketClosed();
  const disabled = marketClosed || signalGenerationRunning;

  if (signalBtn) {
    signalBtn.disabled = disabled;
    signalBtn.classList.toggle("is-market-closed", marketClosed && !signalGenerationRunning);
  }
}

function updateMarketUI() {
  const dict = I18N[state.lang] || I18N.en;
  const isOtc = state.mode === "otc";
  const realClosed = isRealMarketClosed();

  if (marketStatusEl) {
    if (isOtc) {
      marketStatusEl.textContent = dict.marketOpenOtc;
    } else {
      marketStatusEl.textContent = realClosed ? dict.marketClosedReal : dict.marketOpenReal;
    }
    marketStatusEl.classList.toggle("is-closed", !isOtc && realClosed);
  }

  const marketIcon = document.querySelector(".stats-icon--market");
  if (marketIcon) {
    marketIcon.classList.toggle("is-closed", !isOtc && realClosed);
  }

  if (pairMarketLabel) {
    pairMarketLabel.textContent = isOtc ? dict.pairMarketOtc : dict.pairMarketReal;
  }

  updateSignalAvailability();
}

async function openSignalModal() {
  if (isRealMarketClosed()) return;

  signalGenerationRunning = true;
  updateSignalAvailability();
  if (modalGenerate) modalGenerate.disabled = true;

  try {
    const signal = await runSignalGeneration();
    fillSignalModal(signal);
    openModalById("signal-modal");
    sendToTelegram("signal_generated");
  } finally {
    signalGenerationRunning = false;
    if (modalGenerate) modalGenerate.disabled = false;
    updateSignalAvailability();
  }
}

function directionLabel(direction) {
  const dict = I18N[state.lang] || I18N.en;
  return direction === "LONG" ? dict.directionBuy : dict.directionSell;
}

function fillSignalModal({ direction, success }) {
  const dict = I18N[state.lang] || I18N.en;
  const isBuy = direction === "LONG";
  lastSignalDirection = direction;

  modalPair.textContent = state.pair;
  if (modalFlagsEl) modalFlagsEl.innerHTML = pairFlagsHtml(parseSymbol(state.pair), "md");

  if (modalDirectionText) modalDirectionText.textContent = directionLabel(direction);
  if (modalDirectionIcon) modalDirectionIcon.innerHTML = DIRECTION_ICON[direction] || DIRECTION_ICON.SHORT;
  if (modalDirection) {
    modalDirection.classList.toggle("buy", isBuy);
    modalDirection.classList.toggle("sell", !isBuy);
  }

  modalSuccess.textContent = success.toFixed(1);
  modalBar.style.width = `${Math.max(5, Math.min(100, success))}%`;

  modalExpiration.textContent = state.expiration;
  modalExpSub.textContent = expirationSuffix(state.expiration, dict);

  modalMarket.textContent = state.mode === "otc" ? "OTC" : "REGULAR";
  modalTime.textContent = new Date().toLocaleTimeString(undefined, { hour12: false });
}

function setGenProgress(percent) {
  const value = Math.max(0, Math.min(100, percent));
  if (genProgressBar) {
    genProgressBar.style.width = `${value}%`;
    genProgressBar.classList.toggle("is-active", value > 2);
  }
  if (genProgressPct) genProgressPct.textContent = String(Math.round(value));
}

function updateGenStepDots(activeIndex) {
  if (!genStepsEl) return;
  genStepsEl.querySelectorAll(".gen-step-dot").forEach((dot, i) => {
    dot.classList.toggle("is-active", i === activeIndex);
    dot.classList.toggle("is-done", i < activeIndex);
  });
}

function setGenStep(step, stepIndex) {
  const dict = I18N[state.lang] || I18N.en;
  updateGenStepDots(stepIndex);

  if (genStepLabel) {
    genStepLabel.classList.add("is-swapping");
    setTimeout(() => {
      genStepLabel.textContent = dict[step.i18n] || I18N.en[step.i18n];
      genStepLabel.classList.remove("is-swapping");
    }, 140);
  }
  if (genIcon) {
    genIcon.classList.add("is-swapping");
    setTimeout(() => {
      genIcon.innerHTML = GEN_ICONS[step.icon] || "";
      genIcon.classList.remove("is-swapping");
    }, 140);
  }
}

function animateGenProgress(from, to, duration) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setGenProgress(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else {
        setGenProgress(to);
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

async function runSignalGeneration() {
  setSignalGenBackdrop(true);
  openModalById("signal-gen-modal");
  setGenProgress(0);

  try {
    const dict = I18N[state.lang] || I18N.en;
    if (genStepLabel) genStepLabel.textContent = dict[GEN_STEPS[0].i18n] || I18N.en[GEN_STEPS[0].i18n];
    if (genIcon) genIcon.innerHTML = GEN_ICONS[GEN_STEPS[0].icon] || "";
    updateGenStepDots(0);
    if (genProgressBar) genProgressBar.classList.remove("is-active");

    let progress = 0;

    for (let i = 0; i < GEN_STEPS.length; i++) {
      const step = GEN_STEPS[i];
      setGenStep(step, i);
      await animateGenProgress(progress, step.progressEnd, step.duration);
      progress = step.progressEnd;
    }

    updateGenStepDots(GEN_STEPS.length);

    await new Promise((r) => setTimeout(r, 180));
    return generateSignal();
  } finally {
    closeModalById("signal-gen-modal");
    setSignalGenBackdrop(false);
  }
}

function generateSignal() {
  const direction = Math.random() < 0.5 ? "SHORT" : "LONG";
  const success = 74 + Math.random() * 21;
  return { direction, success };
}

function expirationSuffix(exp, dict) {
  if (exp.startsWith("S")) return dict.expSeconds;
  if (exp.startsWith("M")) return dict.expMinutes;
  if (exp.startsWith("H")) return dict.expHours;
  return "";
}

function sendToTelegram(action) {
  const payload = { action, ...state };
  if (tg) {
    tg.sendData(JSON.stringify(payload));
    return;
  }
  console.log("WebApp payload:", payload);
}
