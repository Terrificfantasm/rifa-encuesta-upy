const DATA_URL = "participantes.json";

const state = {
  participants: []
};

const elements = {
  total: document.getElementById("totalParticipants"),
  updatedAt: document.getElementById("updatedAt"),
  visibleCount: document.getElementById("visibleCount"),
  list: document.getElementById("participantsList"),
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  searchResult: document.getElementById("searchResult"),
  wheel: document.getElementById("raffleWheel"),
  wheelTotal: document.getElementById("wheelTotal")
};

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function sha256Hex(text) {
  const encodedText = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedText);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getParticipantAlias(participant) {
  return participant.alias || "Participante";
}

function renderSummary(data) {
  if (elements.total) {
    elements.total.textContent = data.total ?? state.participants.length;
  }

  if (elements.updatedAt) {
    elements.updatedAt.textContent = formatDate(data.updated_at);
  }

  if (elements.wheelTotal) {
    elements.wheelTotal.textContent = data.total ?? state.participants.length;
  }
}

function renderParticipants(participants) {
  if (!elements.list) return;

  elements.list.innerHTML = "";

  if (elements.visibleCount) {
    elements.visibleCount.textContent = `${participants.length} visibles`;
  }

  if (participants.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Todavía no hay participantes registrados.";
    elements.list.appendChild(empty);
    return;
  }

  participants.forEach(participant => {
    const item = document.createElement("li");
    item.textContent = getParticipantAlias(participant);
    elements.list.appendChild(item);
  });
}

function renderWheel(participants) {
  if (!elements.wheel) return;

  elements.wheel.innerHTML = "";

  if (participants.length === 0) {
    return;
  }

  const maxLabels = Math.min(participants.length, 80);
  const visibleParticipants = participants.slice(0, maxLabels);
  const step = 360 / visibleParticipants.length;

  visibleParticipants.forEach((participant, index) => {
    const label = document.createElement("span");
    label.className = "wheel-label";
    label.textContent = getParticipantAlias(participant);
    label.style.setProperty("--angle", `${index * step}deg`);
    elements.wheel.appendChild(label);
  });
}

async function searchParticipant() {
  if (!elements.searchInput || !elements.searchResult) return;

  const rawEmail = elements.searchInput.value;
  const email = normalizeEmail(rawEmail);

  elements.searchResult.className = "search-result";

  if (!email) {
    elements.searchResult.textContent = "Escribe tu correo institucional para buscarte.";
    elements.searchResult.classList.add("neutral");
    return;
  }

  const validEmail = /^\d{6,9}@upy\.edu\.mx$/i.test(email);

  if (!validEmail) {
    elements.searchResult.textContent = "Revisa que el correo tenga formato válido, por ejemplo: 2310419@upy.edu.mx";
    elements.searchResult.classList.add("warning");
    return;
  }

  const emailHash = await sha256Hex(email);

  const match = state.participants.find(
    participant => participant.email_hash === emailHash
  );

  if (match) {
    elements.searchResult.textContent = `Sí estás registrado como ${match.alias}.`;
    elements.searchResult.classList.add("success");
  } else {
    elements.searchResult.textContent = "No encontramos tu correo registrado todavía. Si acabas de contestar, espera a que se actualice la lista.";
    elements.searchResult.classList.add("error");
  }
}

async function loadParticipants() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`);

    if (!response.ok) {
      throw new Error("No se pudo cargar participantes.json");
    }

    const data = await response.json();

    state.participants = Array.isArray(data.participants)
      ? data.participants
      : [];

    renderSummary(data);
    renderParticipants(state.participants);
    renderWheel(state.participants);
  } catch (error) {
    console.error(error);

    if (elements.list) {
      elements.list.innerHTML = "";
      const item = document.createElement("li");
      item.className = "empty-state";
      item.textContent = "No se pudo cargar la lista de participantes.";
      elements.list.appendChild(item);
    }
  }
}

if (elements.searchButton) {
  elements.searchButton.addEventListener("click", searchParticipant);
}

if (elements.searchInput) {
  elements.searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      searchParticipant();
    }
  });
}

loadParticipants();