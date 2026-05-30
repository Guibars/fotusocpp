import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-zinc-950">
      {/* Globo Azul de Marca */}
      <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-brand-blue/20 blur-[120px] mix-blend-screen animate-blob"></div>
      
      {/* Globo Neon de Marca */}
      <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-brand-neon/10 blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
      
      {/* Globo Roxo/Misterioso para profundidade */}
      <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-purple-500/15 blur-[150px] mix-blend-screen animate-blob animation-delay-4000"></div>
      
      {/* Camada de Granulação (Opcional, dá um aspecto premium) / Overlay escuro para garantir contraste */}
      <div className="absolute inset-0 bg-zinc-950/40 mix-blend-multiply"></div>
    </div>
  );
}
