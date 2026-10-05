/**
 * Nigerian Telecom Operator Prefix Detection
 */
export function detectNigerianNetwork(
  phone: string
): "mtn" | "airtel" | "glo" | "9mobile" | null {
  const clean = phone.replace(/[^0-9]/g, "");
  let normalized = clean;

  if (normalized.startsWith("234") && normalized.length >= 6) {
    normalized = "0" + normalized.slice(3);
  } else if (
    !normalized.startsWith("0") &&
    (normalized.startsWith("7") || normalized.startsWith("8") || normalized.startsWith("9"))
  ) {
    normalized = "0" + normalized;
  }

  if (normalized.length < 4) {
    return null;
  }

  // 5-digit prefixes (MTN Visafone/special prefixes)
  const p5 = normalized.slice(0, 5);
  if (p5 === "07025" || p5 === "07026") {
    return "mtn";
  }

  const prefix = normalized.slice(0, 4);

  const mtn = [
    "0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906", "0913", "0916", "0704",
  ];
  const airtel = [
    "0802", "0808", "0708", "0812", "0701", "0902", "0901", "0904", "0907", "0911", "0912",
  ];
  const glo = [
    "0805", "0807", "0705", "0815", "0811", "0905", "0915",
  ];
  const nineMobile = [
    "0809", "0817", "0818", "0909", "0908",
  ];

  if (mtn.includes(prefix)) return "mtn";
  if (airtel.includes(prefix)) return "airtel";
  if (glo.includes(prefix)) return "glo";
  if (nineMobile.includes(prefix)) return "9mobile";
  return null;
}
