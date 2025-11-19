document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const code = document.getElementById("trackingCode").value.trim();
  const status = document.getElementById("status").value.trim();
  const location = document.getElementById("location").value.trim();
  const details = document.getElementById("details").value.trim();
  const key = document.getElementById("adminKey").value.trim();

  try {
    const res = await fetch("/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, code, update: { status, location, details } })
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("updateResult").textContent = "Update successful!";
    } else {
      document.getElementById("updateResult").textContent = "Error: " + data.error;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("updateResult").textContent = "Request failed.";
  }
});
