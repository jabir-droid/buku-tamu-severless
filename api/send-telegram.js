// /api/send-telegram.js
// Vercel Serverless Function (Node 18+)

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendToTelegram(text) {
  if (!TOKEN || !CHAT_ID) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
  }
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Telegram error: ${resp.status} ${t}`);
  }
}

const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const trim = (s) => (s || "").toString().trim();

module.exports = async (req, res) => {
  // CORS sederhana
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};

    // ===== Konfirmasi Pembayaran =====
    if (trim(body.tipe).toLowerCase() === "konfirmasi_pembayaran") {
      const nama = trim(body.nama_pengirim);
      const metode = trim(body.metode);
      const nominalRaw = onlyDigits(body.nominal);
      const tanggal = trim(body.tanggal);
      const catatan = trim(body.catatan);

      if (!nama) return res.status(400).json({ error: "Nama pengirim wajib diisi" });
      if (!metode) return res.status(400).json({ error: "Metode wajib dipilih" });

      const nominal = nominalRaw ? Number(nominalRaw) : 0;
      const fmtNominal = nominal ? new Intl.NumberFormat("id-ID").format(nominal) : "-";

      const lines = [
        "💳 Konfirmasi Pembayaran",
        `Nama Pengirim: ${nama}`,
        `Metode: ${metode}`,
        `Nominal: Rp${fmtNominal}`,
        tanggal ? `Tanggal: ${tanggal}` : null,
        catatan ? `Catatan: ${catatan}` : null,
      ].filter(Boolean);

      await sendToTelegram(lines.join("\n"));
      return res.status(200).json({ ok: true });
    }

    // ===== Ucapan Tamu =====
    const nama = trim(body.nama);
    const kehadiran = trim(body.kehadiran);
    const jumlah = Number(onlyDigits(body.jumlah) || 1);
    const kontak = trim(body.kontak);
    const ucapan = trim(body.ucapan);

    if (!nama) return res.status(400).json({ error: "Nama wajib diisi" });
    if (!kehadiran) return res.status(400).json({ error: "Kehadiran wajib diisi" });

    const lines = [
      "📝 Ucapan Tamu",
      `Nama: ${nama}`,
      `Kehadiran: ${kehadiran}`,
      `Jumlah: ${isFinite(jumlah) && jumlah > 0 ? jumlah : 1}`,
      kontak ? `Nomor WA: ${kontak}` : null,
      ucapan ? `Ucapan: ${ucapan}` : null,
    ].filter(Boolean);

    await sendToTelegram(lines.join("\n"));
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal Error" });
  }
};
