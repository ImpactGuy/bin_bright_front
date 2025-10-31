import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import binPreview from "@/assets/bin-preview-close.jpg";
import { PDF_DIMENSIONS } from "@/types/label";
import { generateLabelId, pxToPt } from "@/utils/labelCalculations";
import { addToCart, getCartItems, getCartTotals, clearCart, PRICE_PER_UNIT } from "@/utils/cart";
import { createCheckout, convertCartItemsToLineItems, getLabelProductVariantId, redirectToCheckout } from "@/services/shopifyStorefront";
import { isShopifyConfigured } from "@/lib/shopifyConfig";
import type { LabelConfiguration, CartItem } from "@/types/label";
const STEP_PT = 5; // Step size in points for manual adjustments

export const LabelConfigurator = () => {
  const [text, setText] = useState("MÜLLER");
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      return getCartItems();
    } catch (error) {
      console.error("Failed to initialize cart:", error);
      return [];
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Advanced font sizing refs and state
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontPx, setFontPx] = useState(36);
  const [fontSizePt, setFontSizePt] = useState(48); // Font size in points for PDF
  const [basePx, setBasePx] = useState(36);
  const [userSteps, setUserSteps] = useState(0); // Steps in points adjustment

  // Safe text processing
  const safeText = useMemo(() => 
    text.trim().replace(/\s+/g, " ").toLocaleUpperCase("de-DE"), 
    [text]
  );

  // Advanced font fitting algorithm with ResizeObserver
  useEffect(() => {
    const fit = () => {
      const box = boxRef.current;
      const span = textRef.current;
      if (!box || !span) return;

      const maxPx = 56;
      const minPx = 14;
      const padding = 16; // Increased padding for better safety margin

      let size = Math.min(maxPx, Math.max(minPx, fontPx));
      span.style.whiteSpace = "nowrap";
      span.style.letterSpacing = "0.02em";

      // Start fresh with base size
      span.style.fontSize = `${minPx}px`;
      size = minPx;

      // Increase size until it doesn't fit
      while (size < maxPx) {
        const testSize = size + 1;
        span.style.fontSize = `${testSize}px`;
        if (span.offsetWidth <= box.clientWidth - padding) {
          size = testSize;
        } else {
          span.style.fontSize = `${size}px`;
          break;
        }
      }

      setBasePx(size);

      // Convert base size to points for PDF
      const basePt = pxToPt(size);
      
      // Apply user adjustments in points, then convert back to pixels for preview
      const adjustedPt = Math.max(40, Math.min(700, basePt + userSteps * STEP_PT));
      const adjustedPx = (adjustedPt / 2.834645669) * 3.779527559; // Convert pt -> mm -> px

      let desired = Math.min(maxPx, Math.max(minPx, adjustedPx));
      span.style.fontSize = `${desired}px`;

      // Ensure it still fits with user adjustments
      while (desired > minPx && span.offsetWidth > box.clientWidth - padding) {
        desired -= 1;
        span.style.fontSize = `${desired}px`;
      }

      setFontPx(desired);
      // Store the point size for PDF generation
      setFontSizePt(pxToPt(desired));
    };

    fit();
    const ro = new ResizeObserver(() => fit());
    if (boxRef.current) ro.observe(boxRef.current);
    window.addEventListener("resize", fit);
    
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [safeText, userSteps]);

  // Reset user steps and quantity when text changes
  useEffect(() => {
    setUserSteps(0);
    setQuantity(1); // Reset quantity to 1 when text changes
  }, [safeText]);

  // Check if plus button should be disabled
  const plusDisabled = (() => {
    const box = boxRef.current;
    const span = textRef.current;
    if (!box || !span) return false;
    const prev = span.style.fontSize;
    const stepPx = (STEP_PT / 2.834645669) * 3.779527559; // Convert step from pt to px
    const probe = fontPx + stepPx;
    span.style.fontSize = `${probe}px`;
    const over = span.offsetWidth > box.clientWidth - 8;
    span.style.fontSize = prev;
    return over;
  })();

  // Sync cart items from localStorage
  useEffect(() => {
    const updateCart = () => {
      setCartItems(getCartItems());
    };
    updateCart();
    // Listen for storage changes (e.g., from other tabs)
    window.addEventListener("storage", updateCart);
    return () => window.removeEventListener("storage", updateCart);
  }, []);

  const handleAddToCart = () => {
    if (!safeText.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Text ein",
        variant: "destructive",
      });
      return;
    }

      const config: LabelConfiguration = {
      id: generateLabelId(),
      text: safeText,
      fontSizePt: fontSizePt,
      fontSizePx: fontPx,
      quantity: quantity,
      fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
        color: "#000000", // black for PDF
      timestamp: Date.now(),
    };

    addToCart(config);
    setCartItems(getCartItems());
    
    toast({
      title: "In den Warenkorb gelegt",
      description: `${quantity}x "${safeText}" wurde hinzugefügt`,
    });
  };

  const handleCheckout = async () => {
    const items = getCartItems();
    if (items.length === 0) {
      toast({
        title: "Warenkorb leer",
        description: "Bitte fügen Sie Artikel zum Warenkorb hinzu",
        variant: "destructive",
      });
      return;
    }

    // Check if Shopify is configured
    if (!isShopifyConfigured()) {
      toast({
        title: "Konfiguration fehlt",
        description: "Shopify Storefront API nicht konfiguriert. Bitte .env Datei überprüfen.",
        variant: "destructive",
      });
      return;
    }

    // Get product variant ID
    const variantId = getLabelProductVariantId();
    if (!variantId) {
      toast({
        title: "Produkt nicht gefunden",
        description: "Bitte erstellen Sie ein Produkt in Shopify und setzen Sie VITE_SHOPIFY_LABEL_VARIANT_ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert cart items to Shopify line items
      const lineItems = convertCartItemsToLineItems(items, variantId);

      // Create Shopify checkout
      const result = await createCheckout(lineItems);

      if (result.error) {
        toast({
          title: "Fehler bei der Bestellung",
          description: result.error,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (result.checkoutUrl) {
        // Success - clear cart before redirecting to Shopify checkout
        clearCart();
        setCartItems([]);
        
        toast({
          title: "Zur Kasse weitergeleitet",
          description: "Sie werden jetzt zur Shopify Kasse weitergeleitet...",
        });

        // Small delay to show toast, then redirect
        setTimeout(() => {
          redirectToCheckout(result.checkoutUrl!);
        }, 500);
      } else {
        throw new Error("Keine Checkout-URL erhalten");
      }
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

  const { totalQuantity, totalPrice } = useMemo(() => getCartTotals(), [cartItems]);

  return (
    <div className="max-w-sm mx-auto px-4">
      {/* Main Configuration Card */}
      <Card className="bg-gradient-card shadow-strong border-0 overflow-hidden animate-fade-in backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Enhanced Preview Section with Advanced Font Fitting */}
          <div 
            className="relative h-[320px] bg-no-repeat bg-center flex items-center justify-center"
            style={{ 
              backgroundImage: `url(${binPreview})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center'
            }}
          >
            {/* Text Preview directly on bin */}
            <div className="w-[70%] px-2 mt-16">
              <div
                ref={boxRef}
                className="mx-auto overflow-hidden text-center"
                style={{ fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif' }}
              >
                <span
                  ref={textRef}
                  className="inline-block select-none align-middle text-white drop-shadow-lg"
                  style={{ 
                    fontSize: `${fontPx}px`, 
                    lineHeight: 1.1,
                    textShadow: "3px 3px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.5)",
                    transform: "scale(0.75)"
                  }}
                >
                  {safeText || "IHR TEXT"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Disclaimer Text */}
          <div className="px-4 pb-3 pt-1 text-center">
            <p className="text-xs text-muted-foreground leading-tight">
              Unverbindliche Vorschau. Der Aufkleber wird eine Größe von 270 mm x 66 mm haben.
            </p>
          </div>

          {/* Configuration Section */}
          <div className="p-4 space-y-4 bg-gradient-card">
            {/* Text Input */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold block">Ihre Beschriftung</Label>
              <Input
                id="text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="z.B. MÜLLER oder 15A"
                className="text-lg uppercase h-11 border-2 border-input focus:border-primary focus:ring-primary/20 focus:ring-4 transition-smooth bg-background/50 backdrop-blur-sm font-medium"
                maxLength={20}
              />
            </div>

            {/* Font Size Controls */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-semibold">Schriftgröße anpassen</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-10 bg-background/80 border-2 border-input text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-smooth hover:scale-[1.02] active:scale-[0.98] font-medium shadow-soft"
                  onClick={() => setUserSteps(s => s - 1)}
                >
                  <Minus className="w-4 h-4" />
                  Kleiner
                </Button>
                <Button
                  variant="outline"
                  className="h-10 bg-background/80 border-2 border-input text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-smooth hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 font-medium shadow-soft"
                  onClick={() => setUserSteps(s => s + 1)}
                  disabled={plusDisabled}
                >
                  <Plus className="w-4 h-4" />
                  Größer
                </Button>
              </div>
            </div>

            {/* Configuration Row */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-xl p-4 space-y-4 shadow-strong border border-slate-700/50 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                {/* Quantity Section */}
                <div className="space-y-2">
                  <Label className="text-slate-200 text-sm font-semibold block">Stück</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className="h-10 bg-slate-700/80 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 transition-smooth hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-soft backdrop-blur-sm"
                      onClick={() => setQuantity(prev => Math.max(prev - 1, 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center justify-center h-10 bg-slate-700/80 rounded-md border border-slate-600 backdrop-blur-sm">
                      <span className="text-lg font-bold text-white">{quantity}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 bg-slate-700/80 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 transition-smooth hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-soft backdrop-blur-sm"
                      onClick={() => setQuantity(prev => Math.min(prev + 1, 99))}
                      disabled={quantity >= 99}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Price Section */}
                <div className="space-y-2">
                  <Label className="text-slate-200 text-sm font-semibold block">Preis</Label>
                  <div className="h-10 flex items-center justify-center bg-slate-700/80 rounded-md border border-slate-600 backdrop-blur-sm">
                    <span className="text-lg font-bold text-white">{(PRICE_PER_UNIT * quantity).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-smooth hover:scale-[1.02] active:scale-[0.98] shadow-medium hover:shadow-strong rounded-xl group"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                In den Warenkorb
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Checkout Button */}
      {totalQuantity > 0 && (
        <div className="mt-4 animate-fade-in space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            Gesamt: {totalQuantity} Artikel • {totalPrice.toFixed(2)} €
          </div>
          <Button 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-strong hover:shadow-medium transition-smooth hover:scale-[1.02] active:scale-[0.98] rounded-xl group relative overflow-hidden disabled:opacity-50" 
            size="lg"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin flex-shrink-0" />
                <span className="truncate">Wird verarbeitet...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2 group-hover:animate-bounce flex-shrink-0" />
                <span className="truncate">
                  {totalQuantity} Artikel bestellen
                </span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};