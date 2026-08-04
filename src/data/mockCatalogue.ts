import {
  Scissors,
  Sparkles,
  Flower2,
  Gift,
  Droplet,
  Palette,
  Waves,
  MoreHorizontal,
} from 'lucide-react'
import type { Product, ServiceGroup } from '../types/pos'

export const serviceGroups: ServiceGroup[] = [
  { id: 'hair', name: 'Hair', icon: Scissors },
  { id: 'nails', name: 'Nails', icon: Sparkles },
  { id: 'skin-spa', name: 'Skin & Spa', icon: Flower2 },
  { id: 'packages', name: 'Packages', icon: Gift },
  { id: 'care-products', name: 'Care Products', icon: Droplet },
  { id: 'colour', name: 'Colour', icon: Palette },
  { id: 'treatments', name: 'Treatments', icon: Waves },
  { id: 'other', name: 'Other', icon: MoreHorizontal },
]

export const products: Product[] = [
  { id: 'p-haircut', groupId: 'hair', name: 'Haircut', price: 120, icon: Scissors },
  { id: 'p-beard-trim', groupId: 'hair', name: 'Beard Trim', price: 35, icon: Scissors },
  { id: 'p-hair-wash', groupId: 'hair', name: 'Hair Wash', price: 40, icon: Scissors },
  { id: 'p-blow-dry', groupId: 'hair', name: 'Blow Dry', price: 60, icon: Scissors },
  { id: 'p-hair-styling', groupId: 'hair', name: 'Hair Styling', price: 90, icon: Scissors },
  { id: 'p-kids-cut', groupId: 'hair', name: "Kids' Haircut", price: 80, icon: Scissors },

  { id: 'p-manicure', groupId: 'nails', name: 'Manicure', price: 70, icon: Sparkles },
  { id: 'p-pedicure', groupId: 'nails', name: 'Pedicure', price: 90, icon: Sparkles },
  { id: 'p-gel-polish', groupId: 'nails', name: 'Gel Polish', price: 110, icon: Sparkles },
  { id: 'p-nail-art', groupId: 'nails', name: 'Nail Art', price: 130, icon: Sparkles },

  { id: 'p-facial', groupId: 'skin-spa', name: 'Facial', price: 180, icon: Flower2 },
  { id: 'p-clean-up', groupId: 'skin-spa', name: 'Clean Up', price: 150, icon: Flower2 },
  { id: 'p-body-massage', groupId: 'skin-spa', name: 'Body Massage', price: 250, icon: Flower2 },
  { id: 'p-waxing', groupId: 'skin-spa', name: 'Waxing', price: 100, icon: Flower2 },

  { id: 'p-bridal-pkg', groupId: 'packages', name: 'Bridal Package', price: 1200, icon: Gift },
  { id: 'p-grooming-pkg', groupId: 'packages', name: 'Grooming Package', price: 350, icon: Gift },
  { id: 'p-spa-pkg', groupId: 'packages', name: 'Spa Day Package', price: 600, icon: Gift },

  { id: 'p-hair-serum', groupId: 'care-products', name: 'Hair Serum 100ml', price: 140, icon: Droplet },
  { id: 'p-shampoo', groupId: 'care-products', name: 'Shampoo 250ml', price: 95, icon: Droplet },
  { id: 'p-conditioner', groupId: 'care-products', name: 'Conditioner 250ml', price: 100, icon: Droplet },
  { id: 'p-face-cream', groupId: 'care-products', name: 'Face Cream', price: 160, icon: Droplet },

  { id: 'p-global-colour', groupId: 'colour', name: 'Global Colour', price: 400, icon: Palette },
  { id: 'p-highlights', groupId: 'colour', name: 'Highlights', price: 450, icon: Palette },
  { id: 'p-root-touchup', groupId: 'colour', name: 'Root Touch-up', price: 250, icon: Palette },

  { id: 'p-keratin', groupId: 'treatments', name: 'Keratin Treatment', price: 800, icon: Waves },
  { id: 'p-hair-spa', groupId: 'treatments', name: 'Hair Spa', price: 300, icon: Waves },
  { id: 'p-dandruff-tx', groupId: 'treatments', name: 'Anti-Dandruff Tx', price: 220, icon: Waves },

  { id: 'p-misc', groupId: 'other', name: 'Miscellaneous', price: 50, icon: MoreHorizontal },
]
