/**
 * Notification Sound Utility — Web Audio API
 * Generates short, pleasant tones without any external files.
 */

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

/**
 * Play a short notification tone.
 * @param {'success'|'error'|'info'|'warning'} type
 */
export function playNotificationSound(type = 'info') {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Volume
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)

    const now = ctx.currentTime

    switch (type) {
      case 'success':
        // Two ascending notes — cheerful ding-ding
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(523, now)       // C5
        oscillator.frequency.setValueAtTime(659, now + 0.12) // E5
        oscillator.frequency.setValueAtTime(784, now + 0.24) // G5
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        oscillator.start(now)
        oscillator.stop(now + 0.5)
        break

      case 'error':
        // Two descending notes — attention grab
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(440, now)       // A4
        oscillator.frequency.setValueAtTime(330, now + 0.15) // E4
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        oscillator.start(now)
        oscillator.stop(now + 0.4)
        break

      case 'warning':
        // Single sustained note
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(466, now)  // Bb4
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        oscillator.start(now)
        oscillator.stop(now + 0.35)
        break

      case 'info':
      default:
        // Soft single ding
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(587, now)  // D5
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        oscillator.start(now)
        oscillator.stop(now + 0.3)
        break
    }
  } catch (e) {
    // Silently fail — audio isn't critical
  }
}
