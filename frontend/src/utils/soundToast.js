/**
 * soundToast — drop-in replacement for react-toastify's `toast` 
 * that plays a notification sound before showing the toast.
 */
import { toast as originalToast } from 'react-toastify'
import { playNotificationSound } from './notificationSound'

const soundToast = (message, options) => {
  playNotificationSound('info')
  return originalToast(message, options)
}

soundToast.success = (message, options) => {
  playNotificationSound('success')
  return originalToast.success(message, options)
}

soundToast.error = (message, options) => {
  playNotificationSound('error')
  return originalToast.error(message, options)
}

soundToast.info = (message, options) => {
  playNotificationSound('info')
  return originalToast.info(message, options)
}

soundToast.warning = (message, options) => {
  playNotificationSound('warning')
  return originalToast.warning(message, options)
}

soundToast.warn = soundToast.warning

// Pass through any other methods
soundToast.dismiss = originalToast.dismiss
soundToast.isActive = originalToast.isActive
soundToast.update = originalToast.update
soundToast.clearWaitingQueue = originalToast.clearWaitingQueue
soundToast.promise = originalToast.promise
soundToast.loading = originalToast.loading

export { soundToast as toast }
