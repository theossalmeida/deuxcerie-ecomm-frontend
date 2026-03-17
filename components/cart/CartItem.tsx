"use client";

import { useRef, useEffect, useState } from "react";
import { Minus, Plus, X, ImagePlus } from "lucide-react";
import { CartItem as CartItemType } from "@/types";
import { useCartStore } from "@/store/cart";

interface CartItemProps {
  item: CartItemType;
}

export function CartItemRow({ item }: CartItemProps) {
  const { updateQuantity, removeItem, removeAdditional, addPhoto, removePhoto, setItemObservation } =
    useCartStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const isMajorItem = item.product.category !== "adicional";

  useEffect(() => {
    const urls = item.photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [item.photos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && item.photos.length < 3) {
      addPhoto(item.id, file);
    }
    e.target.value = "";
  };

  const additionalsTotal = item.additionals.reduce((s, a) => s + a.price, 0);
  const lineTotal = (item.product.price + additionalsTotal) * item.quantity;

  return (
    <div className="py-4 border-b border-burgundy/10 last:border-0">
      {/* Main item */}
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{item.product.emoji || "🎂"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-burgundy text-sm leading-tight">
                {item.product.name}
              </h4>
              {item.product.size && (
                <span className="text-xs text-burgundy/40">{item.product.size}</span>
              )}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-burgundy/30 hover:text-rose transition-colors flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          <p className="font-display text-burgundy/70 text-sm tabular-nums mt-0.5">
            R${" "}
            {item.product.price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>

          {/* Qty controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => updateQuantity(item.id, -1)}
              className="w-7 h-7 rounded-lg bg-burgundy/10 hover:bg-burgundy/20 flex items-center justify-center transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-semibold text-burgundy text-sm tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, 1)}
              className="w-7 h-7 rounded-lg bg-burgundy/10 hover:bg-burgundy/20 flex items-center justify-center transition-colors"
            >
              <Plus size={12} />
            </button>
            <span className="ml-auto font-display font-bold text-burgundy tabular-nums text-sm">
              R${" "}
              {lineTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Additionals */}
      {item.additionals.length > 0 && (
        <div className="ml-10 mt-2 space-y-1">
          {item.additionals.map((additional) => (
            <div
              key={additional.id}
              className="flex items-center gap-2 text-xs text-burgundy/60 bg-rose/5 rounded-lg px-2.5 py-1.5"
            >
              <span>{additional.emoji}</span>
              <span className="flex-1">{additional.name}</span>
              <span className="font-display tabular-nums">
                +R${" "}
                {additional.price.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <button
                onClick={() => removeAdditional(item.id, additional.id)}
                className="text-burgundy/30 hover:text-rose transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Observation — major items only */}
      {isMajorItem && (
        <div className="ml-10 mt-3">
          <textarea
            value={item.observation}
            onChange={(e) => setItemObservation(item.id, e.target.value)}
            placeholder="Deixe aqui o seu sabor escolhido, o que deseja que tenha no bolo e as referências..."
            maxLength={500}
            rows={3}
            className="w-full text-xs text-burgundy placeholder:text-burgundy/30 bg-burgundy/5
              rounded-lg px-3 py-2 resize-none border border-burgundy/10
              focus:outline-none focus:border-burgundy/30 transition-colors"
          />
          {item.observation.length > 0 && (
            <p className="text-right text-[10px] text-burgundy/30 mt-0.5">
              {item.observation.length}/500
            </p>
          )}
        </div>
      )}

      {/* Photo upload — major items only */}
      {isMajorItem && (
        <div className="ml-10 mt-3">
          <p className="text-xs text-burgundy/40 mb-2">
            Fotos de referência ({item.photos.length}/3)
          </p>
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-16 h-16 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Referência ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-burgundy/10"
                />
                <button
                  onClick={() => removePhoto(item.id, i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose text-white rounded-full flex items-center justify-center"
                >
                  <X size={9} />
                </button>
              </div>
            ))}

            {item.photos.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-dashed border-burgundy/20
                  flex flex-col items-center justify-center gap-1 text-burgundy/30
                  hover:border-burgundy/40 hover:text-burgundy/50 transition-colors"
                title="Inclua fotos de referência que possam nos ajudar"
              >
                <ImagePlus size={16} />
                <span className="text-[10px] leading-tight text-center px-1">
                  Adicionar
                </span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
