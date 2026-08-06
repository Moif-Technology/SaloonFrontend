import { SnackbarProvider } from './context/SnackbarContext'
import SessionGate from './components/SessionGate'
import PosPage from './pages/PosPage'
import UpdateBanner from './components/UpdateBanner'

function App() {
  return (
    <SnackbarProvider>
      <UpdateBanner />
      <SessionGate>
        <PosPage />
      </SessionGate>
    </SnackbarProvider>
  )
}

export default App
