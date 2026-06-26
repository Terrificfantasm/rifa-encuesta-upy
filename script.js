const DATA_URL = "participantes.json";

const state = {
  participants: [],
  winners: []
};

const elements = {
  totalRegistered: document.getElementById("totalRegistered"),
  validRaffleParticipants: document.getElementById("validRaffleParticipants"),
  updatedAt: document.getElementById("updatedAt"),
  visibleCount: document.getElementById("visibleCount"),
  list: document.getElementById("participantsList"),
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  searchResult: document.getElementById("searchResult"),
  wheel: document.getElementById("raffleWheel"),
  wheelTotal: document.getElementById("wheelTotal"),
  winnersList: document.getElementById("winnersList"),
  drawStatus: document.getElementById("drawStatus")
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
  const totalRegistered = data.total_registered ?? state.participants.length;
  const validRaffleParticipants =
    data.total_valid_raffle_participants ?? data.total ?? state.participants.length;

  if (elements.totalRegistered) {
    elements.totalRegistered.textContent = totalRegistered;
  }

  if (elements.validRaffleParticipants) {
    elements.validRaffleParticipants.textContent = validRaffleParticipants;
  }

  if (elements.updatedAt) {
    elements.updatedAt.textContent = formatDate(data.updated_at);
  }

  if (elements.wheelTotal) {
    elements.wheelTotal.textContent = validRaffleParticipants;
  }

  if (elements.drawStatus) {
    elements.drawStatus.textContent = data.draw_done
      ? "Rifa realizada"
      : "Rifa pendiente";
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

function renderWinners(winners) {
  if (!elements.winnersList) return;

  elements.winnersList.innerHTML = "";

  if (!Array.isArray(winners) || winners.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Todavía no se han publicado los ganadores.";
    elements.winnersList.appendChild(empty);
    return;
  }

  winners.forEach(winner => {
    const card = document.createElement("article");
    card.className = "winner-card";

    const prize = document.createElement("span");
    prize.className = "winner-prize";
    prize.textContent = `Premio ${winner.prize}`;

    const alias = document.createElement("strong");
    alias.className = "winner-alias";
    alias.textContent = winner.alias;

    card.appendChild(prize);
    card.appendChild(alias);

    elements.winnersList.appendChild(card);
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

function getWinsForAlias(alias) {
  return state.winners.filter(winner => winner.alias === alias);
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

  const participant = state.participants.find(
    item => item.email_hash === emailHash
  );

  if (!participant) {
    elements.searchResult.textContent = "No encontramos tu correo en la lista de participantes elegibles.";
    elements.searchResult.classList.add("error");
    return;
  }

  const wins = getWinsForAlias(participant.alias);

  if (wins.length === 0) {
    elements.searchResult.textContent = `Sí participaste como ${participant.alias}, pero esta vez no resultaste ganador.`;
    elements.searchResult.classList.add("neutral");
    return;
  }

  const prizeNumbers = wins
    .map(winner => `Premio ${winner.prize}`)
    .join(", ");

  const timesText = wins.length === 1
    ? "ganaste 1 vez"
    : `ganaste ${wins.length} veces`;

  elements.searchResult.textContent = `🎉 ¡Felicidades! Participaste como ${participant.alias} y ${timesText}. Resultado: ${prizeNumbers}.`;
  elements.searchResult.classList.add("success");
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

    state.winners = Array.isArray(data.winners)
      ? data.winners
      : [];

    renderSummary(data);
    renderWinners(state.winners);
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

    if (elements.winnersList) {
      elements.winnersList.innerHTML = "";

      const item = document.createElement("p");
      item.className = "empty-state";
      item.textContent = "No se pudieron cargar los resultados de la rifa.";
      elements.winnersList.appendChild(item);
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