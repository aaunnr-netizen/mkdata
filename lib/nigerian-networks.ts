/**
 * Nigerian Telecom Operator Prefix Detection
 */
export function detectNigerianNetwork(
  phone: string
): "mtn" | "airtel" | "glo" | "9mobile" | null {
  const clean = phone.replace(/[^0-9]/g, "");
  let prefix = "";

  if (clean.startsWith("234") && clean.length >= 7) {
    prefix = "0" + clean.slice(3, 6);
  } else if (clean.startsWith("0") && clean.length >= 4) {
    prefix = clean.slice(0, 4);
  } else {
    return null;
  }

  const mtn = [
    "0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906", "0913", "0916", "0704",
  ];
  const airtel = [
    "0802", "0808", "0708", "0812", "0701", "0902", "0901", "0904", "0907", "0912",
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
