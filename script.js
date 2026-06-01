const DATA_FILE = "participantes.json";

const totalParticipants = document.querySelector("#totalParticipants");
const lastUpdated = document.querySelector("#lastUpdated");
const visibleCount = document.querySelector("#visibleCount");
const participantsList = document.querySelector("#participantsList");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const clearSearch = document.querySelector("#clearSearch");

let participants = [];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function maskEmail(email) {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split("@");

  if (!local || !domain) return normalized;

  const firstPart = local.slice(0, 2);
  const lastPart = local.slice(-3);
  const hiddenLength = Math.max(local.length - firstPart.length - lastPart.length, 2);

  return `${firstPart}${"*".repeat(hiddenLength)}${lastPart}@${domain}`;
}

function getMaskedEmail(participant) {
  if (typeof participant === "string") return participant;
  return participant.masked_email || participant.email_masked || participant.email || "";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function renderList(filter = "") {
  const query = normalizeEmail(filter);
  const maskedQuery = query.includes("@") ? maskEmail(query) : query;

  const filtered = participants.filter((participant) => {
    const masked = normalizeEmail(getMaskedEmail(participant));
    return !query || masked.includes(query) || masked.includes(maskedQuery);
  });

  participantsList.innerHTML = "";

  filtered.forEach((participant) => {
    const item = document.createElement("li");
    item.textContent = getMaskedEmail(participant);
    participantsList.appendChild(item);
  });

  visibleCount.textContent = `${filtered.length} visibles`;
  emptyState.hidden = filtered.length !== 0;
}

async function loadParticipants() {
  try {
    const response = await fetch(`${DATA_FILE}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar participantes.json");

    const data = await response.json();
    participants = Array.isArray(data.participants) ? data.participants : [];

    totalParticipants.textContent = data.total ?? participants.length;
    lastUpdated.textContent = formatDate(data.updated_at);
    renderList(searchInput.value);
  } catch (error) {
    totalParticipants.textContent = "Error";
    lastUpdated.textContent = "No disponible";
    participantsList.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = "No se pudo cargar la lista. Intenta de nuevo más tarde.";
    console.error(error);
  }
}

searchInput.addEventListener("input", (event) => {
  renderList(event.target.value);
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderList("");
  searchInput.focus();
});

loadParticipants();
