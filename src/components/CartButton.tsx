import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { getCartTotals } from "@/utils/cart";
import { CartDrawer } from "./CartDrawer";

export const CartButton = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState(0);

  const updateCartCount = async () => {
    try {
      const { totalQuantity: count } = await getCartTotals();
      setTotalQuantity(count);
    } catch (error) {
      console.error("Failed to update cart count:", error);
    }
  };

  useEffect(() => {
    updateCartCount();
    
    // Listen for cart updates
    window.addEventListener("cartUpdated", updateCartCount);
    
    // Poll for changes (in case cart is updated from same tab)
    const interval = setInterval(updateCartCount, 2000);
    
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        size="icon"
      >
        <ShoppingCart className="w-5 h-5" />
        {totalQuantity > 0 && (
          <Badge
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold"
          >
            {totalQuantity > 99 ? "99+" : totalQuantity}
          </Badge>
        )}
      </Button>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
};

