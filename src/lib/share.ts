import LZString from 'lz-string'
import type { SharedPayload } from '../types'

const PREFIX = 'BS1-'

export function encodeShared(payload: SharedPayload): string {
  return PREFIX + LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

export function decodeShared(input: string): SharedPayload | null {
  if (!input) return null
  let code = input.trim()
  const idx = code.indexOf(PREFIX)
  if (idx >= 0) code = code.slice(idx)
  if (!code.startsWith(PREFIX)) return null
  try {
    const json = LZString.decompressFromEncodedURIComponent(code.slice(PREFIX.length))
    if (!json) return null
    const data = JSON.parse(json) as SharedPayload
    if (!data || data.v !== 1 || !data.bike || !data.params || !data.weather || !data.rider) return null
    if (!data.bike.fork || !data.bike.rear || !data.bike.geometry || !data.bike.wheels) return null
    return data
  } catch {
    return null
  }
}

/** Полная ссылка для отправки другу. */
export function shareUrl(code: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/share/${code}`
}

export function fullShareLink(payload: SharedPayload): string {
  return shareUrl(encodeShared(payload))
}
