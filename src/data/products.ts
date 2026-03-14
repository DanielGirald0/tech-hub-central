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
  { id: "computadores", name: "Computadores", icon: "💻", count: 120, subcategories: ["Escritorio", "Portátil", "Todo en Uno"] },
  { id: "accesorios-pc", name: "Accesorios para computadores", icon: "🖱️", count: 250, subcategories: ["Teclados", "Ratones", "Monitores", "Cables", "Webcams"] },
  { id: "consolas", name: "Consolas de videojuegos", icon: "🎮", count: 30, subcategories: ["PlayStation", "Xbox", "Nintendo"] },
  { id: "accesorios-consolas", name: "Accesorios para videojuegos", icon: "🕹️", count: 80, subcategories: ["Controles", "Audífonos", "Bases de carga"] },
  { id: "celulares", name: "Celulares", icon: "📱", count: 60, subcategories: ["Smartphones", "Básicos"] },
  { id: "accesorios-celulares", name: "Accesorios para celulares", icon: "🔌", count: 150, subcategories: ["Fundas", "Cargadores", "Vidrios templados", "Audífonos"] },
  { id: "camaras-seguridad", name: "Cámaras de seguridad", icon: "📷", count: 45, subcategories: ["Interior", "Exterior", "PTZ", "Bala"] },
  { id: "cctv", name: "Accesorios CCTV", icon: "📹", count: 35, subcategories: ["DVR", "NVR", "Kits"] },
  { id: "alarmas", name: "Alarmas", icon: "🚨", count: 25, subcategories: ["Cableadas", "Inalámbricas", "Híbridas"] },
  { id: "control-acceso", name: "Control de acceso", icon: "🔐", count: 20, subcategories: ["Biométrico", "Tarjeta", "Teclado"] },
  { id: "videoporteros", name: "Videoporteros", icon: "🔔", count: 15, subcategories: ["Cableado", "Inalámbrico", "IP"] },
  { id: "redes", name: "Redes y conectividad", icon: "🌐", count: 40, subcategories: ["Routers", "Switches", "Access Points", "Cables"] },
  { id: "gadgets", name: "Gadgets tecnológicos", icon: "⚡", count: 70, subcategories: ["Hogar inteligente", "Wearables", "Drones"] },
];

export const products: Product[] = [
  { id: "1", name: "Portátil Gamer Pro 15\"", category: "computadores", subcategory: "Portátil", price: 5499900, originalPrice: 6299900, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop", brand: "TechPro", inStock: true, rating: 4.8, description: "Portátil gamer de alto rendimiento con RTX 4070", featured: true },
  { id: "2", name: "PC de Escritorio X1", category: "computadores", subcategory: "Escritorio", price: 3799900, image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop", brand: "PowerBuild", inStock: true, rating: 4.5, description: "Estación de trabajo profesional para tareas exigentes", featured: true },
  { id: "3", name: "Teclado Mecánico Gamer", category: "accesorios-pc", subcategory: "Teclados", price: 379900, originalPrice: 499900, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop", brand: "KeyMaster", inStock: true, rating: 4.7, description: "Teclado mecánico RGB con switches Cherry MX" },
  { id: "4", name: "Monitor 4K Ultra 27\"", category: "accesorios-pc", subcategory: "Monitores", price: 1899900, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop", brand: "ViewMax", inStock: true, rating: 4.6, description: "Pantalla IPS 4K con soporte HDR", featured: true },
  { id: "5", name: "PlayStation 5", category: "consolas", subcategory: "PlayStation", price: 2599900, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop", brand: "Sony", inStock: false, rating: 4.9, description: "Consola de nueva generación", featured: true },
  { id: "6", name: "Ratón Gamer Inalámbrico", category: "accesorios-pc", subcategory: "Ratones", price: 289900, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop", brand: "ClickPro", inStock: true, rating: 4.4, description: "Ratón gamer inalámbrico ultraligero" },
  { id: "7", name: "Smartphone Galaxy Ultra", category: "celulares", subcategory: "Smartphones", price: 4999900, originalPrice: 5799900, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop", brand: "Samsung", inStock: true, rating: 4.7, description: "Smartphone insignia con cámara IA", featured: true },
  { id: "8", name: "Sistema de Cámaras 4K", category: "camaras-seguridad", subcategory: "Exterior", price: 1499900, image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop", brand: "SecureVision", inStock: true, rating: 4.5, description: "Cámara de seguridad 4K resistente al clima con visión nocturna", featured: true },
  { id: "9", name: "Router Mesh Wi-Fi 6", category: "redes", subcategory: "Routers", price: 849900, image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=300&fit=crop", brand: "NetSpeed", inStock: true, rating: 4.3, description: "Sistema mesh Wi-Fi 6 para todo el hogar" },
  { id: "10", name: "Audífonos Inalámbricos Pro", category: "accesorios-celulares", subcategory: "Audífonos", price: 629900, originalPrice: 849900, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop", brand: "SoundMax", inStock: true, rating: 4.6, description: "Audífonos inalámbricos con cancelación activa de ruido" },
  { id: "11", name: "Videoportero Inteligente", category: "videoporteros", subcategory: "Inalámbrico", price: 759900, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop", brand: "SecureVision", inStock: true, rating: 4.4, description: "Videoportero HD con audio bidireccional" },
  { id: "12", name: "Xbox Series X", category: "consolas", subcategory: "Xbox", price: 2599900, image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=300&fit=crop", brand: "Microsoft", inStock: true, rating: 4.8, description: "La Xbox más potente de la historia" },
];

export const services: Service[] = [
  { id: "s1", name: "Servicio técnico de computadores", category: "reparacion", description: "Diagnóstico y reparación de computadores de escritorio y portátiles. Problemas de hardware y software.", icon: "🔧", price: "Desde $50.000" },
  { id: "s2", name: "Servicio técnico de celulares", category: "reparacion", description: "Cambio de pantalla, batería y reparaciones generales de celulares.", icon: "📱", price: "Desde $30.000" },
  { id: "s3", name: "Servicio técnico de consolas", category: "reparacion", description: "Reparación de sobrecalentamiento, HDMI, unidad de disco y más.", icon: "🎮", price: "Desde $40.000" },
  { id: "s4", name: "Instalación de cámaras de seguridad", category: "instalacion", description: "Instalación profesional de sistemas CCTV y cámaras IP.", icon: "📷", price: "Desde $150.000" },
  { id: "s5", name: "Instalación de alarmas", category: "instalacion", description: "Instalación y configuración de sistemas de alarma para hogar y negocio.", icon: "🚨", price: "Desde $200.000" },
  { id: "s6", name: "Instalación de control de acceso", category: "instalacion", description: "Instalación de sistemas biométricos, lectores de tarjeta y teclados.", icon: "🔐", price: "Desde $250.000" },
  { id: "s7", name: "Instalación de videoporteros", category: "instalacion", description: "Instalación profesional de sistemas de videoportero.", icon: "🔔", price: "Desde $180.000" },
  { id: "s8", name: "Asesoría en sistemas", category: "asesoria", description: "Consultoría tecnológica para empresas y oficinas en casa.", icon: "💡", price: "Desde $100.000/hr" },
  { id: "s9", name: "Asesoría en seguridad electrónica", category: "asesoria", description: "Evaluación y planificación de sistemas de seguridad para su propiedad.", icon: "🛡️", price: "Desde $150.000" },
  { id: "s10", name: "Mantenimiento preventivo", category: "mantenimiento", description: "Planes de mantenimiento regular para mantener sus equipos funcionando.", icon: "⚙️", price: "Desde $80.000/mes" },
];
