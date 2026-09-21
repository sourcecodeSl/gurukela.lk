import axios from 'axios'
import { randomBytes } from 'crypto'
import env from '../config/env.js'
import { badRequest } from '../utils/http.js'

/**
 * Daily.co integration for in-site live classes.
 *
 * Unlike Zoom (one concurrent meeting per licensed host), a single Daily API key
 * hosts UNLIMITED concurrent rooms — so every slot / group class / seminar gets
 * its own room and any number of teachers can run classes at the same time.
 *
 *   - createRoom()    -> a private room (a token is required to join).
 *   - meetingToken()  -> a short-lived join token. The owning teacher gets an
 *                        owner token (can manage/record); students get a guest
 *                        token (join only).
 *
 * Config: DAILY_API_KEY + DAILY_DOMAIN (e.g. "yourco.daily.co").
 */

const API = 'https://api.daily.co/v1'

export const dailyConfigured = () => !!(env.daily.apiKey && env.daily.domain)

const authHeader = () => ({ Authorization: `Bearer ${env.daily.apiKey}` })

// Turn an axios failure into a readable message that carries Daily's own reason.
const dailyErr = (context, e) => {
  const d = e.response?.data
  const detail = d?.info || d?.error || e.message || 'unknown error'
  const code = e.response?.status ? ` (HTTP ${e.response.status})` : ''
  return badRequest(`Daily ${context} failed${code}: ${detail}`)
}

/** The public URL for a room name on the configured Daily domain. */
export const roomUrl = (name) => `https://${env.daily.domain}/${name}`

/**
 * Create a private Daily room. Returns { roomName, roomUrl }.
 * The room auto-expires a few hours after the class so stale rooms clean up.
 */
export async function createRoom({ duration } = {}) {
  // Our own short name so it fits the reused zoom_meeting_id VARCHAR(30) column.
  const name = 'gk-' + randomBytes(9).toString('hex') // 3 + 18 = 21 chars
  const nowSec = Math.floor(Date.now() / 1000)
  const exp = nowSec + (Math.max(1, duration || 60) + 180) * 60 // class length + 3h buffer
  try {
    const { data } = await axios.post(
      `${API}/rooms`,
      {
        name,
        privacy: 'private', // a meeting token is required to join
        properties: {
          exp,
          eject_at_room_exp: true,
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        },
      },
      { headers: authHeader() }
    )
    return { roomName: data.name, roomUrl: data.url || roomUrl(data.name) }
  } catch (e) {
    throw dailyErr('room creation', e)
  }
}

/**
 * A short-lived join token for a room. `isOwner` = the teacher (can manage the
 * room, admit, record); otherwise a guest (join only).
 */
export async function meetingToken({ roomName, isOwner, userName }) {
  const exp = Math.floor(Date.now() / 1000) + 4 * 3600
  try {
    const { data } = await axios.post(
      `${API}/meeting-tokens`,
      {
        properties: {
          room_name: roomName,
          is_owner: !!isOwner,
          user_name: userName || (isOwner ? 'Teacher' : 'Student'),
          exp,
        },
      },
      { headers: authHeader() }
    )
    return data.token
  } catch (e) {
    throw dailyErr('token creation', e)
  }
}
