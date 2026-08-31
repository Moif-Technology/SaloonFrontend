import { useState, useEffect } from 'react'
import {
  Bluetooth,
  CheckCircle2,
  Circle,
  EthernetPort,
  FileText,
  Plus,
  Printer,
  Save,
  TestTube2,
  Usb,
  X,
} from 'lucide-react'

interface PrinterConfigModalProps {
  open: boolean
  onClose: () => void
}

type ConnectionType = 'USB' | 'Network' | 'Bluetooth'

type PrinterStatus = 'Online' | 'Offline'

type PrinterItem = {
  id: string
  name: string
  connectionType: ConnectionType
  paperSize: string
  status: PrinterStatus
  isDefault: boolean
}

const INITIAL_PRINTERS: PrinterItem[] = [
  {
    id: 'printer-1',
    name: 'POS-80 Thermal Printer',
    connectionType: 'USB',
    paperSize: '80mm',
    status: 'Online',
    isDefault: true,
  },
  {
    id: 'printer-2',
    name: 'Reception Label Printer',
    connectionType: 'Network',
    paperSize: '58mm',
    status: 'Online',
    isDefault: false,
  },
  {
    id: 'printer-3',
    name: 'Backup Bluetooth Printer',
    connectionType: 'Bluetooth',
    paperSize: '80mm',
    status: 'Offline',
    isDefault: false,
  },
]

function getConnectionIcon(connectionType: ConnectionType) {
  if (connectionType === 'USB') {
    return <Usb className="h-4 w-4" />
  }

  if (connectionType === 'Bluetooth') {
    return <Bluetooth className="h-4 w-4" />
  }

  return <EthernetPort className="h-4 w-4" />
}

function getConnectionClass(connectionType: ConnectionType) {
  if (connectionType === 'USB') {
    return 'bg-sky-50 text-sky-700 border-sky-200/60'
  }

  if (connectionType === 'Bluetooth') {
    return 'bg-violet-50 text-violet-700 border-violet-200/60'
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
}

export default function PrinterConfigModal({
  open,
  onClose,
}: PrinterConfigModalProps) {
  const [printers, setPrinters] = useState<PrinterItem[]>(INITIAL_PRINTERS)
  const [showAddForm, setShowAddForm] = useState(false)

  const [newPrinterName, setNewPrinterName] = useState('')
  const [newConnectionType, setNewConnectionType] = useState<ConnectionType>('USB')
  const [newPaperSize, setNewPaperSize] = useState('80mm')

  // Local Toast States
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (!showToast) return

    const timer = window.setTimeout(() => {
      setShowToast(false)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [showToast])

  if (!open) return null

  function triggerToast(message: string) {
    setToastMessage(message)
    setShowToast(true)
  }

  function handleSetDefault(printerId: string) {
    const targetPrinter = printers.find(
      (printer) => printer.id === printerId,
    )

    if (!targetPrinter) return

    if (targetPrinter.status === 'Offline') {
      triggerToast('Offline printers cannot be set as default')
      return
    }

    setPrinters((current) =>
      current.map((printer) => ({
        ...printer,
        isDefault: printer.id === printerId,
      })),
    )

    triggerToast(`"${targetPrinter.name}" set as default printer`)
  }

  function handleTestPrint(printer: PrinterItem) {
    if (printer.status === 'Offline') {
      triggerToast(`"${printer.name}" is currently offline`)
      return
    }

    triggerToast(`Test print sent to "${printer.name}"`)
  }

  function handleAddPrinter() {
    setShowAddForm(true)
  }

  function handleCancelAddPrinter() {
    setShowAddForm(false)
    setNewPrinterName('')
    setNewConnectionType('USB')
    setNewPaperSize('80mm')
  }

  function handleSaveNewPrinter() {
    const trimmedName = newPrinterName.trim()

    if (!trimmedName) {
      triggerToast('Please enter a printer name')
      return
    }

    const newPrinter: PrinterItem = {
      id: `printer-${Date.now()}`,
      name: trimmedName,
      connectionType: newConnectionType,
      paperSize: newPaperSize,
      status: 'Online',
      isDefault: printers.length === 0,
    }

    setPrinters((current) => [...current, newPrinter])

    setShowAddForm(false)
    setNewPrinterName('')
    setNewConnectionType('USB')
    setNewPaperSize('80mm')

    triggerToast(`"${trimmedName}" added successfully`)
  }

  function handleSaveChanges() {
    triggerToast('Printer configuration saved successfully')
  }

  return (
    <>
{/* Local Toast Notification */}
{showToast && (
        <div className="fixed right-6 bottom-6 z-[60] flex items-center gap-3 rounded-xl bg-[#6b1d2f] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-fade-in">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
            ✓
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
                <Printer size={22} />
              </span>

              <div>
                <h2 className="text-xl font-bold text-salon-text">
                  Printer Configuration
                </h2>

                <p className="text-sm text-salon-muted">
                  Configure receipt and label printers for the POS.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </header>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
            {/* Section Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Available Printers
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Select a default printer or run a test print.
                </p>
              </div>

              <div className="rounded-lg bg-[#6b1d2f]/5 px-3 py-1.5 text-xs font-semibold text-[#6b1d2f]">
                {printers.length} Printer
                {printers.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Add Printer Form */}
            {showAddForm && (
              <div className="mb-4 rounded-xl border border-[#6b1d2f]/20 bg-[#6b1d2f]/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Add Printer
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Enter the basic printer configuration.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelAddPrinter}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
                    aria-label="Cancel add printer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {/* Printer Name */}
                  <div>
                    <label
                      htmlFor="printer-name"
                      className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                      Printer Name
                    </label>

                    <input
                      id="printer-name"
                      type="text"
                      value={newPrinterName}
                      onChange={(event) =>
                        setNewPrinterName(event.target.value)
                      }
                      placeholder="e.g. Front Desk Printer"
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                    />
                  </div>

                  {/* Connection Type */}
                  <div>
                    <label
                      htmlFor="printer-connection"
                      className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                      Connection Type
                    </label>

                    <select
                      id="printer-connection"
                      value={newConnectionType}
                      onChange={(event) =>
                        setNewConnectionType(
                          event.target.value as ConnectionType,
                        )
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                    >
                      <option value="USB">USB</option>
                      <option value="Network">Network</option>
                      <option value="Bluetooth">Bluetooth</option>
                    </select>
                  </div>

                  {/* Paper Size */}
                  <div>
                    <label
                      htmlFor="printer-paper-size"
                      className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                      Paper Size
                    </label>

                    <select
                      id="printer-paper-size"
                      value={newPaperSize}
                      onChange={(event) =>
                        setNewPaperSize(event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                    >
                      <option value="58mm">58mm</option>
                      <option value="80mm">80mm</option>
                      <option value="A4">A4</option>
                      <option value="Label">Label</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelAddPrinter}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveNewPrinter}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#581725]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Printer
                  </button>
                </div>
              </div>
            )}

            {/* Printer Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-salon-border bg-[#6b1d2f]/5 text-[11px] font-bold uppercase tracking-wide text-[#6b1d2f]">
                      <th className="px-4 py-3">Printer Name</th>
                      <th className="px-4 py-3">Connection</th>
                      <th className="px-4 py-3">Paper Size</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Default</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {printers.map((printer) => (
                      <tr
                        key={printer.id}
                        className="transition hover:bg-[#6b1d2f]/5"
                      >
                        {/* Printer Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                              <Printer className="h-4 w-4" />
                            </span>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {printer.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {printer.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Connection */}
                        <td className="px-4 py-3">
                          <span
                            className={[
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                              getConnectionClass(printer.connectionType),
                            ].join(' ')}
                          >
                            {getConnectionIcon(printer.connectionType)}
                            {printer.connectionType}
                          </span>
                        </td>

                        {/* Paper Size */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">
                              {printer.paperSize}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={[
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                              printer.status === 'Online'
                                ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-500',
                            ].join(' ')}
                          >
                            {printer.status === 'Online' ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                            {printer.status}
                          </span>
                        </td>

                        {/* Default */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSetDefault(printer.id)}
                            disabled={
                              printer.status === 'Offline' || printer.isDefault
                            }
                            className={[
                              'inline-flex items-center gap-1.5 text-xs font-semibold transition',
                              printer.isDefault
                                ? 'cursor-default text-[#6b1d2f]'
                                : printer.status === 'Offline'
                                ? 'cursor-not-allowed text-slate-300'
                                : 'text-slate-500 hover:text-[#6b1d2f]',
                            ].join(' ')}
                          >
                            {printer.isDefault ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Default
                              </>
                            ) : (
                              <>
                                <Circle className="h-4 w-4" />
                                Set Default
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleTestPrint(printer)}
                            disabled={printer.status === 'Offline'}
                            className={[
                              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                              printer.status === 'Offline'
                                ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                                : 'border-[#6b1d2f]/20 bg-white text-[#6b1d2f] hover:bg-[#6b1d2f]/5',
                            ].join(' ')}
                          >
                            <TestTube2 className="h-3.5 w-3.5" />
                            Test Print
                          </button>
                        </td>
                      </tr>
                    ))}

                    {printers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <Printer className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No printers configured
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Add a printer to start printing receipts and labels.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Configure your default receipt and label printer.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleAddPrinter}
                className="inline-flex items-center gap-2 rounded-lg border border-[#6b1d2f]/20 bg-white px-4 py-2 text-sm font-semibold text-[#6b1d2f] transition hover:bg-[#6b1d2f]/5"
              >
                <Plus className="h-4 w-4" />
                Add Printer
              </button>

              <button
                type="button"
                onClick={handleSaveChanges}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}