import axios from "axios";

interface AmysubPurchaseParams {
  plan: number;  // Plan ID as integer
  mobileNumber: string;
  networkId: number;
  reference: string;
}

interface AmysubResponse {
  success: boolean;
  message: string;
  externalReference?: string;
}

function formatLocalPhone(phone: string) {
  if (phone.startsWith("234")) return `0${phone.slice(3)}`;
  if (!phone.startsWith("0")) return `0${phone}`;
  return phone;
}

export async function purchaseData(params: AmysubPurchaseParams): Promise<AmysubResponse> {
  try {
    const { plan, mobileNumber, networkId, reference } = params;

    const AMYSUB_API_URL = process.env.AMYSUB_API_URL || "https://app.amysub.ng/api";
    const AMYSUB_API_KEY = process.env.AMYSUB_API_KEY;

    if (!AMYSUB_API_KEY) {
      throw new Error("Amysub API key not configured");
    }

    const requestBody = {
      plan: plan,
      mobile_number: formatLocalPhone(mobileNumber),
      network: networkId,
    };

    console.log("[AMYSUB REQUEST]", {
      url: `${AMYSUB_API_URL}/data`,
      body: requestBody,
      timestamp: new Date().toISOString(),
      reference,
    });

    const response = await axios.post(
      `${AMYSUB_API_URL}/data`,
      requestBody,
      {
        headers: {
          "Authorization": `Token ${AMYSUB_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[AMYSUB RESPONSE]", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
      reference,
    });

    const responseData = response.data;

    // Check for success status (case-insensitive)
    const status = String(responseData?.status ?? "").toLowerCase();
    if (responseData && (status === "success" || status === "successful")) {
      return {
        success: true,
        message: responseData.api_response || responseData.description || "Data purchase successful",
        externalReference: String(responseData.reference || responseData.id || ""),
      };
    } else {
      const errorMsg = responseData?.api_response || responseData?.description || "Data purchase failed";
      console.log("[AMYSUB FAILED]", { message: errorMsg, response: responseData });
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error: any) {
    console.error("[AMYSUB API ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });

    if (error.response) {
      const errorMessage = error.response.data?.api_response || error.response.data?.description || `API Error: ${error.response.status}`;
      return {
        success: false,
        message: errorMessage,
      };
    } else if (error.code === "ECONNABORTED") {
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else {
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}
