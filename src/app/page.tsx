'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import BookingForm from '@/components/features/BookingForm';
import { siteConfig } from '@/config/site';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Phone, Mail, Calendar, ArrowRight, CheckCircle2, ShieldCheck, Clock, MapPin,
  Camera, MessageCircle, FileText, ChevronLeft, ChevronRight,
  Menu, X, Layers, Award, Wrench, Lock, Sparkles, Sliders, Star, Eye,
  Building2, Home as HomeIcon, Shield, Paintbrush, HardHat, FileCheck
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* CATÁLOGO DE SERVICIOS REALES DE TEJADOS 360                        */
/* ------------------------------------------------------------------ */
const DEFAULT_SERVICES = [
  {
    id: 'dron-tech',
    label: 'Inspección con dron',
    badge: 'DIAGNÓSTICO AÉREO HD',
    icon: Camera,
    title: 'Inspección aérea y presupuesto con dron',
    text: 'Revisamos tejados, limahoyas, canalones y fachadas con fotografía y vídeo aéreo en ultra resolución. Detectamos fisuras, tejas movidas y puntos de filtración sin riesgos estructurales.',
    bullets: [
      'Informe fotográfico HD detallado del estado previo',
      'Sin riesgo de accidentes ni costes de instalación de andamios',
      'Presupuesto cerrado, transparente y ajustado'
    ],
    service: 'Inspección y Presupuesto Técnico con Dron',
    img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'limpieza-reparacion-tejados',
    label: 'Tejados y goteras',
    badge: 'CUBIERTAS & GOTERAS',
    icon: HomeIcon,
    title: 'Limpieza, reparación de goteras e impermeabilización',
    text: 'La lluvia y el clima atlántico de A Coruña desgastan las cubiertas. Eliminamos verdín, musgo y líquenes, reparamos filtraciones críticas y aplicamos capas impermeables de máxima durabilidad.',
    bullets: [
      'Limpieza profunda y saneado de teja, pizarra y panel sándwich',
      'Reparación e inspección inmediata de goteras y vías de agua',
      'Impermeabilización continua de máxima estanqueidad'
    ],
    service: 'Limpieza y Reparación de Tejados y Goteras',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'malla-fibrada-encapsulado',
    label: 'Malla fibrada',
    badge: 'ENCAPSULADO PROTECTOR',
    icon: Shield,
    title: 'Impermeabilización con membrana de fibra de vidrio',
    text: 'Sistema técnico de encapsulado con membrana de fibra de vidrio y malla fibrada. Absorbe las dilataciones y contracciones térmicas de la estructura sin agrietarse jamás.',
    bullets: [
      'Encapsulado elástico impenetrable a la humedad',
      'Resistencia extrema a los cambios térmicos del invierno gallegos',
      'Acabado continuo sin juntas ni porosidad'
    ],
    service: 'Impermeabilización con Malla Fibrada y Encapsulado',
    img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'fachadas-limpieza-pintura',
    label: 'Fachadas y terrazas',
    badge: 'REHABILITACIÓN DE ENVOLVENTES',
    icon: Building2,
    title: 'Limpieza, revestimiento y pintura de fachadas y terrazas',
    text: 'Rehabilitación integral de la envolvente del edificio. Limpieza con hidrolavado, tratamiento de grietas, revestimiento elástico e impermeabilización de terrazas transitables.',
    bullets: [
      'Limpieza de fachadas e impermeabilización de terrazas',
      'Revestimiento elástico y pintura hidrófuga de exterior',
      'Eliminación definitiva de filtraciones e imprevistos'
    ],
    service: 'Limpieza, Revestimiento y Pintura de Fachadas y Terrazas',
    img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'pintura-interiores-estucado',
    label: 'Pintura e interiores',
    badge: 'ACABADOS DE INTERIOR',
    icon: Paintbrush,
    title: 'Alisado, empastado/estucado y pintura de viviendas',
    text: 'Solución integral para interiores golpeados por la humedad. Eliminamos humedades internas, realizamos alisado o empastado completo, lijado, imprimación y pintura decorativa.',
    bullets: [
      'Eliminación de humedades y saneamiento en paredes interiores',
      'Empastado o estucado: empastado, lijado e imprimación técnica',
      'Pintura y decoración completa de viviendas y locales'
    ],
    service: 'Alisado, Empastado y Pintura de Interiores',
    img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    id: 'descolgado-cuerdas',
    label: 'Descolgado vertical',
    badge: 'TÉCNICOS EN SUSPENSIÓN',
    icon: HardHat,
    title: 'Descolgado de cuerdas y trabajos en vertical',
    text: 'Accedemos a patios de luces, medianeras y zonas de difícil acceso colgados de cuerdas homologadas sin montar andamios, garantizando rapidez y costes reducidos.',
    bullets: [
      'Técnicos certificados IRATA / ANETVA para trabajos de altura',
      'Sellado de juntas, reparación de bajantes y bajadas de pluviales',
      'Cero molestias por andamios en la vía pública'
    ],
    service: 'Descolgado de Cuerdas en Vertical',
    img: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop'
    ]
  }
];

const TESTIMONIALS_DATA = [
  {
    quote: "Teníamos una filtración rebelde en la cubierta que nadie daba detectado. Hicieron la revisión previa con dron, vieron el punto exacto y la impermeabilización quedó impecable.",
    author: "María S.",
    location: "Oleiros, A Coruña",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop"
  },
  {
    quote: "Contratamos la pintura de la fachada mediante descolgado vertical en el edificio. Rápidos, limpios y sin las molestias ni los costes de montar andamios.",
    author: "Carlos M.",
    location: "A Coruña centro",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop"
  },
  {
    quote: "Nos realizaron el alisado y empastado de la vivienda interior tras solucionar las humedades. Un acabado fino, profesional y con cumplimiento de plazos estricto.",
    author: "Elena R.",
    location: "Arteixo",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop"
  }
];

const reasons = [
  { icon: ShieldCheck, t: 'Garantía Técnica por Escrito', d: 'Respaldamos cada intervención en tejados, fachadas e interiores con garantías reales por escrito.' },
  { icon: FileText, t: 'Presupuesto Cerrado', d: 'Estudios precisos tras la inspección previa para dar un importe definitivo sin imprevistos ni sorpresas.' },
  { icon: Clock, t: 'Atención de Urgencias', d: 'Respuesta rápida para atender goteras, filtraciones críticas y humedades en A Coruña.' },
  { icon: MapPin, t: 'Cobertura en A Coruña y Comarca', d: 'Atendemos en A Coruña, Oleiros, Arteixo, Cambre, Culleredo, Sada y alrededores.' },
];

const navLinks = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'seccion-servicios', label: 'Servicios' },
  { id: 'proyectos-framer', label: 'Proyectos' },
  { id: 'trabajos-verticales', label: 'Descolgado' },
  { id: 'proceso', label: 'Metodología' },
  { id: 'testimonios', label: 'Reseñas' },
  { id: 'contacto-inspeccion', label: 'Presupuesto' },
];

const noScrollbar = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.12 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Logo360({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-full bg-white p-1 shadow-md border border-slate-200 ${className}`}>
      <svg viewBox="0 0 500 500" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="250" cy="250" r="240" fill="#FAF9F6" />
        <path d="M100 240 L260 110 M250 120 L400 220" stroke="#0A2540" strokeWidth="22" strokeLinecap="round" />
        <path d="M120 280 L180 230 L230 270 L280 220 M180 270 L320 180" stroke="#0A2540" strokeWidth="18" strokeLinecap="round" />
        <path d="M210 290 Q 240 270 270 290 T 330 290 M230 310 Q 260 290 290 310 T 350 310" stroke="#F26522" strokeWidth="20" strokeLinecap="round" fill="none" />
        <path d="M190 300 Q 230 180 270 140 C 280 120 250 100 240 120" stroke="#0A2540" strokeWidth="24" strokeLinecap="round" fill="none" />
        <circle cx="260" cy="95" r="22" fill="#F26522" />
        <path d="M140 240 L190 190 M180 160 L140 200" stroke="#F26522" strokeWidth="12" strokeLinecap="round" />
        <text x="250" y="380" textAnchor="middle" fill="#0A2540" fontSize="52" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="2">TEJADOS</text>
        <text x="250" y="440" textAnchor="middle" fill="#F26522" fontSize="64" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="1">360</text>
      </svg>
    </div>
  );
}

function ServiceImageCarousel({ images, title, label }: { images: string[]; title: string; label: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [images]);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const safeImages = images && images.length > 0 ? images.slice(0, 3) : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop'];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-md group bg-slate-900 w-full h-[220px] sm:h-[260px] md:h-[280px]">
      <div className="relative w-full h-full overflow-hidden">
        {safeImages.map((imgUrl, idx) => (
          <img
            key={idx}
            src={imgUrl}
            alt={`${title} - Fotografía ${idx + 1}`}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          />
        ))}
      </div>

      <span className="absolute bottom-3 left-3 z-10 rounded-lg bg-[#0A2540]/90 border border-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-md">
        Tejados 360 · {label} {safeImages.length > 1 ? `(${currentIndex + 1}/${safeImages.length})` : ''}
      </span>

      {safeImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-[#F26522] border border-white/10 shadow-xl"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-[#F26522] border border-white/10 shadow-xl"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 right-3 z-20 flex gap-1.5">
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-5 bg-[#F26522]' : 'w-2 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Ver imagen ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ServiceModal({ service, onClose, onBooking }: { service: any; onClose: () => void; onBooking: (serviceName: string) => void }) {
  if (!service) return null;

  const images = service.images || [service.img];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="flex items-center justify-between p-5 md:px-8 md:pt-6 border-b border-slate-100 bg-white shrink-0">
          <div>
            <span className="inline-block rounded-full bg-[#F26522]/10 border border-[#F26522]/20 px-3 py-0.5 text-[11px] font-black uppercase text-[#F26522] mb-1">
              {service.badge}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0A2540] leading-tight">
              {service.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-[#F26522] hover:text-white shrink-0 ml-3"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-8 space-y-6 flex-1">
          <ServiceImageCarousel images={images} title={service.title} label={service.label} />

          <div className="space-y-5 text-sm leading-relaxed">
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
              <h4 className="font-black text-[#0A2540] text-sm sm:text-base mb-1.5">Descripción Técnica:</h4>
              <p className="text-slate-600 font-medium text-xs sm:text-sm">{service.text}</p>
            </div>

            <div>
              <h4 className="font-black text-[#0A2540] text-sm sm:text-base mb-3">Puntos Clave de la Intervención:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {service.bullets?.map((bullet: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-[#F26522] shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-800 text-xs">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 md:px-8 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition"
          >
            Volver
          </button>
          <button
            onClick={() => {
              onClose();
              onBooking(service.service || service.title);
            }}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#F26522] hover:bg-[#E65100] text-white text-xs font-black uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 hover:scale-102"
          >
            <Calendar className="h-4 w-4" />
            <span>AGENDAR INSPECCIÓN DRON AHORA</span>
          </button>
        </div>

      </div>
    </div>
  );
}

function ProcessInteractiveSection({ 
  onOpenBooking,
  siteImages 
}: { 
  onOpenBooking: (serviceName?: string) => void;
  siteImages: Record<string, string>;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const getImage = (id: string, fallback: string) => {
    return siteImages[id] || siteImages[id.toLowerCase()] || siteImages[id.toUpperCase()] || fallback;
  };

  const processSteps = [
    {
      id: 0,
      number: "01",
      icon: Calendar,
      title: "Reserva de Cita & Evaluación Inicial",
      text: "Coordinamos en línea o telefónicamente la inspección presencial de tu cubierta o fachada en A Coruña y comarca sin comprometer la teja.",
      image: getImage('process_step1', "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop")
    },
    {
      id: 1,
      number: "02",
      icon: Camera,
      title: "Diagnóstico Aéreo con Dron HD",
      text: "Vuelo de reconocimiento técnico con fotografía y vídeo aéreo de alta resolución para detectar goteras, fisuras y humedades en puntos inaccesibles.",
      image: getImage('process_step2', "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop")
    },
    {
      id: 2,
      number: "03",
      icon: FileCheck,
      title: "Informe Técnico & Ejecución Garantizada",
      text: "Entrega de presupuesto cerrado transparente e intervención profesional mediante impermeabilización, malla fibrada o trabajos verticales con garantía por escrito.",
      image: getImage('process_step3', "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop")
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight;
      
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        const scrolledPercent = Math.abs(rect.top) / sectionHeight;
        
        if (scrolledPercent < 0.33) {
          setActiveStep(0);
        } else if (scrolledPercent < 0.66) {
          setActiveStep(1);
        } else {
          setActiveStep(2);
        }
      } else if (rect.top > 0) {
        setActiveStep(0);
      } else if (rect.bottom < window.innerHeight) {
        setActiveStep(2);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={sectionRef} className="relative lg:h-[250vh] bg-[#020617] border-t border-slate-800 py-12 lg:py-0">
      <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 w-full">
          
          <div className="mb-8 lg:mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F26522]/30 bg-[#F26522]/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#F26522] mb-3">
              <Sparkles className="h-3.5 w-3.5" /> METODOLOGÍA DE RESERVA
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight">
              Reserva tu Inspección con Dron en 3 Pasos<span className="text-[#F26522]">.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-400 font-medium">
              Garantizamos un proceso transparente desde el agendamiento previo hasta la entrega formal de tu informe y garantía por escrito.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6">
              <div className="relative h-[260px] sm:h-[360px] lg:h-[440px] w-full rounded-3xl overflow-hidden border border-white/15 bg-slate-900 shadow-[0_25px_50px_rgba(0,0,0,0.8)]">
                {processSteps.map((step, idx) => (
                  <img
                    key={step.id}
                    src={step.image}
                    alt={step.title}
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out ${
                      activeStep === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between text-xs font-bold text-white z-10">
                  <span className="rounded-full bg-[#F26522] px-3.5 py-1 uppercase tracking-wider text-[10px] font-black shadow-lg">
                    Paso {processSteps[activeStep].number} de 03
                  </span>
                  <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-slate-300 text-[10px] sm:text-xs">
                    Tejados 360 · A Coruña
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              {processSteps.map((step, idx) => {
                const IconComponent = step.icon;
                const isActive = activeStep === idx;

                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(idx)}
                    className={`rounded-3xl border p-4 sm:p-6 transition-all duration-500 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-[#F26522] shadow-[0_10px_30px_rgba(242,101,34,0.25)] -translate-y-0.5'
                        : 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-10 sm:h-12 w-10 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/30' : 'bg-white/5 border border-white/10 text-slate-400'
                      }`}>
                        <IconComponent className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#F26522] tracking-wider">PASO {step.number}</span>
                        <h3 className={`text-sm sm:text-lg font-black transition-colors ${
                          isActive ? 'text-white' : 'text-slate-300'
                        }`}>
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 space-y-3 animate-in fade-in duration-300">
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                          {step.text}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBooking('Inspección Técnica con Dron');
                          }}
                          className="inline-flex items-center gap-2 rounded-full bg-[#F26522] hover:bg-[#E65100] px-5 py-2 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-105"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>AGENDAR VISITA TÉCNICA AHORA</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function StickyProjectCard({
  project,
  index,
  onOpenBooking
}: {
  project: {
    title: string;
    location: string;
    date: string;
    beforeImages: string[];
    afterImages: string[];
    desc: string;
  };
  index: number;
  onOpenBooking: () => void;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [imgIdx, setImgIdx] = useState(0);

  const beforeImg = project.beforeImages[imgIdx] || project.beforeImages[0];
  const afterImg = project.afterImages[imgIdx] || project.afterImages[0];

  return (
    <div
      className="sticky top-20 sm:top-28 w-full rounded-3xl bg-slate-900 border border-white/15 p-4 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl mb-8 sm:mb-12 transition-all duration-500"
      style={{ top: `${80 + index * 15}px` }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/*
          AJUSTE RESPONSIVE PROFESIONAL DE PROYECTOS:
          Proporción optimizada para dispositivos móviles (aspect-[4/3]) y escritorio (aspect-[16/10])
          evitando que el texto o los botones se salgan del marco de la pantalla.
        */}
        <div className="lg:col-span-7 relative w-full aspect-[4/3] sm:aspect-[16/10] min-h-[240px] sm:min-h-[340px] lg:min-h-[420px] rounded-2xl overflow-hidden shadow-2xl select-none group border border-white/10 bg-slate-950">
          <img 
            src={afterImg} 
            alt="Resultado Final" 
            className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-500" 
            draggable={false} 
          />
          <img
            src={beforeImg}
            alt="Estado Previo"
            className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 [clip-path:inset(0_var(--clip-pos)_0_0)]"
            style={{ '--clip-pos': `${100 - sliderPos}%` } as React.CSSProperties}
            draggable={false}
          />

          <span className="absolute left-3 top-3 sm:left-4 sm:top-4 z-10 rounded-lg bg-black/80 border border-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase text-slate-200 backdrop-blur-md">
            ANTES
          </span>
          <span className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 rounded-lg bg-[#F26522] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase text-white shadow-lg backdrop-blur-md">
            DESPUÉS
          </span>

          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_15px_rgba(242,101,34,0.9)] z-20" style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-1/2 left-1/2 flex h-8 sm:h-10 w-8 sm:w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#0A2540] text-white shadow-2xl">
              <Sliders className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-[#F26522]" />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            aria-label="Deslizar para comparar antes y después"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 z-30"
            style={{ touchAction: 'pan-y' }}
          />

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`h-2 sm:h-2.5 rounded-full transition-all ${
                  imgIdx === i ? 'w-5 sm:w-6 bg-[#F26522]' : 'w-2 sm:w-2.5 bg-white/40 hover:bg-white'
                }`}
                aria-label={`Ver perspectiva ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3 sm:space-y-4 text-left">
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#F26522]" /> {project.date}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#F26522]" /> {project.location}</span>
          </div>

          <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
            {project.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium line-clamp-3 sm:line-clamp-none">
            {project.desc}
          </p>

          <div className="pt-1 sm:pt-2">
            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-[#F26522] hover:bg-[#E65100] px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-extrabold text-white tracking-wider uppercase transition shadow-lg"
            >
              <span>AGENDAR INSPECCIÓN TÉCNICA</span>
              <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Rope3DAnimationSection({ siteImages }: { siteImages: Record<string, string> }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const getImage = (id: string, fallback: string) => {
    return siteImages[id] || siteImages[id.toLowerCase()] || siteImages[id.toUpperCase()] || fallback;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <section id="trabajos-verticales" className="relative overflow-hidden bg-[#020617] py-16 sm:py-28 text-white border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5 lg:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F26522]/30 bg-[#F26522]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#F26522] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#F26522]" />
                <span>Técnica Certificada de Altura</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Especialistas en <br />
                <span className="text-[#F26522]">Descolgado Vertical</span> en Edificios.
              </h2>

              <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
                Intervenimos fachadas, patios interiores y puntos inaccesibles colgados de cuerdas homologadas. Eliminamos los costes e inconvenientes de instalar andamios pesados en A Coruña.
              </p>

              <ul className="space-y-3 pt-1 text-xs sm:text-sm text-slate-300 font-semibold">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5 text-[#F26522] shrink-0" />
                  <span>Técnicos homologados para trabajos de alto riesgo en suspensión</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5 text-[#F26522] shrink-0" />
                  <span>Instalación de líneas de vida y arneses con doble sistema anticaídas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5 text-[#F26522] shrink-0" />
                  <span>Reparación inmediata de grietas, bajantes, sellado de juntas y pintura</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 flex justify-center items-center">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="relative w-full max-w-md h-[380px] sm:h-[520px] rounded-3xl overflow-hidden border border-white/20 bg-slate-900 shadow-[0_25px_60px_rgba(242,101,34,0.2)] group cursor-pointer"
              >
                <img
                  src={getImage('vertical_work', "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop")}
                  alt="Técnico de Tejados 360 realizando trabajo vertical en fachada"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute top-4 left-4 z-10 rounded-full bg-slate-950/80 border border-[#F26522]/40 px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase text-[#F26522] backdrop-blur-md">
                  TRABAJOS VERTICALES CERTIFICADOS
                </div>

                <div className="absolute bottom-6 left-6 right-6 z-10 space-y-2">
                  <h3 className="text-lg sm:text-xl font-black text-white">Acceso Inmediato sin Andamios</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Sistemas homologados de suspensión para intervenciones limpias, rápidas y seguras en A Coruña.
                  </p>
                  <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-amber-400 bg-black/70 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-md">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Certificación IRATA & ANETVA
                  </div>
                </div>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [modalService, setModalService] = useState<any>(null);
  const [servicesList, setServicesList] = useState<any[]>(DEFAULT_SERVICES);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(DEFAULT_SERVICES[0].id);
  const [activeSection, setActiveSection] = useState('inicio');
  const [isServicesInView, setIsServicesInView] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeServiceCardIndex, setActiveServiceCardIndex] = useState<Record<string, number>>({});
  
  // Estado inicial para mapear todas las imágenes dinámicas
  const [siteImages, setSiteImages] = useState<Record<string, string>>({
    hero_card: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop',
    about_main: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000&auto=format&fit=crop',
    process_step1: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop',
    process_step2: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop',
    process_step3: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
    vertical_work: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop',
    footer_worker: 'https://images.rawpixel.com/image_png_800/png-bg-001/2022/10/rawpixel_item_11003468_png.png',
    proj1_before: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop',
    proj1_after: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
    proj2_before: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    proj2_after: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    proj3_before: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200&auto=format&fit=crop',
    proj3_after: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
  });

  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const chipBarRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const getImage = useCallback((id: string, fallback: string) => {
    return siteImages[id] || siteImages[id.toLowerCase()] || siteImages[id.toUpperCase()] || fallback;
  }, [siteImages]);

  // Memoria reactiva useMemo para que las tarjetas de proyectos se actualicen de inmediato al cambiar siteImages
  const featuredProjectsDynamic = useMemo(() => [
    {
      title: 'Rehabilitación y Restauración de Tejados de Teja',
      location: 'Oleiros, A Coruña',
      date: 'Marzo 15, 2026',
      beforeImages: [
        getImage('proj1_before', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200&auto=format&fit=crop')
      ],
      afterImages: [
        getImage('proj1_after', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop')
      ],
      desc: 'Saneado profundo de tejas con verdín y sustitución de rastreles deteriorados, hidrolavado industrial e impermeabilización completa.',
    },
    {
      title: 'Restauración y Pintado de Fachada Edificio Tradicional',
      location: 'A Coruña Centro',
      date: 'Enero 27, 2026',
      beforeImages: [
        getImage('proj2_before', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop')
      ],
      afterImages: [
        getImage('proj2_after', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop')
      ],
      desc: 'Reparación de mortero desprendido, sellado de grietas e impermeabilización elástica con acabado de pintura hidrófuga.',
    },
    {
      title: 'Encapsulado con Malla Fibrada e Impermeabilización de Terrazas',
      location: 'Arteixo, A Coruña',
      date: 'Noviembre 8, 2025',
      beforeImages: [
        getImage('proj3_before', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200&auto=format&fit=crop')
      ],
      afterImages: [
        getImage('proj3_after', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop')
      ],
      desc: 'Colocación de armadura de fibra de vidrio elástica sobre la cubierta para eliminar filtraciones y garantizar estanqueidad total.',
    },
  ], [siteImages, getImage]);

  useEffect(() => {
    let isMounted = true;
    async function loadDynamicData() {
      try {
        const { data: dbImages, error: imgError } = await supabase
          .from('site_images')
          .select('id, image_url, updated_at');

        if (imgError) {
          console.error('Error al consultar site_images:', imgError);
        }

        if (isMounted && dbImages && dbImages.length > 0) {
          const imgMap: Record<string, string> = {};
          dbImages.forEach((item) => {
            const version = item.updated_at ? new Date(item.updated_at).getTime() : Date.now();
            const cleanUrl = item.image_url.includes('?') 
              ? `${item.image_url}&v=${version}` 
              : `${item.image_url}?v=${version}`;
            
            const idLower = item.id.toLowerCase();
            const idUpper = item.id.toUpperCase();
            
            imgMap[item.id] = cleanUrl;
            imgMap[idLower] = cleanUrl;
            imgMap[idUpper] = cleanUrl;
          });

          setSiteImages((prev) => ({ ...prev, ...imgMap }));
        }

        const { data: settings } = await supabase
          .from('site_settings')
          .select('hero_video_url, hero_image_url')
          .eq('id', 1)
          .maybeSingle();

        if (!isMounted) return;

        if (settings?.hero_video_url && settings.hero_video_url.trim() !== '') {
          setHeroVideoUrl(settings.hero_video_url);
        } else if (settings?.hero_image_url && settings.hero_image_url.trim() !== '') {
          setHeroImageUrl(settings.hero_image_url);
        } else {
          setHeroImageUrl('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop');
        }

        const { data: dbServices } = await supabase
          .from('services')
          .select('id, badge, title, label, text, bullets, service, cta, img, order_index, images')
          .order('order_index', { ascending: true });

        if (isMounted && dbServices && dbServices.length > 0) {
          const formattedServices = dbServices.map((s) => ({
            ...s,
            images: s.images && s.images.length > 0 ? s.images : [s.img],
          }));
          setServicesList(formattedServices);
        }
      } catch (err) {
        console.warn('Usando datos locales por reserva:', err);
      } finally {
        if (isMounted) setIsMediaLoading(false);
      }
    }

    loadDynamicData();
    return () => { isMounted = false; };
  }, []);

  const openBooking = (serviceName?: string) => {
    setSelectedService(serviceName ?? '');
    setMenuOpen(false);
    setIsModalOpen(true);
  };

  const goTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselContainerRef.current) return;
    const scrollAmount = 380;
    carouselContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleServiceCardClick = (s: any) => {
    const images = s.images && s.images.length > 0 ? s.images : [s.img];
    if (images.length > 1) {
      setActiveServiceCardIndex((prev) => {
        const current = prev[s.id] || 0;
        return { ...prev, [s.id]: (current + 1) % images.length };
      });
    } else {
      setModalService(s);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActiveSection(e.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    navLinks.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const servicesSection = document.getElementById('seccion-servicios');
    if (!servicesSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          setIsServicesInView(e.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(servicesSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = (menuOpen || modalService) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, modalService]);

  const digits = siteConfig.phone.replace(/\D/g, '');
  const waNumber = digits.startsWith('34') ? digits : `34${digits}`;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[#F26522] selection:text-white">
      <BookingForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedService={selectedService} />

      <ServiceModal
        service={modalService}
        onClose={() => setModalService(null)}
        onBooking={(srv) => openBooking(srv)}
      />

      {/* TOPBAR INFORMATIVA */}
      <div className="hidden bg-[#0A2540] border-b border-slate-800 px-6 py-2.5 text-xs text-slate-300 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6 font-medium">
            <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#F26522]" />{siteConfig.email}</span>
            <span className="hidden items-center gap-2 md:flex"><MapPin className="h-3.5 w-3.5 text-[#F26522]" />{siteConfig.address}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-2 font-bold text-white transition hover:text-[#F26522]">
              <Phone className="h-3.5 w-3.5 text-[#F26522]" />{siteConfig.phone}
            </a>
            <Link href="/admin" className="flex items-center gap-1.5 font-semibold text-slate-300 transition hover:text-white">
              <Lock className="h-3.5 w-3.5 text-amber-400" /> Admin
            </Link>
          </div>
        </div>
      </div>

      {/* HEADER PRINCIPAL STICKY */}
      <header className="sticky top-0 z-50 h-20 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button onClick={() => goTo('inicio')} className="flex items-center gap-3 text-left group" aria-label="Ir al inicio">
            <Logo360 className="h-12 w-12 transition-transform group-hover:scale-105" />
            <span>
              <span className="block text-xl font-black leading-none tracking-tight text-[#0A2540]">TEJADOS 360</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F26522]">Fachadas & Cubiertas</span>
            </span>
          </button>

          <nav className="hidden h-full items-center gap-8 text-sm font-semibold text-slate-700 lg:flex">
            {navLinks.map((l) => {
              const isActive = activeSection === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => goTo(l.id)}
                  className={`relative flex h-full items-center transition-colors ${
                    isActive ? 'font-bold text-[#F26522]' : 'hover:text-[#F26522]'
                  }`}
                >
                  <span>{l.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-1 bg-[#F26522] rounded-t-full transition-all duration-300" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openBooking()}
              className="flex items-center gap-2 rounded-full bg-[#F26522] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#F26522]/20 transition hover:bg-[#E65100] sm:px-6 sm:text-sm"
            >
              <Calendar className="h-4 w-4" />
              <span>Pedir presupuesto</span>
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-[#0A2540] lg:hidden"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="fixed inset-x-0 top-20 z-50 h-[calc(100dvh-5rem)] overflow-y-auto bg-white px-6 py-6 lg:hidden border-t border-slate-100 shadow-xl">
            <div className="flex flex-col divide-y divide-slate-100">
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => goTo(l.id)} className="py-4 text-left text-lg font-bold text-[#0A2540]">{l.label}</button>
              ))}
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-4 text-left text-lg font-bold text-amber-600">
                <Lock className="h-5 w-5" /> Panel Admin
              </Link>
            </div>
            <a href={`tel:${siteConfig.phone}`} className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#0A2540] py-4 font-bold text-white">
              <Phone className="h-5 w-5 text-[#F26522]" />{siteConfig.phone}
            </a>
          </div>
        )}
      </header>

      {/*
        HERO REDISEÑADO RESPONSIVE:
        En móviles se prioriza la visualización limpia del vídeo con padding pt-28 pb-6,
        transformando la tarjeta del dron en un banner flotante horizontal que no tapa la acción.
      */}
      <section id="inicio" className="relative flex min-h-[85vh] sm:min-h-[92vh] md:min-h-[calc(100vh-5rem)] w-full flex-col justify-end overflow-hidden bg-[#020617] pt-28 pb-6 sm:pb-10">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {isMediaLoading ? (
            <div className="flex h-full w-full items-center justify-center bg-[#020617]">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#F26522] border-t-transparent" />
            </div>
          ) : heroVideoUrl ? (
            <video
              key={heroVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover object-center scale-105"
            >
              <source src={heroVideoUrl} type="video/mp4" />
            </video>
          ) : (
            <img src={heroImageUrl || ''} alt="Rehabilitación de fachadas y cubiertas en A Coruña" className="h-full w-full object-cover object-center" fetchPriority="high" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-[#020617]/20" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full pt-12 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-end">
            
            <div className="lg:col-span-8 space-y-4 sm:space-y-5 text-left">
              <h1 className="text-3xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight sm:leading-none drop-shadow-2xl">
                Estamos construyendo <br className="hidden sm:block" />
                tejados que resisten <br className="hidden sm:block" />
                el paso del tiempo<span className="text-[#F26522]">.</span>
              </h1>

              <div className="pt-1 sm:pt-2">
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="inline-flex items-center gap-2.5 sm:gap-3 rounded-full bg-[#F26522] hover:bg-[#E65100] px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_10px_25px_rgba(242,101,34,0.4)] transition hover:scale-105"
                >
                  <Phone className="h-4 w-4 text-white" />
                  <span>{siteConfig.phone}</span>
                </a>
              </div>
            </div>

            {/* WIDGET DRON ULTRA-COMPACTO Y ELEGANTE */}
            <div className="lg:col-span-4 flex justify-start lg:justify-end mt-2 lg:mt-0">
              <div className="w-full lg:max-w-[260px] rounded-2xl border border-white/15 bg-slate-950/60 p-2.5 sm:p-3 backdrop-blur-md shadow-xl flex lg:flex-col items-center lg:items-stretch gap-3 lg:gap-2.5 text-left">
                <div className="h-16 lg:h-24 w-20 lg:w-full shrink-0 rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={getImage('hero_card', "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop")}
                    alt="Inspección con Dron de Tejados 360"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-white/90 leading-snug line-clamp-2 lg:line-clamp-none">
                    No permita que pequeñas goteras se conviertan en grandes reconstrucciones<span className="text-[#F26522]">.</span>
                  </p>

                  <button
                    onClick={() => openBooking('Inspección Técnica Gratuita')}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-[#F26522] border border-white/20 px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white transition"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Solicitar Inspección Dron</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 bg-slate-950/60 backdrop-blur-md py-3 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs font-bold text-white/90">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-[#F26522]" />
                <span>Con licencia y seguro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-[#F26522]" />
                <span>Presupuestos gratuitos</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Award className="h-4 w-4 text-[#F26522]" />
                <span>Calidad garantizada</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold ml-auto sm:ml-0">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                ))}
              </div>
              <span className="text-white text-[10px] sm:text-xs">4.9 EXCELENTE</span>
            </div>
          </div>
        </div>
      </section>

      {/* FRANJA CONFIANZA */}
      <div className="border-b border-slate-200/80 bg-white shadow-sm relative z-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-6 text-xs sm:text-sm md:grid-cols-4">
          {[
            { i: Award, t: '+10 Años de Experiencia' },
            { i: Camera, t: 'Diagnóstico Aéreo Dron HD' },
            { i: Wrench, t: 'Garantía Técnica por Escrito' },
            { i: Clock, t: 'Atención de Urgencias' },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="flex items-center justify-center gap-3 font-bold text-[#0A2540] sm:justify-start">
              <Icon className="h-5 w-5 shrink-0 text-[#F26522]" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BARRA DE SERVICIOS ADHESIVA */}
      <div
        id="servicios-nav"
        className={`sticky top-20 z-40 h-14 border-b border-slate-200 bg-[#0A2540] shadow-md transition-all duration-300 ${
          isServicesInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="relative mx-auto flex h-full max-w-7xl items-center">
          <span className="hidden shrink-0 items-center gap-2 border-r border-white/10 px-6 text-xs font-black uppercase tracking-wider text-[#F26522] xl:flex">
            <Layers className="h-4 w-4" />Servicios
          </span>
          
          <div ref={chipBarRef} className={`relative flex h-full flex-1 items-center gap-2 overflow-x-auto px-4 sm:px-6 ${noScrollbar}`}>
            {servicesList.map((s) => {
              const isSelected = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  id={`chip-${s.id}`}
                  onClick={() => goTo(s.id)}
                  aria-current={isSelected}
                  className={`relative shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#F26522] text-white shadow-md'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0A2540] to-transparent lg:hidden" />
        </div>
      </div>

      {/* SECCIÓN DE SERVICIOS */}
      <section id="seccion-servicios" className="scroll-mt-20 py-24 bg-[#020617] text-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 relative z-10">
          
          <ScrollReveal className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F26522]/30 bg-[#F26522]/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#F26522] mb-3">
                <Sparkles className="h-3.5 w-3.5" /> SERVICIOS DE CONSTRUCCIÓN, IMPERMEABILIZACIÓN & PINTURA
              </div>
              <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
                Servicios diseñados para perdurar<span className="text-[#F26522]">.</span>
              </h2>
              <p className="mt-3 max-w-xl text-xs sm:text-sm text-slate-400 font-medium">
                Pasa el cursor o toca para rotar las fotografías de cada trabajo, o haz clic para abrir la ficha técnica completa.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => scrollCarousel('left')}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-slate-900 text-white shadow-lg transition hover:bg-[#F26522] hover:border-[#F26522] active:scale-95"
                aria-label="Anterior servicio"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-slate-900 text-white shadow-lg transition hover:bg-[#F26522] hover:border-[#F26522] active:scale-95"
                aria-label="Siguiente servicio"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </ScrollReveal>

          <div
            ref={carouselContainerRef}
            className={`flex gap-6 overflow-x-auto pb-8 pt-2 scroll-smooth ${noScrollbar}`}
          >
            {servicesList.map((s, idx) => {
              const IconComp = (s as any).icon || Building2;
              const cardImages = s.images && s.images.length > 0 ? s.images.slice(0, 3) : [s.img];
              const activeIdx = activeServiceCardIndex[s.id] || 0;
              const currentCardImg = cardImages[activeIdx] || cardImages[0];

              return (
                <div
                  key={s.id}
                  id={s.id}
                  onClick={() => handleServiceCardClick(s)}
                  className="group relative flex-none w-[300px] sm:w-[360px] h-[420px] rounded-3xl border border-white/15 bg-slate-900/90 p-6 flex flex-col justify-between shadow-2xl transition-all duration-500 hover:border-[#F26522] hover:shadow-[0_20px_40px_rgba(242,101,34,0.3)] cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 z-0 opacity-20 sm:opacity-0 transition-opacity duration-700 group-hover:opacity-100 overflow-hidden">
                    <img
                      src={currentCardImg}
                      alt={s.title}
                      className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30" />
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/15 text-white transition-colors group-hover:bg-[#F26522] group-hover:border-[#F26522]">
                      <IconComp className="h-6 w-6" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {cardImages.length > 1 && (
                        <div className="flex gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                          {cardImages.map((_: any, i: number) => (
                            <span
                              key={i}
                              className={`h-1.5 rounded-full transition-all ${
                                i === activeIdx ? 'w-3 bg-[#F26522]' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 group-hover:text-[#F26522]">
                        0{idx + 1}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-3">
                    <span className="inline-block rounded-full bg-[#F26522]/20 border border-[#F26522]/30 px-3 py-1 text-[10px] font-black uppercase text-[#F26522]">
                      {s.badge}
                    </span>

                    <h3 className="text-xl font-black text-white leading-snug group-hover:text-white">
                      {s.label}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-medium transition-colors group-hover:text-slate-200">
                      {s.text}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-xs font-black text-[#F26522] group-hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                      <span>{cardImages.length > 1 ? 'Toca para ver fotos / detalles' : 'Ver ficha técnica completa'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 ml-auto" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECCIÓN PROYECTOS EN PILA CON COMPARADOR ANTES / DESPUÉS DINÁMICO */}
      <section id="proyectos-framer" className="scroll-mt-20 bg-[#020617] py-24 text-white relative">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <ScrollReveal className="mb-12 sm:mb-20 text-center">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#F26522]">PROYECTOS DESTACADOS</span>
            <h2 className="mt-2 text-3xl font-black md:text-5xl text-white">
              Transformaciones Reales Proyectadas<span className="text-[#F26522]">.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-slate-400 font-medium">
              Al deslizar hacia abajo las tarjetas se apilan una sobre otra; al subir, se retiran revelando el proyecto anterior.
            </p>
          </ScrollReveal>

          <div className="relative space-y-8 sm:space-y-12">
            {featuredProjectsDynamic.map((proj: any, idx: number) => (
              <StickyProjectCard
                key={idx}
                project={proj}
                index={idx}
                onOpenBooking={() => openBooking(proj.title)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN DESCOLGADO VERTICAL CON FOTO DINÁMICA vertical_work */}
      <Rope3DAnimationSection siteImages={siteImages} />

      {/* SOBRE NOSOTROS CON FOTO DINÁMICA about_main */}
      <section id="sobre-nosotros" className="py-20 bg-white border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7">
                <span className="text-xs font-black uppercase tracking-widest text-[#F26522]">SOBRE NOSOTROS</span>
                <h2 className="mt-2 text-3xl font-black text-[#0A2540] md:text-5xl leading-tight">
                  Una Empresa de Fachadas & Cubiertas en la que Puedes Confiar<span className="text-[#F26522]">.</span>
                </h2>
                <p className="mt-6 text-slate-600 text-sm md:text-base leading-relaxed">
                  Somos un equipo local especializado en la rehabilitación integral de envolventes edilicias. Nos compromete la mano de obra certificada, el diagnóstico técnico transparente y los resultados concebidos para resistir el clima atlántico.
                </p>

                <div className="mt-10 grid grid-cols-3 gap-6 border-t border-b border-slate-100 py-8">
                  <div>
                    <div className="text-3xl md:text-4xl font-black text-[#0A2540]">10<span className="text-[#F26522]">+</span></div>
                    <div className="text-xs md:text-sm font-semibold text-slate-500 mt-1">Años de Experiencia</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-black text-[#0A2540]">350<span className="text-[#F26522]">+</span></div>
                    <div className="text-xs md:text-sm font-semibold text-slate-500 mt-1">Obras Finalizadas</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-black text-[#0A2540]">4.9<span className="text-[#F26522]">★</span></div>
                    <div className="text-xs md:text-sm font-semibold text-slate-500 mt-1">Calificación Google</div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => openBooking()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0A2540] px-8 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-slate-900"
                  >
                    <span>SOLICITAR EVALUACIÓN TÉCNICA</span>
                    <ArrowRight className="h-4 w-4 text-[#F26522]" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-2xl">
                  <img
                    src={getImage('about_main', "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000&auto=format&fit=crop")}
                    alt="Equipo de Tejados 360 inspeccionando cubierta"
                    className="w-full h-[450px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-2 text-[#F26522] font-extrabold text-xs uppercase tracking-wider mb-1">
                      <ShieldCheck className="h-4 w-4" /> Compromiso 360
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      Inspección previa por dron sin comprometer la integridad de tus tejas.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECCIÓN PROCESO INTERACTIVO DE RESERVA CON IMÁGENES DINÁMICAS (process_step1, 2, 3) */}
      <ProcessInteractiveSection onOpenBooking={(srv) => openBooking(srv)} siteImages={siteImages} />

      {/* TESTIMONIOS */}
      <section id="testimonios" className="scroll-mt-20 bg-[#020617] py-24 text-white overflow-hidden relative border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 mb-16 text-center">
          <ScrollReveal>
            <span className="text-xs font-black uppercase tracking-widest text-[#F26522]">TESTIMONIOS</span>
            <h2 className="mt-2 text-3xl font-black md:text-5xl">Opiniones de Nuestros Clientes<span className="text-[#F26522]">.</span></h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 font-medium">
              Personas reales, casos reales. Cubiertas e intervenciones diseñadas para durar.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-6 max-w-7xl mx-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TESTIMONIALS_DATA.map((t, idx) => (
              <div key={idx} className="flex-none w-[320px] sm:w-[380px] rounded-3xl border border-white/10 bg-slate-900 p-6 flex flex-col justify-between shadow-2xl hover:border-[#F26522]/50 transition-colors">
                <div>
                  <div className="flex gap-1 text-[#F26522] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300 italic mb-6">
                    "{t.quote}"
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <img src={t.avatar} alt={t.author} className="h-10 w-10 rounded-full object-cover border border-white/20" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{t.author}</h4>
                      <span className="text-xs text-slate-400">{t.location}</span>
                    </div>
                  </div>

                  <div className="h-36 overflow-hidden rounded-xl border border-white/10">
                    <img src={t.img} alt={`Proyecto ${t.author}`} className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* RAZONES */}
      <section id="por-que-elegirnos" className="scroll-mt-20 border-t border-slate-200/80 bg-amber-50/40 px-5 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mb-16 text-center">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#F26522]" />
            <h2 className="text-3xl font-black text-[#0A2540] md:text-5xl">¿Por qué Elegir Tejados 360?<span className="text-[#F26522]">.</span></h2>
            <p className="mt-3 text-sm text-slate-600 font-medium">Compromiso técnico y máxima calidad para proteger su patrimonio.</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, t, d }) => (
              <ScrollReveal key={t}>
                <div className="relative rounded-2xl border border-slate-200 bg-white p-8 pt-12 text-center shadow-sm transition hover:shadow-md h-full">
                  <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl bg-[#F26522] text-white shadow-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#0A2540]">{t}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN FINAL CON IMAGEN DE FONDO CONFIGURADA DESDE EL PANEL ADMIN AL 100% DE EXTREMO A EXTREMO */}
      <section id="contacto-inspeccion" className="relative w-full min-h-[580px] bg-[#020617] text-white overflow-hidden scroll-mt-20 border-t border-slate-900 flex items-center">
        {/* Imagen de fondo configurada desde el Admin (footer_worker) que cubre el 100% de pantalla */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={getImage('footer_worker', "https://images.rawpixel.com/image_png_800/png-bg-001/2022/10/rawpixel_item_11003468_png.png")} 
            alt="Fondo Presupuesto Tejados 360" 
            className="h-full w-full object-cover object-right md:object-center brightness-[0.9] scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/70 via-[#020617]/30 to-transparent z-0" />
        </div>

        <ScrollReveal className="w-full">
          <div className="relative z-10 mx-auto max-w-7xl min-h-[520px] lg:min-h-[580px] grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 relative z-10 flex flex-col justify-center">
              {/* Recorte diagonal naranja optimizado (lg:col-span-6) para dar más espacio a la foto */}
              <div className="absolute inset-0 bg-[#F26522] z-10 lg:[clip-path:polygon(0_0,85%_0,70%_100%,0%_100%)]" />
              <div className="absolute inset-0 bg-[#F26522]/50 backdrop-blur-xs z-0 hidden lg:block lg:[clip-path:polygon(0_0,95%_0,80%_100%,0%_100%)]" />

              <div className="relative z-20 max-w-md px-6 py-16 md:px-12 lg:py-20 space-y-6">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/90 bg-black/20 px-3.5 py-1.5 rounded-sm inline-block">
                  PRESUPUESTO SIN COMPROMISO
                </span>
                
                <h2 className="text-4xl sm:text-6xl font-black leading-[1.02] text-white tracking-tight">
                  Construyamos un <br />
                  Tejado Más Resiliente<span className="text-black">.</span>
                </h2>

                <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium">
                  Solicita una evaluación técnica gratuita y descubre cómo protegemos tu hogar en A Coruña sin imprevistos.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => openBooking('Inspección Técnica Gratuita')}
                    className="inline-flex items-center gap-3 bg-[#0A2540] hover:bg-black text-white font-black text-xs uppercase tracking-wider pl-2 pr-6 py-2.5 rounded-sm shadow-2xl transition-transform hover:scale-105"
                  >
                    <div className="bg-white text-[#0A2540] p-2 rounded-xs flex items-center justify-center">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <span>SOLICITAR INSPECCIÓN GRATUITA</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative z-20 lg:col-span-6 h-full min-h-[420px] lg:min-h-[580px] flex items-start justify-end pointer-events-none px-4 sm:px-0">
              <div className="absolute top-10 right-4 lg:right-8 z-30 text-right select-none">
                <p className="font-serif italic text-2xl md:text-3xl text-[#F26522] font-black leading-tight drop-shadow-md rotate-[-2deg]">
                  Hogares Más Fuertes,
                </p>
                <p className="font-serif italic text-2xl md:text-3xl text-white font-black leading-tight drop-shadow-md rotate-[-1deg]">
                  Familias Más Tranquilas
                </p>
                <div className="h-1 w-28 bg-[#F26522] rounded-full ml-auto mt-1" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FOOTER CORPORATIVO */}
      <footer className="bg-black text-white pt-20 pb-12 border-t border-slate-900 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-slate-800/80 relative z-10">
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 100 50" className="h-8 w-auto text-[#F26522] filter drop-shadow-[0_0_10px_rgba(242,101,34,0.8)]" fill="currentColor">
                  <path d="M10 40 L50 10 L90 40 L80 40 L50 17 L20 40 Z" />
                  <rect x="68" y="14" width="7" height="15" />
                </svg>
                <span className="text-2xl font-black tracking-tight text-white">TEJADOS 360</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-medium">
                Ingeniería, impermeabilización certificada con malla fibrada y rehabilitación técnica de envolventes edilicias en A Coruña y comarca.
              </p>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Servicios Principal</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                {servicesList.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <button onClick={() => goTo(s.id)} className="hover:text-[#F26522] transition">{s.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Empresa</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><button onClick={() => goTo('sobre-nosotros')} className="hover:text-white transition">Sobre Nosotros</button></li>
                <li><button onClick={() => goTo('seccion-servicios')} className="hover:text-white transition">Proyectos</button></li>
                <li><button onClick={() => goTo('testimonios')} className="hover:text-white transition">Reseñas</button></li>
                <li><button onClick={() => goTo('contacto-inspeccion')} className="hover:text-white transition">Contacto</button></li>
              </ul>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <div className="space-y-2.5 text-xs text-slate-300 font-medium">
                <p className="flex items-center gap-2.5 font-bold text-white"><Phone className="h-4 w-4 text-[#F26522]" /> {siteConfig.phone}</p>
                <p className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-[#F26522]" /> {siteConfig.email}</p>
                <p className="flex items-center gap-2.5 text-slate-400"><MapPin className="h-4 w-4 text-[#F26522]" /> {siteConfig.address}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-12 pt-8 text-center overflow-hidden flex flex-col items-center justify-center">
            
            <div className="absolute inset-0 flex items-center justify-end pointer-events-none opacity-25 translate-y-6">
              <svg viewBox="0 0 600 300" className="h-[280px] w-auto text-[#F26522] filter drop-shadow-[0_0_35px_rgba(242,101,34,0.9)]" fill="currentColor">
                <path d="M50 250 L300 50 L550 250 L480 250 L300 95 L120 250 Z" />
                <rect x="420" y="80" width="40" height="90" />
              </svg>
            </div>

            <h2 className="relative z-10 text-6xl sm:text-8xl md:text-[130px] font-black text-slate-900/90 tracking-widest select-none leading-none">
              TEJADOS 360
            </h2>

            <div className="relative z-10 mt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-4 w-full border-t border-slate-900 pt-6">
              <p>© {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:underline">Aviso legal</a>
                <span>|</span>
                <a href="#" className="hover:underline">Política de privacidad</a>
              </div>
            </div>

          </div>

        </div>
      </footer>

      {/* WHATSAPP FLOTANTE */}
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full bg-emerald-500 p-4 text-white shadow-2xl transition hover:scale-110 hover:bg-emerald-600"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </main>
  );
}