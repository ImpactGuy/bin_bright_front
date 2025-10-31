import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bins.jpg";

export const HeroSection = () => {
  const scrollToConfigurator = () => {
    const element = document.getElementById('configurator');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          filter: "brightness(0.4)"
        }}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Tonnentext
          </span>
        </h1>
        <p className="text-xl md:text-2xl mb-4 text-white/90 font-medium">
          Individuelle Mülltonnen-Beschriftungen
        </p>
        <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
          Einfach Text eingeben, Schrift & Farbe wählen, Vorschau sehen – fertig! 
          Wir liefern Ihnen hochwertige, wetterbeständige Aufkleber in 40 cm Breite.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={scrollToConfigurator}
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-strong text-lg px-8 py-3 h-auto transition-bounce"
          >
            Jetzt konfigurieren
          </Button>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-label-green rounded-full"></div>
              <span>Wetterfest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-label-yellow rounded-full"></div>
              <span>40cm Breite</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-label-blue rounded-full"></div>
              <span>4 Farben</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};