import axios from "axios";

export type AlrahuzResult = {
  success: boolean;
  message: string;
  externalReference?: string;
  pin?: string;
  raw?: unknown;
};

export type AlrahuzValidationResult = {
  success: boolean;
  valid: boolean;
  customerName?: string;
  address?: string;
  message: string;
  raw?: unknown;
};

export type AlrahuzDataParams = {
  network: number;
  plan: number;
  mobileNumber: string;
  reference: string;
};

export type AlrahuzAirtimeParams = {
  network: number;
  amount: number;
  mobileNumber: string;
  reference: string;
};

export type AlrahuzElectricityParams = {
  discoName: number;
  amount: number;
  meterNumber: string;
  meterType: 1 | 2;
  reference: string;
};

export type AlrahuzCableParams = {
  cablename: number;
  cableplan: number;
  smartCardNumber: string;
  reference: string;
};

export type AlrahuzExamParams = {
  examName: string;
  quantity: number;
  reference: string;
};

export type AlrahuzValidateIucParams = {
  smartCardNumber: string;
  cablename: number | string;
};

export type AlrahuzValidateMeterParams = {
  meterNumber: string;
  disconame: number | string;
  meterType?: 1 | 2 | "prepaid" | "postpaid" | string;
};

function getBaseUrl() {
  return (process.env.ALRAHUZ_BASE_URL || "https://alrahuzdata.com.ng").replace(/\/$/, "");
}

function getToken(kind: "default" | "epin" = "default") {
  const token =
    kind === "epin"
      ? process.env.ALRAHUZ_EPIN_API_TOKEN || process.env.ALRAHUZ_API_TOKEN
      : process.env.ALRAHUZ_API_TOKEN;

  if (!token) {
    throw new Error(
      `Alrahuz API token not configured. Please set ${
        kind === "epin" ? "ALRAHUZ_EPIN_API_TOKEN or ALRAHUZ_API_TOKEN" : "ALRAHUZ_API_TOKEN"
      } in your environment variables.`
    );
  }

  return token;
}

function formatLocalPhone(phone: string) {
  if (phone.startsWith("234")) return `0${phone.slice(3)}`;
  if (!phone.startsWith("0")) return `0${phone}`;
  return phone;
}

function getMessage(data: any, fallback: string) {
  return (
    data?.message ||
    data?.Message ||
    data?.detail ||
    data?.description ||
    data?.error ||
    data?.data?.message ||
    data?.data?.detail ||
    data?.data?.description ||
    fallback
  );
}

function getExternalReference(data: any, reference: string) {
  return String(
    data?.reference ||
      data?.Reference ||
      data?.ident ||
      data?.id ||
      data?.data?.reference ||
      data?.data?.Reference ||
      data?.data?.ident ||
      data?.data?.id ||
      reference
  );
}

function getPin(data: any) {
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

function isFailurePayload(data: any) {
  const status = String(data?.status ?? data?.Status ?? data?.code ?? "").toLowerCase();
  return (
    data?.success === false ||
    data?.status === false ||
    status === "failed" ||
    status === "failure" ||
    status === "error" ||
    status === "cancelled" ||
    data?.invalid === true
  );
}

function extractCustomerName(data: any): string | undefined {
  if (data?.invalid === true) return undefined;

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

  if (typeof name === "string" && name.trim().length > 0 && !isFailurePayload({ status: name })) {
    const trimmed = name.trim();
    if (/invalid/i.test(trimmed)) return undefined;
    return trimmed;
  }
  return undefined;
}

function extractAddress(data: any): string | undefined {
  const address =
    data?.address ||
    data?.Address ||
    data?.customer_address ||
    data?.customerAddress ||
    data?.data?.address ||
    data?.data?.Address;

  if (typeof address === "string" && address.trim().length > 0) {
    return address.trim();
  }
  return undefined;
}

async function getFromAlrahuz(
  path: string,
  params?: Record<string, unknown>,
  options?: {
    tokenKind?: "default" | "epin";
    fallbackMessage?: string;
  }
): Promise<{ status: number; data: any }> {
  const url = `${getBaseUrl()}${path}`;
  console.log("[ALRAHUZ GET REQUEST]", {
    url,
    params,
    tokenKind: options?.tokenKind || "default",
    timestamp: new Date().toISOString(),
  });

  const response = await axios.get(url, {
    params,
    headers: {
      Authorization: `Token ${getToken(options?.tokenKind)}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
    validateStatus: (status) => status >= 200 && status < 500,
  });

  console.log("[ALRAHUZ GET RESPONSE]", {
    url,
    status: response.status,
    data: response.data,
    timestamp: new Date().toISOString(),
  });

  return { status: response.status, data: response.data };
}

async function postToAlrahuz(
  path: string,
  body: Record<string, unknown>,
  options: {
    tokenKind?: "default" | "epin";
    reference: string;
    successMessage: string;
  }
): Promise<AlrahuzResult> {
  try {
    const url = `${getBaseUrl()}${path}`;
    console.log("[ALRAHUZ REQUEST]", {
      url,
      body,
      reference: options.reference,
      tokenKind: options.tokenKind || "default",
      timestamp: new Date().toISOString(),
    });

    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Token ${getToken(options.tokenKind)}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    const data = response.data;
    console.log("[ALRAHUZ RESPONSE]", {
      url,
      status: response.status,
      data,
      reference: options.reference,
      timestamp: new Date().toISOString(),
    });

    if (response.status >= 400 || isFailurePayload(data)) {
      return {
        success: false,
        message: getMessage(data, `API C request failed with status ${response.status}`),
        externalReference: getExternalReference(data, options.reference),
        raw: data,
      };
    }

    const pin = getPin(data);
    return {
      success: true,
      message: pin ? `${options.successMessage}. PIN: ${pin}` : getMessage(data, options.successMessage),
      externalReference: getExternalReference(data, options.reference),
      pin,
      raw: data,
    };
  } catch (error: any) {
    console.error("[ALRAHUZ API ERROR]", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
      path,
      reference: options.reference,
      timestamp: new Date().toISOString(),
    });

    if (error.code === "ECONNABORTED") {
      return { success: false, message: "Request timeout - please try again" };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.detail || "Network error - please try again",
    };
  }
}

export async function purchaseData(params: AlrahuzDataParams): Promise<AlrahuzResult> {
  let network = params.network;
  if (params.network === 2) {
    network = 3;
  } else if (params.network === 3) {
    network = 2;
  }

  return postToAlrahuz(
    "/api/data/",
    {
      network,
      mobile_number: formatLocalPhone(params.mobileNumber),
      plan: params.plan,
      Ported_number: true,
    },
    {
      reference: params.reference,
      successMessage: "Data purchase successful",
    }
  );
}

export async function purchaseAirtime(params: AlrahuzAirtimeParams): Promise<AlrahuzResult> {
  return postToAlrahuz(
    "/api/topup/",
    {
      network: params.network,
      amount: params.amount,
      mobile_number: formatLocalPhone(params.mobileNumber),
      Ported_number: true,
      airtime_type: "VTU",
    },
    {
      reference: params.reference,
      successMessage: "Airtime purchase successful",
    }
  );
}

export async function purchaseElectricity(params: AlrahuzElectricityParams): Promise<AlrahuzResult> {
  return postToAlrahuz(
    "/api/billpayment/",
    {
      disco_name: params.discoName,
      amount: params.amount,
      meter_number: params.meterNumber,
      MeterType: params.meterType,
    },
    {
      reference: params.reference,
      successMessage: "Electricity purchase successful",
    }
  );
}

export async function purchaseCable(params: AlrahuzCableParams): Promise<AlrahuzResult> {
  return postToAlrahuz(
    "/api/cablesub/",
    {
      cablename: params.cablename,
      cableplan: params.cableplan,
      smart_card_number: params.smartCardNumber,
    },
    {
      reference: params.reference,
      successMessage: "Cable TV subscription successful",
    }
  );
}

export async function purchaseExamPin(params: AlrahuzExamParams): Promise<AlrahuzResult> {
  return postToAlrahuz(
    "/api/epin/",
    {
      exam_name: params.examName,
      quantity: params.quantity,
    },
    {
      tokenKind: "epin",
      reference: params.reference,
      successMessage: "Exam checker PIN purchase successful",
    }
  );
}

export async function validateIUC(params: AlrahuzValidateIucParams): Promise<AlrahuzValidationResult> {
  try {
    const { status, data } = await getFromAlrahuz("/api/validateiuc", {
      smart_card_number: params.smartCardNumber,
      cablename: params.cablename,
    });

    if (status >= 400 || isFailurePayload(data)) {
      return {
        success: false,
        valid: false,
        message: getMessage(data, "Could not validate smart card number"),
        raw: data,
      };
    }

    const customerName = extractCustomerName(data);
    const valid = Boolean(customerName || (!data?.invalid && status === 200));

    return {
      success: true,
      valid,
      customerName,
      message: customerName ? `Verified: ${customerName}` : "Smart card verified",
      raw: data,
    };
  } catch (error: any) {
    console.error("[ALRAHUZ VALIDATE IUC ERROR]", error);
    return {
      success: false,
      valid: false,
      message: error.response?.data?.message || error.message || "Smart card validation failed",
    };
  }
}

export async function validateMeter(params: AlrahuzValidateMeterParams): Promise<AlrahuzValidationResult> {
  try {
    const mtype =
      params.meterType === 1 || params.meterType === "prepaid"
        ? "prepaid"
        : params.meterType === 2 || params.meterType === "postpaid"
        ? "postpaid"
        : params.meterType || "prepaid";

    const { status, data } = await getFromAlrahuz("/api/validatemeter", {
      meternumber: params.meterNumber,
      disconame: params.disconame,
      mtype,
    });

    if (status >= 400 || isFailurePayload(data)) {
      return {
        success: false,
        valid: false,
        message: getMessage(data, "Could not validate meter number"),
        raw: data,
      };
    }

    const customerName = extractCustomerName(data);
    const address = extractAddress(data);
    const valid = Boolean(customerName || address || (!data?.invalid && status === 200));

    return {
      success: true,
      valid,
      customerName,
      address,
      message: customerName ? `Verified: ${customerName}` : "Meter number verified",
      raw: data,
    };
  } catch (error: any) {
    console.error("[ALRAHUZ VALIDATE METER ERROR]", error);
    return {
      success: false,
      valid: false,
      message: error.response?.data?.message || error.message || "Meter validation failed",
    };
  }
}

export async function queryCableSub(id: string | number): Promise<AlrahuzResult> {
  try {
    const { status, data } = await getFromAlrahuz(`/api/cablesub/${id}`);
    if (status >= 400 || isFailurePayload(data)) {
      return {
        success: false,
        message: getMessage(data, `Cable query failed with status ${status}`),
        externalReference: getExternalReference(data, String(id)),
        raw: data,
      };
    }

    return {
      success: true,
      message: getMessage(data, "Cable subscription queried successfully"),
      externalReference: getExternalReference(data, String(id)),
      raw: data,
    };
  } catch (error: any) {
    console.error("[ALRAHUZ QUERY CABLE ERROR]", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Could not query cable subscription",
    };
  }
}

export async function queryElectricityBill(id: string | number): Promise<AlrahuzResult> {
  try {
    const { status, data } = await getFromAlrahuz(`/api/billpayment/${id}`);
    if (status >= 400 || isFailurePayload(data)) {
      return {
        success: false,
        message: getMessage(data, `Electricity query failed with status ${status}`),
        externalReference: getExternalReference(data, String(id)),
        raw: data,
      };
    }

    const pin = getPin(data);
    return {
      success: true,
      message: pin ? `Token: ${pin}` : getMessage(data, "Electricity bill queried successfully"),
      externalReference: getExternalReference(data, String(id)),
      pin,
      raw: data,
    };
  } catch (error: any) {
    console.error("[ALRAHUZ QUERY ELECTRICITY ERROR]", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Could not query electricity bill",
    };
  }
}

export async function queryExamPin(id: string | number): Promise<AlrahuzResult> {
  try {
    const { status, data } = await getFromAlrahuz(`/api/epin/${id}`, undefined, { tokenKind: "epin" });
    if (status >= 400 || isFailurePayload(data)) {
      return {
        success: false,
        message: getMessage(data, `Exam pin query failed with status ${status}`),
        externalReference: getExternalReference(data, String(id)),
        raw: data,
      };
    }

    const pin = getPin(data);
    return {
      success: true,
      message: pin ? `PIN: ${pin}` : getMessage(data, "Exam pin queried successfully"),
      externalReference: getExternalReference(data, String(id)),
      pin,
      raw: data,
    };
  } catch (error: any) {
    console.error("[ALRAHUZ QUERY EXAM PIN ERROR]", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Could not query exam pin",
    };
  }
}
