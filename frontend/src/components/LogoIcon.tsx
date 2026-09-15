import React from 'react';

export const LogoIcon = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`mx-auto ${className}`} // ✅ Añadido mx-auto para que se centre solo
      aria-label="Modexastock Logo"
    >
      {/* Barras Izquierdas (Pata izquierda de la M) - Indigo */}
      {/* ✅ Añadido código hex (#4f46e5) como respaldo por si la variable CSS no carga */}
      <rect x="10" y="15" width="5" height="70" rx="2" fill="var(--color-primary, #4f46e5)" />
      <rect x="18" y="25" width="8" height="60" rx="2" fill="var(--color-primary, #4f46e5)" />

      {/* Barra de Acento (Crecimiento/Venta) - Esmeralda */}
      <rect x="28" y="30" width="3" height="55" rx="1.5" fill="var(--color-secondary, #10b981)" />

      {/* Barras Centrales Bajas (Valle de la M) - Indigo */}
      <rect x="35" y="45" width="4" height="40" rx="2" fill="var(--color-primary, #4f46e5)" />
      <rect x="42" y="55" width="6" height="30" rx="2" fill="var(--color-primary, #4f46e5)" />

      {/* Barra de Acento Central - Esmeralda */}
      <rect x="51" y="55" width="3" height="30" rx="1.5" fill="var(--color-secondary, #10b981)" />

      {/* Barras Centrales Bajas (Subiendo hacia la derecha) - Indigo */}
      <rect x="57" y="45" width="4" height="40" rx="2" fill="var(--color-primary, #4f46e5)" />

      {/* Barras Derechas (Pata derecha de la M) - Indigo */}
      <rect x="65" y="25" width="8" height="60" rx="2" fill="var(--color-primary, #4f46e5)" />
      <rect x="76" y="15" width="5" height="70" rx="2" fill="var(--color-primary, #4f46e5)" />
    </svg>
  );
};