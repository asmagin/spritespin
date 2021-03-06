import { clamp, wrap } from '../utils'
import { Data } from './models'
import { getState } from './state'

export function getPlaybackState(data: Data): PlaybackState {
  return getState(data, 'playback')
}

export interface PlaybackState {
  frameTime: number
  lastFrame: number
  lastLane: number
  handler: number
}

function updateLane(data: Data, lane: number) {
  data.lane = data.wrapLane
    ? wrap(lane, 0, data.lanes - 1, data.lanes)
    : clamp(lane, 0, data.lanes - 1)
}

function updateAnimationFrame(data: Data) {
  data.frame += (data.reverse ? -1 : 1)
  // wrap the frame value to fit in range [0, data.frames)
  data.frame = wrap(data.frame, 0, data.frames - 1, data.frames)
  // stop animation if loop is disabled and the stopFrame is reached
  if (!data.loop && (data.frame === data.stopFrame)) {
    stopAnimation(data)
  }
}

function updateInputFrame(data: Data, frame: number) {
  data.frame = Number(frame)
  data.frame = data.wrap
    ? wrap(data.frame, 0, data.frames - 1, data.frames)
    : clamp(data.frame, 0, data.frames - 1)
}

function updateAnimation(data: Data) {
  const state = getPlaybackState(data)
  if (state.handler) {
    updateBefore(data)
    updateAnimationFrame(data)
    updateAfter(data)
  }
}

function updateBefore(data: Data) {
  const state = getPlaybackState(data)
  state.lastFrame = data.frame
  state.lastLane = data.lane
}

function updateAfter(data: Data) {
  const state = getPlaybackState(data)
  if (state.lastFrame !== data.frame || state.lastLane !== data.lane) {
    data.target.trigger('onFrameChanged', data)
  }
  data.target.trigger('onFrame', data)
  data.target.trigger('onDraw', data)
}

/**
 * Updates the frame number of the SpriteSpin data. Performs an auto increment if no frame number is given.
 */
export function updateFrame(data: Data, frame: number, lane?: number) {
  updateBefore(data)
  if (frame != null) {
    updateInputFrame(data, frame)
  }
  if (lane != null) {
    updateLane(data, lane)
  }
  updateAfter(data)
}

/**
 * Stops the running animation on given SpriteSpin data.
 */
export function stopAnimation(data: Data) {
  data.animate = false
  const state = getPlaybackState(data)
  if (state.handler != null) {
    window.clearInterval(state.handler)
    state.handler = null
  }
}

/**
 * Starts animation on given SpriteSpin data if animation is enabled.
 */
export function applyAnimation(data: Data) {
  const state = getPlaybackState(data)
  if (state.handler && (!data.animate || state.frameTime !== data.frameTime)) {
    stopAnimation(data)
  }
  if (data.animate && !state.handler) {
    state.frameTime = data.frameTime
    state.handler = window.setInterval(() => updateAnimation(data), state.frameTime)
  }
}

/**
 * Starts the animation playback
 */
export function startAnimation(data: Data) {
  data.animate = true
  applyAnimation(data)
}
