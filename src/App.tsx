import { SnackbarProvider } from './context/SnackbarContext'
import PosPage from './pages/PosPage'

function App() {
  return (
    <SnackbarProvider>
      <PosPage />
    </SnackbarProvider>
  )
}

export default App
