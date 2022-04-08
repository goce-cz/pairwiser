import React, { createContext, FC, useCallback, useContext, useEffect, useState } from 'react'
import GoogleLogin, { GoogleLoginResponse, GoogleLoginResponseOffline, GoogleLogout } from 'react-google-login'

export interface GoogleAPIProviderProps {
  clientId: string
  apiKey: string
  discoveryDocs: string[]
  scope: string
}

declare global {
  interface Window {
    googleAPIClientLoaded: boolean

    handleGoogleAPIClientLoaded (): void
  }
}

export interface GoogleAPIContextData {
  loginResponse: GoogleLoginResponse
}

const GoogleAPIContext = createContext<GoogleAPIContextData | null>(null)

export const useGoogleAPIData = () => useContext(GoogleAPIContext)!

export const GoogleAPIProvider: FC<GoogleAPIProviderProps> = ({
  apiKey,
  discoveryDocs,
  scope,
  clientId,
  children
}) => {
  const [loginResponse, setLoginResponse] = useState<GoogleLoginResponse | null>(null)
  const [clientLoaded, setClientLoaded] = useState(window.googleAPIClientLoaded)
  const [ready, setReady] = useState(false)

  window.handleGoogleAPIClientLoaded = useCallback(
    () => {
      setClientLoaded(true)
      window.googleAPIClientLoaded = true
    },
    []
  )

  const handleLogin = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if (!('accessToken' in response)) {
      throw new Error('invalid response')
    }
    setLoginResponse(response)
  }

  const handleLogout = () => {
    setLoginResponse(null)
  }

  useEffect(
    () => {
      if (clientLoaded && loginResponse) {
        gapi.load('client:auth2', async () => {
          await gapi.client.init({
            apiKey,
            discoveryDocs
          })
          gapi.client.setToken({ access_token: loginResponse.accessToken })
          setReady(true)
        })
      }
    },
    [clientLoaded, loginResponse, apiKey, discoveryDocs]
  )

  if (!loginResponse) {
    return (
      <GoogleLogin
        clientId={clientId}
        onSuccess={handleLogin}
        cookiePolicy="single_host_origin"
        scope={scope}
        isSignedIn
      />
    )
  }

  return (
    <div>
      <div><GoogleLogout clientId={clientId} onLogoutSuccess={handleLogout}/></div>
      {
        ready
          ? <GoogleAPIContext.Provider value={{ loginResponse }}>{children}</GoogleAPIContext.Provider>
          : <div>Loading...</div>
      }
    </div>
  )
}
