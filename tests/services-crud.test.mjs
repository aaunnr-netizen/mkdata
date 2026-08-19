import assert from "node:assert/strict";
import {
  ALRAHUZ_ELECTRICITY_PROVIDERS,
  ALRAHUZ_CABLE_PROVIDERS,
  ALRAHUZ_CABLE_PLANS,
  ALRAHUZ_EXAM_PRODUCTS,
} from "../lib/services-catalog-data.mjs";

export async function testServicesCatalogAndSeed() {
  console.log("Testing Alrahuz Services Catalog definitions and sync...");

  // 1. Validate Electricity Providers definition
  assert.ok(
    ALRAHUZ_ELECTRICITY_PROVIDERS.length >= 11,
    `Expected at least 11 electricity providers, got ${ALRAHUZ_ELECTRICITY_PROVIDERS.length}`
  );
  const ikeja = ALRAHUZ_ELECTRICITY_PROVIDERS.find((p) => p.discoName === 1);
  assert.ok(ikeja, "Missing Ikeja Electric (discoName: 1)");
  assert.equal(ikeja.name, "Ikeja Electric");

  const yola = ALRAHUZ_ELECTRICITY_PROVIDERS.find((p) => p.discoName === 11);
  assert.ok(yola, "Missing Yola Electric (discoName: 11)");
  assert.equal(yola.name, "Yola Electric");

  // 2. Validate Cable Providers definition
  assert.equal(ALRAHUZ_CABLE_PROVIDERS.length, 3, "Expected 3 cable providers (GOTV, DSTV, STARTIME)");
  const gotv = ALRAHUZ_CABLE_PROVIDERS.find((c) => c.cablename === 1);
  assert.ok(gotv, "Missing GOTV (cablename: 1)");
  assert.equal(gotv.name, "GOTV");

  // 3. Validate Cable Plans definition
  assert.ok(ALRAHUZ_CABLE_PLANS.length >= 30, `Expected at least 30 cable plans, got ${ALRAHUZ_CABLE_PLANS.length}`);
  const gotvMax = ALRAHUZ_CABLE_PLANS.find((p) => p.cableplan === 2);
  assert.ok(gotvMax, "Missing GOtv Max (cableplan: 2)");
  assert.equal(gotvMax.providerName, "GOTV");
  assert.ok(gotvMax.price > 0, "Price must be positive");

  // 4. Validate Exam Products definition
  assert.equal(ALRAHUZ_EXAM_PRODUCTS.length, 4, "Expected 4 exam products (WAEC, NECO, NABTEB, JAMB)");
  const waec = ALRAHUZ_EXAM_PRODUCTS.find((e) => e.examName === "WAEC");
  assert.ok(waec, "Missing WAEC product");
  assert.ok(waec.price >= 1000, "WAEC price should be >= 1000");

  console.log("PASS: Services catalog definitions and constants verified successfully.");
}
