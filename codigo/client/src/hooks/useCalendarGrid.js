import { useState, useMemo } from 'react';

export const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DIAS_SEMANA_DOMINGO_A_SABADO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DIAS_SEMANA_LUNES_A_DOMINGO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ─── UTILIDADES DE FECHA LOCAL (SIN BUG UTC) ──────────────────────────────
export const pad = (n) => String(n).padStart(2, '0');

export const formatLocalDate = (year, monthNumber, dayNumber) => {
    return `${year}-${pad(monthNumber)}-${pad(dayNumber)}`;
};

export const toLocalDateStr = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    return formatLocalDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
};

/**
 * Parsea una fecha en formato YYYY-MM-DD o ISO a un Date puramente local
 * evitando el desfase de 1 día que causa new Date("YYYY-MM-DD") en husos UTC-3 / locales.
 */
export const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d, 12, 0, 0); // Mediodía local para seguridad absoluta contra DST
};

export const getTodayLocalDateStr = () => {
    const hoy = new Date();
    return formatLocalDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
};

/**
 * Hook reutilizable y sincronizado para Calendario y Asistencia
 */
export function useCalendarGrid({ startOnMonday = false } = {}) {
    const hoy = useMemo(() => new Date(), []);
    const [currentYear, setCurrentYear] = useState(() => hoy.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(() => hoy.getMonth()); // 0 a 11

    const irMesSiguiente = () => {
        setCurrentMonth(prev => {
            if (prev === 11) {
                setCurrentYear(y => y + 1);
                return 0;
            }
            return prev + 1;
        });
    };

    const irMesAnterior = () => {
        setCurrentMonth(prev => {
            if (prev === 0) {
                setCurrentYear(y => y - 1);
                return 11;
            }
            return prev - 1;
        });
    };

    const irHoy = () => {
        const ahora = new Date();
        setCurrentYear(ahora.getFullYear());
        setCurrentMonth(ahora.getMonth());
    };

    const monthData = useMemo(() => {
        const hoyStr = getTodayLocalDateStr();
        // Cantidad exacta de días en el mes actual (gestiona bisiestos automáticamente)
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Primer día del mes
        const primerDiaDate = new Date(currentYear, currentMonth, 1, 12, 0, 0);
        const dayOfWeekFirst = primerDiaDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.

        // Padding inicial para alinear el primer día
        let paddingDays = 0;
        if (startOnMonday) {
            paddingDays = dayOfWeekFirst === 0 ? 6 : dayOfWeekFirst - 1;
        } else {
            paddingDays = dayOfWeekFirst;
        }

        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(currentYear, currentMonth, i, 12, 0, 0);
            const dateStr = formatLocalDate(currentYear, currentMonth + 1, i);
            const dayOfWeek = dateObj.getDay();
            const dayName = DIAS_SEMANA_DOMINGO_A_SABADO[dayOfWeek];

            days.push({
                day: i,
                dateStr,
                dayName,
                dayOfWeek,
                dateObj,
                isToday: dateStr === hoyStr
            });
        }

        const nombreMes = NOMBRES_MESES[currentMonth];
        const tituloMes = `${nombreMes} ${currentYear}`;

        return {
            year: currentYear,
            month: currentMonth,
            monthName: nombreMes,
            monthTitle: tituloMes,
            daysInMonth,
            paddingDays,
            days
        };
    }, [currentYear, currentMonth, startOnMonday]);

    /**
     * Helper para verificar si un día tiene asistencia registrada
     */
    const verificarAsistencia = (dateStr, asistencias = []) => {
        if (!dateStr || !Array.isArray(asistencias)) return false;
        return asistencias.some(a => {
            if (!a || !a.fecha) return false;
            const aDateStr = String(a.fecha).split('T')[0];
            return aDateStr === dateStr;
        });
    };

    /**
     * Genera los 7 días de la semana actual (Lunes a Domingo) para la vista semanal de progreso
     */
    const getWeeklyDays = (asistencias = []) => {
        const ahora = new Date();
        const hoyStr = getTodayLocalDateStr();
        const diaSemana = ahora.getDay(); // 0: Dom, 1: Lun...
        // Distancia al Lunes anterior
        const diffToMonday = diaSemana === 0 ? -6 : 1 - diaSemana;
        
        const lunes = new Date(ahora);
        lunes.setDate(ahora.getDate() + diffToMonday);

        const result = [];
        const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(lunes);
            d.setDate(lunes.getDate() + i);
            const dateStr = formatLocalDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
            const hasAttended = verificarAsistencia(dateStr, asistencias);
            const isFuture = dateStr > hoyStr;

            result.push({
                dayName: nombresDias[i],
                dayNumber: d.getDate(),
                dateStr,
                status: hasAttended ? 'yes' : (isFuture ? 'pending' : 'no')
            });
        }

        return result;
    };

    return {
        currentYear,
        currentMonth,
        ...monthData,
        irMesSiguiente,
        irMesAnterior,
        irHoy,
        verificarAsistencia,
        getWeeklyDays,
        todayStr: getTodayLocalDateStr(),
        headers: startOnMonday ? DIAS_SEMANA_LUNES_A_DOMINGO : DIAS_SEMANA_DOMINGO_A_SABADO
    };
}
