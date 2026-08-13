import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Package,
  FileBarChart,
  Shield,
  Receipt,
  Contact,
  Boxes,
  Layers,
  PackagePlus,
  Scissors,
  Lock,
  LogOut,
  FolderPlus,
  Network,
  UserCog,
  Settings2,
  ArrowLeftRight,
  Wallet,
  DoorClosed,
} from 'lucide-react'

export interface NavMenuItem {
  id: string
  label: string
  icon: LucideIcon
  /** Route path when the page exists; null = dialog / action */
  path: string | null
  /** Dialog action id when not navigating */
  action?:
    | 'group-entry'
    | 'product-entry'
    | 'sub-group-entry'
    | 'service-entry'
    | 'sales-viewer'
    | 'customer-list'
    | 'product-list'
    | 'group-list'
    | 'salesman-wise-report'
    | 'item-wise-report'
    | 'group-wise-report'
    | 'pos-setup'
    | 'cash-in-out'
    | 'counter-close'
    | null
  /** Only show for admin / owner roles */
  adminOnly?: boolean
}

export interface NavMenuSection {
  id: string
  title: string
  icon: LucideIcon
  items: NavMenuItem[]
}

/**
 * Administrative / back-office navigation for the POS header drawer.
 * Only include items that are implemented (action or Lock/Logout).
 */
export const NAV_MENU_SECTIONS: NavMenuSection[] = [
  {
    id: 'cash',
    title: 'Cash / Till',
    icon: Wallet,
    items: [
      {
        id: 'cash-in-out',
        label: 'Cash In / Out',
        icon: ArrowLeftRight,
        path: null,
        action: 'cash-in-out',
      },
      {
        id: 'counter-close',
        label: 'Counter Close',
        icon: DoorClosed,
        path: null,
        action: 'counter-close',
      },
    ],
  },
  {
    id: 'customers',
    title: 'Customer Management',
    icon: Users,
    items: [
      { id: 'customer-list', label: 'Customer List', icon: Contact, path: null, action: 'customer-list' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory / Products',
    icon: Package,
    items: [
      { id: 'product-list', label: 'Product List', icon: Boxes, path: null, action: 'product-list' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: FileBarChart,
    items: [
      {
        id: 'sales-viewer',
        label: 'Sales Viewer',
        icon: Receipt,
        path: null,
        action: 'sales-viewer',
      },
      {
        id: 'salesman-wise-report',
        label: 'Salesman Wise Report',
        icon: UserCog,
        path: null,
        action: 'salesman-wise-report',
      },
      {
        id: 'item-wise-report',
        label: 'Item Wise Report',
        icon: Package,
        path: null,
        action: 'item-wise-report',
      },
      {
        id: 'group-wise-report',
        label: 'Group Wise Report',
        icon: Layers,
        path: null,
        action: 'group-wise-report',
      },
    ],
  },
  {
    id: 'masters',
    title: 'Masters / Catalogue',
    icon: Layers,
    items: [
      {
        id: 'group-list',
        label: 'Group List',
        icon: Layers,
        path: null,
        action: 'group-list',
      },
      {
        id: 'group-entry',
        label: 'Group Entry',
        icon: FolderPlus,
        path: null,
        action: 'group-entry',
      },
      {
        id: 'sub-group-entry',
        label: 'Sub Group Entry',
        icon: Network,
        path: null,
        action: 'sub-group-entry',
      },
      {
        id: 'product-entry',
        label: 'Product Entry',
        icon: PackagePlus,
        path: null,
        action: 'product-entry',
      },
      {
        id: 'service-entry',
        label: 'Service Entry',
        icon: Scissors,
        path: null,
        action: 'service-entry',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings2,
    items: [
      {
        id: 'pos-setup',
        label: 'POS Setup',
        icon: Settings2,
        path: null,
        action: 'pos-setup',
        adminOnly: true,
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    items: [
      { id: 'lock-screen', label: 'Lock Screen', icon: Lock, path: null },
      { id: 'logout', label: 'Logout', icon: LogOut, path: null },
    ],
  },
]
