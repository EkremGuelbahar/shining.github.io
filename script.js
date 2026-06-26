const START_HOUR = 9;
const END_HOUR = 18;
const INTERVAL_MINUTES = 30;

const datePicker = document.getElementById("datePicker");
const slotsContainer = document.getElementById("slots");
const bookingForm = document.getElementById("bookingForm");
const selectedSlotText = document.getElementById("selectedSlotText");
const message = document.getElementById("message");
const appointmentsList = document.getElementById("appointmentsList");

let selectedSlot = null;

function getTodayAsInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createSlots() {
  const slots = [];

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += INTERVAL_MINUTES) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      slots.push(time);
    }
  }

  return slots;
}

function getStorageKey(date) {
  return `appointments-${date}`;
}

function getAppointments(date) {
  const saved = localStorage.getItem(getStorageKey(date));
  return saved ? JSON.parse(saved) : [];
}

function saveAppointments(date, appointments) {
  localStorage.setItem(getStorageKey(date), JSON.stringify(appointments));
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}

function resetSelection() {
  selectedSlot = null;
  selectedSlotText.textContent = "Bitte zuerst eine Uhrzeit auswählen.";
}

function renderSlots() {
  const date = datePicker.value;
  const appointments = getAppointments(date);
  const bookedSlots = appointments.map((appointment) => appointment.time);

  slotsContainer.innerHTML = "";
  resetSelection();

  createSlots().forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = slot;
    button.className = "slot-button";

    if (bookedSlots.includes(slot)) {
      button.disabled = true;
      button.classList.add("booked");
      button.title = "Dieser Termin ist bereits belegt.";
    }

    button.addEventListener("click", () => {
      document.querySelectorAll(".slot-button").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
      selectedSlot = slot;
      selectedSlotText.textContent = `Ausgewählter Termin: ${formatGermanDate(date)} um ${slot} Uhr`;
      showMessage("", "");
    });

    slotsContainer.appendChild(button);
  });

  renderAppointments();
}

function renderAppointments() {
  const date = datePicker.value;
  const appointments = getAppointments(date).sort((a, b) => a.time.localeCompare(b.time));

  appointmentsList.innerHTML = "";

  if (appointments.length === 0) {
    appointmentsList.innerHTML = "<p>Noch keine Termine für dieses Datum.</p>";
    return;
  }

  appointments.forEach((appointment) => {
    const item = document.createElement("div");
    item.className = "appointment-item";
    item.innerHTML = `
      <div class="appointment-time">${appointment.time}</div>
      <div class="appointment-details">
        <strong>${escapeHtml(appointment.name)}</strong><br>
        ${escapeHtml(appointment.service)} · ${escapeHtml(appointment.phone)}
        ${appointment.note ? `<br><small>${escapeHtml(appointment.note)}</small>` : ""}
      </div>
    `;
    appointmentsList.appendChild(item);
  });
}

function formatGermanDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = datePicker.value;
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const service = document.getElementById("service").value;
  const note = document.getElementById("note").value.trim();

  if (!selectedSlot) {
    showMessage("Bitte wähle zuerst eine freie Uhrzeit aus.", "error");
    return;
  }

  if (!name || !phone) {
    showMessage("Bitte Name und Telefonnummer eintragen.", "error");
    return;
  }

  const appointments = getAppointments(date);
  const alreadyBooked = appointments.some((appointment) => appointment.time === selectedSlot);

  if (alreadyBooked) {
    showMessage("Dieser Termin wurde gerade belegt. Bitte wähle eine andere Uhrzeit.", "error");
    renderSlots();
    return;
  }

  appointments.push({
    id: crypto.randomUUID(),
    date,
    time: selectedSlot,
    name,
    phone,
    service,
    note,
    createdAt: new Date().toISOString(),
  });

  saveAppointments(date, appointments);
  bookingForm.reset();
  showMessage("Termin wurde eingetragen.", "success");
  renderSlots();
});

datePicker.addEventListener("change", renderSlots);

datePicker.value = getTodayAsInputValue();
datePicker.min = getTodayAsInputValue();
renderSlots();
