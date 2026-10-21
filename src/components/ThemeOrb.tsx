import React, { useState } from 'react';
import { Theme } from '../App';

const themes: Theme[] = [
  {
    name: 'dark',
    colors: {
      background: 'from-gray-900 to-black',
      text: 'text-white',
      accent: 'bg-gray-800',
      secondary: 'text-gray-300'
    },
    sectionColor: '#1f2937',
    position: { x: 15, y: 25 },
    calculatorBody: '#374151',
    display: '#111827',
    displayText: '#ffffff',
    buttons: '#4b5563',
    shortcuts: '#374151'
  },
  {
    name: 'light',
    colors: {
      background: 'from-gray-100 to-white',
      text: 'text-gray-900',
      accent: 'bg-gray-200',
      secondary: 'text-gray-600'
    },
    sectionColor: '#f3f4f6',
    position: { x: 85, y: 25 },
    calculatorBody: '#f9fafb',
    display: '#ffffff',
    displayText: '#111827',
    buttons: '#e5e7eb',
    shortcuts: '#f9fafb'
  },
  {
    name: 'blue',
    colors: {
      background: 'from-blue-900 to-blue-700',
      text: 'text-white',
      accent: 'bg-blue-600',
      secondary: 'text-blue-200'
    },
    sectionColor: '#3b82f6',
    position: { x: 85, y: 50 },
    calculatorBody: '#3b82f6',
    display: '#1e3a8a',
    displayText: '#ffffff',
    buttons: '#2563eb',
    shortcuts: '#3b82f6'
  },
  {
    name: 'green',
    colors: {
      background: 'from-green-900 to-green-700',
      text: 'text-white',
      accent: 'bg-green-600',
      secondary: 'text-green-200'
    },
    sectionColor: '#22c55e',
    position: { x: 85, y: 75 },
    calculatorBody: '#22c55e',
    display: '#14532d',
    displayText: '#ffffff',
    buttons: '#16a34a',
    shortcuts: '#22c55e'
  },
  {
    name: 'red',
    colors: {
      background: 'from-red-900 to-red-700',
      text: 'text-white',
      accent: 'bg-red-600',
      secondary: 'text-red-200'
    },
    sectionColor: '#ef4444',
    position: { x: 50, y: 85 },
    calculatorBody: '#ef4444',
    display: '#7f1d1d',
    displayText: '#ffffff',
    buttons: '#dc2626',
    shortcuts: '#ef4444'
  },
  {
    name: 'purple',
    colors: {
      background: 'from-purple-900 to-purple-700',
      text: 'text-white',
      accent: 'bg-purple-600',
      secondary: 'text-purple-200'
    },
    sectionColor: '#8b5cf6',
    position: { x: 15, y: 75 },
    calculatorBody: '#8b5cf6',
    display: '#581c87',
    displayText: '#ffffff',
    buttons: '#7c3aed',
    shortcuts: '#8b5cf6'
  },
  {
    name: 'orange',
    colors: {
      background: 'from-orange-900 to-orange-700',
      text: 'text-white',
      accent: 'bg-orange-600',
      secondary: 'text-orange-200'
    },
    sectionColor: '#f97316',
    position: { x: 15, y: 50 },
    calculatorBody: '#f97316',
    display: '#9a3412',
    displayText: '#ffffff',
    buttons: '#ea580c',
    shortcuts: '#f97316'
  },
  {
    name: 'cyan',
    colors: {
      background: 'from-cyan-900 to-cyan-700',
      text: 'text-white',
      accent: 'bg-cyan-600',
      secondary: 'text-cyan-200'
    },
    sectionColor: '#06b6d4',
    position: { x: 50, y: 15 },
    calculatorBody: '#06b6d4',
    display: '#164e63',
    displayText: '#ffffff',
    buttons: '#0891b2',
    shortcuts: '#06b6d4'
  }
];

interface ThemeOrbProps {
  onThemeChange: (theme: Theme) => void;
  onAreaThemeChange: (area: string, color: string) => void;
  currentTheme: Theme;
}

const ThemeOrb: React.FC<ThemeOrbProps> = ({ onThemeChange, currentTheme }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [, setDraggedTheme] = useState<Theme | null>(null);
  const [rightClickDragMode, setRightClickDragMode] = useState(false);
  const [heldTheme, setHeldTheme] = useState<Theme | null>(null);

  const handleRightClick = (e: React.MouseEvent, theme: Theme) => {
    e.preventDefault();

    if (heldTheme?.name === theme.name && rightClickDragMode) {
      setRightClickDragMode(false);
      setHeldTheme(null);
      setIsDragging(false);
      setDraggedTheme(null);
      document.body.style.cursor = '';
    } else {
      setRightClickDragMode(true);
      setHeldTheme(theme);
      setIsDragging(true);
      setDraggedTheme(theme);
      document.body.style.cursor = 'grabbing';
    }

    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (rightClickDragMode && heldTheme) {
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elementBelow) {
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
          dataTransfer: new DataTransfer()
        });
        elementBelow.dispatchEvent(dragOverEvent);
      }
    }
  };

  const handleGlobalClick = (e: MouseEvent) => {
    if (rightClickDragMode && heldTheme && e.button === 0) {
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
        dataTransfer: new DataTransfer()
      });

      dropEvent.dataTransfer?.setData('text/plain', heldTheme.sectionColor);
      dropEvent.dataTransfer?.setData('application/json', JSON.stringify(heldTheme));

      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elementBelow) {
        elementBelow.dispatchEvent(dropEvent);
      }

      setRightClickDragMode(false);
      setHeldTheme(null);
      setIsDragging(false);
      setDraggedTheme(null);
      document.body.style.cursor = '';

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDragStart = (theme: Theme, e: React.DragEvent) => {
    setIsDragging(true);
    setDraggedTheme(theme);

    e.dataTransfer.setData('text/plain', theme.sectionColor);
    e.dataTransfer.setData('application/json', JSON.stringify(theme));
    e.dataTransfer.effectAllowed = 'copy';

    const dragImage = document.createElement('div');
    dragImage.style.width = '30px';
    dragImage.style.height = '30px';
    dragImage.style.borderRadius = '50%';
    dragImage.style.backgroundColor = theme.sectionColor;
    dragImage.style.border = '2px solid white';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);

    e.dataTransfer.setDragImage(dragImage, 15, 15);

    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 100);
  };

  const handleDragEnd = () => {
    if (!rightClickDragMode) {
      setIsDragging(false);
      setDraggedTheme(null);
    }
  };

  React.useEffect(() => {
    if (rightClickDragMode) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('click', handleGlobalClick);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [rightClickDragMode, heldTheme]);

  const handleOrbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const themeData = e.dataTransfer.getData('application/json');
      if (themeData) {
        const droppedTheme = JSON.parse(themeData);
        onThemeChange(droppedTheme);
      }
    } catch {
      // Ignorar datos JSON inválidos
    }
  };

  const handleOrbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="fixed top-8 right-8 z-50">
      <div
        className="relative w-40 h-40 cursor-pointer select-none"
        style={{
          background: `conic-gradient(from 0deg, ${themes.map((theme) => theme.sectionColor).join(', ')})`,
          borderRadius: '50%',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
          transform: 'perspective(300px) rotateX(15deg)',
        }}
        onDrop={handleOrbDrop}
        onDragOver={handleOrbDragOver}
      >
        {/* Círculos de colores arrastrables */}
        {themes.map((theme) => (
          <div
            key={theme.name}
            data-theme={theme.name}
            className={`absolute w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl z-20 ${
              heldTheme?.name === theme.name && rightClickDragMode
                ? 'border-yellow-400 border-4 animate-pulse shadow-lg shadow-yellow-400/50'
                : 'border-white/60 hover:border-white/90'
            }`}
            style={{
              backgroundColor: theme.sectionColor,
              left: `${theme.position.x}%`,
              top: `${theme.position.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: rightClickDragMode && heldTheme?.name === theme.name ? 'grabbing' : 'grab',
              boxShadow:
                heldTheme?.name === theme.name && rightClickDragMode
                  ? '0 0 20px rgba(255, 255, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
                  : '0 6px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
            }}
            draggable
            onDragStart={(e) => handleDragStart(theme, e)}
            onDragEnd={handleDragEnd}
            onContextMenu={(e) => handleRightClick(e, theme)}
            title={`Tema ${theme.name} - Click derecho para agarrar | Click izquierdo para soltar`}
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
          </div>
        ))}

        {/* Centro del orbe */}
        <div
          className={`absolute top-1/2 left-1/2 w-16 h-16 rounded-full border-3 transition-all duration-300 ${
            isDragging ? 'border-white/80 scale-110 shadow-2xl' : 'border-white/40'
          }`}
          style={{
            transform: 'translate(-50%, -50%)',
            backgroundColor: currentTheme.sectionColor,
            boxShadow: isDragging
              ? `inset 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 40px ${currentTheme.sectionColor}80`
              : 'inset 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 25px rgba(255, 255, 255, 0.2)',
          }}
          onDrop={handleOrbDrop}
          onDragOver={handleOrbDragOver}
        >
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
          {isDragging && (
            <div className="absolute inset-0 rounded-full animate-pulse bg-white/20" />
          )}
        </div>

        {/* Efectos de brillo */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-full border border-white/10" />
      </div>

      {/* Instrucciones */}
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 text-center whitespace-nowrap">
        <div>Click derecho: agarrar</div>
        <div className="text-xs opacity-75 mt-1">Click izquierdo: soltar</div>
      </div>
    </div>
  );
};

export default ThemeOrb;