export const ALRAHUZ_ELECTRICITY_PROVIDERS = [
  { discoName: 1, name: "Ikeja Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 2, name: "Eko Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 3, name: "Abuja Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 4, name: "Kano Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 5, name: "Enugu Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 6, name: "Port Harcourt Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 7, name: "Ibadan Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 8, name: "Kaduna Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 9, name: "Jos Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 10, name: "Benin Electric", minAmount: 500, maxAmount: 50000 },
  { discoName: 11, name: "Yola Electric", minAmount: 500, maxAmount: 50000 },
];

export const ALRAHUZ_CABLE_PROVIDERS = [
  { cablename: 1, name: "GOTV" },
  { cablename: 2, name: "DSTV" },
  { cablename: 3, name: "STARTIME" },
];

export const ALRAHUZ_CABLE_PLANS = [
  // GOTV
  { cableplan: 2, name: "GOtv Max", price: 8500, providerName: "GOTV" },
  { cableplan: 16, name: "GOtv Jinja", price: 3900, providerName: "GOTV" },
  { cableplan: 17, name: "GOtv Jolli", price: 5800, providerName: "GOTV" },
  { cableplan: 34, name: "GOtv Smallie - Monthly", price: 1900, providerName: "GOTV" },
  { cableplan: 35, name: "GOtv Smallie - Quarterly", price: 5100, providerName: "GOTV" },
  { cableplan: 36, name: "GOtv Smallie - Yearly", price: 15000, providerName: "GOTV" },
  { cableplan: 47, name: "GOTv SUPA", price: 11400, providerName: "GOTV" },
  { cableplan: 49, name: "GOTv SUPA PLUS", price: 16800, providerName: "GOTV" },

  // DSTV
  { cableplan: 6, name: "DStv Yanga", price: 6000, providerName: "DSTV" },
  { cableplan: 7, name: "DStv Compact", price: 19000, providerName: "DSTV" },
  { cableplan: 8, name: "DStv Compact Plus", price: 30000, providerName: "DSTV" },
  { cableplan: 9, name: "DStv Premium", price: 44500, providerName: "DSTV" },
  { cableplan: 19, name: "DStv-Confam", price: 11000, providerName: "DSTV" },
  { cableplan: 20, name: "DStv-Padi", price: 4400, providerName: "DSTV" },
  { cableplan: 23, name: "DStv -indian", price: 14900, providerName: "DSTV" },
  { cableplan: 24, name: "DStv Premium French", price: 69000, providerName: "DSTV" },
  { cableplan: 25, name: "DStv Premium Asia", price: 50500, providerName: "DSTV" },
  { cableplan: 26, name: "DStv Confam + ExtraView", price: 17000, providerName: "DSTV" },
  { cableplan: 27, name: "DStv Yanga + ExtraView", price: 12000, providerName: "DSTV" },
  { cableplan: 28, name: "DStv Padi + ExtraView", price: 10400, providerName: "DSTV" },
  { cableplan: 29, name: "DStv Compact + Extra View", price: 25000, providerName: "DSTV" },
  { cableplan: 30, name: "DStv Premium + Extra View", price: 50500, providerName: "DSTV" },
  { cableplan: 31, name: "DStv Compact Plus - Extra View", price: 36000, providerName: "DSTV" },
  { cableplan: 33, name: "ExtraView Access", price: 6000, providerName: "DSTV" },

  // STARTIME
  { cableplan: 11, name: "Classic - 7400 Naira - 1 Month", price: 6000, providerName: "STARTIME" },
  { cableplan: 12, name: "Basic - 4000 Naira - 1 Month", price: 4000, providerName: "STARTIME" },
  { cableplan: 13, name: "Smart - 5100 Naira - 1 Month", price: 5100, providerName: "STARTIME" },
  { cableplan: 14, name: "Nova - 2100 Naira - 1 Month", price: 2100, providerName: "STARTIME" },
  { cableplan: 15, name: "Super - 9800 Naira - 1 Month", price: 9800, providerName: "STARTIME" },
  { cableplan: 37, name: "Nova - 700 Naira - 1 Week", price: 700, providerName: "STARTIME" },
  { cableplan: 38, name: "Basic - 1400 Naira - 1 Week", price: 1400, providerName: "STARTIME" },
  { cableplan: 39, name: "Smart - 1700 Naira - 1 Week", price: 1700, providerName: "STARTIME" },
  { cableplan: 40, name: "Classic - 2000 Naira - 1 Week", price: 2000, providerName: "STARTIME" },
  { cableplan: 41, name: "Super - 3300 Naira - 1 Week", price: 3300, providerName: "STARTIME" },
  { cableplan: 48, name: "Super - 9000 Naira - 1 Month", price: 9000, providerName: "STARTIME" },
];

export const ALRAHUZ_EXAM_PRODUCTS = [
  { examName: "WAEC", displayName: "WAEC Result Checker", price: 3800, maxQuantity: 5 },
  { examName: "NECO", displayName: "NECO Token", price: 1800, maxQuantity: 5 },
  { examName: "NABTEB", displayName: "NABTEB Pin", price: 1800, maxQuantity: 5 },
  { examName: "JAMB", displayName: "JAMB UTME / DE Pin", price: 2500, maxQuantity: 5 },
];
