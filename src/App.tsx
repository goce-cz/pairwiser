import React from 'react'
import './App.css'
import { API_KEY, CLIENT_ID, SCOPES, DISCOVERY_DOCS } from './config'
import { GoogleAPIProvider } from './GoogleAPIProvider'
import { CompareMissing } from './CompareMissing'
import { DataProvider } from './DataProvider'

function App () {
  return (
    <GoogleAPIProvider clientId={CLIENT_ID} apiKey={API_KEY} discoveryDocs={DISCOVERY_DOCS} scope={SCOPES}>
      <DataProvider>
        <CompareMissing/>
      </DataProvider>
    </GoogleAPIProvider>
  )
}

export default App
