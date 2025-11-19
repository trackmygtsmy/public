import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  // Vercel/node may not parse body automatically in some environments
  if (!body || typeof body !== "object") {
    try {
      body = JSON.parse(req.rawBody || "{}");
    } catch (_) {}
  }

  const { key, code, update } = body || {};
  const ADMIN_KEY = process.env.ADMIN_KEY;

  if (!key || key !== ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  if (!code || !update || !update.status || !update.location) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const privatePath = path.join(process.cwd(), "tracking-data-private.json");
  const publicPath = path.join(process.cwd(), "tracking-data-public.json");

  const privateData = JSON.parse(fs.readFileSync(privatePath, "utf8"));
  if (!privateData[code]) {
    return res.status(404).json({ error: "Tracking number not found" });
  }

  privateData[code].history = privateData[code].history || [];
  privateData[code].history.push({
    status: update.status,
    timestamp: new Date().toISOString(),
    location: update.location,
    details: update.details || ""
  });

  fs.writeFileSync(privatePath, JSON.stringify(privateData, null, 2));

  // Update masked public record
  const publicData = JSON.parse(fs.readFileSync(publicPath, "utf8"));
  publicData[code] = {
    ...privateData[code],
    sender: {
      name: privateData[code].sender.name,
      address: maskAddress(privateData[code].sender.address),
      phone: maskPhone(privateData[code].sender.phone)
    },
    receiver: {
      name: privateData[code].receiver.name,
      address: maskAddress(privateData[code].receiver.address),
      phone: maskPhone(privateData[code].receiver.phone)
    }
  };

  fs.writeFileSync(publicPath, JSON.stringify(publicData, null, 2));

  return res.status(200).json({ success: true, parcel: privateData[code] });
}

function maskPhone(phone) {
  return phone ? phone.slice(0, 2) + "XXXX" + phone.slice(-3) : "—";
}
function maskAddress(address) {
  const parts = address.split(",");
  return parts.slice(-2).join(",").trim();
}
