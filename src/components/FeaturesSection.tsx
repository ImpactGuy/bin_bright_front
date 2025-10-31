import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Palette, Ruler, Zap } from "lucide-react";

const features = [
  {
    icon: CheckCircle,
    title: "Einfache Bestellung",
    description: "Text eingeben, Schrift & Farbe wählen, Vorschau sehen – fertig! Keine komplizierte Gestaltung nötig.",
  },
  {
    icon: Ruler,
    title: "Garantierte 40cm Breite",
    description: "Jeder Aufkleber wird exakt auf 40cm Breite skaliert. Perfekt für alle gängigen Mülltonnen.",
  },
  {
    icon: Palette,
    title: "4 Schriften & Farben",
    description: "Wählen Sie aus 4 professionellen Schriftarten und 4 wetterfesten Farben für Ihren individuellen Stil.",
  },
  {
    icon: Zap,
    title: "Sofort produktionsfertig",
    description: "Automatisch erzeugte Vektordateien ermöglichen schnelle, fehlerfreie Fertigung ohne Nacharbeit.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Warum Tonnentext?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professionelle Mülltonnen-Beschriftungen in Minuten erstellt – 
            mit garantierter Qualität und perfekter Passform.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center shadow-soft hover:shadow-medium transition-smooth bg-gradient-card">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};