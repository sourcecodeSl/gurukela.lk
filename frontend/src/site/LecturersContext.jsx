/**
 * Real lecturer data for the public site.
 *
 * The marketing pages used to render a hand-written `lecturers` array from
 * siteData.js. They now read the academy's actual registered instructors from
 * the API (`GET /instructors`, public view — only active, non-banned, contact
 * hidden), joined with the subject/module catalogue so each lecturer still
 * carries the subject / stream / medium the site UI expects.
 *
 * One fetch for the whole signed-out tree: the provider sits in SiteRoutes and
 * every page reads it through `useLecturers()`.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const LecturersContext = createContext(null)

/* Backend stream labels (subject.streams) → the site's stream ids in siteData. */
const STREAM_MAP = {
  'O/L': 'ordinary-level',
  'A/L Physical Science': 'al-science',
  'A/L Biological Science': 'al-science',
  'A/L Technology': 'al-technology',
  'A/L Commerce': 'al-commerce',
  'A/L Arts': 'other',
}

const uniq = (arr) => [...new Set(arr.filter(Boolean))]

/** Shape one API instructor (+ catalogue lookups) into the site lecturer form. */
function toLecturer(ins, subjectById) {
  const subjectIds = uniq(ins.subjectIds || [])
  const subjects = uniq(subjectIds.map((sid) => subjectById[sid]?.name))
  const streams = uniq(
    subjectIds.flatMap((sid) => (subjectById[sid]?.streams || []).map((s) => STREAM_MAP[s] || 'other'))
  )

  const languages = Array.isArray(ins.languages) ? ins.languages : []
  const mediums = uniq(languages.filter((l) => l === 'Sinhala' || l === 'English'))
  if (!mediums.length) mediums.push('Sinhala')
  // Card badge shows one medium; Sinhala is the default medium of instruction.
  const medium = mediums.includes('Sinhala') ? 'Sinhala' : mediums[0]

  const years = Number(ins.experienceYears) || 0
  const students = Number(ins.studentCount) || 0
  const rating = Number(ins.rating) || 0

  const highlights = Array.isArray(ins.highlights) ? ins.highlights.filter(Boolean) : []
  const qualifications = highlights.length
    ? highlights
    : uniq([
        years ? `${years} years of teaching experience` : null,
        ins.city ? `Based in ${ins.city}` : null,
        ins.verified ? 'Verified Gurukela lecturer' : null,
      ])

  return {
    id: ins.id,
    name: ins.name,
    title: ins.title || 'Lecturer',
    subject: subjects[0] || ins.title || 'Lecturer',
    subjects,
    stream: streams[0] || 'other',
    streams: streams.length ? streams : ['other'],
    medium,
    mediums,
    years,
    students,
    rating,
    verified: !!ins.verified,
    bio:
      ins.bio ||
      `${ins.name} teaches with Gurukela${years ? `, bringing ${years} years in the classroom` : ''}.`,
    qualifications,
    // The academy sells the same class types for every lecturer; fees/schedule
    // are product-level, defined on the profile page.
    classes: ['Theory', 'Revision', 'Paper Class'],
  }
}

export function LecturersProvider({ children }) {
  const [state, setState] = useState({ lecturers: [], loading: true, error: null })

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('/instructors', { auth: false }),
      api.get('/subjects', { auth: false }).catch(() => []),
    ])
      .then(([instructors, subjects]) => {
        if (!alive) return
        const subjectById = {}
        for (const s of subjects || []) subjectById[s.id] = s

        const lecturers = (instructors || []).map((ins) => toLecturer(ins, subjectById))
        setState({ lecturers, loading: false, error: null })
      })
      .catch((err) => {
        if (alive) setState({ lecturers: [], loading: false, error: err })
      })
    return () => {
      alive = false
    }
  }, [])

  const value = useMemo(() => {
    const { lecturers } = state
    return {
      ...state,
      lecturerById: (id) => lecturers.find((l) => l.id === id) || null,
      lecturersOf: (streamId) => lecturers.filter((l) => l.streams.includes(streamId)),
    }
  }, [state])

  return <LecturersContext.Provider value={value}>{children}</LecturersContext.Provider>
}

export function useLecturers() {
  const ctx = useContext(LecturersContext)
  if (!ctx) throw new Error('useLecturers must be used inside <LecturersProvider>')
  return ctx
}
