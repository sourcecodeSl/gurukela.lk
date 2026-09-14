import axios from 'axios'
import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import { badRequest } from '../utils/http.js'

/**
 * Zoom integration for in-site live classes.
 *
 * Two Zoom Marketplace apps back this:
 *   - Meeting SDK app  -> SDK Key/Secret. Used to sign the join signature the
 *     embedded web client needs. (ZOOM_SDK_KEY / ZOOM_SDK_SECRET)
 *   - Server-to-Server OAuth app -> Account/Client id + secret. Used to create
 *     meetings via the REST API and to fetch the host's ZAK start token.
 *     (ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET)
 *
 * NOTE (free plan): meetings created under the account owner ("me") — a free
 * Zoom account allows a single host / one concurrent meeting and cuts group
 * calls at 40 minutes, with local-only recording. Upgrading to Pro removes
 * these limits and enables cloud recording without any code change here.
 */

export const zoomEmbedConfigured = () => !!(env.zoom.sdkKey && env.zoom.sdkSecret)
export const zoomApiConfigured = () =>
  !!(env.zoom.accountId && env.zoom.clientId && env.zoom.clientSecret)

// Cached Server-to-Server OAuth token so we don't mint one per request.
let cached = null // { token, exp }

async function accessToken() {
  if (!zoomApiConfigured()) throw badRequest('Zoom API credentials are not configured on the server')
  if (cached && cached.exp > Date.now() + 60_000) return cached.token

  const basic = Buffer.from(`${env.zoom.clientId}:${env.zoom.clientSecret}`).toString('base64')
  const { data } = await axios.post('https://zoom.us/oauth/token', null, {
    params: { grant_type: 'account_credentials', account_id: env.zoom.accountId },
    headers: { Authorization: `Basic ${basic}` },
  })
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 }
  return cached.token
}

/**
 * Create a Zoom meeting under the account owner. Returns the ids the embedded
 * client needs to join. `startTime` (ISO) makes it a scheduled meeting.
 */
export async function createMeeting({ topic, startTime, duration }) {
  const token = await accessToken()
  const { data } = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    {
      topic: (topic || 'Live class').slice(0, 200),
      type: startTime ? 2 : 1, // 2 = scheduled, 1 = instant
      start_time: startTime || undefined,
      duration: duration || 60,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false, // students wait until the teacher starts
        waiting_room: false,
        // Only the host/co-host can record; participants cannot record at all.
        auto_recording: 'none',
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return {
    meetingId: String(data.id),
    passcode: data.password || '',
    joinUrl: data.join_url || '',
  }
}

/** The account owner's ZAK token — required for the embedded client to *start*
 *  (host) a meeting rather than merely join it. */
export async function hostZak() {
  const token = await accessToken()
  const { data } = await axios.get('https://api.zoom.us/v2/users/me/token', {
    params: { type: 'zak' },
    headers: { Authorization: `Bearer ${token}` },
  })
  return data.token
}

/**
 * Meeting SDK signature (JWT, HS256) per Zoom's v2 spec.
 * role: 1 = host/co-host (can start + record), 0 = attendee.
 */
export function sdkSignature(meetingNumber, role) {
  if (!zoomEmbedConfigured()) throw badRequest('Zoom SDK credentials are not configured on the server')
  const iat = Math.floor(Date.now() / 1000) - 30
  const exp = iat + 60 * 60 * 2 // 2 hours
  const payload = {
    appKey: env.zoom.sdkKey,
    sdkKey: env.zoom.sdkKey,
    mn: String(meetingNumber),
    role,
    iat,
    exp,
    tokenExp: exp,
  }
  return jwt.sign(payload, env.zoom.sdkSecret, { algorithm: 'HS256' })
}
