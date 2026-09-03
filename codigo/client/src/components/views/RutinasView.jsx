import { useState, useEffect } from 'react';
import { getRutinas, createRutina, getEjercicios, createEjercicio } from '../../services/api';
import { getCurrentUser } from '../../features/authService';

const FORM_RUTINA_INICIAL = { nombre: '', descripcion: '', dia_asignado: '' };
const FORM_EJERCICIO_INICIAL = { nombre: '', grupo_muscular: '', descripcion: '', gif: '' };

function RutinasView() {
    const user = getCurrentUser();
    const [tab, setTab] = useState('Favoritas'); // Favoritas, Pre-armadas, Propia
    const [rutinas, setRutinas] = useState([]);
    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formRutina, setFormRutina] = useState(FORM_RUTINA_INICIAL);
    const [rutinaEjercicios, setRutinaEjercicios] = useState([]); // Ejercicios a agregar a la rutina actual
    const [ejercicioSeleccionadoId, setEjercicioSeleccionadoId] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [formEjercicio, setFormEjercicio] = useState(FORM_EJERCICIO_INICIAL);

    const [toast, setToast] = useState({ msg: '', tipo: 'success' });
    const mostrarToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast({ msg: '', tipo: 'success' }), 3000);
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [resRutinas, resEjercicios] = await Promise.all([
                getRutinas(),
                getEjercicios()
            ]);
            if (resRutinas?.success) setRutinas(resRutinas.data);
            if (resEjercicios?.success) setEjercicios(resEjercicios.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCrearRutina = async () => {
        if (!formRutina.nombre) return mostrarToast('El nombre de la rutina es obligatorio', 'error');
        
        try {
            const res = await createRutina({
                ...formRutina,
                id_usuario: user?.id,
                ejercicios: rutinaEjercicios
            });
            if (res?.success) {
                mostrarToast('Rutina creada correctamente', 'success');
                setFormRutina(FORM_RUTINA_INICIAL);
                setRutinaEjercicios([]);
                cargarDatos();
            }
        } catch (error) {
            mostrarToast('Error al crear rutina', 'error');
        }
    };

    const handleCrearEjercicio = async () => {
        if (!formEjercicio.nombre) return mostrarToast('El nombre es obligatorio', 'error');
        try {
            const res = await createEjercicio(formEjercicio);
            if (res?.success) {
                mostrarToast('Ejercicio creado', 'success');
                setModalAbierto(false);
                setFormEjercicio(FORM_EJERCICIO_INICIAL);
                cargarDatos();
            }
        } catch (error) {
            mostrarToast('Error al crear ejercicio', 'error');
        }
    };

    const agregarEjercicioARutina = () => {
        if (!ejercicioSeleccionadoId) return;
        const ej = ejercicios.find(e => e.id_ejercicio === parseInt(ejercicioSeleccionadoId));
        if (ej) {
            setRutinaEjercicios([
                ...rutinaEjercicios, 
                { ...ej, series: 3, repeticiones: 10, peso: 0 } // Valores por defecto
            ]);
        }
    };

    const updateEjercicioRutina = (index, field, value) => {
        const newEjercicios = [...rutinaEjercicios];
        newEjercicios[index][field] = value;
        setRutinaEjercicios(newEjercicios);
    };

    const removerEjercicioRutina = (index) => {
        const newEjercicios = [...rutinaEjercicios];
        newEjercicios.splice(index, 1);
        setRutinaEjercicios(newEjercicios);
    };

    const rutinasFiltradas = rutinas.filter(r => {
        if (tab === 'Favoritas') return r.es_favorita === 1;
        if (tab === 'Pre-armadas') return r.id_usuario === null;
        return r.id_usuario === user?.id; // Propia
    });

    return (
        <div style={{ width: '100%', padding: '20px' }}>
            <h1 className="admin-titulo" style={{ textAlign: 'center', marginBottom: '20px' }}>RUTINAS</h1>
            <div className="tipo-usuario-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
                <button
                    className={`btn-ver ${tab === 'Favoritas' ? 'activo' : ''}`}
                    onClick={() => setTab('Favoritas')}
                    style={{ flex: 1, background: tab === 'Favoritas' ? 'var(--admin-selected-bg)' : 'var(--admin-card-soft)', border: tab === 'Favoritas' ? '1px solid var(--admin-selected-border)' : 'none', color: 'white', borderRadius: '8px', padding: '10px' }}
                >
                    Favoritas
                </button>
                <button
                    className={`btn-ver ${tab === 'Pre-armadas' ? 'activo' : ''}`}
                    onClick={() => setTab('Pre-armadas')}
                    style={{ flex: 1, background: tab === 'Pre-armadas' ? 'var(--admin-selected-bg)' : 'var(--admin-card-soft)', border: tab === 'Pre-armadas' ? '1px solid var(--admin-selected-border)' : 'none', color: 'white', borderRadius: '8px', padding: '10px' }}
                >
                    Pre-armadas
                </button>
                <button
                    className={`btn-ver ${tab === 'Propia' ? 'activo' : ''}`}
                    onClick={() => setTab('Propia')}
                    style={{ flex: 1, background: tab === 'Propia' ? 'var(--admin-selected-bg)' : 'var(--admin-card-soft)', border: tab === 'Propia' ? '1px solid var(--admin-selected-border)' : 'none', color: 'white', borderRadius: '8px', padding: '10px' }}
                >
                    Mi Rutina Propia
                </button>
            </div>

            {toast.msg && <div className={`toast ${toast.tipo}`}>{toast.msg}</div>}

            {tab !== 'Propia' ? (
                <div>
                    {loading ? <div className="loading-state"><div className="loading-spinner"></div></div> : (
                        rutinasFiltradas.length > 0 ? (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {rutinasFiltradas.map(r => (
                                    <div key={r.id_rutina} style={{ border: '1px solid rgba(140, 88, 211, 0.78)', background: 'var(--admin-card-soft)', padding: '15px', borderRadius: '13px', color: 'white' }}>
                                        <h3 style={{ margin: '0 0 5px 0' }}>{r.nombre}</h3>
                                        <p style={{ margin: 0, color: 'var(--admin-muted)', fontSize: '13px' }}>{r.descripcion}</p>
                                        {r.dia_asignado && <span className="badge-estado activo" style={{ marginTop: '10px' }}>Día: {r.dia_asignado}</span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="usuarios-vacio">
                                <p>No hay rutinas para mostrar en esta sección.</p>
                            </div>
                        )
                    )}
                </div>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--admin-card-soft)', padding: '15px', borderRadius: '13px', border: '1px solid rgba(140, 88, 211, 0.78)' }}>
                        <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '18px' }}>Crear Nueva Rutina</h2>
                        <input className="input-modal" placeholder="Nombre de la Rutina (ej. Pierna)" value={formRutina.nombre} onChange={e => setFormRutina({ ...formRutina, nombre: e.target.value })} />
                        <textarea className="input-modal" placeholder="Descripción breve" value={formRutina.descripcion} onChange={e => setFormRutina({ ...formRutina, descripcion: e.target.value })} style={{ minHeight: '80px' }} />
                        
                        <select className="input-modal" value={formRutina.dia_asignado} onChange={e => setFormRutina({ ...formRutina, dia_asignado: e.target.value })}>
                            <option value="">Selecciona un día agendado (Opcional)</option>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        <div style={{ marginTop: '10px' }}>
                            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '16px' }}>Agregar Ejercicio</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select className="input-modal" value={ejercicioSeleccionadoId} onChange={e => setEjercicioSeleccionadoId(e.target.value)} style={{ flex: 1, marginBottom: 0 }}>
                                    <option value="">Selecciona un ejercicio existente...</option>
                                    {ejercicios.map(e => (
                                        <option key={e.id_ejercicio} value={e.id_ejercicio}>{e.nombre}</option>
                                    ))}
                                </select>
                                <button className="btn-editar" onClick={agregarEjercicioARutina} style={{ padding: '0 15px', borderRadius: '8px' }}>+</button>
                            </div>
                            <button className="btn-ver" onClick={() => setModalAbierto(true)} style={{ width: '100%', marginTop: '10px', height: '40px', borderRadius: '8px' }}>
                                Crear Nuevo Ejercicio en DB
                            </button>
                        </div>
                    </div>

                    {rutinaEjercicios.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '16px' }}>Ejercicios en esta rutina</h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {rutinaEjercicios.map((e, index) => (
                                    <div key={index} style={{ border: '1px solid rgba(95, 181, 224, 0.85)', background: 'var(--admin-card-soft)', padding: '15px', borderRadius: '13px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        {e.gif ? (
                                            <img src={e.gif} alt={e.nombre} style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '70px', height: '70px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#aaa', textAlign: 'center' }}>Sin GIF</div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0, color: 'white', fontSize: '15px' }}>{e.nombre}</h4>
                                                <button onClick={() => removerEjercicioRutina(index)} style={{ background: 'transparent', border: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: '18px' }}>×</button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                <div>
                                                    <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Series</label>
                                                    <input type="number" className="input-modal" style={{ minHeight: '30px', padding: '5px', marginBottom: 0 }} value={e.series} onChange={(ev) => updateEjercicioRutina(index, 'series', ev.target.value)} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Reps</label>
                                                    <input type="number" className="input-modal" style={{ minHeight: '30px', padding: '5px', marginBottom: 0 }} value={e.repeticiones} onChange={(ev) => updateEjercicioRutina(index, 'repeticiones', ev.target.value)} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Peso (kg)</label>
                                                    <input type="number" className="input-modal" style={{ minHeight: '30px', padding: '5px', marginBottom: 0 }} value={e.peso} onChange={(ev) => updateEjercicioRutina(index, 'peso', ev.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button className="btn-guardar" onClick={handleCrearRutina} style={{ width: '100%', marginTop: '20px', height: '50px', background: 'var(--admin-violet)', border: 'none', color: 'white', borderRadius: '9px', fontWeight: 'bold' }}>
                                GUARDAR RUTINA
                            </button>
                        </div>
                    )}
                </div>
            )}

            {modalAbierto && (
                <div className="overlay">
                    <div className="modal">
                        <h2 className="modal-titulo">Nuevo Ejercicio</h2>
                        <div className="modal-grid">
                            <input className="input-modal" placeholder="Nombre del Ejercicio" value={formEjercicio.nombre} onChange={e => setFormEjercicio({ ...formEjercicio, nombre: e.target.value })} />
                            <input className="input-modal" placeholder="Grupo Muscular" value={formEjercicio.grupo_muscular} onChange={e => setFormEjercicio({ ...formEjercicio, grupo_muscular: e.target.value })} />
                            <textarea className="input-modal" placeholder="Descripción" value={formEjercicio.descripcion} onChange={e => setFormEjercicio({ ...formEjercicio, descripcion: e.target.value })} style={{ minHeight: '60px' }} />
                            <input className="input-modal" placeholder="URL del GIF animado" value={formEjercicio.gif} onChange={e => setFormEjercicio({ ...formEjercicio, gif: e.target.value })} />
                        </div>
                        <div className="modal-btns" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="btn-ver" onClick={() => setModalAbierto(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--admin-muted)', color: 'white', borderRadius: '8px' }}>Cancelar</button>
                            <button className="btn-editar" onClick={handleCrearEjercicio} style={{ flex: 1, background: 'var(--admin-violet)', border: 'none', color: 'white', borderRadius: '8px' }}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RutinasView;

