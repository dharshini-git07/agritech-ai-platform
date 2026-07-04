export const MARKETPLACE_CATEGORIES = {
  "Fresh Produce": [
    "Vegetables",
    "Fruits",
    "Leafy Greens",
    "Herbs"
  ],
  "Seeds & Plants": [
    "Vegetable Seeds",
    "Fruit Seeds",
    "Flower Seeds",
    "Saplings",
    "Indoor Plants",
    "Outdoor Plants"
  ],
  "Organic Farming Inputs": [
    "Vermicompost",
    "Cocopeat",
    "Neem Cake",
    "Bio Fertilizers",
    "Organic Pest Control"
  ],
  "Terrace Setup": [
    "Grow Bags",
    "Pots",
    "Raised Beds",
    "Vertical Garden Kits",
    "Ready-made Terrace Garden Packages"
  ],
  "Hydroponics": [
    "NFT Kits",
    "DWC Kits",
    "Grow Channels",
    "Reservoirs",
    "Net Pots",
    "Growing Media"
  ],
  "Watering & Irrigation": [
    "Watering Can",
    "Drip Kits",
    "Sprayers",
    "Timers",
    "Hose Pipes"
  ],
  "Garden Tools": [
    "Pruners",
    "Gloves",
    "Trowels",
    "Harvest Baskets",
    "Garden Scissors"
  ]
} as const;

export type CategoryName = keyof typeof MARKETPLACE_CATEGORIES;

export const SELLER_TYPES = [
  "Farmer",
  "Nursery",
  "Organic Store",
  "Hydroponics Supplier",
  "Terrace Equipment Supplier"
] as const;

export type SellerTypeName = typeof SELLER_TYPES[number];
