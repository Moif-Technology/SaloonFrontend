import { useState, useEffect } from 'react'
import {
  Check,
  Plus,
  KeyRound,
  ShieldCheck,
  Settings2,
  Users,
  X,
} from 'lucide-react'

interface UserRolePermissionsModalProps {
  open: boolean
  onClose: () => void
}

type PermissionKey =
  | 'inventory'
  | 'reports'
  | 'pos'
  | 'settings'

type Role = {
  id: string
  name: string
  users: number
  permissions: Record<PermissionKey, boolean>
}

const INITIAL_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    users: 2,
    permissions: {
      inventory: true,
      reports: true,
      pos: true,
      settings: true,
    },
  },
  {
    id: 'cashier',
    name: 'Cashier',
    users: 3,
    permissions: {
      inventory: false,
      reports: true,
      pos: true,
      settings: false,
    },
  },
  {
    id: 'stylist',
    name: 'Stylist',
    users: 5,
    permissions: {
      inventory: false,
      reports: false,
      pos: true,
      settings: false,
    },
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    users: 2,
    permissions: {
      inventory: false,
      reports: true,
      pos: true,
      settings: false,
    },
  },
]

const permissionLabels: Record<PermissionKey, string> = {
  inventory: 'Inventory Access',
  reports: 'Reports',
  pos: 'POS',
  settings: 'Settings',
}

function createRoleId() {
  return `role-${Date.now()}`
}

export default function UserRolePermissionsModal({
  open,
  onClose,
}: UserRolePermissionsModalProps) {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES)
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleError, setNewRoleError] = useState('')

  // Toast state matching reference pattern
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Auto-hide toast after 3s
  useEffect(() => {
    if (!showToast) return

    const timer = window.setTimeout(() => {
      setShowToast(false)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [showToast])

  if (!open) return null

  function togglePermission(
    roleId: string,
    permission: PermissionKey,
  ) {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [permission]: !role.permissions[permission],
              },
            }
          : role,
      ),
    )
  }

  function handleAddRole() {
    setNewRoleError('')

    const name = newRoleName.trim()

    if (!name) {
      setNewRoleError('Please enter a role name.')
      return
    }

    const alreadyExists = roles.some(
      (role) => role.name.toLowerCase() === name.toLowerCase(),
    )

    if (alreadyExists) {
      setNewRoleError('A role with this name already exists.')
      return
    }

    const newRole: Role = {
      id: createRoleId(),
      name,
      users: 0,
      permissions: {
        inventory: false,
        reports: false,
        pos: false,
        settings: false,
      },
    }

    setRoles((prev) => [...prev, newRole])
    setNewRoleName('')
    setIsAddingRole(false)

    // Trigger toast for adding role
    setToastMessage('Role added successfully')
    setShowToast(true)
  }

  function handleCancelAddRole() {
    setNewRoleName('')
    setNewRoleError('')
    setIsAddingRole(false)
  }

  function handleSaveChanges() {
    // Connect this to your API/backend later.
    setToastMessage('Changes saved successfully')
    setShowToast(true)
    
    // Optional: close modal after a brief delay so they see the toast, or leave it open
    setTimeout(() => {
      onClose()
    }, 1200)
  }

  const totalUsers = roles.reduce(
    (sum, role) => sum + role.users,
    0,
  )

  const activePermissionCount = roles.reduce(
    (sum, role) =>
      sum +
      Object.values(role.permissions).filter(Boolean).length,
    0,
  )

  return (
    <>
      {/* Toast Notification matching reference style */}
      {showToast && (
        <div className="fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-xl bg-[#6b1d2f] px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
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
          className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#6b1d2f]/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
                <KeyRound size={22} />
              </span>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  User Roles & Permissions
                </h2>

                <p className="text-sm text-slate-500">
                  Manage staff roles and control access to salon
                  features.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </header>

          {/* Summary Metrics */}
          <div className="grid shrink-0 grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#6b1d2f]/25 bg-gradient-to-br from-white to-[#6b1d2f]/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6b1d2f]">
                    Total Roles
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-[#6b1d2f] tabular-nums">
                    {roles.length}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                  <ShieldCheck size={18} />
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Assigned Users
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                    {totalUsers}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Users size={18} />
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Active Permissions
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                    {activePermissionCount}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Settings2 size={18} />
                </span>
              </div>
            </div>
          </div>

          {/* Add Role Panel */}
          {isAddingRole && (
            <div className="mx-6 mb-4 shrink-0 rounded-xl border border-[#6b1d2f]/20 bg-[#6b1d2f]/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="new-role-name"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    New Role Name
                  </label>
                  <input
                    id="new-role-name"
                    type="text"
                    value={newRoleName}
                    onChange={(event) => {
                      setNewRoleName(event.target.value)
                      setNewRoleError('')
                    }}
                    placeholder="e.g. Manager"
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 ${
                      newRoleError ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {newRoleError && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {newRoleError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelAddRole}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRole}
                    className="h-10 rounded-lg bg-[#6b1d2f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
                  >
                    Add Role
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="min-h-0 flex-1 overflow-auto px-6 pb-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#6b1d2f]/5 text-[11px] font-bold uppercase tracking-wide text-[#6b1d2f]">
                    <th className="px-4 py-3">Role Name</th>
                    <th className="px-4 py-3">Assigned Users</th>
                    <th className="px-4 py-3">Inventory Access</th>
                    <th className="px-4 py-3">Reports</th>
                    <th className="px-4 py-3">POS</th>
                    <th className="px-4 py-3">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.map((role) => (
                    <tr
                      key={role.id}
                      className="transition hover:bg-[#6b1d2f]/5"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                            <ShieldCheck size={17} />
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {role.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Staff access role
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          <Users className="h-3.5 w-3.5" />
                          {role.users}
                        </span>
                      </td>

                      {(
                        Object.keys(
                          permissionLabels,
                        ) as PermissionKey[]
                      ).map((permission) => (
                        <td key={permission} className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              togglePermission(
                                role.id,
                                permission,
                              )
                            }
                            className="flex items-center gap-2"
                            aria-label={`Toggle ${permissionLabels[permission]} for ${role.name}`}
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                                role.permissions[permission]
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-white'
                                  : 'border-slate-300 bg-white text-transparent hover:border-[#6b1d2f]/50'
                              }`}
                            >
                              <Check
                                className="h-3.5 w-3.5"
                                strokeWidth={3}
                              />
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                role.permissions[permission]
                                  ? 'text-[#6b1d2f]'
                                  : 'text-slate-400'
                              }`}
                            >
                              {role.permissions[permission]
                                ? 'Enabled'
                                : 'Disabled'}
                            </span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-700">
                  Permission tip:
                </span>{' '}
                Click a permission to enable or disable access for
                that role. Changes are applied when you select
                <span className="font-semibold text-[#6b1d2f]">
                  {' '}
                  Save Changes
                </span>
                .
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {roles.length} role
              {roles.length === 1 ? '' : 's'} configured
            </p>

            <div className="flex items-center justify-end gap-2">
              {!isAddingRole && (
                <button
                  type="button"
                  onClick={() => setIsAddingRole(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#6b1d2f]/30 bg-white px-4 py-2 text-sm font-semibold text-[#6b1d2f] transition hover:bg-[#6b1d2f]/5"
                >
                  <Plus className="h-4 w-4" />
                  Add New Role
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveChanges}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}