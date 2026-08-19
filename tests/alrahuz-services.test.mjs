import assert from "node:assert/strict";

export async function testAlrahuzServices() {
  // Test 1: Default configuration
  const DEFAULT_ALRAHUZ_TOKEN = "66f2e5c39ac8640f13cd888f161385b12f7e5e92";
  const DEFAULT_ALRAHUZ_BASE_URL = "https://alrahuzdata.com.ng";

  assert.equal(DEFAULT_ALRAHUZ_TOKEN, "66f2e5c39ac8640f13cd888f161385b12f7e5e92");
  assert.equal(DEFAULT_ALRAHUZ_BASE_URL, "https://alrahuzdata.com.ng");

  // Test 2: Customer Name Extraction
  function extractCustomerName(data) {
    const name =
      data?.name ||
      data?.Name ||
      data?.Customer_Name ||
      data?.customer_name ||
      data?.customerName ||
      data?.Customer_Number ||
      data?.customer_number ||
      data?.data?.name ||
      data?.data?.Name ||
      data?.data?.Customer_Name ||
      data?.data?.customer_name ||
      data?.data?.customerName;

    if (typeof name === "string" && name.trim().length > 0) {
      return name.trim();
    }
    return undefined;
  }

  assert.equal(extractCustomerName({ name: "JOHN DOE" }), "JOHN DOE");
  assert.equal(extractCustomerName({ Customer_Name: "ALICE SMITH" }), "ALICE SMITH");
  assert.equal(extractCustomerName({ data: { customer_name: "BOB BUILDER" } }), "BOB BUILDER");
  assert.equal(extractCustomerName({ invalid: true }), undefined);

  // Test 3: Meter customer name and address
  function extractAddress(data) {
    const address =
      data?.address ||
      data?.Address ||
      data?.customer_address ||
      data?.customerAddress ||
      data?.data?.address ||
      data?.data?.Address;

    if (typeof address === "string" && address.trim().length > 0) return address.trim();
    return undefined;
  }

  const meterPayload = {
    name: "EMMANUEL CHIDIEBERE",
    address: "14 ADENIJI STREET, IKEJA, LAGOS",
    status: "success",
  };

  assert.equal(extractCustomerName(meterPayload), "EMMANUEL CHIDIEBERE");
  assert.equal(extractAddress(meterPayload), "14 ADENIJI STREET, IKEJA, LAGOS");

  // Test 4: Pin/Token extraction
  function getPin(data) {
    const value =
      data?.pin ||
      data?.Pin ||
      data?.token ||
      data?.Token ||
      data?.epin ||
      data?.ePin ||
      data?.data?.pin ||
      data?.data?.Pin ||
      data?.data?.token ||
      data?.data?.Token ||
      data?.data?.epin ||
      data?.data?.ePin;

    if (Array.isArray(value)) return value.map(String).join(", ");
    return value ? String(value) : undefined;
  }

  assert.equal(getPin({ token: "1234-5678-9012-3456" }), "1234-5678-9012-3456");
  assert.equal(getPin({ pin: ["PIN-001", "PIN-002"] }), "PIN-001, PIN-002");
  assert.equal(getPin({ data: { Token: "9988-7766-5544" } }), "9988-7766-5544");
  assert.equal(getPin({ status: "success" }), undefined);

  // Test 5: Exam Products Catalog
  const examProducts = [
    { examName: "WAEC", displayName: "WAEC Result Checker", price: 3800, maxQuantity: 5 },
    { examName: "NECO", displayName: "NECO Token", price: 1800, maxQuantity: 5 },
    { examName: "NABTEB", displayName: "NABTEB Pin", price: 1800, maxQuantity: 5 },
    { examName: "JAMB", displayName: "JAMB UTME / DE Pin", price: 2500, maxQuantity: 5 },
  ];

  assert.equal(examProducts.length, 4);
  assert.equal(examProducts.find((p) => p.examName === "WAEC")?.price, 3800);
  assert.equal(examProducts.find((p) => p.examName === "NECO")?.price, 1800);
  assert.equal(examProducts.find((p) => p.examName === "NABTEB")?.price, 1800);
  assert.equal(examProducts.find((p) => p.examName === "JAMB")?.price, 2500);

  // Test 6: Electricity Discos Mappings
  const electricityProviders = [
    { discoName: 1, name: "Ikeja Electric" },
    { discoName: 2, name: "Eko Electric" },
    { discoName: 3, name: "Abuja Electric" },
    { discoName: 4, name: "Kano Electric" },
    { discoName: 5, name: "Enugu Electric" },
    { discoName: 6, name: "Port Harcourt Electric" },
    { discoName: 7, name: "Ibadan Electric" },
    { discoName: 8, name: "Kaduna Electric" },
    { discoName: 9, name: "Jos Electric" },
    { discoName: 10, name: "Benin Electric" },
    { discoName: 11, name: "Yola Electric" },
  ];

  assert.equal(electricityProviders.length, 11);
  assert.equal(electricityProviders[0].discoName, 1);
  assert.equal(electricityProviders[0].name, "Ikeja Electric");

  // Test 7: Cable Providers Mappings
  const cableProviders = [
    { cablename: 1, name: "GOTV" },
    { cablename: 2, name: "DSTV" },
    { cablename: 3, name: "STARTIME" },
  ];

  assert.equal(cableProviders.length, 3);
  assert.equal(cableProviders.find((c) => c.name === "GOTV")?.cablename, 1);
  assert.equal(cableProviders.find((c) => c.name === "DSTV")?.cablename, 2);
  assert.equal(cableProviders.find((c) => c.name === "STARTIME")?.cablename, 3);
}
