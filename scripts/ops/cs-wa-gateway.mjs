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
  log("inbound", key.fromMe ? "me" : "them", remote.endsWith("@lid") ? "lid" : "pn", (key.id || "").slice(0, 12))

  const content = message.message || {}
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
    else return
  }

  let mediaBase64 = ""
  let mimeType = ""
  const image = content.imageMessage
  if (image) {
    try {
      const buffer = await downloadMediaMessage(message, "buffer", {}, { logger: pino({ level: "fatal" }), reuploadRequest: sock.updateMediaMessage })
      mediaBase64 = Buffer.from(buffer).toString("base64")
      mimeType = image.mimetype || "image/jpeg"
    } catch (error) {
      log("media download failed", String(error?.message || error))
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
    for (const reply of data.replies || []) {
      if (!reply?.text) continue
      if (key.fromMe) continue
      const sent = await sock.sendMessage(remote, { text: reply.text })
      const id = sent?.key?.id
      if (id) {
        sentIds.add(id)
        if (sentIds.size > 300) sentIds.delete(sentIds.values().next().value)
      }
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
      for (const message of event.messages || []) {
        await forwardInbound(message)
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

async function send(phone, message) {
  if (!connected || !sock) return { error: "Gateway belum terhubung ke WhatsApp." }
  await sock.sendMessage(jidFor(phone), { text: message })
  return { ok: true }
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
    return json(res, 200, await send(String(body.phone || ""), String(body.message || "")))
  }

  return json(res, 404, { error: "not found" })
})

server.listen(PORT, "127.0.0.1", () => log(`gateway listening on ${PORT}`))
connect()
