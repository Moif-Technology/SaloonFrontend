/**
 * Catalogue UI (Swetha icons) backed by real company-5 product IDs (Sonu)
 * so job/save + sales/settle can persist.
 */
import {
  Scissors,
  Sparkles,
  Flower2,
  Gift,
  Droplet,
  Wand2,
  Droplets,
  Wind,
  Baby,
  Hand,
  Footprints,
  Flame,
  Gem,
  Award,
  FlaskConical,
  SprayCan,
  Paintbrush,
  ShieldCheck,
  Palette,
  Waves,
} from 'lucide-react'
import type { Product, ServiceGroup } from '../types/pos'

export const serviceGroups: ServiceGroup[] = [
  { id: '1', name: 'Hair', icon: Scissors },
  { id: '2', name: 'Nails', icon: Sparkles },
  { id: '3', name: 'Skin & Spa', icon: Flower2 },
  { id: '4', name: 'Packages', icon: Gift },
  { id: '5', name: 'Retail', icon: Droplet },
]

/** Prices / names match `core.product_master` + inventory for company_id=5. */
export const products: Product[] = [
  // Hair (group 1)
  { id: 1, groupId: '1', name: 'Haircut', price: 60, icon: Scissors, lineType: 'SERVICE', taxRate: 5 },
  { id: 2, groupId: '1', name: 'Kids Haircut', price: 35, icon: Baby, lineType: 'SERVICE', taxRate: 5 },
  { id: 3, groupId: '1', name: 'Blow Dry', price: 50, icon: Wind, lineType: 'SERVICE', taxRate: 5 },
  { id: 4, groupId: '1', name: 'Beard Trim', price: 35, icon: Wand2, lineType: 'SERVICE', taxRate: 5 },
  { id: 5, groupId: '1', name: 'Hair Styling / Updo', price: 120, icon: Sparkles, lineType: 'SERVICE', taxRate: 5 },
  { id: 6, groupId: '1', name: 'Hair Colour', price: 220, icon: Palette, lineType: 'SERVICE', taxRate: 5 },
  { id: 7, groupId: '1', name: 'Highlights', price: 320, icon: Sparkles, lineType: 'SERVICE', taxRate: 5 },
  { id: 8, groupId: '1', name: 'Root Touch-up', price: 140, icon: Paintbrush, lineType: 'SERVICE', taxRate: 5 },
  { id: 9, groupId: '1', name: 'Keratin Treatment', price: 400, icon: Flame, lineType: 'SERVICE', taxRate: 5 },
  { id: 10, groupId: '1', name: 'Hair Spa', price: 130, icon: Droplets, lineType: 'SERVICE', taxRate: 5 },

  // Nails (group 2)
  { id: 11, groupId: '2', name: 'Manicure', price: 55, icon: Hand, lineType: 'SERVICE', taxRate: 5 },
  { id: 12, groupId: '2', name: 'Gel Polish', price: 80, icon: Droplet, lineType: 'SERVICE', taxRate: 5 },
  { id: 13, groupId: '2', name: 'Pedicure', price: 65, icon: Footprints, lineType: 'SERVICE', taxRate: 5 },
  { id: 14, groupId: '2', name: 'Nail Extensions', price: 160, icon: Sparkles, lineType: 'SERVICE', taxRate: 5 },

  // Skin & Spa (group 3)
  { id: 15, groupId: '3', name: 'Classic Facial', price: 150, icon: Sparkles, lineType: 'SERVICE', taxRate: 5 },
  { id: 16, groupId: '3', name: 'Gold Facial', price: 260, icon: Gem, lineType: 'SERVICE', taxRate: 5 },
  { id: 17, groupId: '3', name: 'Threading', price: 25, icon: ShieldCheck, lineType: 'SERVICE', taxRate: 5 },
  { id: 18, groupId: '3', name: 'Head & Shoulder Massage', price: 110, icon: Waves, lineType: 'SERVICE', taxRate: 5 },

  // Packages (group 4)
  { id: 19, groupId: '4', name: 'Bridal Package', price: 1200, icon: Gem, lineType: 'SERVICE', taxRate: 5 },
  { id: 20, groupId: '4', name: 'Party Ready Package', price: 350, icon: Award, lineType: 'SERVICE', taxRate: 5 },

  // Retail (group 5)
  { id: 21, groupId: '5', name: 'Shampoo 250ml', price: 45, icon: FlaskConical, lineType: 'PRODUCT', taxRate: 5 },
  { id: 22, groupId: '5', name: 'Conditioner 250ml', price: 45, icon: Droplets, lineType: 'PRODUCT', taxRate: 5 },
  { id: 23, groupId: '5', name: 'Hair Serum 100ml', price: 75, icon: SprayCan, lineType: 'PRODUCT', taxRate: 5 },
  { id: 24, groupId: '5', name: 'Argan Hair Oil 50ml', price: 95, icon: Droplet, lineType: 'PRODUCT', taxRate: 5 },
  { id: 25, groupId: '5', name: 'Hair Mask 200ml', price: 85, icon: FlaskConical, lineType: 'PRODUCT', taxRate: 5 },
]
