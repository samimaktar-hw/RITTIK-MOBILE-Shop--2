import { Product } from '../types';

const now = Date.now();

export const defaultCatalog: Product[] = [
  {
    id: "apple-iphone-13",
    name: "Apple iPhone 13 (Midnight, 128 GB)",
    brand: "Apple",
    category: "mobile",
    price: 43999,
    mrp: 59900,
    rating: 4.8,
    reviewsCount: 142,
    createdAt: now - (9 * 86400000),
    condition: "Superb Condition",
    quality: "Apple Certified Pre-Owned",
    bodyCondition: "Pristine matte glass back, zero scratches on aluminium edges",
    displayCondition: "Flawless original Super Retina XDR OLED, TrueTone 100% active",
    batteryCondition: "94% Battery Health (Original Apple Cell)",
    accessories: "Original Apple Braided Lightning Cable & SIM Ejector Included",
    boxAvailable: "Original Apple Retail Box Included",
    warranty: "6 Months Rittik Mobile Store Warranty + 7 Days Replacement",
    processor: "Apple A15 Bionic (5nm Hexa-Core with 4-Core GPU)",
    camera: "12MP Wide + 12MP Ultra-Wide Dual Camera with Sensor-Shift OIS & 4K Dolby Vision",
    display: "6.1-inch Super Retina XDR OLED Display (2532 x 1170 px, 1200 nits peak)",
    battery: "3240 mAh with 20W Fast Charging & 15W MagSafe Wireless Support",
    network: "5G NR, Gigabit LTE, Wi-Fi 6, Bluetooth 5.0, Ultra Wideband chip",
    images: [
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "4 GB", rom: "128 GB" },
    variants: [
      {
        id: "apple-iphone-13-v1",
        ram: "4 GB",
        rom: "128 GB",
        storage: "128 GB",
        price: 43999,
        mrp: 59900,
        condition: "Superb Condition",
        quality: "Apple Certified Pre-Owned",
        battery: "3240 mAh (94% Battery Health)",
        processor: "Apple A15 Bionic"
      },
      {
        id: "apple-iphone-13-v2",
        ram: "4 GB",
        rom: "256 GB",
        storage: "256 GB",
        price: 49999,
        mrp: 69900,
        condition: "Like New (Flawless)",
        quality: "Apple Certified Pre-Owned",
        battery: "3240 mAh (96% Battery Health)",
        processor: "Apple A15 Bionic"
      }
    ]
  },
  {
    id: "samsung-s23-5g",
    name: "Samsung Galaxy S23 5G (Phantom Black, 128 GB)",
    brand: "Samsung",
    category: "mobile",
    price: 49999,
    mrp: 74999,
    rating: 4.9,
    reviewsCount: 168,
    createdAt: now - (3 * 86400000),
    condition: "Like New (Flawless)",
    quality: "Samsung Knox Tested & 32-Point Verified",
    bodyCondition: "Armor Aluminum frame, zero dents, clean polished finish",
    displayCondition: "Dynamic AMOLED 2X 120Hz display, scratch-free Gorilla Glass Victus 2",
    batteryCondition: "97% Tested Battery Life with intelligent power management",
    accessories: "Type-C to Type-C 25W Fast Cable + SIM Pin",
    boxAvailable: "Original Brand Box Included",
    warranty: "6 Months Comprehensive Store Warranty",
    processor: "Snapdragon 8 Gen 2 for Galaxy (4nm Octa-Core)",
    camera: "50MP Primary (OIS) + 12MP Ultra-Wide + 10MP Telephoto (3x Optical Zoom)",
    display: "6.1-inch Dynamic AMOLED 2X, 120Hz Adaptive Refresh, 1750 nits HDR10+",
    battery: "3900 mAh with 25W Super Fast Charging & Wireless PowerShare",
    network: "Dual SIM 5G SA/NSA, Wi-Fi 6E, Bluetooth 5.3, NFC, UWB",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "8 GB", rom: "128 GB" },
    variants: [
      {
        id: "samsung-s23-5g-v1",
        ram: "8 GB",
        rom: "128 GB",
        storage: "128 GB",
        price: 49999,
        mrp: 74999,
        condition: "Like New (Flawless)",
        quality: "Samsung Knox Tested & 32-Point Verified"
      },
      {
        id: "samsung-s23-5g-v2",
        ram: "8 GB",
        rom: "256 GB",
        storage: "256 GB",
        price: 54999,
        mrp: 79999,
        condition: "Pristine Condition",
        quality: "Samsung Knox Tested & 32-Point Verified"
      }
    ]
  },
  {
    id: "vivo-t3x-5g",
    name: "Vivo T3x 5G (Crimson Bliss, 128 GB)",
    brand: "Vivo",
    category: "mobile",
    price: 13499,
    mrp: 17499,
    rating: 4.5,
    reviewsCount: 230,
    createdAt: now - (1 * 86400000),
    condition: "Superb Condition",
    quality: "Tested & 32-Point Verified",
    bodyCondition: "3D textured back panel with minimal pocket wear, completely unblemished",
    displayCondition: "120Hz FHD+ Ultra Smooth display with pre-installed tempered shield",
    batteryCondition: "99% High-Capacity Battery Endurance Test Passed",
    accessories: "Original 44W FlashCharge Adapter + USB Type-C Cable",
    boxAvailable: "Rittik Mobile Certified Box",
    warranty: "3 Months Store Warranty & Free Diagnostics",
    processor: "Snapdragon 6 Gen 1 (4nm High-Efficiency Octa-Core)",
    camera: "50MP AI HD Main Camera + 2MP Bokeh Lens & 8MP Portrait Selfie",
    display: "6.72-inch FHD+ Ultra Smooth 120Hz Sunlight Display",
    battery: "6000 mAh Monster Battery with 44W FlashCharge",
    network: "Dual SIM 5G / 4G VoLTE, Wi-Fi 5, Bluetooth 5.1, GPS",
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "6 GB", rom: "128 GB" },
    variants: [
      {
        id: "vivo-t3x-5g-v1",
        ram: "6 GB",
        rom: "128 GB",
        storage: "128 GB",
        price: 13499,
        mrp: 17499,
        processor: "Snapdragon 6 Gen 1 (4nm High-Efficiency Octa-Core)",
        camera: "50MP AI HD Main Camera + 2MP Bokeh Lens & 8MP Portrait Selfie",
        display: "6.72-inch FHD+ Ultra Smooth 120Hz Sunlight Display",
        battery: "6000 mAh Monster Battery with 44W FlashCharge",
        condition: "Superb Condition",
        quality: "Tested & 32-Point Verified"
      },
      {
        id: "vivo-t3x-5g-v2",
        ram: "8 GB",
        rom: "256 GB",
        storage: "256 GB",
        price: 16499,
        mrp: 20999,
        processor: "Snapdragon 6 Gen 1 with Turbo RAM Boost",
        camera: "50MP AI Ultra HD Camera + 2MP Bokeh & 8MP HDR Selfie",
        display: "6.72-inch FHD+ Ultra Smooth 120Hz Sunlight Display",
        battery: "6000 mAh Monster Battery with 44W FlashCharge",
        condition: "Like New (Flawless)",
        quality: "Tested & 32-Point Verified"
      }
    ]
  },
  {
    id: "realme-12-pro-plus",
    name: "Realme 12 Pro+ 5G (Submarine Blue, 256 GB)",
    brand: "Realme",
    category: "mobile",
    price: 26999,
    mrp: 34999,
    rating: 4.7,
    reviewsCount: 89,
    createdAt: now - (4 * 86400000),
    condition: "Like New (Flawless)",
    quality: "Periscope Camera & Lens Verified",
    bodyCondition: "Luxury Vegan Leather Finish with 3D Jubilee Bracelet Accent",
    displayCondition: "120Hz Curved Vision AMOLED with Pro-XDR Precision",
    batteryCondition: "96% Battery Health (Original 67W Tested)",
    accessories: "67W SUPERVOOC Power Adapter & Heavy-Duty Cable",
    boxAvailable: "Original Brand Box Included",
    warranty: "6 Months Comprehensive Store Warranty",
    processor: "Snapdragon 7s Gen 2 (4nm 5G Architecture)",
    camera: "64MP Periscope Portrait (3X Optical, 120X SuperZoom) + 50MP Sony IMX890 OIS",
    display: "6.7-inch 120Hz Curved AMOLED with 2160Hz PWM Dimming",
    battery: "5000 mAh with 67W SUPERVOOC Super Fast Charging",
    network: "Dual SIM 5G Dual Standby, Wi-Fi 6, Bluetooth 5.2",
    images: [
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "8 GB", rom: "256 GB" },
    variants: [
      {
        id: "realme-12-pro-plus-v1",
        ram: "8 GB",
        rom: "256 GB",
        storage: "256 GB",
        price: 26999,
        mrp: 34999,
        condition: "Like New (Flawless)",
        quality: "Periscope Camera & Lens Verified"
      },
      {
        id: "realme-12-pro-plus-v2",
        ram: "12 GB",
        rom: "512 GB",
        storage: "512 GB",
        price: 29999,
        mrp: 39999,
        condition: "Pristine Sealed Box Condition",
        quality: "Periscope Camera & Pro-XDR Display Verified"
      }
    ]
  },
  {
    id: "oppo-reno-11",
    name: "Oppo Reno 11 5G (Wave Green, 128 GB)",
    brand: "Oppo",
    category: "mobile",
    price: 24999,
    mrp: 31999,
    rating: 4.6,
    reviewsCount: 64,
    createdAt: now - (14 * 86400000),
    condition: "Superb Condition",
    quality: "Ultra-Clear Portrait System Verified",
    bodyCondition: "Shimmering Silk Texture back with zero cosmetic flaws",
    displayCondition: "3D Curved AMOLED 120Hz, vibrant HDR10+ colors",
    batteryCondition: "95% Battery Health (SuperVOOC Certified)",
    accessories: "67W Fast Charger + Braided Cable",
    boxAvailable: "Original Brand Box Included",
    warranty: "6 Months Store Warranty",
    processor: "MediaTek Dimensity 7050 5G Octa-Core",
    camera: "50MP Sony OIS Main + 32MP Telephoto Portrait + 8MP Ultra-Wide",
    display: "6.7-inch 120Hz 3D Curved AMOLED Screen (1.07 Billion Colors)",
    battery: "5000 mAh with 67W SUPERVOOC Flash Charge",
    network: "Dual SIM 5G / 4G VoLTE, Wi-Fi 6, Bluetooth 5.3",
    images: [
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "8 GB", rom: "128 GB" },
    variants: [
      {
        id: "oppo-reno-11-v1",
        ram: "8 GB",
        rom: "128 GB",
        storage: "128 GB",
        price: 24999,
        mrp: 31999,
        condition: "Superb Condition"
      },
      {
        id: "oppo-reno-11-v2",
        ram: "8 GB",
        rom: "256 GB",
        storage: "256 GB",
        price: 27999,
        mrp: 35999,
        condition: "Like New (Flawless)"
      }
    ]
  },
  {
    id: "xiaomi-redmi-note-13-pro",
    name: "Xiaomi Redmi Note 13 Pro 5G (Arctic White, 128 GB)",
    brand: "Xiaomi",
    category: "mobile",
    price: 21999,
    mrp: 28999,
    rating: 4.7,
    reviewsCount: 115,
    createdAt: now - (2 * 86400000),
    condition: "Superb Condition",
    quality: "200MP OIS Camera Verified",
    bodyCondition: "Double-sided glass body, scratch-free bezel and camera bump",
    displayCondition: "1.5K CrystalRes 120Hz AMOLED with Corning Gorilla Glass Victus",
    batteryCondition: "96% Battery Health (Turbo Charging Tested)",
    accessories: "67W Turbo Charger + USB-C Cable",
    boxAvailable: "Original Brand Box Included",
    warranty: "6 Months Store Warranty",
    processor: "Snapdragon 7s Gen 2 (4nm 5G)",
    camera: "200MP Samsung ISOCELL HP3 (OIS) + 8MP Ultra-Wide + 2MP Macro",
    display: "6.67-inch 1.5K 120Hz AMOLED Display (1800 nits peak)",
    battery: "5100 mAh with 67W Turbo Charge (0 to 100% in 44 mins)",
    network: "Dual SIM 5G SA/NSA, Wi-Fi 5, Bluetooth 5.2, IR Blaster",
    images: [
      "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "8 GB", rom: "128 GB" },
    variants: [
      {
        id: "xiaomi-redmi-note-13-pro-v1",
        ram: "8 GB",
        rom: "128 GB",
        storage: "128 GB",
        price: 21999,
        mrp: 28999,
        condition: "Superb Condition"
      },
      {
        id: "xiaomi-redmi-note-13-pro-v2",
        ram: "12 GB",
        rom: "256 GB",
        storage: "256 GB",
        price: 24999,
        mrp: 32999,
        condition: "Like New (Flawless)"
      }
    ]
  },
  {
    id: "google-pixel-7a",
    name: "Google Pixel 7a (Sea Blue, 128 GB)",
    brand: "Google",
    category: "mobile",
    price: 33999,
    mrp: 43999,
    rating: 4.8,
    reviewsCount: 94,
    createdAt: now - (5 * 86400000),
    condition: "Mint Condition",
    quality: "Google Titan M2 Security & Camera Verified",
    bodyCondition: "Glossy plastic back with sleek aluminium camera bar visor",
    displayCondition: "6.1-inch 90Hz OLED Smooth Display, HDR enabled",
    batteryCondition: "95% Battery Health (Extreme Battery Saver capable)",
    accessories: "Original USB-C to USB-C Cable & Quick Switch Adapter",
    boxAvailable: "Original Google Box Included",
    warranty: "6 Months Store Warranty",
    processor: "Google Tensor G2 with Titan M2 security coprocessor",
    camera: "64MP Quad PD Quad Bayer Wide + 13MP Ultrawide with Super Res Zoom",
    display: "6.1-inch OLED up to 90Hz, Corning Gorilla Glass 3",
    battery: "4385 mAh with 18W Fast Charging & Wireless Charging",
    network: "Dual SIM 5G (Nano + eSIM), Wi-Fi 6E, Bluetooth 5.3, NFC",
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "8 GB", rom: "128 GB" }
  },
  {
    id: "apple-watch-se",
    name: "Apple Watch SE (2nd Gen) GPS 44mm (Midnight)",
    brand: "Apple",
    category: "watch",
    price: 22999,
    mrp: 29900,
    rating: 4.8,
    reviewsCount: 78,
    createdAt: now - (6 * 86400000),
    condition: "Mint Condition",
    quality: "Apple Sensor & Battery Health 98%+",
    bodyCondition: "100% recycled aluminium case, flawless Ion-X glass",
    displayCondition: "Retina OLED 1000 nits, high tactile responsiveness",
    batteryCondition: "98% Battery Health (Original Apple Magnetic Charger)",
    accessories: "Apple Magnetic Fast Charger to USB-C Cable + Midnight Sport Band",
    boxAvailable: "Original Apple Watch Box Included",
    warranty: "6 Months Store Warranty",
    processor: "S8 SiP with 64-bit Dual-Core Processor",
    camera: "Optical Heart Sensor & Crash Detection",
    display: "Retina LTPO OLED Display (Up to 1000 nits)",
    battery: "All-day 18-hour battery with Low Power Mode (Up to 36 hours)",
    network: "Wi-Fi 802.11b/g/n, Bluetooth 5.3, GPS/GNSS",
    images: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "OLED", rom: "Retina Display" },
    variants: [
      {
        id: "apple-watch-se-v1",
        ram: "GPS Only",
        rom: "40mm Case",
        storage: "40mm Case",
        price: 19999,
        mrp: 25900,
        condition: "Mint Condition"
      },
      {
        id: "apple-watch-se-v2",
        ram: "GPS + Cellular",
        rom: "44mm Case",
        storage: "44mm Case",
        price: 22999,
        mrp: 29900,
        condition: "Like New (Flawless)"
      }
    ]
  },
  {
    id: "galaxy-buds-2-pro",
    name: "Samsung Galaxy Buds2 Pro ANC Earbuds (Graphite)",
    brand: "Samsung",
    category: "accessory",
    price: 9499,
    mrp: 17999,
    rating: 4.6,
    reviewsCount: 92,
    createdAt: now - (12 * 86400000),
    condition: "Sanitized & Verified",
    quality: "24-bit Hi-Fi Audio Tested",
    bodyCondition: "Matte case and buds sanitized with UV-C, no scuffs",
    displayCondition: "Dual Driver Acoustic System (Coaxial 2-Way)",
    batteryCondition: "100% Battery Retention on both buds and charging case",
    accessories: "Wireless Charging Case, USB-C Cable & 3 Sizes of Silicone Ear Tips",
    boxAvailable: "Original Brand Box Included",
    warranty: "6 Months Store Warranty",
    processor: "Intelligent 360 Audio with Direct Multi-Channel",
    camera: "3 High-SNR Microphones with Active Noise Cancellation",
    display: "Custom Coaxial 2-Way (Tweeter + Woofer)",
    battery: "Up to 29 hours total playtime with wireless Qi charging case",
    network: "Bluetooth 5.3, Auto Switch, Samsung Seamless Codec (SSC)",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80"
    ],
    highlights: { ram: "ANC", rom: "Wireless Charging" }
  }
];

export const initialProducts = defaultCatalog;
