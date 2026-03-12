import { Shield, Wrench, Users, Award } from "lucide-react";

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">About TechStore</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Your trusted technology partner with over 15 years of experience serving our community.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Our Story</h2>
          <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
            <p>
              TechStore was founded with a simple mission: to bring the best technology products and services
              to our community at fair prices with expert support.
            </p>
            <p>
              What started as a small computer repair shop has grown into a full-service technology center offering
              over 1,000 products across multiple categories, along with professional installation and repair services.
            </p>
            <p>
              Today, we're proud to serve thousands of residential and commercial customers, providing everything
              from the latest gadgets to complete security system installations.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Shield, title: "Trusted", desc: "Authorized dealer of top brands" },
            { icon: Wrench, title: "Expert", desc: "Certified technicians on staff" },
            { icon: Users, title: "5000+", desc: "Satisfied customers" },
            { icon: Award, title: "15 Years", desc: "In the industry" },
          ].map((item) => (
            <div key={item.title} className="bg-card border border-border rounded-xl p-5 text-center">
              <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-display font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-foreground mb-3">Our Mission</h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          To empower our community with reliable technology solutions, exceptional service,
          and honest advice — making technology accessible and worry-free for everyone.
        </p>
      </div>
    </div>
  );
};

export default About;
