import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Trophy,
    Timer,
    Dumbbell,
    Calendar,
    Flame,
    Zap,
    Award,
    Clock,
    ArrowRight
} from 'lucide-react';
import { getHistorialByUsuario } from '../../services/api';
import { getCurrentUser } from '../../features/authService';
import '../../styles/progresoView.css';

function formatSegundosAHrsMins(segundos) {
    if (!segundos || segundos <= 0) return '0 min';
    const hrs = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);

    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }
    return `${mins} min`;
}

function formatFechaLegible(fechaStr) {
    if (!fechaStr) return '';
    try {
        const d = new Date(fechaStr);
        return d.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return fechaStr;
    }
}

// Gráfico de Evolución SVG de Kilos a lo largo del tiempo
function KilosEvolutionChart({ data }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Preparar puntos en orden cronológico (del más antiguo al más reciente)
    const puntos = useMemo(() => {
        if (!data || data.length === 0) return [];
        const invertidos = [...data].reverse(); // cronológico

        const maxKilos = Math.max(...invertidos.map(d => Number(d.kilos_totales) || 0), 100);
        const minKilos = Math.min(...invertidos.map(d => Number(d.kilos_totales) || 0), 0);
        const rango = maxKilos - minKilos || 1;

        const width = 500;
        const height = 180;
        const paddingX = 40;
        const paddingY = 25;

        const chartW = width - (paddingX * 2);
        const chartH = height - (paddingY * 2);

        return invertidos.map((item, idx) => {
            const x = invertidos.length === 1
                ? width / 2
                : paddingX + (idx / (invertidos.length - 1)) * chartW;

            const val = Number(item.kilos_totales) || 0;
            const y = height - paddingY - ((val - minKilos) / rango) * chartH;

            return {
                x,
                y,
                kilos: val,
                fecha: formatFechaLegible(item.fecha),
                rutina: item.nombre_rutina
            };
        });
    }, [data]);

    if (puntos.length === 0) {
        return (
            <div className="progreso-chart-empty">
                <Dumbbell size={32} />
                <p>No hay datos suficientes para trazar el gráfico de evolución.</p>
            </div>
        );
    }

    const pathD = puntos.reduce((acc, p, idx) => {
        return `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${puntos[puntos.length - 1].x} 165 L ${puntos[0].x} 165 Z`;

    return (
        <div className="progreso-chart-container">
            <svg viewBox="0 0 500 190" className="progreso-svg-chart">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8a2be2" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#8a2be2" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8a2be2" />
                        <stop offset="50%" stopColor="#6c5ce7" />
                        <stop offset="100%" stopColor="#00d2ff" />
                    </linearGradient>
                </defs>

                {/* Líneas guía de fondo */}
                <line x1="30" y1="35" x2="470" y2="35" stroke="rgba(138, 43, 226, 0.15)" strokeDasharray="4 4" />
                <line x1="30" y1="95" x2="470" y2="95" stroke="rgba(138, 43, 226, 0.15)" strokeDasharray="4 4" />
                <line x1="30" y1="155" x2="470" y2="155" stroke="rgba(138, 43, 226, 0.25)" />

                {/* Área bajo la curva */}
                {puntos.length > 1 && (
                    <path d={areaD} fill="url(#areaGradient)" />
                )}

                {/* Línea de progresión */}
                {puntos.length > 1 && (
                    <path
                        d={pathD}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Puntos interactivos */}
                {puntos.map((p, idx) => {
                    const isHovered = hoveredIndex === idx;
                    return (
                        <g
                            key={idx}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={isHovered ? 7 : 4.5}
                                fill="#00d2ff"
                                stroke="#181528"
                                strokeWidth={isHovered ? 3 : 2}
                                style={{ transition: 'all 0.15s ease' }}
                            />

                            {/* Tooltip dinámico */}
                            {isHovered && (
                                <g transform={`translate(${Math.min(380, Math.max(80, p.x))}, ${Math.max(30, p.y - 15)})`}>
                                    <rect
                                        x="-60"
                                        y="-32"
                                        width="120"
                                        height="30"
                                        rx="6"
                                        fill="#0f0c1b"
                                        stroke="#00d2ff"
                                        strokeWidth="1.5"
                                    />
                                    <text
                                        x="0"
                                        y="-18"
                                        textAnchor="middle"
                                        fill="#00d2ff"
                                        fontSize="11"
                                        fontWeight="700"
                                    >
                                        {p.kilos} kg levantados
                                    </text>
                                    <text
                                        x="0"
                                        y="-7"
                                        textAnchor="middle"
                                        fill="#94a3b8"
                                        fontSize="9"
                                    >
                                        {p.fecha}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function ProgresoView() {
    const user = getCurrentUser();
    const userId = user?.id ?? user?.id_usuario;
    const navigate = useNavigate();

    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar historial del atleta desde MySQL
    useEffect(() => {
        let isMounted = true;
        async function fetchHistorial() {
            setLoading(true);
            try {
                const res = await getHistorialByUsuario(userId || '');
                if (res?.success && Array.isArray(res.data) && isMounted) {
                    setHistorial(res.data);
                }
            } catch (err) {
                console.error('Error al cargar historial:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchHistorial();
        return () => { isMounted = false; };
    }, [userId]);

    // ─── Estadísticas del Mes ───────────────────────────────────────────────────
    const estadisticasMes = useMemo(() => {
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const anioActual = ahora.getFullYear();

        const sesionesMes = historial.filter(s => {
            if (!s.fecha) return false;
            const f = new Date(s.fecha);
            return f.getMonth() === mesActual && f.getFullYear() === anioActual;
        });

        const diasAsistidos = new Set(
            sesionesMes.map(s => new Date(s.fecha).toDateString())
        ).size;

        const duracionTotalSegundos = sesionesMes.reduce(
            (acc, s) => acc + (Number(s.duracion_segundos) || 0),
            0
        );

        const volumenTotalMes = sesionesMes.reduce(
            (acc, s) => acc + (Number(s.kilos_totales) || 0),
            0
        );

        return {
            diasAsistidos,
            tiempoTotal: formatSegundosAHrsMins(duracionTotalSegundos),
            volumenTotal: volumenTotalMes
        };
    }, [historial]);

    // ─── Récords Personales Históricos ──────────────────────────────────────────
    const records = useMemo(() => {
        if (historial.length === 0) {
            return {
                pesoMaximo: 0,
                volumenMaximo: 0,
                duracionMaxima: 0,
                totalSesiones: 0
            };
        }

        const pesoMax = Math.max(...historial.map(s => Number(s.peso_maximo) || 0));
        const volumenMax = Math.max(...historial.map(s => Number(s.kilos_totales) || 0));
        const duracionMax = Math.max(...historial.map(s => Number(s.duracion_segundos) || 0));

        return {
            pesoMaximo: pesoMax,
            volumenMaximo: volumenMax,
            duracionMaxima: formatSegundosAHrsMins(duracionMax),
            totalSesiones: historial.length
        };
    }, [historial]);

    return (
        <div className="progreso-container">
            {/* Cabecera */}
            <div className="progreso-header">
                <h1 className="progreso-title">
                    <TrendingUp size={24} color="var(--prog-cyan)" />
                    Progreso del Atleta
                </h1>
                <p className="progreso-subtitle">
                    Evolución de cargas, marcas personales y registro de entrenamientos.
                </p>
            </div>

            {/* 1. Estadísticas del Mes Actual */}
            <div className="progreso-stats-grid">
                <div className="progreso-stat-card">
                    <div className="progreso-stat-icon-box dias">
                        <Calendar size={22} />
                    </div>
                    <div className="progreso-stat-info">
                        <span className="progreso-stat-label">Días del Mes</span>
                        <span className="progreso-stat-val">{estadisticasMes.diasAsistidos} días</span>
                    </div>
                </div>

                <div className="progreso-stat-card">
                    <div className="progreso-stat-icon-box tiempo">
                        <Timer size={22} />
                    </div>
                    <div className="progreso-stat-info">
                        <span className="progreso-stat-label">Tiempo Total</span>
                        <span className="progreso-stat-val">{estadisticasMes.tiempoTotal}</span>
                    </div>
                </div>

                <div className="progreso-stat-card">
                    <div className="progreso-stat-icon-box volumen">
                        <Flame size={22} />
                    </div>
                    <div className="progreso-stat-info">
                        <span className="progreso-stat-label">Volumen del Mes</span>
                        <span className="progreso-stat-val">{estadisticasMes.volumenTotal.toLocaleString()} kg</span>
                    </div>
                </div>
            </div>

            {/* 2. Gráfico de Evolución de Kilos */}
            <div className="progreso-chart-card">
                <div className="progreso-card-top-row">
                    <h3 className="progreso-card-title">
                        <TrendingUp size={18} color="var(--prog-cyan)" />
                        Evolución de Kilos Levantados
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--prog-text-muted)' }}>
                        Progreso por sesión
                    </span>
                </div>

                <KilosEvolutionChart data={historial} />
            </div>

            {/* 3. Récords Personales */}
            <div className="progreso-records-section">
                <h3 className="progreso-card-title">
                    <Trophy size={18} color="var(--prog-gold)" />
                    Récords Personales
                </h3>

                <div className="progreso-records-grid">
                    <div className="progreso-record-card">
                        <div className="record-trophy-box">
                            <Trophy size={22} />
                        </div>
                        <div className="record-info">
                            <span className="record-label">Peso Máximo</span>
                            <span className="record-val">{records.pesoMaximo} kg</span>
                            <span className="record-sub">Mayor carga levantada</span>
                        </div>
                    </div>

                    <div className="progreso-record-card">
                        <div className="record-trophy-box" style={{ borderColor: 'var(--prog-cyan)', color: 'var(--prog-cyan)', background: 'rgba(0,210,255,0.15)' }}>
                            <Zap size={22} />
                        </div>
                        <div className="record-info">
                            <span className="record-label" style={{ color: 'var(--prog-cyan)' }}>Volumen Récord</span>
                            <span className="record-val">{records.volumenMaximo.toLocaleString()} kg</span>
                            <span className="record-sub">En una sola sesión</span>
                        </div>
                    </div>

                    <div className="progreso-record-card">
                        <div className="record-trophy-box" style={{ borderColor: 'var(--prog-green)', color: 'var(--prog-green)', background: 'rgba(0,200,83,0.15)' }}>
                            <Clock size={22} />
                        </div>
                        <div className="record-info">
                            <span className="record-label" style={{ color: 'var(--prog-green)' }}>Sesión Más Larga</span>
                            <span className="record-val">{records.duracionMaxima}</span>
                            <span className="record-sub">{records.totalSesiones} sesiones totales</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Historial de Sesiones Recientes */}
            <div className="progreso-historial-section">
                <div className="progreso-card-top-row">
                    <h3 className="progreso-card-title">
                        <Dumbbell size={18} color="var(--prog-cyan)" />
                        Historial de Sesiones ({historial.length})
                    </h3>
                    <button
                        type="button"
                        className="btn-crono btn-crono-play"
                        style={{ padding: '6px 14px', fontSize: '12px', minHeight: '34px' }}
                        onClick={() => navigate('/entrenamiento')}
                    >
                        <Zap size={13} fill="currentColor" />
                        Entrenar Ahora
                    </button>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--prog-text-muted)', fontSize: '13px' }}>
                        Cargando historial de entrenamientos...
                    </p>
                ) : historial.length > 0 ? (
                    <div className="progreso-historial-list">
                        {historial.map(s => (
                            <div key={s.id_historial} className="progreso-historial-item">
                                <div className="historial-item-main">
                                    <div className="historial-item-icon-box">
                                        <Dumbbell size={18} />
                                    </div>
                                    <div className="historial-item-text">
                                        <span className="historial-item-title">{s.nombre_rutina}</span>
                                        <span className="historial-item-fecha">
                                            <Calendar size={11} />
                                            {formatFechaLegible(s.fecha)}
                                        </span>
                                    </div>
                                </div>

                                <div className="historial-item-metrics">
                                    <div className="historial-metric-pill">
                                        <span className="historial-metric-sub">Tiempo</span>
                                        <span className="historial-metric-val">
                                            {formatSegundosAHrsMins(s.duracion_segundos)}
                                        </span>
                                    </div>
                                    <div className="historial-metric-pill">
                                        <span className="historial-metric-sub">Peso Máx</span>
                                        <span className="historial-metric-val" style={{ color: 'var(--prog-gold)' }}>
                                            {s.peso_maximo} kg
                                        </span>
                                    </div>
                                    <div className="historial-metric-pill">
                                        <span className="historial-metric-sub">Volumen</span>
                                        <span className="historial-metric-val" style={{ color: 'var(--prog-green)' }}>
                                            {Number(s.kilos_totales).toLocaleString()} kg
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--prog-bg-card)', borderRadius: '16px', border: '1px dashed var(--prog-border)' }}>
                        <Trophy size={36} color="var(--prog-text-muted)" style={{ marginBottom: '8px' }} />
                        <p style={{ color: 'var(--prog-text-muted)', fontSize: '13.5px', margin: '0 0 12px 0' }}>
                            Aún no has registrado ninguna sesión de entrenamiento.
                        </p>
                        <button
                            type="button"
                            className="btn-crono btn-crono-play"
                            onClick={() => navigate('/entrenamiento')}
                        >
                            <Zap size={14} fill="currentColor" />
                            Empezar mi Primer Entrenamiento
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProgresoView;
