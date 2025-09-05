export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ ok: false, error: "Missing env vars" });
    }

    const body = req.body || {};
    const nama = (body.nama || "").toString().trim();
    const kehadiran = (body.kehadiran || "").toString().trim();
    const jumlah = Number.parseInt(body.jumlah, 10) || 1;
    const kontak = (body.kontak || "").toString().trim();
    const ucapan = (body.ucapan || "").toString().trim();

    if (!nama) return res.status(400).json({ ok: false, error: "Nama wajib diisi" });
    if (!kehadiran) return res.status(400).json({ ok: false, error: "Kehadiran wajib diisi" });
    if (!Number.isFinite(jumlah) || jumlah < 1) {
      return res.status(400).json({ ok: false, error: "Jumlah minimal 1" });
    }

    const text = [
      "Entri Buku Tamu Baru:",
      `• Nama: ${nama}`,
      `• Kehadiran: ${kehadiran}`,
      `• Jumlah Tamu: ${jumlah}`,
      kontak ? `• Kontak Tamu: ${kontak}` : "",
      ucapan ? `• Ucapan: ${ucapan}` : "",
    ].filter(Boolean).join("\n");

    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const tgResp = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
    });

    if (!tgResp.ok) {
      const detail = await tgResp.text().catch(() => "");
      return res.status(502).json({ ok: false, error: "Telegram error", detail });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
