import { SnackbarProvider } from './context/SnackbarContext'
import SessionGate from './components/SessionGate'
import PosPage from './pages/PosPage'

function App() {
  return (
    <SnackbarProvider>
      <SessionGate>
        <PosPage />
      </SessionGate>
    </SnackbarProvider>
  )
}

export default App
