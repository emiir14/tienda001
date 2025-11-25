
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (quantity: number) => void;
  maxQuantity: number;
}

export const QuantitySelector = ({ quantity, setQuantity, maxQuantity }: QuantitySelectorProps) => {
  const increment = () => setQuantity(Math.min(quantity + 1, maxQuantity));
  const decrement = () => setQuantity(Math.max(1, quantity - 1));

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={decrement} disabled={quantity <= 1}>
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={1}
        max={maxQuantity}
        value={quantity}
        onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxQuantity))}
        className="w-16 text-center"
      />
      <Button variant="outline" size="icon" onClick={increment} disabled={quantity >= maxQuantity}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};