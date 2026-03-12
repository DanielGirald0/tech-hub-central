import { Link } from "react-router-dom";
import { Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const solutions = [
  {
    title: "Security Cameras & CCTV",
    icon: "📷",
    description: "Professional surveillance systems for homes and businesses. HD and 4K options with remote viewing.",
    features: ["Indoor & Outdoor Cameras", "Night Vision", "Remote Viewing App", "Motion Detection", "Cloud Storage"],
  },
  {
    title: "Alarm Systems",
    icon: "🚨",
    description: "Protect your property with modern alarm systems. Wired, wireless, and hybrid options available.",
    features: ["Intrusion Detection", "Smoke & Fire Alerts", "24/7 Monitoring", "Mobile Notifications", "Battery Backup"],
  },
  {
    title: "Access Control",
    icon: "🔐",
    description: "Control who enters your premises with biometric, card reader, and keypad systems.",
    features: ["Biometric Readers", "RFID Card Systems", "PIN Keypads", "Time & Attendance", "Multi-door Control"],
  },
  {
    title: "Video Intercom",
    icon: "🔔",
    description: "See and speak with visitors before opening the door. Wired and wireless models.",
    features: ["HD Video", "Two-way Audio", "Smartphone Integration", "Multiple Stations", "Night Vision"],
  },
];

const Security = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Security Solutions</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Complete Security for Your Property
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Professional security solutions with expert installation and ongoing support.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/contact">Get Free Consultation <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-16">
        <div className="container mx-auto px-4 space-y-12">
          {solutions.map((sol, i) => (
            <div key={sol.title} className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <span className="text-3xl">{sol.icon}</span>
                  <h2 className="font-display text-xl font-bold text-foreground mt-3 mb-2">{sol.title}</h2>
                  <p className="text-muted-foreground mb-4">{sol.description}</p>
                  <Button asChild variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                    <Link to={`/products?category=${sol.title.includes("Camera") ? "security-cameras" : sol.title.includes("Alarm") ? "alarms" : sol.title.includes("Access") ? "access-control" : "intercom"}`}>
                      View Products <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
                <div className="md:w-64 shrink-0">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {sol.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Security;
