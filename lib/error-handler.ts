/**
 * Global Error Handler with LINE Notification
 * 
 * Use this to report critical errors to admin via LINE
 */

/**
 * Report an error to admin via LINE notification
 * Call this for critical errors that require immediate attention
 */
export async function reportCriticalError(
  errorType: string,
  errorMessage: string,
  context?: string
): Promise<void> {
  try {
    // Don't block - fire and forget
    fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'system_error',
        data: {
          errorType,
          errorMessage,
          context,
        }
      })
    }).catch(err => {
      // Only log, don't throw
      console.error('Failed to send error notification:', err)
    })
  } catch (err) {
    console.error('Error in reportCriticalError:', err)
  }
}

/**
 * Server-side error reporter using direct LINE API
 * Use this in API routes or server components
 */
export async function reportCriticalErrorServer(
  errorType: string,
  errorMessage: string,
  context?: string
): Promise<void> {
  try {
    // Import dynamically to avoid issues with client components
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get admin LINE configuration
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('line_channel_access_token, line_user_id, notify_errors')
      .single()

    if (!settings?.line_channel_access_token || !settings?.line_user_id || !settings?.notify_errors) {
      return
    }

    const message = `🚨 System Error Alert

Type: ${errorType}
Message: ${errorMessage}
${context ? `Context: ${context}` : ''}

Please check the system immediately.`

    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.line_channel_access_token}`,
      },
      body: JSON.stringify({
        to: settings.line_user_id,
        messages: [{ type: 'text', text: message }],
      }),
    })
  } catch (err) {
    console.error('Error in reportCriticalErrorServer:', err)
  }
}

