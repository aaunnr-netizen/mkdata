import axios from "axios";

interface SmeplugPurchaseParams {
  externalNetworkId: number;
  externalPlanId: number;
  phone: string;
  reference: string;
}

export interface SmeplugResponse {
  success: boolean;
  message: string;
  externalReference?: string;
  isTimeout?: boolean;
}

interface SmeplugAirtimeParams {
  networkId: number;
  amount: number;
  phone: string;
  reference: string;
}

function getSmeplugConfig() {
  const baseUrl =
    process.env.SMEPLUG_BASE_URL ||
    process.env.SMEPLUG_API_URL ||
    "https://smeplug.ng/api/v1";
  const apiKey = process.env.SMEPLUG_API_KEY;

  if (!apiKey) {
    throw new Error("SMEPlug API key not configured");
  }

  return { baseUrl, apiKey };
}

function formatSmeplugPhone(phone: string) {
  if (phone.startsWith("234")) {
    return "0" + phone.substring(3);
  }

  if (!phone.startsWith("0")) {
    return "0" + phone;
  }

  return phone;
}

export async function purchaseData(params: SmeplugPurchaseParams): Promise<SmeplugResponse> {
  const { externalNetworkId, externalPlanId, phone, reference } = params;
  try {
    const { baseUrl, apiKey } = getSmeplugConfig();
    const formattedPhone = formatSmeplugPhone(phone);

    const requestBody = {
      network_id: externalNetworkId,
      plan_id: externalPlanId,
      phone: formattedPhone,
      customer_reference: reference,
    };

    console.log("[SMEPLUG REQUEST]", {
      url: `${baseUrl}/data/purchase`,
      body: requestBody,
      timestamp: new Date().toISOString(),
      reference,
    });

    const response = await axios.post(
      `${baseUrl}/data/purchase`,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000, // 20-second timeout guard to prevent lambda abrupt kills
      }
    );

    console.log("[SMEPLUG RESPONSE]", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
      reference,
    });

    // SMEPlug returns status as boolean (true/false)
    if (response.data && response.data.status === true && response.data.data) {
      const returnData: SmeplugResponse = {
        success: true,
        message: response.data.data.msg || "Data purchase successful",
        externalReference: response.data.data.reference,
        isTimeout: false,
      };
      console.log("[SMEPLUG SUCCESS]", returnData);
      return returnData;
    } else {
      const errorMsg =
        response.data?.data?.msg ||
        response.data?.msg ||
        response.data?.message ||
        "Data purchase failed";
      console.log("[SMEPLUG REJECTED]", { message: errorMsg, response: response.data });
      return {
        success: false,
        message: errorMsg,
        isTimeout: false,
      };
    }
  } catch (error: any) {
    console.error("[SMEPLUG API ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
      reference,
    });

    if (error.response) {
      const is504 = error.response.status === 504 || error.response.status === 502;
      const errorMessage =
        error.response.data?.msg ||
        error.response.data?.message ||
        `API Error: ${error.response.status}`;

      return {
        success: false,
        message: errorMessage,
        isTimeout: is504,
      };
    } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return {
        success: false,
        message: "Request timeout - order is processing with provider",
        isTimeout: true,
      };
    } else {
      // Network disconnect / connection reset
      return {
        success: false,
        message: "Network connection issue - order status is pending verification",
        isTimeout: true,
      };
    }
  }
}

export async function purchaseAirtime(params: SmeplugAirtimeParams): Promise<SmeplugResponse> {
  const { networkId, amount, phone, reference } = params;
  try {
    const { baseUrl, apiKey } = getSmeplugConfig();
    const requestBody = {
      network_id: networkId,
      amount,
      phone: formatSmeplugPhone(phone),
      customer_reference: reference,
    };

    console.log("[SMEPLUG AIRTIME REQUEST]", {
      url: `${baseUrl}/airtime/purchase`,
      body: requestBody,
      reference,
      timestamp: new Date().toISOString(),
    });

    const response = await axios.post(
      `${baseUrl}/airtime/purchase`,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    console.log("[SMEPLUG AIRTIME RESPONSE]", {
      status: response.status,
      data: response.data,
      reference,
      timestamp: new Date().toISOString(),
    });

    if (response.data?.status === true && response.data?.data) {
      return {
        success: true,
        message: response.data.data.msg || "Airtime purchase successful",
        externalReference: response.data.data.reference || reference,
        isTimeout: false,
      };
    }

    return {
      success: false,
      message:
        response.data?.data?.msg ||
        response.data?.msg ||
        response.data?.message ||
        "Airtime purchase failed",
      isTimeout: false,
    };
  } catch (error: any) {
    console.error("[SMEPLUG AIRTIME ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      reference,
    });

    if (error.response) {
      const is504 = error.response.status === 504 || error.response.status === 502;
      return {
        success: false,
        message:
          error.response.data?.data?.msg ||
          error.response.data?.msg ||
          error.response.data?.message ||
          `API Error: ${error.response.status}`,
        isTimeout: is504,
      };
    }

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return {
        success: false,
        message: "Request timeout - order is processing with provider",
        isTimeout: true,
      };
    }

    return {
      success: false,
      message: "Network error - order status is pending verification",
      isTimeout: true,
    };
  }
}
