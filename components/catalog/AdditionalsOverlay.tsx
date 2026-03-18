"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Product } from "@/types";

interface AdditionalsOverlayProps {
  product: Product | null;
  additionals: Product[];
  onConfirm: (product: Product, additionals: Product[]) => void;
  onClose: () => void;
}

export function AdditionalsOverlay({
  product,
  additionals,
  onConfirm,
  onClose,
}: AdditionalsOverlayProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!product) return;
    const selectedAdditionals = additionals.filter((a) => selected.has(a.id));
    onConfirm(product, selectedAdditionals);
    setSelected(new Set());
  };

  const handleClose = () => {
    setSelected(new Set());
    onClose();
  };

  const totalAdditionals = additionals
    .filter((a) => selected.has(a.id))
    .reduce((s, a) => s + a.pixPrice, 0);

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-burgundy/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto
              bg-cream rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-burgundy px-6 py-5 flex items-start justify-between">
              <div>
                <p className="text-rose text-xs font-medium tracking-widest uppercase mb-1">
                  Personalize
                </p>
                <h2 className="text-cream font-display text-xl font-semibold">
                  {product.emoji} {product.name}
                </h2>
                <p className="text-cream/60 text-sm mt-0.5">
                  Adicione extras ao seu pedido
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-cream/60 hover:text-cream transition-colors mt-0.5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Additionals List */}
            <div className="px-6 py-4 max-h-72 overflow-y-auto">
              <div className="space-y-2">
                {additionals.map((additional) => {
                  const isSelected = selected.has(additional.id);
                  return (
                    <button
                      key={additional.id}
                      onClick={() => toggle(additional.id)}
                      className={`
                        w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-200 text-left
                        ${
                          isSelected
                            ? "border-rose bg-rose/10"
                            : "border-burgundy/10 bg-white hover:border-burgundy/20"
                        }
                      `}
                    >
                      <span className="text-2xl">{additional.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-burgundy text-sm">
                          {additional.name}
                        </p>
                        <p className="text-xs text-burgundy/50 truncate">
                          {additional.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-semibold text-burgundy tabular-nums text-sm">
                            +R${" "}
                            {(additional.pixPrice / 100).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[9px] font-semibold bg-gold/40 text-burgundy px-1 py-0.5 rounded">
                            PIX
                          </span>
                        </div>
                        <div
                          className={`
                            w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0
                            ${
                              isSelected
                                ? "bg-rose border-rose text-white"
                                : "border-burgundy/20"
                            }
                          `}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-3 border-t border-burgundy/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-burgundy/50">Total</p>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-xl text-burgundy tabular-nums">
                      R${" "}
                      {((product.pixPrice + totalAdditionals) / 100).toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                    <span className="text-[10px] font-semibold bg-gold/40 text-burgundy px-1.5 py-0.5 rounded-md">
                      PIX
                    </span>
                  </div>
                </div>
                <p className="text-xs text-burgundy/40">
                  {selected.size > 0
                    ? `${selected.size} extra${selected.size > 1 ? "s" : ""} selecionado${selected.size > 1 ? "s" : ""}`
                    : "Sem extras"}
                </p>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full bg-burgundy text-cream py-3.5 rounded-xl font-semibold
                  hover:bg-burgundy-light transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/20
                  active:scale-[0.98]"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
