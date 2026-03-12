export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand: string;
  inStock: boolean;
  rating: number;
  description: string;
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  subcategories: string[];
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  price?: string;
}

export const categories: Category[] = [
  { id: "computers", name: "Computers", icon: "💻", count: 120, subcategories: ["Desktop", "Laptop", "All-in-One"] },
  { id: "accessories", name: "Computer Accessories", icon: "🖱️", count: 250, subcategories: ["Keyboards", "Mice", "Monitors", "Cables", "Webcams"] },
  { id: "consoles", name: "Video Game Consoles", icon: "🎮", count: 30, subcategories: ["PlayStation", "Xbox", "Nintendo"] },
  { id: "console-accessories", name: "Gaming Accessories", icon: "🕹️", count: 80, subcategories: ["Controllers", "Headsets", "Charging Docks"] },
  { id: "phones", name: "Mobile Phones", icon: "📱", count: 60, subcategories: ["Smartphones", "Feature Phones"] },
  { id: "phone-accessories", name: "Phone Accessories", icon: "🔌", count: 150, subcategories: ["Cases", "Chargers", "Screen Protectors", "Earbuds"] },
  { id: "security-cameras", name: "Security Cameras", icon: "📷", count: 45, subcategories: ["Indoor", "Outdoor", "PTZ", "Bullet"] },
  { id: "cctv", name: "CCTV Equipment", icon: "📹", count: 35, subcategories: ["DVR", "NVR", "Kits"] },
  { id: "alarms", name: "Alarm Systems", icon: "🚨", count: 25, subcategories: ["Wired", "Wireless", "Hybrid"] },
  { id: "access-control", name: "Access Control", icon: "🔐", count: 20, subcategories: ["Biometric", "Card Reader", "Keypads"] },
  { id: "intercom", name: "Video Intercom", icon: "🔔", count: 15, subcategories: ["Wired", "Wireless", "IP"] },
  { id: "networking", name: "Networking", icon: "🌐", count: 40, subcategories: ["Routers", "Switches", "Access Points", "Cables"] },
  { id: "gadgets", name: "Tech Gadgets", icon: "⚡", count: 70, subcategories: ["Smart Home", "Wearables", "Drones"] },
];

export const products: Product[] = [
  { id: "1", name: "Gaming Laptop Pro 15\"", category: "computers", subcategory: "Laptop", price: 1299.99, originalPrice: 1499.99, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop", brand: "TechPro", inStock: true, rating: 4.8, description: "High-performance gaming laptop with RTX 4070", featured: true },
  { id: "2", name: "Desktop Workstation X1", category: "computers", subcategory: "Desktop", price: 899.99, image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop", brand: "PowerBuild", inStock: true, rating: 4.5, description: "Professional workstation for demanding tasks", featured: true },
  { id: "3", name: "Mechanical Gaming Keyboard", category: "accessories", subcategory: "Keyboards", price: 89.99, originalPrice: 119.99, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop", brand: "KeyMaster", inStock: true, rating: 4.7, description: "RGB mechanical keyboard with Cherry MX switches" },
  { id: "4", name: "4K Ultra Monitor 27\"", category: "accessories", subcategory: "Monitors", price: 449.99, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop", brand: "ViewMax", inStock: true, rating: 4.6, description: "4K IPS display with HDR support", featured: true },
  { id: "5", name: "PlayStation 5 Console", category: "consoles", subcategory: "PlayStation", price: 499.99, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop", brand: "Sony", inStock: false, rating: 4.9, description: "Next-gen gaming console", featured: true },
  { id: "6", name: "Wireless Gaming Mouse", category: "accessories", subcategory: "Mice", price: 69.99, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop", brand: "ClickPro", inStock: true, rating: 4.4, description: "Ultra-lightweight wireless gaming mouse" },
  { id: "7", name: "Smartphone Galaxy Ultra", category: "phones", subcategory: "Smartphones", price: 1199.99, originalPrice: 1399.99, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop", brand: "Samsung", inStock: true, rating: 4.7, description: "Flagship smartphone with AI camera", featured: true },
  { id: "8", name: "4K Security Camera System", category: "security-cameras", subcategory: "Outdoor", price: 349.99, image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop", brand: "SecureVision", inStock: true, rating: 4.5, description: "Weatherproof 4K security camera with night vision", featured: true },
  { id: "9", name: "Wi-Fi 6 Mesh Router", category: "networking", subcategory: "Routers", price: 199.99, image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=300&fit=crop", brand: "NetSpeed", inStock: true, rating: 4.3, description: "Whole-home mesh Wi-Fi 6 system" },
  { id: "10", name: "Wireless Earbuds Pro", category: "phone-accessories", subcategory: "Earbuds", price: 149.99, originalPrice: 199.99, image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=300&fit=crop", brand: "SoundMax", inStock: true, rating: 4.6, description: "Active noise cancelling wireless earbuds" },
  { id: "11", name: "Smart Doorbell Camera", category: "intercom", subcategory: "Wireless", price: 179.99, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", brand: "SecureVision", inStock: true, rating: 4.4, description: "HD video doorbell with two-way audio" },
  { id: "12", name: "Xbox Series X", category: "consoles", subcategory: "Xbox", price: 499.99, image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=300&fit=crop", brand: "Microsoft", inStock: true, rating: 4.8, description: "Most powerful Xbox ever" },
];

export const services: Service[] = [
  { id: "s1", name: "Computer Repair", category: "repair", description: "Diagnostic and repair of desktops and laptops. Hardware and software issues.", icon: "🔧", price: "From $49" },
  { id: "s2", name: "Phone Repair", category: "repair", description: "Screen replacement, battery swap, and general mobile phone repairs.", icon: "📱", price: "From $29" },
  { id: "s3", name: "Console Repair", category: "repair", description: "Fix overheating, HDMI issues, disk drive problems and more.", icon: "🎮", price: "From $39" },
  { id: "s4", name: "Security Camera Installation", category: "installation", description: "Professional installation of CCTV and IP camera systems.", icon: "📷", price: "From $149" },
  { id: "s5", name: "Alarm System Installation", category: "installation", description: "Setup and configuration of home and business alarm systems.", icon: "🚨", price: "From $199" },
  { id: "s6", name: "Access Control Setup", category: "installation", description: "Install biometric, card reader, and keypad access systems.", icon: "🔐", price: "From $249" },
  { id: "s7", name: "Video Intercom Installation", category: "installation", description: "Professional video intercom system setup and wiring.", icon: "🔔", price: "From $179" },
  { id: "s8", name: "IT Consulting", category: "consulting", description: "Technology consulting for businesses and home offices.", icon: "💡", price: "From $99/hr" },
  { id: "s9", name: "Security Consulting", category: "consulting", description: "Assessment and planning of security systems for your property.", icon: "🛡️", price: "From $149" },
  { id: "s10", name: "Preventive Maintenance", category: "maintenance", description: "Regular maintenance plans to keep your equipment running smoothly.", icon: "⚙️", price: "From $79/mo" },
];
