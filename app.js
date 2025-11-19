function getPrefillCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  return code && code.trim() ? code.trim() : null;
}

function maskPhone(phone) {
  if (!phone) return "—";
  return phone.slice(0, 2) + "XXXX" + phone.slice(-3);
}

function maskAddress(address) {
  if (!address) return "—";
  const parts = address.split(",");
  return parts.slice(-2).join(",").trim();
}

function renderParcel(code, parcel) {
  document.getElementById("resultCode").textContent = code;
  document.getElementById("currentStatus").textContent = parcel.currentStatus;
  document.getElementById("estDelivery").textContent = parcel.estDelivery;

  document.getElementById("serviceType").textContent = parcel.service;
  document.getElementById("deliveryProtection").textContent = parcel.deliveryProtection;
  document.getElementById("referenceCode").textContent = parcel.referenceCode;

  document.getElementById("weight").textContent = parcel.weight;
  document.getElementById("dimensions").textContent = parcel.dimensions;

  const itemsList = document.getElementById("itemsList");
  itemsList.innerHTML = "";
  if (Array.isArray(parcel.items)) {
    const ul = document.createElement("ul");
    parcel.items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.qty} × ${item.name} (${item.weight})`;
      ul.appendChild(li);
    });
    itemsList.appendChild(ul);
  }

  document.getElementById("senderName").textContent = parcel.sender?.name || "—";
  document.getElementById("senderAddress").textContent = parcel.sender?.address || "—";
  document.getElementById("receiverName").textContent = parcel.receiver?.name || "—";
  document.getElementById("receiverAddress").textContent = parcel.receiver?.address || "—";

  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";
  (parcel.history || []).forEach(event => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `<strong>${event.timestamp}</strong> — ${event.status}<br><small>${event.location}</small><br>${event.details}`;
    timeline.appendChild(div);
  });

  document.getElementById("result").classList.remove("hidden");

  const share = document.getElementById("shareLink");
  const url = new URL(window.location.href);
  url.searchParams.set("code", code);
  share.href = url.toString();
  share.addEventListener("click", (e) => {
    e.preventDefault();
    navigator.clipboard?.writeText(url.toString());
    share.textContent = "Link copied";
    setTimeout(() => (share.textContent = "Copy share link"), 1500);
  });
}

async function fetchAndRender(code) {
  try {
    const res = await fetch("tracking-data-public.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load tracking data");
    const data = await res.json();

    if (data[code]) {
      renderParcel(code, data[code]);
    } else {
      alert("Tracking number not found.");
    }
  } catch (err) {
    console.error(err);
    alert("Error loading tracking data.");
  }
}

document.getElementById("trackingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = document.getElementById("trackingInput").value.trim();
  if (!code) return;
  const url = new URL(window.location.href);
  url.searchParams.set("code", code);
  history.replaceState({}, "", url.toString());
  await fetchAndRender(code);
});

window.addEventListener("DOMContentLoaded", async () => {
  const code = getPrefillCode();
  if (code) {
    document.getElementById("trackingInput").value = code;
    await fetchAndRender(code);
  }

  const sections = {
    navTrackNew: "panelTrackNew",
    navReportIssue: "panelReportIssue",
    navDeliverySupport: "panelDeliverySupport",
    navFeedback: "panelFeedback",
  };
  Object.keys(sections).forEach(id => {
    const link = document.getElementById(id);
    link?.addEventListener("click", () => {
      document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
      document.getElementById(sections[id]).classList.remove("hidden");
      document.getElementById(sections[id]).scrollIntoView({ behavior: "smooth" });
    });
  });

  document.getElementById("printBtn").addEventListener("click", () => {
    window.print();
  });
});
