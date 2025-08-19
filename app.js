// Código JS (similar al que te mostré antes, por espacio no lo repito todo aquí)
// app.js
const QUESTIONS = [
  "Estrategia y planeación de TI alineada al negocio",
  "Infraestructura (servidores/redes/nube) confiable y actualizada",
  "Seguridad de la información (políticas, backups, DRP)",
  "Soporte a usuarios con SLAs y seguimiento",
  "Aplicaciones actualizadas, integradas y documentadas",
  "Innovación y mejora continua impulsada por TI",
  "Cumplimiento normativo y licenciamiento",
  "Presupuesto de TI definido y controlado",
  "Talento de TI capacitado y con plan de desarrollo",
  "Monitoreo y KPIs de desempeño del área"
];

const qList = document.getElementById("questions");
const scoreEl = document.getElementById("score");
const bandEl = document.getElementById("band");
const barFill = document.getElementById("barFill");
const form = document.getElementById("ti-form");
const statusEl = document.getElementById("status");
const resultCard = document.getElementById("resultCard");
const finalScoreEl = document.getElementById("finalScore");
const finalBandEl = document.getElementById("finalBand");
const finalMessageEl = document.getElementById("finalMessage");

function makeSelect(name) {
  const sel = document.createElement("select");
  sel.name = name; 
  sel.required = true;
  const opts = ["",1,2,3,4,5];
  for (const v of opts) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v === "" ? "Seleccionar" : v;
    sel.appendChild(opt);
  }
  sel.addEventListener("change", updateScore);
  return sel;
}

// Render de preguntas + selects
QUESTIONS.forEach((q, i) => {
  const row = document.createElement("div");
  row.className = "q-item";

  const label = document.createElement("span");
  label.textContent = `${i + 1}. ${q}`;

  const select = makeSelect(`q${i + 1}`);

  row.appendChild(label);
  row.appendChild(select);
  qList.appendChild(row);
});

function calcScore() {
  let total = 0;
  QUESTIONS.forEach((_, i) => {
    const v = parseInt(form[`q${i + 1}`].value, 10);
    if (!isNaN(v)) total += v;
  });
  return total;
}

function bandFromScore(s) {
  if (s >= 40) return { label: "Verde — Área madura y sólida", color: "var(--good)" };
  if (s >= 25) return { label: "Amarillo — Oportunidades de mejora", color: "var(--warn)" };
  return { label: "Rojo — Requiere apoyo urgente", color: "var(--bad)" };
}

function updateScore() {
  const total = calcScore();
  scoreEl.textContent = total;
  const pct = Math.round((total / 50) * 100);
  barFill.style.width = pct + "%";
  const band = bandFromScore(total);
  bandEl.textContent = band.label;
  // pequeño glow según banda
  barFill.style.boxShadow = `0 0 12px ${band.color}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";

  // Validar que todas las preguntas estén respondidas
  for (let i = 1; i <= QUESTIONS.length; i++) {
    if (!form[`q${i}`].value) {
      statusEl.textContent = "Por favor, responde todas las preguntas.";
      return;
    }
  }

  const total = calcScore();
  const band = bandFromScore(total).label;

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    company: form.company.value.trim(),
    phone: (form.phone.value || "").trim(),
    notes: (form.notes.value || "").trim(),
    answers: QUESTIONS.map((q, idx) => ({
      q,
      score: Number(form[`q${idx + 1}`].value)
    })),
    total,
    band
  };

  // Mostrar resultado local
  finalScoreEl.textContent = total;
  finalBandEl.textContent = band;
  finalMessageEl.textContent =
    total >= 40
      ? "¡Buen trabajo! Mantén el rumbo y evalúa oportunidades de optimización."
      : total >= 25
      ? "Hay bases, pero con iniciativas focalizadas pueden lograr mejoras rápidas."
      : "Es un buen momento para intervenir con un plan de estabilización y seguridad.";
  resultCard.hidden = false;

  // Enviar a la API
  const btn = form.querySelector(".btn");
  btn.disabled = true;
  statusEl.textContent = "Enviando resultados por email…";

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error al enviar email");
    statusEl.textContent = "¡Listo! Revisa tu correo (y spam por si acaso).";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "No pudimos enviar el email ahora. Tu resultado se mostró arriba.";
  } finally {
    btn.disabled = false;
  }
});

// Inicializar
updateScore();
