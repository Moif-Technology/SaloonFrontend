import { useState } from 'react'
import {
    Store,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
} from 'lucide-react'

import { useSnackbar } from '../../context/SnackbarContext'

interface StoreInformationModalProps {
  open: boolean
  onClose: () => void
}

type StoreInformation = {
  storeName: string
  contactNumber: string
  email: string
  address: string
  currency: string
  openingTime: string
  closingTime: string
}

const INITIAL_STORE_INFO: StoreInformation = {
  storeName: 'Salon & Spa',
  contactNumber: '+91 98765 43210',
  email: 'contact@salon.com',
  address: 'Main Road, Kochi, Kerala',
  currency: 'INR',
  openingTime: '09:00',
  closingTime: '21:00',
}

export default function StoreInformationModal({
  open,
  onClose,
}: StoreInformationModalProps) {
  const { showSnackbar } = useSnackbar()

  const [storeInfo, setStoreInfo] =
    useState<StoreInformation>(INITIAL_STORE_INFO)

  function updateField<K extends keyof StoreInformation>(
    field: K,
    value: StoreInformation[K],
  ) {
    setStoreInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleSave() {
    if (!storeInfo.storeName.trim()) {
      showSnackbar('Please enter the store name', 'error')
      return
    }

    if (!storeInfo.contactNumber.trim()) {
      showSnackbar('Please enter the contact number', 'error')
      return
    }

    if (!storeInfo.email.trim()) {
      showSnackbar('Please enter the email address', 'error')
      return
    }

    if (!storeInfo.address.trim()) {
      showSnackbar('Please enter the physical address', 'error')
      return
    }

    if (!storeInfo.openingTime || !storeInfo.closingTime) {
      showSnackbar('Please select business hours', 'error')
      return
    }

    showSnackbar('Store information saved successfully', 'success')
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
              <Store size={21} />
            </span>

            <div>
              <h2 className="text-xl font-bold text-salon-text">
                Store Information
              </h2>

              <p className="text-sm text-salon-muted">
                Manage your salon business profile and operating details.
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
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          {/* Helper Banner */}
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#6b1d2f]/10 bg-[#6b1d2f]/5 px-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
              <Store size={16} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#6b1d2f]">
                Business profile
              </p>

              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                These details can be used on receipts, reports, and other
                customer-facing information.
              </p>
            </div>
          </div>

          {/* Store Details */}
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">
                Store Details
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Enter the basic contact information for your business.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
              {/* Store Name */}
              <div>
                <label
                  htmlFor="store-name"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Store Name
                </label>

                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="store-name"
                    type="text"
                    value={storeInfo.storeName}
                    onChange={(e) =>
                      updateField('storeName', e.target.value)
                    }
                    placeholder="Enter store name"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="store-contact"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Contact Number
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="store-contact"
                    type="tel"
                    value={storeInfo.contactNumber}
                    onChange={(e) =>
                      updateField('contactNumber', e.target.value)
                    }
                    placeholder="+91 98765 43210"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="store-email"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="store-email"
                    type="email"
                    value={storeInfo.email}
                    onChange={(e) =>
                      updateField('email', e.target.value)
                    }
                    placeholder="contact@example.com"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label
                  htmlFor="store-currency"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Currency
                </label>

                <select
                  id="store-currency"
                  value={storeInfo.currency}
                  onChange={(e) =>
                    updateField('currency', e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label
                  htmlFor="store-address"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Physical Address
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />

                  <textarea
                    id="store-address"
                    rows={3}
                    value={storeInfo.address}
                    onChange={(e) =>
                      updateField('address', e.target.value)
                    }
                    placeholder="Enter your complete business address"
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Business Hours */}
          <section className="mt-4 rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                  <Clock3 size={16} />
                </span>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Business Hours
                  </h3>

                  <p className="text-xs text-slate-500">
                    Set the standard opening and closing time.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              {/* Opening Time */}
              <div>
                <label
                  htmlFor="opening-time"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Opening Time
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="opening-time"
                    type="time"
                    value={storeInfo.openingTime}
                    onChange={(e) =>
                      updateField('openingTime', e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  />
                </div>
              </div>

              {/* Closing Time */}
              <div>
                <label
                  htmlFor="closing-time"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Closing Time
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="closing-time"
                    type="time"
                    value={storeInfo.closingTime}
                    onChange={(e) =>
                      updateField('closingTime', e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  />
                </div>
              </div>
            </div>

            <div className="mx-4 mb-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Current schedule:
                </span>{' '}
                {storeInfo.openingTime} – {storeInfo.closingTime}
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <p className="hidden text-xs text-slate-500 sm:block">
            Store information will be used across the POS system.
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
            >
              <Save className="h-4 w-4" />
              Save Store Info
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}