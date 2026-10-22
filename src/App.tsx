import React, { useState, useEffect, useRef } from 'react';
import ThemeOrb from './components/ThemeOrb';
import Calculator from './components/Calculator';

export interface Theme {
  name: string;
  colors: {
    background: string;
    text: string;
    accent: string;
    secondary: string;
  };
  sectionColor: string;
  position: { x: number; y: number };
  calculatorBody?: string;
  display?: string;
  displayText?: string;
  buttons?: string;
  shortcuts?: string;
}

const defaultTheme: Theme = {
  name: 'purple-dark',
  colors: {
    background: 'from-slate-900 via-purple-900 to-slate-900',
    text: 'text-white',
    accent: 'bg-purple-800',
    secondary: 'text-purple-300'
  },
  sectionColor: '#8b5cf6',
  position: { x: 50, y: 20 },
  calculatorBody: '#374151',
  display: '#111827',
  displayText: '#ffffff',
  buttons: '#4b5563',
  shortcuts: '#374151'
};

function App() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [showOrb, setShowOrb] = useState<boolean>(true);
  // Recuerda si la pantalla ya era "pequeña" para no pisar la elección del usuario en cada resize
  const wasSmallRef = useRef<boolean | null>(null);

  // Detectar tamaño inicial y escuchar Ctrl + M para mostrar/ocultar el Orbe
  useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth < 768 || window.innerHeight < 560;
      // Solo reacciona al CRUZAR el umbral (en celular el resize se dispara al ocultar la barra del navegador)
      if (wasSmallRef.current !== small) {
        wasSmallRef.current = small;
        setShowOrb(!small);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowOrb(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setCurrentTheme(prev => ({
      ...prev,
      sectionColor: newTheme.sectionColor,
      calculatorBody: newTheme.calculatorBody,
      shortcuts: newTheme.shortcuts,
      buttons: newTheme.buttons,
      display: newTheme.display,
      displayText: newTheme.displayText,
    }));

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleAreaThemeChange = (area: string, color: string) => {
    setCurrentTheme(prev => ({
      ...prev,
      ...(area === 'calculatorBody' && { calculatorBody: color }),
      ...(area === 'display' && { display: color }),
      ...(area === 'buttons' && { buttons: color }),
      ...(area === 'shortcuts' && { shortcuts: color })
    }));

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <div className={`fixed inset-0 h-[100dvh] w-screen bg-gradient-to-br ${currentTheme.colors.background} transition-all duration-700 ease-in-out overflow-hidden flex items-center justify-center p-1 sm:p-4 box-border`}>
      
      {/* Orbe de temas (se muestra/oculta con Ctrl + M) */}
      {showOrb && (
        <ThemeOrb 
          onThemeChange={handleThemeChange} 
          onAreaThemeChange={handleAreaThemeChange}
          onClose={() => setShowOrb(false)}
          currentTheme={currentTheme} 
        />
      )}

      {/* Efectos de fondo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-white/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-radial from-white/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Contenedor central */}
      <div className="relative z-10 w-full h-full flex overflow-auto">
        <Calculator 
          theme={currentTheme} 
          onThemeChange={handleAreaThemeChange}
          showOrb={showOrb}
          onToggleOrb={() => setShowOrb(prev => !prev)}
        />
      </div>
    </div>
  );
}

export default App;