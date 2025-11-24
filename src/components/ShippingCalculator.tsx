
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
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        handleCalculate();
    }
  }

  const renderResult = () => {
    if (status === 'loading') return null;
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
    <div className="mt-4 p-3 border rounded-lg bg-secondary/30">
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Truck className="h-5 w-5 text-muted-foreground"/>
            <span className='text-muted-foreground'>Calcula tu envío</span>
        </div>
      <div className="flex items-center gap-2">
        <Input
          id="shipping-postal-code"
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Tu código postal"
          className="bg-background flex-grow"
          aria-label="Código postal para envío"
        />
        <Button onClick={handleCalculate} disabled={status === 'loading'} variant="outline" className='bg-background shrink-0'>
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calcular'}
        </Button>
      </div>
      {renderResult()}
    </div>
  );
}
