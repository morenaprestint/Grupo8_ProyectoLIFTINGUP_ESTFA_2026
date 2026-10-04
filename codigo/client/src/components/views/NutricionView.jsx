import { useState, useMemo, useEffect } from 'react';
import { Check, RotateCcw, Utensils } from 'lucide-react';
import { CATEGORIAS_NUTRICION, ALIMENTOS_DATA } from '../../data/alimentosData';
import '../../styles/nutricionView.css';

const STORAGE_KEY = 'lifting_up_plato_ideal_v1';
const DEFAULT_SELECTION = ['carne', 'huevo', 'arroz', 'tomate'];

// Componentes vectoriales limpios para cada alimento
function FoodIcon({ tipo }) {
    switch (tipo) {
        case 'carne':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path
                        d="M12 16C7 20 6 28 10 34C15 41 26 42 34 38C41 34 44 24 39 17C34 10 27 8 20 10C17 11 14 13 12 16Z"
                        fill="#D9384E"
                    />
                    <path
                        d="M14 18C11 21 10 27 13 32C17 38 25 39 32 35C37 32 40 24 36 19C32 13 26 11 21 13C18 14 16 16 14 18Z"
                        fill="#FF5E7E"
                    />
                    <ellipse cx="23" cy="23" rx="5" ry="4" fill="#FFFFFF" />
                    <ellipse cx="23" cy="23" rx="2.5" ry="2" fill="#E2E8F0" />
                </svg>
            );
        case 'huevo':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path
                        d="M12 26C10 33 15 41 24 41C33 41 39 33 37 25C35 17 29 10 24 10C18 10 14 18 12 26Z"
                        fill="#FFFFFF"
                        stroke="#E2E8F0"
                        strokeWidth="1.5"
                    />
                    <circle cx="24" cy="27" r="7" fill="#FFB703" />
                    <circle cx="26" cy="25" r="2" fill="#FFEAA7" />
                </svg>
            );
        case 'palta':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path
                        d="M24 8C17 8 13 16 12 24C11 33 16 41 24 41C32 41 37 33 36 24C35 16 31 8 24 8Z"
                        fill="#386641"
                    />
                    <path
                        d="M24 11C18 11 15 18 14 24C13 31 17 38 24 38C31 38 35 31 34 24C33 18 30 11 24 11Z"
                        fill="#A7C957"
                    />
                    <circle cx="24" cy="27" r="6" fill="#6F4E37" />
                    <circle cx="26" cy="25.5" r="1.5" fill="#8B5E3C" />
                </svg>
            );
        case 'atun':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <rect x="10" y="16" width="28" height="18" rx="6" fill="#3A3258" stroke="#00D2FF" strokeWidth="1.5" />
                    <path d="M17 25C20 22 25 22 28 25" stroke="#00D2FF" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="28" cy="25" r="1.5" fill="#00D2FF" />
                    <path d="M10 22H38" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                </svg>
            );
        case 'porotos':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path
                        d="M13 25C11 20 14 14 20 14C24 14 26 17 25 20C24 23 20 24 20 27C20 30 23 32 20 34C16 36 14 31 13 25Z"
                        fill="#A01A1A"
                    />
                    <path
                        d="M26 31C24 26 27 20 33 20C37 20 39 23 38 26C37 29 33 30 33 33C33 36 36 38 33 40C29 42 27 37 26 31Z"
                        fill="#C1121F"
                    />
                </svg>
            );
        case 'pollo':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path
                        d="M26 12C20 12 16 16 16 22C16 26 19 30 22 33L13 41"
                        stroke="#E2E8F0"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />
                    <ellipse cx="29" cy="20" rx="9" ry="8" fill="#FB8500" />
                    <ellipse cx="28" cy="20" rx="7" ry="6" fill="#FFAA33" />
                </svg>
            );
        case 'salmon':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path d="M10 28C14 18 24 16 38 18C36 26 30 34 16 34L10 28Z" fill="#FF758F" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="18" y1="20" x2="16" y2="32" stroke="#FFFFFF" strokeWidth="1.5" />
                    <line x1="25" y1="19" x2="23" y2="33" stroke="#FFFFFF" strokeWidth="1.5" />
                    <line x1="32" y1="19" x2="30" y2="31" stroke="#FFFFFF" strokeWidth="1.5" />
                </svg>
            );
        case 'aceite':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <rect x="18" y="10" width="12" height="6" rx="2" fill="#D4A373" />
                    <path d="M17 16H31L34 24V38C34 40 32 42 30 42H18C16 42 14 40 14 38V24L17 16Z" fill="#E9C46A" />
                    <circle cx="24" cy="28" r="4" fill="#2A9D8F" />
                </svg>
            );
        case 'frutos_secos':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <ellipse cx="18" cy="25" rx="7" ry="11" transform="rotate(-20 18 25)" fill="#936639" />
                    <ellipse cx="30" cy="26" rx="6" ry="9" transform="rotate(25 30 26)" fill="#7F4F24" />
                </svg>
            );
        case 'semillas':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path d="M12 24C12 32 17 38 24 38C31 38 36 32 36 24H12Z" fill="#495057" />
                    <circle cx="20" cy="22" r="1.5" fill="#E2E8F0" />
                    <circle cx="24" cy="20" r="1.5" fill="#E2E8F0" />
                    <circle cx="28" cy="22" r="1.5" fill="#E2E8F0" />
                </svg>
            );
        case 'queso':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path d="M10 32L38 32L38 20L10 32Z" fill="#FFD166" />
                    <path d="M10 32L38 20L28 12L10 32Z" fill="#FFE494" />
                    <circle cx="26" cy="24" r="2.5" fill="#E9B949" />
                    <circle cx="33" cy="25" r="1.5" fill="#E9B949" />
                </svg>
            );
        case 'arroz':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <ellipse cx="24" cy="20" rx="14" ry="5" fill="#FFFFFF" />
                    <path d="M10 20C10 28 16 36 24 36C32 36 38 28 38 20H10Z" fill="#495057" />
                    <path d="M16 16L18 22" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <path d="M24 14L24 21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <path d="M30 16L28 22" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );
        case 'avena':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <ellipse cx="24" cy="22" rx="12" ry="4" fill="#E9D8A6" />
                    <path d="M12 22C12 30 17 36 24 36C31 36 36 30 36 22H12Z" fill="#DDA15E" />
                    <circle cx="22" cy="21" r="1.5" fill="#BC6C25" />
                    <circle cx="26" cy="22" r="1.5" fill="#BC6C25" />
                </svg>
            );
        case 'papa':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <ellipse cx="24" cy="25" rx="13" ry="9" transform="rotate(-15 24 25)" fill="#DDB892" />
                    <circle cx="20" cy="23" r="1" fill="#7F5539" />
                    <circle cx="27" cy="27" r="1" fill="#7F5539" />
                </svg>
            );
        case 'fideos':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path d="M12 24C12 32 17 36 24 36C31 36 36 32 36 24H12Z" fill="#3D405B" />
                    <path d="M16 22C18 16 22 18 24 14C26 18 30 16 32 22" stroke="#EE9B00" strokeWidth="3" fill="none" />
                </svg>
            );
        case 'pan':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path d="M14 20C14 16 18 14 24 14C30 14 34 16 34 20V32C34 34 32 36 30 36H18C16 36 14 34 14 32V20Z" fill="#B08968" />
                    <path d="M17 21C17 18 20 17 24 17C28 17 31 18 31 21V31C31 32 30 33 29 33H19C18 33 17 32 17 31V21Z" fill="#DDB892" />
                </svg>
            );
        case 'tomate':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <circle cx="24" cy="26" r="11" fill="#E63946" />
                    <path d="M24 15V11" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M21 16L24 15L27 16" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );
        case 'brocoli':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <rect x="22" y="27" width="4" height="11" rx="2" fill="#95D5B2" />
                    <circle cx="24" cy="18" r="7" fill="#2D6A4F" />
                    <circle cx="17" cy="23" r="6" fill="#40916C" />
                    <circle cx="31" cy="23" r="6" fill="#40916C" />
                </svg>
            );
        case 'espinaca':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path d="M14 30C12 20 22 14 24 12C26 14 36 20 34 30C32 36 24 38 24 38C24 38 16 36 14 30Z" fill="#2D6A4F" />
                    <line x1="24" y1="14" x2="24" y2="40" stroke="#74C69D" strokeWidth="1.5" />
                </svg>
            );
        case 'zanahoria':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <path d="M24 38L18 18C18 16 20 14 24 14C28 14 30 16 30 18L24 38Z" fill="#F77F00" />
                    <path d="M22 14L20 10M24 14V9M26 14L28 10" stroke="#52B788" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );
        case 'lechuga':
            return (
                <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <circle cx="24" cy="26" r="10" fill="#52B788" />
                    <circle cx="18" cy="24" r="6" fill="#74C69D" />
                    <circle cx="30" cy="24" r="6" fill="#74C69D" />
                </svg>
            );
        default:
            return <Utensils size={24} color="#00D2FF" />;
    }
}

// Ilustración del Plato Saludable Equilibrado
function PlatoIllustration() {
    return (
        <svg viewBox="0 0 200 200" className="nutricion-plato-svg">
            {/* Sombra y Borde exterior del plato */}
            <circle cx="100" cy="100" r="94" fill="#0C091A" stroke="rgba(138, 43, 226, 0.5)" strokeWidth="3" />
            <circle cx="100" cy="100" r="88" fill="#F8FAFC" />
            <circle cx="100" cy="100" r="76" fill="#EDF2F7" stroke="#E2E8F0" strokeWidth="1.5" />

            {/* Cuadrante 1: Proteínas (Pollo / Salmón a la plancha) */}
            <g transform="translate(48, 44)">
                <path d="M5 25 C10 8, 30 5, 42 18 C38 32, 22 36, 5 25 Z" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
                <line x1="16" y1="12" x2="14" y2="24" stroke="#FFE4D6" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="25" y1="14" x2="23" y2="26" stroke="#FFE4D6" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="33" y1="17" x2="31" y2="25" stroke="#FFE4D6" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Cuadrante 2: Palta / Aguacate en rodajas */}
            <g transform="translate(98, 45)">
                <path d="M12 2 C6 2, 2 9, 2 17 C2 26, 7 32, 16 32 C23 32, 28 25, 28 17 C28 9, 22 2, 12 2 Z" fill="#2D6A4F" />
                <path d="M12 5 C8 5, 5 11, 5 17 C5 24, 9 29, 16 29 C21 29, 25 24, 25 17 C25 11, 20 5, 12 5 Z" fill="#A7C957" />
                <circle cx="15" cy="19" r="6" fill="#6F4E37" />
            </g>

            {/* Centro: Huevo duro cortado a la mitad */}
            <g transform="translate(85, 82)">
                <ellipse cx="14" cy="16" rx="14" ry="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <circle cx="14" cy="16" r="6.5" fill="#FFB703" />
            </g>

            {/* Cuadrante 3: Vegetales y hojas verdes (Espinaca / Brócoli) */}
            <g transform="translate(42, 102)">
                <circle cx="14" cy="16" r="10" fill="#15803D" />
                <circle cx="28" cy="14" r="8" fill="#16A34A" />
                <circle cx="18" cy="26" r="9" fill="#22C55E" />
                <circle cx="32" cy="24" r="7" fill="#15803D" />
            </g>

            {/* Cuadrante 4: Tomates cherry frescos */}
            <g transform="translate(76, 122)">
                <circle cx="12" cy="12" r="7.5" fill="#EF4444" />
                <circle cx="24" cy="14" r="7" fill="#DC2626" />
                <circle cx="18" cy="20" r="6.5" fill="#B91C1C" />
            </g>

            {/* Cuadrante 5: Carbohidratos complejos (Arroz / Porotos / Granos) */}
            <g transform="translate(108, 92)">
                <ellipse cx="26" cy="22" rx="20" ry="18" fill="#92400E" />
                <circle cx="18" cy="16" r="2" fill="#FBBF24" />
                <circle cx="24" cy="14" r="2" fill="#FBBF24" />
                <circle cx="30" cy="18" r="2" fill="#FBBF24" />
                <circle cx="22" cy="24" r="2" fill="#FBBF24" />
                <circle cx="30" cy="26" r="2" fill="#FBBF24" />
            </g>
        </svg>
    );
}

function NutricionView() {
    // Categoría activa de filtrado
    const [categoriaActiva, setCategoriaActiva] = useState('Proteinas');

    // Ingredientes seleccionados (recuperados de localStorage si existen)
    const [selectedIds, setSelectedIds] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error('Error al leer de localStorage:', e);
        }
        return DEFAULT_SELECTION;
    });

    // Toast de notificación
    const [toastMsg, setToastMsg] = useState('');
    const mostrarToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    // Guardar en localStorage cada vez que cambien los ingredientes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
        } catch (e) {
            console.error('Error al guardar en localStorage:', e);
        }
    }, [selectedIds]);

    // Alternar selección de un alimento
    const handleToggleAlimento = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Alimentos que componen el plato armado actual
    const alimentosSeleccionados = useMemo(() => {
        return ALIMENTOS_DATA.filter(item => selectedIds.includes(item.id));
    }, [selectedIds]);

    // Cálculo dinámico de calorías totales estimadas
    const totalCalorias = useMemo(() => {
        return alimentosSeleccionados.reduce((acc, item) => acc + item.kcal, 0);
    }, [alimentosSeleccionados]);

    // Filtrar alimentos según la categoría de chip seleccionada
    const alimentosFiltrados = useMemo(() => {
        if (categoriaActiva === 'Todas') return ALIMENTOS_DATA;
        return ALIMENTOS_DATA.filter(item => item.categoria === categoriaActiva);
    }, [categoriaActiva]);

    // Acción principal: "ARMA TU PLATO"
    const handleArmarPlato = () => {
        if (selectedIds.length === 0) {
            return mostrarToast('Selecciona al menos un ingrediente para armar tu plato');
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
            mostrarToast('¡Tu plato ideal ha sido armado y guardado!');
            // Scroll suave hacia la tarjeta del plato armado
            const platoEl = document.getElementById('plato-ideal-armado');
            if (platoEl) {
                platoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (err) {
            mostrarToast('Error al confirmar el plato');
        }
    };

    // Reiniciar plato al default
    const handleReiniciarPlato = () => {
        setSelectedIds([]);
        localStorage.removeItem(STORAGE_KEY);
        mostrarToast('Plato reiniciado');
    };

    return (
        <div className="nutricion-container">
            {/* Título de la vista */}
            <h1 className="nutricion-title">ARMA TU PLATO IDEAL</h1>

            {/* Toast flotante */}
            {toastMsg && (
                <div className="nutricion-toast">
                    <Check size={16} />
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
               TARJETA 1: TUS ELECCIONES PARA EL PLATO
               ══════════════════════════════════════════════════════════════════ */}
            <section className="nutricion-card-elecciones">
                <h2 className="nutricion-card-header-title">TUS ELECCIONES PARA EL PLATO</h2>

                {/* Divisor en gradiente */}
                <div className="nutricion-gradient-divider" />

                {/* Barra horizontal de chips/tags */}
                <div className="nutricion-chips-bar">
                    {CATEGORIAS_NUTRICION.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            className={`nutricion-chip ${categoriaActiva === cat ? 'active' : ''}`}
                            onClick={() => setCategoriaActiva(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grilla interactiva de alimentos */}
                <div className="nutricion-alimentos-grid">
                    {alimentosFiltrados.map(alimento => {
                        const isSelected = selectedIds.includes(alimento.id);
                        return (
                            <div
                                key={alimento.id}
                                className={`nutricion-alimento-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleToggleAlimento(alimento.id)}
                            >
                                <div className="nutricion-alimento-top">
                                    <div className="nutricion-checkbox">
                                        {isSelected && <Check size={13} className="nutricion-check-icon" />}
                                    </div>
                                    <div className="nutricion-alimento-icono-box">
                                        <FoodIcon tipo={alimento.icono} />
                                    </div>
                                </div>

                                <div className="nutricion-alimento-meta">
                                    <span className="nutricion-alimento-kcal">{alimento.kcal} kcal</span>
                                    <span className="nutricion-alimento-nombre">{alimento.nombre}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mensaje de orientación */}
                <p className="nutricion-instruccion-text">
                    Selecciona ingredientes de tu guía para armar el plato
                </p>

                {/* Botón Verde Destacado "ARMA TU PLATO" */}
                <button
                    type="button"
                    className="btn-arma-tu-plato"
                    onClick={handleArmarPlato}
                >
                    ARMA TU PLATO
                </button>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
               TARJETA 2: TU PLATO IDEAL ARMADO
               ══════════════════════════════════════════════════════════════════ */}
            <section className="nutricion-card-plato-armado" id="plato-ideal-armado">
                <h2 className="nutricion-card-header-title">TU PLATO IDEAL ARMADO</h2>

                <div className="nutricion-plato-armado-content">
                    {/* Lista con viñetas de los ingredientes seleccionados */}
                    {alimentosSeleccionados.length > 0 ? (
                        <ul className="nutricion-plato-ingredientes-list">
                            {alimentosSeleccionados.map(item => (
                                <li key={item.id} className="nutricion-plato-ingrediente-item">
                                    <span className="nutricion-plato-bullet" />
                                    <span>{item.nombre}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="nutricion-plato-vacio-text">
                            No has seleccionado ingredientes aún. Toca los alimentos arriba para armar tu plato.
                        </p>
                    )}

                    {/* Ilustración del plato saludable */}
                    <div className="nutricion-plato-ilustracion-box">
                        <PlatoIllustration />
                    </div>
                </div>

                {/* Total de Calorías Estimadas en tiempo real */}
                <div className="nutricion-calorias-total-banner">
                    <span>TOTAL DE CALORÍAS ESTIMADAS:</span>
                    <span className="nutricion-calorias-valor">{totalCalorias} Kcal</span>
                </div>

                {/* Botón para reiniciar selección */}
                {selectedIds.length > 0 && (
                    <button
                        type="button"
                        className="btn-reiniciar-plato"
                        onClick={handleReiniciarPlato}
                    >
                        <RotateCcw size={13} />
                        Limpiar selección
                    </button>
                )}
            </section>
        </div>
    );
}

export default NutricionView;
