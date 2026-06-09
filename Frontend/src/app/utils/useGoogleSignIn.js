import { useEffect, useRef, useCallback, useState } from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function useGoogleSignIn(onCredential) {
  const cbRef = useRef(onCredential)
  cbRef.current = onCredential
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    if (window.google?.accounts?.oauth2) {
      setReady(true)
      return
    }

    // Some adblockers block the GSI script, or it arrives after React mounts.
    // Poll for it instead of relying on script load timing.
    let cancelled = false
    const check = setInterval(() => {
      if (cancelled) return
      if (window.google?.accounts?.oauth2) {
        clearInterval(check)
        setReady(true)
      }
    }, 200)

    const onGsiLoad = () => {
      if (cancelled) return
      clearInterval(check)
      setReady(true)
    }

    // If the script is already in the page but not yet parsed, listen for the load
    const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (script && !window.google?.accounts?.oauth2) {
      script.addEventListener('load', onGsiLoad, { once: true })
    }

    return () => {
      cancelled = true
      clearInterval(check)
      script?.removeEventListener('load', onGsiLoad)
    }
  }, [])

  const prompt = useCallback(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.oauth2) {
      console.warn('Google Sign-In aún no disponible')
      return
    }

    // Use the popup-based OAuth 2.0 token flow instead of One Tap.
    // This avoids the origin validation check that GSI's /gsi/status endpoint performs.
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (res) => {
        if (res.error) {
          console.error('Google Sign-In error:', res)
          return
        }
        // Send the access token to our backend, which verifies it
        cbRef.current?.(res.access_token)
      },
    })
    client.requestAccessToken()
  }, [])

  return { prompt, enabled: !!GOOGLE_CLIENT_ID && ready }
}
