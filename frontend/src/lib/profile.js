/**
 * A teacher must complete their profile before they can work on the platform.
 * Every field below is mandatory; only once they are all present can the
 * account be submitted for admin verification. The backend additionally
 * blocks publishing until an admin marks the account `verified`.
 */

export const REQUIRED_PROFILE_FIELDS = [
  { key: 'photoUrl', label: 'Profile picture' },
  { key: 'email', label: 'Email address' },
  { key: 'phone', label: 'Mobile number' },
  { key: 'title', label: 'Title / headline' },
  { key: 'city', label: 'City' },
  { key: 'bio', label: 'About you (bio)' },
  { key: 'subjectIds', label: 'Subjects you teach' },
  { key: 'demoVideoUrl', label: 'Demo video' },
]

const hasValue = (v) => {
  if (Array.isArray(v)) return v.length > 0
  return typeof v === 'string' ? v.trim().length > 0 : v != null && v !== ''
}

/** List of required fields still missing from an instructor profile. */
export function missingProfileFields(instructor) {
  if (!instructor) return REQUIRED_PROFILE_FIELDS.slice()
  return REQUIRED_PROFILE_FIELDS.filter((f) => !hasValue(instructor[f.key]))
}

/** True when every required profile field is filled in. */
export function isProfileComplete(instructor) {
  return missingProfileFields(instructor).length === 0
}
