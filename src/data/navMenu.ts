import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  Users,
  UserCog,
  Package,
  FileBarChart,
  Settings,
  Shield,
  LineChart,
  Receipt,
  Gauge,
  LayoutDashboard,
  Calendar,
  Clock,
  ListOrdered,
  ClipboardList,
  Contact,
  History,
  Award,
  CreditCard,
  IdCard,
  UserCheck,
  Percent,
  Scissors,
  Boxes,
  Layers,
  PackagePlus,
  ShoppingCart,
  FileText,
  NotebookPen,
  Landmark,
  Wrench,
  Warehouse,
  Printer,
  FileType,
  PercentCircle,
  Store,
  KeyRound,
  SlidersHorizontal,
  Lock,
  LogOut,
  FolderPlus,
  Network,
} from 'lucide-react'

export interface NavMenuItem {
  id: string
  label: string
  icon: LucideIcon
  /** Route path when the page exists; null = placeholder / not wired yet */
  path: string | null
  /** Dialog action id (e.g. 'group-entry') when not navigating */
  action?: 'group-entry' | 'product-entry' | 'sub-group-entry' | 'service-entry' | null
}

export interface NavMenuSection {
  id: string
  title: string
  icon: LucideIcon
  items: NavMenuItem[]
}

/**
 * Administrative / back-office navigation for the POS header drawer.
 * Paths are reserved for future React Router wiring — null items stay UI-only.
 */
export const NAV_MENU_SECTIONS: NavMenuSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard / Analytics',
    icon: BarChart3,
    items: [
      { id: 'daily-sales', label: 'Daily Sales', icon: LineChart, path: null },
      { id: 'todays-bills', label: "Today's Bills", icon: Receipt, path: null },
      { id: 'performance', label: 'Performance Overview', icon: Gauge, path: null },
      { id: 'kpi', label: 'KPI Dashboard', icon: LayoutDashboard, path: null },
    ],
  },
  {
    id: 'appointments',
    title: 'Appointments / Bookings',
    icon: CalendarDays,
    items: [
      { id: 'appt-calendar', label: 'Appointment Calendar', icon: Calendar, path: null },
      { id: 'upcoming', label: 'Upcoming Bookings', icon: Clock, path: null },
      { id: 'walk-in-queue', label: 'Walk-in Queue', icon: ListOrdered, path: null },
      { id: 'booking-mgmt', label: 'Booking Management', icon: ClipboardList, path: null },
    ],
  },
  {
    id: 'customers',
    title: 'Customer Management',
    icon: Users,
    items: [
      { id: 'customer-list', label: 'Customer List', icon: Contact, path: null },
      { id: 'customer-history', label: 'Customer History', icon: History, path: null },
      { id: 'loyalty', label: 'Loyalty Points', icon: Award, path: null },
      { id: 'memberships', label: 'Memberships', icon: CreditCard, path: null },
    ],
  },
  {
    id: 'staff',
    title: 'Staff / Employees',
    icon: UserCog,
    items: [
      { id: 'employee-list', label: 'Employee List', icon: IdCard, path: null },
      { id: 'attendance', label: 'Staff Attendance', icon: UserCheck, path: null },
      { id: 'commissions', label: 'Commissions', icon: Percent, path: null },
      { id: 'service-assign', label: 'Service Assignments', icon: Scissors, path: null },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory / Products',
    icon: Package,
    items: [
      { id: 'product-list', label: 'Product List', icon: Boxes, path: null },
      { id: 'stock-levels', label: 'Stock Levels', icon: Layers, path: null },
      { id: 'stock-requests', label: 'Stock Requests', icon: PackagePlus, path: null },
      { id: 'purchase', label: 'Purchase Management', icon: ShoppingCart, path: null },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: FileBarChart,
    items: [
      { id: 'sales-reports', label: 'Sales Reports', icon: FileText, path: null },
      { id: 'daily-closing', label: 'Daily Closing', icon: NotebookPen, path: null },
      { id: 'tax-summary', label: 'Tax Summary', icon: Landmark, path: null },
      { id: 'service-reports', label: 'Service Reports', icon: Wrench, path: null },
      { id: 'inventory-reports', label: 'Inventory Reports', icon: Warehouse, path: null },
    ],
  },
  {
    id: 'masters',
    title: 'Masters / Catalogue',
    icon: Layers, // already imported
    items: [
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
    icon: Settings,
    items: [
      { id: 'printer', label: 'Printer Configuration', icon: Printer, path: null },
      { id: 'receipt-templates', label: 'Receipt Templates', icon: FileType, path: null },
      { id: 'tax-settings', label: 'Tax Settings', icon: PercentCircle, path: null },
      { id: 'store-info', label: 'Store Information', icon: Store, path: null },
      { id: 'roles', label: 'User & Role Permissions', icon: KeyRound, path: null },
      { id: 'app-settings', label: 'Application Settings', icon: SlidersHorizontal, path: null },
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
