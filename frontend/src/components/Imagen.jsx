import { useEffect, useRef, useState } from 'react';

function ImagenConRespaldo({ src, alt = '', tipo = 'archivo', categoria = 'otro', className = '', onError, onLoad, ...props }) {
  const [fallo, setFallo] = useState(!src);
  const cargada = useRef(false);
  const esServicio = tipo === 'servicio';
  const esReferencia = esServicio && (fallo || src?.startsWith('/referencias/'));
  const categoriaSegura = ['electricidad', 'plomeria', 'medicina', 'carpinteria', 'asesoria', 'jardineria', 'limpieza', 'pintura', 'mecanica', 'diseno', 'fotografia', 'otro'].includes(categoria) ? categoria : 'otro';
  const respaldo = esServicio ? `/referencias/${categoriaSegura}.jpg` : `/referencias/${tipo === 'avatar' ? 'avatar' : 'no-disponible'}.svg`;

  useEffect(() => {
    if (!src) return;
    // También cubre despliegues antiguos que dejan /uploads sin respuesta.
    const timer = setTimeout(() => {
      if (!cargada.current) setFallo(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [src]);

  const imagen = (
    <img
      {...props}
      src={fallo ? respaldo : src}
      alt={esReferencia ? `${alt} · Imagen de referencia` : fallo ? (tipo === 'avatar' ? `Avatar de ${alt}` : 'Imagen no disponible') : alt}
      className={esReferencia ? 'w-full h-full object-cover' : className}
      onLoad={(event) => { cargada.current = true; onLoad?.(event); }}
      onError={(event) => {
        if (!fallo) { setFallo(true); onError?.(event); }
      }}
    />
  );

  if (!esReferencia) return imagen;
  return (
    <span className={`relative block ${className}`}>
      {imagen}
      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white">Imagen de referencia</span>
    </span>
  );
}

export default function Imagen(props) {
  // Reiniciar al cambiar de foto, sin conservar errores de la anterior.
  return <ImagenConRespaldo key={`${props.src}|${props.tipo}|${props.categoria}`} {...props} />;
}
