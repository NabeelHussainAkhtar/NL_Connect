/**
 * Returns the current time or a formatted time in IST (Asia/Kolkata)
 * format: 12:30 PM
 */
export const getISTTime = (date?: Date | string | number) => {
  try {
    if (!date) return new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
    
    let d: Date
    if (typeof date === 'string') {
      // If it's a standard DB string without 'Z', append 'Z' to treat as UTC (Cloudflare D1 standard)
      if (date.includes('-') && !date.endsWith('Z') && !date.includes('+')) {
        d = new Date(date.replace(' ', 'T') + 'Z')
      } else {
        d = new Date(date)
      }
    } else {
      d = new Date(date)
    }

    if (isNaN(d.getTime())) throw new Error('Invalid Date')

    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (e) {
    console.error('Date formatting error:', e, date)
    return '00:00 AM'
  }
}
