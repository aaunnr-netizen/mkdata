import axios from "axios";

type AlrahuzResult = {
  success: boolean;
  message: string;
  externalReference?: string;
  pin?: string;
  raw?: unknown;
};

type AlrahuzDataParams = {
  network: number;
  plan: number;
  mobileNumber: string;
  reference: string;
};

type AlrahuzAirtimeParams = {
  network: number;
  amount: number;
  mobileNumber: string;
  reference: string;
};

type AlrahuzElectricityParams = {
  discoName: number;
  amount: number;
  meterNumber: string;
  meterType: 1 | 2;
  reference: string;
};

type AlrahuzCableParams = {
  cablename: number;
  cableplan: number;
  smartCardNumber: string;
  reference: string;
};

type AlrahuzExamParams = {
  examName: string;
  quantity: number;
  reference: string;
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
    throw new Error(kind === "epin" ? "ALRAHUZ_EPIN_API_TOKEN is not configured" : "ALRAHUZ_API_TOKEN is not configured");
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
    status === "cancelled"
  );
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
