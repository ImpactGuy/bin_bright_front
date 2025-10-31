import { LabelConfigurator } from "@/components/LabelConfigurator";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Configurator Section */}
      <section id="configurator" className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <LabelConfigurator />
        </div>
      </section>
    </div>
  );
};

export default Index;
