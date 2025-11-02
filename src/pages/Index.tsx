import { LabelConfigurator } from "@/components/LabelConfigurator";
import { CartButton } from "@/components/CartButton.tsx";

const Index = () => {
  return (
    <div className="w-full">
      {/* Configurator Section */}
      <section id="configurator" className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <LabelConfigurator />
        </div>
      </section>
      
      {/* Floating Cart Button */}
      <CartButton />
    </div>
  );
};

export default Index;
