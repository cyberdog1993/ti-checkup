// Código Node con SendGrid (como te pasé en detalle arriba)

// /api/submit.js
const sgMail = require("@sendgrid/mail");

const ADMIN_EMAIL = "julio.valdez@consultores-it.com";

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    // CORS opcional (por si algún día sirves frontend fuera de Vercel)
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing SENDGRID_API_KEY" });

  sgMail.setApiKey(apiKey);

  try {
    const { name, email, company, phone, notes, answers, total, band } = req.body || {};
    if (!name || !email || !company || !answers || typeof total !== "number") {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const dateStr = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
    const table = answers.map((a, i) => `${i + 1}. ${a.q}: ${a.score}/5`).join("\n");

    const userMsg = {
      to: email,
      from: { email: "no-reply@consultores-it.com", name: "Consultores-IT" },
      subject: `Tu resultado de Autoevaluación TI: ${total}/50`,
      text:
`Hola ${name},

Gracias por completar la Autoevaluación de TI.
Fecha: ${dateStr}

Resultado: ${total}/50 — ${band}

Detalle:
${table}

Comentarios que enviaste:
${notes || "(sin comentarios)"}

Siguiente paso:
Si tu resultado está en amarillo o rojo, contáctanos y te ayudamos a llevar tu área de TI y tu empresa al siguiente nivel.

Saludos,
Consultores-IT`,
      html:
`<p>Hola <strong>${escapeHtml(name)}</strong>,</p>
<p>Gracias por completar la <strong>Autoevaluación de TI</strong>.</p>
<p><strong>Fecha:</strong> ${escapeHtml(dateStr)}</p>
<p style="font-size:16px"><strong>Resultado:</strong> ${total}/50 — ${escapeHtml(band)}</p>
<pre style="background:#0b1220;color:#e8eef6;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(table)}</pre>
<p><em>Comentarios:</em> ${escapeHtml(notes || "(sin comentarios)")}</p>
<hr />
<p><strong>Siguiente paso:</strong><br/>
Si tu resultado está en amarillo o rojo, contáctanos y te ayudamos a llevar <strong>tu área de TI y tu empresa</strong> al siguiente nivel.</p>
<p>— Consultores-IT</p>`
    };

    const adminMsg = {
      to: ADMIN_EMAIL,
      from: { email: "no-reply@consultores-it.com", name: "Consultores-IT" },
      subject: `Nuevo Lead: ${company} · ${name} · ${total}/50`,
      text:
`Nuevo lead de Autoevaluación TI

Fecha: ${dateStr}
Nombre: ${name}
Email: ${email}
Empresa: ${company}
Teléfono: ${phone || "(no indicado)"}

Resultado: ${total}/50 — ${band}

Detalle:
${table}

Notas del lead:
${notes || "(sin comentarios)"}`
    };

    await sgMail.send(userMsg);
    await sgMail.send(adminMsg);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo enviar el email" });
  }
};
