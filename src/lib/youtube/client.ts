import type { YouTubeVideoListResponse } from './types'

const YOUTUBE_VIDEOS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos'
const YOUTUBE_VIDEO_PARTS = 'snippet,liveStreamingDetails,statistics,status'

export type YouTubeErrorCode =
  | 'invalid_api_key'
  | 'invalid_request'
  | 'malformed_response'
  | 'missing_api_key'
  | 'network_error'
  | 'quota_exceeded'
  | 'youtube_error'

export class YouTubeApiError extends Error {
  readonly code: YouTubeErrorCode
  readonly status: number

  constructor(code: YouTubeErrorCode, message: string, status: number) {
    super(message)
    this.name = 'YouTubeApiError'
    this.code = code
    this.status = status
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const readErrorReason = (body: unknown): string | undefined => {
  if (!isRecord(body) || !isRecord(body.error) || !Array.isArray(body.error.errors)) {
    return undefined
  }

  const [firstError] = body.error.errors
  if (!isRecord(firstError) || typeof firstError.reason !== 'string') {
    return undefined
  }

  return firstError.reason
}

const mapYouTubeError = (status: number, body: unknown): YouTubeApiError => {
  const reason = readErrorReason(body)

  if (reason === 'keyInvalid' || reason === 'keyExpired') {
    return new YouTubeApiError('invalid_api_key', 'YouTube API key was rejected.', 500)
  }

  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    return new YouTubeApiError('quota_exceeded', 'YouTube quota was exceeded.', 503)
  }

  if (status === 403) {
    return new YouTubeApiError('youtube_error', 'YouTube refused the request.', 502)
  }

  return new YouTubeApiError('youtube_error', 'YouTube request failed.', 502)
}

const isVideoListResponse = (body: unknown): body is YouTubeVideoListResponse => {
  if (!isRecord(body)) {
    return false
  }

  return body.items === undefined || Array.isArray(body.items)
}

export const fetchYouTubeVideoList = async (
  videoIds: string[],
): Promise<YouTubeVideoListResponse> => {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    throw new YouTubeApiError('missing_api_key', 'YouTube API key is not configured.', 500)
  }

  const url = new URL(YOUTUBE_VIDEOS_ENDPOINT)
  url.searchParams.set('part', YOUTUBE_VIDEO_PARTS)
  url.searchParams.set('id', videoIds.join(','))
  url.searchParams.set('key', apiKey)

  let response: Response

  try {
    response = await fetch(url)
  } catch {
    throw new YouTubeApiError('network_error', 'Could not reach YouTube.', 502)
  }

  let body: unknown

  try {
    body = await response.json()
  } catch {
    throw new YouTubeApiError('malformed_response', 'YouTube returned an unreadable response.', 502)
  }

  if (!response.ok) {
    throw mapYouTubeError(response.status, body)
  }

  if (!isVideoListResponse(body)) {
    throw new YouTubeApiError('malformed_response', 'YouTube returned an unexpected response.', 502)
  }

  return body
}
