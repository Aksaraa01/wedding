#!/usr/bin/env node
// Gateway WhatsApp CS (Baileys) — proses terpisah dari app Next.
//
//   GET  /status           → { connected, me, pairing, qr }
//   POST /pair   { phone } → mulai pairing (kode 8 karakter + QR data URL)
//   POST /logout           → logout + hapus sesi
//   POST /send   { phone, message } → kirim teks
//
// Inbound (teks/gambar) diteruskan ke app:
//   POST ${CS_APP_INBOUND} dengan header x-cs-secret: ${CS_INBOUND_SECRET}
// Balasan dari app dikirim kembali ke WhatsApp oleh gateway ini.
//
// Semua endpoint butuh header x-cs-secret = CS_GATEWAY_SECRET.

import http from "node:http"
import { rm } from "node:fs/promises"
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  normalizeMessageContent,
  getContentType,
} from "@whiskeysockets/baileys"
import pino from "pino"
import QRCode from "qrcode"

const PORT = Number(process.env.CS_GATEWAY_PORT || 3101)
const AUTH_DIR = process.env.CS_WA_AUTH_DIR || "/home/askaraa/cs-wa/auth"
const APP_INBOUND =
  process.env.CS_APP_INBOUND || "https://wedding.aksaraa.com/api/cs/wa/inbound"
const APP_SECRET = process.env.CS_INBOUND_SECRET || ""
const SECRET = process.env.CS_GATEWAY_SECRET || ""

let sock = null
let connected = false
let me = null
let pairing = false
let pairingPhone = ""
let pairingCode = ""
let qrDataUrl = ""
let starting = false
// ID pesan yang kita kirim sendiri: echo fromMe-nya tidak boleh diteruskan
// kembali ke app (kalau tidak, balasan bot tercatat sebagai pesan masuk).
const sentIds = new Set()
const seenInbound = new Set()
// Chat yang baru saja dibalas MANUSIA dari HP/WhatsApp Web. Balasan bot yang
// sedang diproses (2-15 detik) harus dibatalkan di titik terakhir ini, karena
// app bisa saja belum sempat melihat pesan manusia tersebut.
const humanBlock = new Map()
const HUMAN_BLOCK_MS = 120_000

function humanOwns(jid) {
  const at = humanBlock.get(jid) || 0
  return Date.now() - at < HUMAN_BLOCK_MS
}

function markHuman(remote) {
  if (remote) humanBlock.set(remote, Date.now())
}

const log = (...args) => console.log(new Date().toISOString(), ...args)

function jidFor(phone) {
  const digits = String(phone || "").replace(/\D/g, "")
  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("62")
      ? digits
      : `62${digits}`
  return `${normalized}@s.whatsapp.net`
}

async function safeSend(jid, text) {
  let timer = null
  try {
    return await Promise.race([
      sock.sendMessage(jid, { text }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("send timeout")), 15000)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

let inboundChain = Promise.resolve()

function enqueueInbound(message) {
  inboundChain = inboundChain
    .then(() => forwardInbound(message))
    .catch((error) => log("inbound failed", String(error?.message || error)))
  return inboundChain
}

async function forwardInbound(message) {
  const key = message.key || {}
  if (key.fromMe && sentIds.has(key.id)) return
  const remote = key.remoteJid || ""
  // Sejak 2025 banyak chat langsung memakai @lid, bukan @s.whatsapp.net.
  // Terima keduanya; nomor telepon diambil dari remoteJidAlt/senderPn bila ada.
  const isDirect = remote.endsWith("@s.whatsapp.net") || remote.endsWith("@lid")
  if (!isDirect) return

  const alt = key.remoteJidAlt || key.senderPn || ""
  const fromJid = alt.endsWith("@s.whatsapp.net") ? alt : remote
  // fromMe yang BUKAN kiriman bot = manusia ikut membalas. Tandai segera
  // (sebelum antrean diproses) supaya balasan bot yang sedang jalan dibatalkan.
  if (key.fromMe) markHuman(remote)
  log("inbound", key.fromMe ? "me" : "them", remote.endsWith("@lid") ? "lid" : "pn", (key.id || "").slice(0, 12))

  // Pesan dari perangkat tertaut (WhatsApp Web/Desktop) dibungkus
  // deviceSentMessage / ephemeral / viewOnce. Tanpa normalisasi, imageMessage
  // tidak terlihat dan pesan dibuang diam-diam.
  const content = normalizeMessageContent(message.message) || {}
  const type = getContentType(content)
  log("inbound type", type || "unknown")

  const text =
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    ""

  let unsupported = ""
  if (!text && !content.imageMessage) {
    if (content.audioMessage) unsupported = "voice note"
    else if (content.stickerMessage) unsupported = "stiker"
    else if (content.documentMessage) unsupported = "dokumen"
    else if (content.locationMessage) unsupported = "lokasi"
    else if (content.contactMessage) unsupported = "kontak"
    else if (type === "imageMessage") unsupported = "foto"
    else if (type === "videoMessage") unsupported = "video"
    else return
  }

  let mediaBase64 = ""
  let mimeType = ""
  const image = content.imageMessage || content.documentWithCaptionMessage?.message?.documentMessage
  if (image) {
    try {
      const buffer = await Promise.race([
        downloadMediaMessage(message, "buffer", {}, { logger: pino({ level: "fatal" }), reuploadRequest: sock.updateMediaMessage }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("media timeout")), 20000)),
      ])
      mediaBase64 = Buffer.from(buffer).toString("base64")
      mimeType = image.mimetype || "image/jpeg"
    } catch (error) {
      log("media download failed", String(error?.message || error))
      unsupported = "foto"
    }
  }

  if (!text && !mediaBase64 && !unsupported) return

  try {
    const res = await fetch(APP_INBOUND, {
      method: "POST",
      headers: { "content-type": "application/json", "x-cs-secret": APP_SECRET },
      body: JSON.stringify({
        from: fromJid,
        push_name: message.pushName || "",
        text,
        wa_message_id: key.id || "",
        from_me: !!key.fromMe,
        media_base64: mediaBase64 || undefined,
        mime_type: mimeType || undefined,
        unsupported: unsupported || undefined,
      }),
      signal: AbortSignal.timeout(60_000),
    })
    const data = await res.json().catch(() => ({}))
    log("forward ok", "replies", (data.replies || []).length)
    const replies = (data.replies || []).filter((r) => r?.text)
    // Album / beberapa foto sekaligus: app membalas per foto. Kirim hanya
    // balasan terakhir agar klien tidak menerima 4 pesan "tersimpan (1/5)…".
    const toSend = image ? replies.slice(-1) : replies
    for (const reply of toSend) {
      if (!reply?.text) continue
      if (key.fromMe) continue

      // Kirim ke chat asal (lid) dulu; kalau gagal/timeout, coba JID telepon.
      if (humanOwns(remote) || humanOwns(fromJid)) {
        log("reply skipped", "human replied in this chat")
        continue
      }

      const candidates = [remote, fromJid].filter(
        (jid, index, list) => !!jid && jid !== list[index - 1]
      )
      let delivered = false
      for (const target of candidates) {
        try {
          const sent = await safeSend(target, reply.text)
          delivered = true
          const id = sent?.key?.id
          if (id) {
            sentIds.add(id)
            if (sentIds.size > 300) sentIds.delete(sentIds.values().next().value)
          }
          log("reply sent", id ? "ok" : "no-id", target.endsWith("@lid") ? "lid" : "pn")
          break
        } catch (error) {
          log("reply failed", target.endsWith("@lid") ? "lid" : "pn", String(error?.message || error))
        }
      }
      if (!delivered) log("reply undelivered")
    }
  } catch (error) {
    log("forward failed", String(error?.message || error))
  }
}

async function connect() {
  if (starting) return
  starting = true
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: "fatal" }),
      markOnlineOnConnect: false,
    })

    sock.ev.on("creds.update", saveCreds)
    sock.ev.on("messages.upsert", async (event) => {
      if (event.type && event.type !== "notify") return
      for (const message of event.messages || []) {
        const id = message?.key?.id
        if (!id) continue
        if (seenInbound.has(id)) continue
        seenInbound.add(id)
        if (seenInbound.size > 500) seenInbound.delete(seenInbound.values().next().value)
        await enqueueInbound(message)
      }
    })

    sock.ev.on("connection.update", async (update) => {
      if (update.qr) {
        qrDataUrl = await QRCode.toDataURL(update.qr, { width: 320, margin: 1 }).catch(() => "")
        // File publik sementara supaya QR bisa dibuka langsung dari browser
        // (cdn.aksaraa.com menyajikan public/ tanpa lewat manifest Next).
        await QRCode.toFile("/var/www/aksara-wedding/.next/standalone/public/cs-pair.png", update.qr, {
          width: 420,
          margin: 1,
        }).catch(() => {})
      }
      if (update.connection === "open") {
        connected = true
        me = sock.user?.id || null
        pairing = false
        pairingCode = ""
        qrDataUrl = ""
        log("connected", me)
      }
      if (update.connection === "close") {
        connected = false
        const code = update.lastDisconnect?.error?.output?.statusCode
        log("close", code)
        starting = false
        if (code === DisconnectReason.loggedOut) {
          me = null
          pairing = false
          pairingCode = ""
          return
        }
        setTimeout(connect, code === DisconnectReason.restartRequired ? 500 : 2000)
        return
      }
    })
  } catch (error) {
    log("connect error", String(error?.message || error))
  } finally {
    starting = false
  }
}

async function startPairing(phone) {
  if (connected) return { error: "Nomor sudah terhubung." }
  pairing = true
  pairingPhone = phone
  pairingCode = ""
  qrDataUrl = ""
  if (!sock) await connect()
  // Kode pairing dibuat setelah socket benar-benar connecting.
  await new Promise((resolve) => setTimeout(resolve, 1200))
  try {
    const code = await sock.requestPairingCode(jidFor(phone).split("@")[0])
    pairingCode = code
    log("pairing code", code)
    return { code, qr: qrDataUrl }
  } catch (error) {
    return { error: String(error?.message || error) }
  }
}

async function logout() {
  try {
    if (sock) await sock.logout()
  } catch (error) {
    log("logout error", String(error?.message || error))
  }
  connected = false
  me = null
  pairing = false
  pairingCode = ""
  qrDataUrl = ""
  await rm(AUTH_DIR, { recursive: true, force: true })
  return { ok: true }
}

async function send(phone, message, jid) {
  if (!connected || !sock) return { error: "Gateway belum terhubung ke WhatsApp." }

  // App bisa mengirim langsung ke JID chat (lid) untuk balasan yang tidak
  // lewat antrean `replies`.
  if (jid && (jid.endsWith("@lid") || jid.endsWith("@s.whatsapp.net"))) {
    try {
      await safeSend(jid, message)
      log("jid send ok", jid.endsWith("@lid") ? "lid" : "pn")
      return { ok: true, jid }
    } catch (error) {
      log("jid send failed", String(error?.message || error))
      return { error: String(error?.message || error) }
    }
  }

  // Nomor mentah belum tentu JID yang bisa dikirimi; tanya WhatsApp dulu.
  let target = jidFor(phone)
  try {
    const [resolved] = (await Promise.race([
      sock.onWhatsApp(phone),
      new Promise((_, reject) => setTimeout(() => reject(new Error("lookup timeout")), 8000)),
    ])) || []
    if (resolved?.jid) target = resolved.jid
    else return { error: "nomor tidak terdaftar di WhatsApp" }
  } catch {
    // lanjut dengan JID tebakan
  }

  try {
    await safeSend(target, message)
    return { ok: true, jid: target }
  } catch (error) {
    return { error: String(error?.message || error) }
  }
}

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  if (SECRET && req.headers["x-cs-secret"] !== SECRET) return json(res, 401, { error: "unauthorized" })

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)

  if (req.method === "GET" && url.pathname === "/status") {
    return json(res, 200, { connected, me, pairing, pairingCode, qr: qrDataUrl })
  }

  if (req.method === "POST" && (url.pathname === "/pair" || url.pathname === "/logout" || url.pathname === "/send")) {
    let body = {}
    try {
      body = await req.json()
    } catch {}
    if (url.pathname === "/pair") return json(res, 200, await startPairing(String(body.phone || "")))
    if (url.pathname === "/logout") return json(res, 200, await logout())
    return json(res, 200, await send(String(body.phone || ""), String(body.message || ""), String(body.jid || "")))
  }

  return json(res, 404, { error: "not found" })
})

server.listen(PORT, "127.0.0.1", () => log(`gateway listening on ${PORT}`))
connect()
