
'use client';

import { useState, useEffect } from 'react';
import { useShippingStore } from '@/store/shipping-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function ShippingCalculator() {
  const {
    postalCode,
    shippingCost,
    status,
    error,
    setPostalCode,
    setShippingCost,
    setError,
    setLoading,
  } = useShippingStore();

  const [inputCode, setInputCode] = useState(postalCode || '');

  useEffect(() => {
    setInputCode(postalCode || '');
  }, [postalCode]);

  const handleCalculate = async () => {
    if (!inputCode.trim()) {
      setError('Por favor, ingresa un código postal.');
      return;
    }

    setLoading();
    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postalCode: inputCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo calcular el envío.');
      }

      setShippingCost(data.price, inputCode.trim());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMessage);
    }
  };

  const renderResult = () => {
    if (status === 'loading') {
      return null; // The button's loading state is enough
    }
    if (status === 'error' && error) {
      return (
        <div className="mt-2 text-sm flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      );
    }
    if (status === 'success' && shippingCost !== null) {
      return (
        <div className="mt-2 text-sm flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Costo de envío: <strong>{formatCurrency(shippingCost)}</strong></span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-secondary/30">
        <label htmlFor="shipping-postal-code" className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Truck className="h-5 w-5"/>
            Calcula tu envío
        </label>
      <div className="flex items-center gap-2">
        <Input
          id="shipping-postal-code"
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="Tu código postal"
          className="max-w-[180px] bg-background"
          aria-label="Código postal para envío"
        />
        <Button onClick={handleCalculate} disabled={status === 'loading'} variant="outline">
          {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Calcular
        </Button>
      </div>
      {renderResult()}
    </div>
  );
}
