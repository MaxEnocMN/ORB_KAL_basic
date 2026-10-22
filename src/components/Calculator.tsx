import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../App';

interface CalculatorProps {
  theme: Theme;
  onThemeChange: (area: string, color: string) => void;
  showOrb: boolean;
  onToggleOrb: () => void;
}

type ViewMode = 'full' | 'functions' | 'display';

// Función para obtener color de texto con buen contraste
const getContrastColor = (backgroundColor: string): string => {
  if (!backgroundColor) return '#ffffff';
  
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Convierte a notación científica asegurando un máximo de 12 caracteres visibles
const formatToScientific = (num: number): string => {
  if (!isFinite(num) || isNaN(num)) return 'Error';
  for (let p = 6; p >= 2; p--) {
    const exp = num.toExponential(p);
    if (exp.length <= 12) return exp;
  }
  return num.toExponential(2);
};

// Formatea el valor para pantalla: natural hasta 12 dígitos, científica a partir del 13
const formatValue = (raw: string | number): string => {
  if (typeof raw === 'number') {
    if (!isFinite(raw) || isNaN(raw)) return 'Error';
    const str = String(raw);
    if (str.length <= 12 && !str.includes('e')) {
      return str;
    }
    return formatToScientific(raw);
  }

  if (raw === '' || raw === 'Error') return raw || '0';
  if (raw.length <= 12) return raw;

  const num = parseFloat(raw);
  if (isNaN(num)) return raw.slice(0, 12);
  return formatToScientific(num);
};

export default function Calculator({ theme, onThemeChange, showOrb, onToggleOrb }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [rawInput, setRawInput] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Estados de visibilidad y modo responsivo
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('full');

  // Táctil vs escritorio: decide qué ayuda se muestra y si hay efectos hover
  const [isTouch, setIsTouch] = useState<boolean>(
    () => typeof window !== 'undefined' && !window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setIsTouch(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isTouch && showShortcuts) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isTouch, showShortcuts]);

  // Adaptación automática: solo actúa cuando se CRUZA un umbral, así no pisa lo que el
  // usuario eligió (en celular el resize se dispara al ocultarse la barra del navegador)
  const autoMode = useRef<{ shortcuts: boolean | null; view: ViewMode | null }>({ shortcuts: null, view: null });
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const nextShortcuts = w >= 680;
      const nextView: ViewMode = h < 220 ? 'display' : h < 520 ? 'functions' : 'full';

      if (autoMode.current.shortcuts !== nextShortcuts) {
        autoMode.current.shortcuts = nextShortcuts;
        setShowShortcuts(nextShortcuts);
      }
      if (autoMode.current.view !== nextView) {
        autoMode.current.view = nextView;
        setViewMode(nextView);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragOver = (e: React.DragEvent, area: string) => {
    e.preventDefault();
    setDragOver(area);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent, area: string) => {
    e.preventDefault();
    setDragOver(null);
    
    const color = e.dataTransfer.getData('text/plain');
    if (color) {
      onThemeChange(area, color);
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setRawInput(num);
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      if (rawInput.length >= 25) return;
      const nextRaw = rawInput === '0' ? num : rawInput + num;
      setRawInput(nextRaw);
      setDisplay(formatValue(nextRaw));
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setRawInput('0.');
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!rawInput.includes('.')) {
      const nextRaw = (rawInput === '' ? '0' : rawInput) + '.';
      setRawInput(nextRaw);
      setDisplay(formatValue(nextRaw));
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(rawInput || display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(formatValue(newValue));
      setRawInput(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, op: string): number => {
    switch (op) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue === 0 ? NaN : firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(rawInput || display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(formatValue(newValue));
      setRawInput(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setRawInput('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (waitingForOperand) {
      clearDisplay();
      return;
    }

    if (rawInput.length > 1) {
      const nextRaw = rawInput.slice(0, -1);
      setRawInput(nextRaw);
      setDisplay(formatValue(nextRaw));
    } else {
      setRawInput('0');
      setDisplay('0');
    }
  };

  const cycleViewMode = () => {
    setViewMode(prev => (prev === 'full' ? 'functions' : prev === 'functions' ? 'display' : 'full'));
  };

  // Manejo de teclado con bloqueo de eventos por defecto en Enter, Espacio y Escape
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setShowShortcuts(prev => !prev);
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          cycleViewMode();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        inputNumber(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+') {
        inputOperation('+');
      } else if (e.key === '-') {
        inputOperation('-');
      } else if (e.key === '*') {
        inputOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        inputOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        performCalculation();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        clearDisplay();
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === ' ') {
        e.preventDefault();
        performCalculation();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [rawInput, display, previousValue, operation, waitingForOperand]);

  const buttonStyle = (isOperation = false) => ({
    backgroundColor: theme.buttons ?? '#4b5563',
    color: getContrastColor(theme.buttons ?? '#4b5563'),
    border: `2px solid ${isOperation ? '#4a5568' : 'transparent'}`,
    boxShadow: `
      6px 6px 12px rgba(0, 0, 0, 0.3),
      -6px -6px 12px rgba(255, 255, 255, 0.1),
      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
      inset -2px -2px 4px rgba(0, 0, 0, 0.2)
    `
  });

  const hov = (cls: string) => (isTouch ? '' : cls); // hover solo en escritorio
  const btnClasses = `py-3 sm:py-4 min-h-[44px] rounded-xl font-bold text-lg transition-all duration-200 touch-manipulation ${hov('hover:scale-105')} active:scale-95`;
  const compactBtnClasses = `py-2 sm:py-3 min-h-[44px] rounded-xl font-bold text-base transition-all duration-200 touch-manipulation ${hov('hover:scale-105')} active:scale-95`;

  // En vistas compactas la ayuda siempre va ABAJO de la calculadora
  const mode: ViewMode = isTouch ? 'full' : viewMode; // en celular solo la vista completa (con números)
  const stacked = mode !== 'full';
  const panelLayout = stacked
    ? 'order-2 w-[min(96vw,420px)]'
    : 'order-2 md:order-1 w-[min(96vw,420px)] md:w-auto';
  const calcLayout = stacked ? 'order-1' : 'order-1 md:order-2';
  const barBtn = isTouch
    ? 'px-3 min-h-[44px] min-w-[44px] text-xs rounded'
    : 'px-2 py-0.5 rounded';

  return (
    <div className={`m-auto flex flex-col ${stacked ? '' : 'md:flex-row'} items-center justify-center p-1 sm:p-2 bg-transparent select-none gap-3`}>
      
      {/* Panel de atajos */}
      {showShortcuts && (
        <div 
          ref={panelRef}
          className={`${panelLayout} p-4 rounded-xl backdrop-blur-sm transition-all duration-300 ${
            dragOver === 'shortcuts' ? 'ring-4 ring-blue-400 scale-105' : ''
          }`}
          style={{ 
            backgroundColor: theme.shortcuts ?? '#374151',
            boxShadow: `
              12px 12px 24px rgba(0, 0, 0, 0.3),
              -12px -12px 24px rgba(255, 255, 255, 0.1),
              inset 3px 3px 6px rgba(255, 255, 255, 0.1),
              inset -3px -3px 6px rgba(0, 0, 0, 0.2)
            `
          }}
          onDragOver={(e) => handleDragOver(e, 'shortcuts')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'shortcuts')}
        >
          <h3 
            className="font-bold mb-3 text-sm"
            style={{ color: getContrastColor(theme.shortcuts ?? '#374151') }}
          >
            {isTouch ? 'Ayuda táctil:' : 'Atajos de Teclado:'}
          </h3>
          {isTouch ? (
            <div
              className="text-xs space-y-1"
              style={{ color: getContrastColor(theme.shortcuts ?? '#374151') }}
            >
              <div>• Toca los botones para calcular</div>
              <div>• C: limpiar todo</div>
              <div className="pt-2 font-semibold opacity-90 border-t border-white/20 mt-2">
                • Orbe: mantén pulsado un color para agarrarlo y toca para soltarlo
              </div>
              <div className="font-semibold opacity-90">
                • Arrastra el centro del orbe a la derecha para cerrarlo
              </div>
            </div>
          ) : (
            <div 
            className="text-xs space-y-1"
            style={{ color: getContrastColor(theme.shortcuts ?? '#374151') }}
          >
            <div>• 0-9 / .: Números y decimal</div>
            <div>• +, -, *, /: Operadores</div>
            <div>• Enter / Espacio: Calcular</div>
            <div>• Escape / Backspace: Limpiar</div>
            <div className="pt-2 font-semibold opacity-90 border-t border-white/20 mt-2">
              • Ctrl + M: Mostrar/Ocultar Orbe
            </div>
            <div className="font-semibold opacity-90">
              • Ctrl + H: Mostrar/Ocultar Atajos
            </div>
            <div className="font-semibold opacity-90">
              • Ctrl + B: Cambiar Modo Vista
            </div>
          </div>
          )}
        </div>
      )}

      {/* Calculadora */}
      <div 
        className={`${calcLayout} relative w-[min(96vw,420px)] p-3 sm:p-5 rounded-3xl backdrop-blur-sm transition-all duration-300 ${
          dragOver === 'calculatorBody' ? 'ring-4 ring-blue-400 scale-105' : ''
        }`}
        style={{ 
          backgroundColor: theme.calculatorBody ?? '#374151',
          boxShadow: `
            20px 20px 40px rgba(0, 0, 0, 0.3),
            -20px -20px 40px rgba(255, 255, 255, 0.1),
            inset 5px 5px 10px rgba(0, 0, 0, 0.2),
            inset -5px -5px 10px rgba(255, 255, 255, 0.1)
          `
        }}
        onDragOver={(e) => handleDragOver(e, 'calculatorBody')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'calculatorBody')}
      >
        {/* Barra superior de control de vistas con desenfoque automático al hacer clic */}
        <div 
          className={`flex items-center justify-between mb-3 px-1 ${isTouch ? 'text-xs' : 'text-[11px]'} opacity-75`}
          style={{ color: getContrastColor(theme.calculatorBody ?? '#374151') }}
        >
          <div className="flex gap-2">
            {!isTouch && (
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                cycleViewMode();
              }}
              title="Cambiar vista (Ctrl + B)"
              className={`${barBtn} bg-black/20 ${hov('hover:bg-black/40')} transition`}
            >
              {mode === 'full' ? 'Completa' : mode === 'functions' ? 'Funciones' : 'Solo Display'}
            </button>
            )}
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                setShowShortcuts(prev => !prev);
              }}
              title="Mostrar/Ocultar Atajos (Ctrl + H)"
              className={`${barBtn} transition ${showShortcuts ? 'bg-white/25 font-bold' : `bg-black/20 ${hov('hover:bg-black/40')}`}`}
            >
              ?
            </button>
          </div>
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleOrb();
            }}
            title="Mostrar/Ocultar Orbe de Color (Ctrl + M)"
            className={`${barBtn} transition ${showOrb ? 'bg-white/25 font-bold' : `bg-black/20 ${hov('hover:bg-black/40')}`}`}
          >
            🎨 Orbe
          </button>
        </div>

        {/* Pantalla */}
        <div 
          className={`${mode === 'display' ? 'mb-0' : 'mb-4'} p-4 rounded-2xl overflow-hidden transition-all duration-300 ${
            dragOver === 'display' ? 'ring-4 ring-blue-400 scale-105' : ''
          }`}
          style={{ 
            backgroundColor: theme.display ?? '#111827',
            boxShadow: `
              inset 8px 8px 16px rgba(0, 0, 0, 0.4),
              inset -8px -8px 16px rgba(255, 255, 255, 0.05),
              0 2px 4px rgba(0, 0, 0, 0.2)
            `
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver('display');
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
              setDragOver(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(null);
            
            const color = e.dataTransfer.getData('text/plain');
            if (color) {
              onThemeChange('display', color);
              if ('vibrate' in navigator) {
                navigator.vibrate(50);
              }
            }
          }}
        >
          <div className="flex justify-between items-baseline">
            <span 
              className="text-sm font-mono opacity-80"
              style={{ color: getContrastColor(theme.display ?? '#111827') }}
            >
              {operation ? `${previousValue ?? ''} ${operation}` : ''}
            </span>
            <div 
              className="text-right text-3xl font-mono font-bold truncate tracking-tight ml-auto"
              style={{ color: getContrastColor(theme.display ?? '#111827') }}
            >
              {display}
            </div>
          </div>
        </div>

        {/* MODO SOLO FUNCIONES: Oculta teclado numérico 0-9 */}
        {mode === 'functions' && (
          <div 
            className={`grid grid-cols-6 gap-2 transition-all duration-300 ${
              dragOver === 'buttons' ? 'ring-4 ring-blue-400 scale-105' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver('buttons');
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              
              if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                setDragOver(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(null);
              
              const color = e.dataTransfer.getData('text/plain');
              if (color) {
                onThemeChange('buttons', color);
                if ('vibrate' in navigator) {
                  navigator.vibrate(50);
                }
              }
            }}
          >
            <button onFocus={(e) => e.target.blur()} onClick={clearDisplay} className={compactBtnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>C</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('÷')} className={compactBtnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>÷</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('×')} className={compactBtnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>×</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('-')} className={compactBtnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>-</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('+')} className={compactBtnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>+</button>
            <button onFocus={(e) => e.target.blur()} onClick={performCalculation} className={compactBtnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>=</button>
          </div>
        )}

        {/* MODO COMPLETO: Todos los botones */}
        {mode === 'full' && (
          <div 
            className={`grid grid-cols-4 gap-3 transition-all duration-300 ${
              dragOver === 'buttons' ? 'ring-4 ring-blue-400 scale-105' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver('buttons');
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              
              if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                setDragOver(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(null);
              
              const color = e.dataTransfer.getData('text/plain');
              if (color) {
                onThemeChange('buttons', color);
                if ('vibrate' in navigator) {
                  navigator.vibrate(50);
                }
              }
            }}
          >
            {/* Primera fila */}
            <button onFocus={(e) => e.target.blur()} onClick={clearDisplay} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>C</button>
            <button onFocus={(e) => e.target.blur()} onClick={inputDecimal} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>.</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('0')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>0</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('÷')} className={btnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>÷</button>

            {/* Segunda fila */}
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('1')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>1</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('2')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>2</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('3')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>3</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('×')} className={btnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>×</button>

            {/* Tercera fila */}
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('4')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>4</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('5')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>5</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('6')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>6</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('-')} className={btnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>-</button>

            {/* Cuarta fila */}
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('7')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>7</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('8')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>8</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputNumber('9')} className={btnClasses} style={buttonStyle()} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>9</button>
            <button onFocus={(e) => e.target.blur()} onClick={() => inputOperation('+')} className={btnClasses} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>+</button>

            {/* Quinta fila */}
            <button onFocus={(e) => e.target.blur()} onClick={performCalculation} className={`col-span-4 ${btnClasses}`} style={buttonStyle(true)} onDragOver={(e) => handleDragOver(e, 'buttons')} onDrop={(e) => handleDrop(e, 'buttons')}>=</button>
          </div>
        )}

        {/* Etiqueta en la base */}
        {mode === 'full' && (
          <div className="mt-4 text-center">
            <span 
              className="text-xs opacity-60"
              style={{ color: getContrastColor(theme.calculatorBody ?? '#374151') }}
            >
              Tarea desarrollada en julio del 2026_MEMN
            </span>
          </div>
        )}
      </div>
    </div>
  );
}