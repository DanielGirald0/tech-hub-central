export interface Service {
  id: string;
  name: string;
  category: "reparacion" | "mantenimiento" | "instalacion" | "asesoria";
  description: string;
  icon: string;
  price?: string;
}

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
  { id: "s10", name: "Asesoría a negocios en facturación electrónica, inventarios, POS y sistemas de facturación", category: "asesoria", description: "Acompañamos a tu negocio en la implementación de facturación electrónica, control de inventarios, sistemas POS y software de facturación adaptado a tus necesidades.", icon: "💼", price: "Desde $150.000/hr" },
  { id: "s11", name: "Mantenimiento preventivo", category: "mantenimiento", description: "Planes de mantenimiento regular para mantener sus equipos funcionando.", icon: "⚙️", price: "Desde $80.000/mes" },
];
