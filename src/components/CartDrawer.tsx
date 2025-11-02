import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { getCartItems, removeFromCart, getCartTotals, clearCart } from "@/utils/cart";
import { queryCart, getCartId } from "@/services/shopifyCart";
import { useToast } from "@/hooks/use-toast";
import type { CartItem } from "@/types/label";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load cart items when drawer opens
  useEffect(() => {
    const loadCart = async () => {
      if (open) {
        setIsLoading(true);
        try {
          const items = await getCartItems();
          setCartItems(items);
        } catch (error) {
          console.error("Failed to load cart:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadCart();
  }, [open]);

  // Listen for cart changes
  useEffect(() => {
    const updateCart = async () => {
      try {
        const items = await getCartItems();
        setCartItems(items);
      } catch (error) {
        console.error("Failed to update cart:", error);
      }
    };
    
    updateCart();
    window.addEventListener("cartUpdated", updateCart);
    return () => {
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, []);

  const handleRemoveItem = async (shopifyLineId: string) => {
    try {
      await removeFromCart(shopifyLineId);
      const items = await getCartItems();
      setCartItems(items);
      toast({
        title: "Artikel entfernt",
        description: "Der Artikel wurde aus dem Warenkorb entfernt",
      });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Artikel konnte nicht entfernt werden",
        variant: "destructive",
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      setCartItems([]);
      toast({
        title: "Warenkorb geleert",
        description: "Alle Artikel wurden entfernt",
      });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Warenkorb konnte nicht geleert werden",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    const items = await getCartItems();
    if (items.length === 0) {
      toast({
        title: "Warenkorb leer",
        description: "Bitte fügen Sie Artikel zum Warenkorb hinzu",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const cartId = getCartId();
      if (!cartId) {
        throw new Error("Cart not found");
      }

      const cart = await queryCart(cartId);
      if (!cart || !cart.checkoutUrl) {
        throw new Error("Checkout URL not available");
      }

      toast({
        title: "Zur Kasse weitergeleitet",
        description: "Sie werden jetzt zur Shopify Kasse weitergeleitet...",
      });

      setTimeout(() => {
        window.location.href = cart.checkoutUrl;
      }, 500);
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Bestellung konnte nicht erstellt werden",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const [totals, setTotals] = useState({ totalQuantity: 0, totalPrice: 0 });

  useEffect(() => {
    const loadTotals = async () => {
      const totals = await getCartTotals();
      setTotals(totals);
    };
    loadTotals();
    const interval = setInterval(loadTotals, 1000);
    return () => clearInterval(interval);
  }, [cartItems]);

  const { totalQuantity, totalPrice } = totals;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Warenkorb
          </SheetTitle>
          <SheetDescription>
            {cartItems.length === 0
              ? "Ihr Warenkorb ist leer"
              : `${totalQuantity} Artikel im Warenkorb`}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Warenkorb wird geladen...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Keine Artikel im Warenkorb</p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mt-4"
            >
              Weiter einkaufen
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 mt-6 pr-4">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{item.text}</h4>
                          <div className="mt-1 text-sm text-muted-foreground space-y-1">
                            <p>Menge: {item.quantity}x</p>
                            <p>Schriftgröße: {item.fontSizePt.toFixed(0)} pt</p>
                            <p className="font-medium text-foreground">
                              {item.totalPrice.toFixed(2)} €
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => item.shopifyLineId && handleRemoveItem(item.shopifyLineId)}
                          disabled={!item.shopifyLineId}
                          className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="flex-col gap-2 sm:flex-col">
              <Separator className="my-4" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
                  <p className="text-2xl font-bold">{totalPrice.toFixed(2)} €</p>
                  <p className="text-xs text-muted-foreground">
                    {totalQuantity} {totalQuantity === 1 ? "Artikel" : "Artikel"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                {cartItems.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleClearCart}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Alle löschen
                  </Button>
                )}
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wird verarbeitet...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Zur Kasse
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

