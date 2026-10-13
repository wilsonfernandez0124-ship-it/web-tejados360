'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { siteConfig } from '@/config/site';
import { Calendar, Clock, MapPin, Phone, User, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService?: string;
}

export default function BookingForm({ isOpen, onClose, selectedService }: BookingFormProps) {
  const supabase = createClient();

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    localidad: siteConfig.regions?.[0] || 'A Coruña',
    servicio_interes: selectedService || siteConfig.services?.[0]?.title || 'Inspección con Dron',
    fecha_cita: '',
    franja_horaria: 'Mañana (09:00 - 13:00)',
    comentarios: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.from('appointments').insert([formData]);
      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg('Error al agendar la cita. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 md:p-8 relative overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">¡Cita Solicitada con Éxito!</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Hemos registrado tu solicitud de inspección técnica en <strong>{siteConfig.name}</strong>. Nos pondremos en contacto contigo en breve.
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                onClose();
              }}
              className="bg-[#F26522] hover:bg-[#E65100] text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-[#F26522]/20"
            >
              Cerrar Ventana
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 border-b border-slate-100 pb-4">
              <span className="text-[#F26522] font-black text-xs uppercase tracking-widest">Reserva Directa</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Solicitar Inspección Técnica</h2>
              <p className="text-slate-500 text-xs mt-1">Evaluación técnica presencial y presupuesto sin compromiso.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Manuel García"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Ej. 612 345 678"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección del Inmueble *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle, número, piso"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Zona / Localidad *</label>
                <select
                  value={formData.localidad}
                  onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#F26522]"
                >
                  {(siteConfig.regions || []).map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Servicio Requerido *</label>
              <select
                value={formData.servicio_interes}
                onChange={(e) => setFormData({ ...formData, servicio_interes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#F26522]"
              >
                {(siteConfig.services || []).map((srv) => (
                  <option key={srv.id} value={srv.title}>{srv.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Preferida *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.fecha_cita}
                    onChange={(e) => setFormData({ ...formData, fecha_cita: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Franja Horaria *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={formData.franja_horaria}
                    onChange={(e) => setFormData({ ...formData, franja_horaria: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#F26522]"
                  >
                    <option value="Mañana (09:00 - 13:00)">Mañana (09:00 - 13:00)</option>
                    <option value="Tarde (15:00 - 19:00)">Tarde (15:00 - 19:00)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F26522] hover:bg-[#E65100] text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#F26522]/20 disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirmar Reserva Técnica</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}