import { Card, CardContent } from "@/components/ui/card";
import { Edit3, Eye, Package, Truck } from "lucide-react";

const steps = [
  {
    icon: Edit3,
    title: "1. Konfigurieren",
    description: "Text eingeben und aus 4 Schriften sowie 4 Farben wählen",
  },
  {
    icon: Eye,
    title: "2. Vorschau prüfen", 
    description: "Live-Vorschau in originaler 40cm Breite betrachten",
  },
  {
    icon: Package,
    title: "3. Bestellen",
    description: "Sichere Bezahlung – automatische Produktionsdatei wird erstellt",
  },
  {
    icon: Truck,
    title: "4. Erhalten",
    description: "Wetterfester Qualitäts-Aufkleber wird zu Ihnen geliefert",
  },
];

export const ProcessSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            So einfach geht's
          </h2>
          <p className="text-lg text-muted-foreground">
            In nur 4 Schritten zu Ihrer individuellen Mülltonnen-Beschriftung
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative shadow-soft hover:shadow-medium transition-smooth bg-gradient-card">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 shadow-medium">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border transform -translate-y-1/2"></div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};