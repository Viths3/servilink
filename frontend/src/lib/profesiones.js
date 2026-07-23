// Lista extendida de oficios y profesiones para el autocompletado del
// buscador y del selector de categoría al registrarse como proveedor.
// Cada profesión apunta a uno de los 12 valores de categoría que acepta
// el backend (ver CATEGORIAS en ./categorias.js) — así el usuario puede
// escribir el nombre específico de su oficio ("Plomero", "Electricista
// residencial", etc.) y el sistema lo resuelve a la categoría correcta,
// sin necesidad de que sepa cómo se llama la categoría general.

export const PROFESIONES = [
  // Electricidad
  { nombre: 'Electricista', categoria: 'electricidad' },
  { nombre: 'Electricista residencial', categoria: 'electricidad' },
  { nombre: 'Electricista industrial', categoria: 'electricidad' },
  { nombre: 'Técnico en refrigeración', categoria: 'electricidad' },
  { nombre: 'Técnico en aire acondicionado', categoria: 'electricidad' },
  { nombre: 'Instalador de paneles solares', categoria: 'electricidad' },
  { nombre: 'Instalador de cámaras de seguridad', categoria: 'electricidad' },
  { nombre: 'Instalador de alarmas', categoria: 'electricidad' },
  { nombre: 'Técnico electrónico', categoria: 'electricidad' },
  { nombre: 'Técnico en electrodomésticos', categoria: 'electricidad' },

  // Plomería
  { nombre: 'Plomero', categoria: 'plomeria' },
  { nombre: 'Gasfitero', categoria: 'plomeria' },
  { nombre: 'Fontanero', categoria: 'plomeria' },
  { nombre: 'Técnico en fugas de agua', categoria: 'plomeria' },
  { nombre: 'Destapador de tuberías', categoria: 'plomeria' },
  { nombre: 'Instalador de calefones', categoria: 'plomeria' },
  { nombre: 'Gasista', categoria: 'plomeria' },

  // Medicina / salud
  { nombre: 'Médico general', categoria: 'medicina' },
  { nombre: 'Médico familiar', categoria: 'medicina' },
  { nombre: 'Pediatra', categoria: 'medicina' },
  { nombre: 'Ginecólogo', categoria: 'medicina' },
  { nombre: 'Dermatólogo', categoria: 'medicina' },
  { nombre: 'Cardiólogo', categoria: 'medicina' },
  { nombre: 'Odontólogo', categoria: 'medicina' },
  { nombre: 'Dentista', categoria: 'medicina' },
  { nombre: 'Enfermero', categoria: 'medicina' },
  { nombre: 'Enfermera a domicilio', categoria: 'medicina' },
  { nombre: 'Fisioterapeuta', categoria: 'medicina' },
  { nombre: 'Nutricionista', categoria: 'medicina' },
  { nombre: 'Psicólogo', categoria: 'medicina' },
  { nombre: 'Psiquiatra', categoria: 'medicina' },
  { nombre: 'Terapista ocupacional', categoria: 'medicina' },
  { nombre: 'Cuidador de adultos mayores', categoria: 'medicina' },
  { nombre: 'Niñera', categoria: 'medicina' },
  { nombre: 'Partera', categoria: 'medicina' },
  { nombre: 'Masajista terapéutico', categoria: 'medicina' },
  { nombre: 'Podólogo', categoria: 'medicina' },
  { nombre: 'Oftalmólogo', categoria: 'medicina' },
  { nombre: 'Optometrista', categoria: 'medicina' },
  { nombre: 'Veterinario', categoria: 'medicina' },

  // Carpintería
  { nombre: 'Carpintero', categoria: 'carpinteria' },
  { nombre: 'Ebanista', categoria: 'carpinteria' },
  { nombre: 'Fabricante de muebles', categoria: 'carpinteria' },
  { nombre: 'Instalador de closets', categoria: 'carpinteria' },
  { nombre: 'Tapicero', categoria: 'carpinteria' },
  { nombre: 'Restaurador de muebles', categoria: 'carpinteria' },
  { nombre: 'Instalador de pisos de madera', categoria: 'carpinteria' },

  // Asesoría
  { nombre: 'Abogado', categoria: 'asesoria' },
  { nombre: 'Contador', categoria: 'asesoria' },
  { nombre: 'Contador público', categoria: 'asesoria' },
  { nombre: 'Asesor financiero', categoria: 'asesoria' },
  { nombre: 'Asesor tributario', categoria: 'asesoria' },
  { nombre: 'Consultor de negocios', categoria: 'asesoria' },
  { nombre: 'Notario', categoria: 'asesoria' },
  { nombre: 'Traductor', categoria: 'asesoria' },
  { nombre: 'Profesor particular', categoria: 'asesoria' },
  { nombre: 'Tutor académico', categoria: 'asesoria' },
  { nombre: 'Profesor de inglés', categoria: 'asesoria' },
  { nombre: 'Profesor de matemáticas', categoria: 'asesoria' },
  { nombre: 'Coach de vida', categoria: 'asesoria' },
  { nombre: 'Asesor de marketing', categoria: 'asesoria' },
  { nombre: 'Asesor inmobiliario', categoria: 'asesoria' },
  { nombre: 'Corredor de bienes raíces', categoria: 'asesoria' },
  { nombre: 'Ingeniero civil', categoria: 'asesoria' },
  { nombre: 'Arquitecto', categoria: 'asesoria' },
  { nombre: 'Topógrafo', categoria: 'asesoria' },

  // Jardinería
  { nombre: 'Jardinero', categoria: 'jardineria' },
  { nombre: 'Paisajista', categoria: 'jardineria' },
  { nombre: 'Podador de árboles', categoria: 'jardineria' },
  { nombre: 'Diseñador de jardines', categoria: 'jardineria' },
  { nombre: 'Fumigador', categoria: 'jardineria' },
  { nombre: 'Control de plagas', categoria: 'jardineria' },

  // Limpieza
  { nombre: 'Personal de limpieza', categoria: 'limpieza' },
  { nombre: 'Empleada doméstica', categoria: 'limpieza' },
  { nombre: 'Limpieza de hogares', categoria: 'limpieza' },
  { nombre: 'Limpieza de oficinas', categoria: 'limpieza' },
  { nombre: 'Limpieza de tapicería', categoria: 'limpieza' },
  { nombre: 'Limpieza de alfombras', categoria: 'limpieza' },
  { nombre: 'Limpieza post construcción', categoria: 'limpieza' },
  { nombre: 'Lavado de muebles', categoria: 'limpieza' },

  // Pintura
  { nombre: 'Pintor', categoria: 'pintura' },
  { nombre: 'Pintor de interiores', categoria: 'pintura' },
  { nombre: 'Pintor de exteriores', categoria: 'pintura' },
  { nombre: 'Decorador de interiores', categoria: 'pintura' },
  { nombre: 'Empapelador', categoria: 'pintura' },
  { nombre: 'Muralista', categoria: 'pintura' },

  // Mecánica
  { nombre: 'Mecánico automotriz', categoria: 'mecanica' },
  { nombre: 'Mecánico de motos', categoria: 'mecanica' },
  { nombre: 'Técnico en frenos', categoria: 'mecanica' },
  { nombre: 'Electricista automotriz', categoria: 'mecanica' },
  { nombre: 'Enderezador y pintor automotriz', categoria: 'mecanica' },
  { nombre: 'Vulcanizador', categoria: 'mecanica' },
  { nombre: 'Mecánico diesel', categoria: 'mecanica' },
  { nombre: 'Técnico en inyección electrónica', categoria: 'mecanica' },

  // Diseño
  { nombre: 'Diseñador gráfico', categoria: 'diseno' },
  { nombre: 'Diseñador web', categoria: 'diseno' },
  { nombre: 'Diseñador de interiores', categoria: 'diseno' },
  { nombre: 'Diseñador de modas', categoria: 'diseno' },
  { nombre: 'Ilustrador', categoria: 'diseno' },
  { nombre: 'Editor de video', categoria: 'diseno' },
  { nombre: 'Desarrollador web', categoria: 'diseno' },
  { nombre: 'Programador', categoria: 'diseno' },
  { nombre: 'Diseñador UX/UI', categoria: 'diseno' },
  { nombre: 'Community manager', categoria: 'diseno' },

  // Fotografía
  { nombre: 'Fotógrafo', categoria: 'fotografia' },
  { nombre: 'Fotógrafo de bodas', categoria: 'fotografia' },
  { nombre: 'Fotógrafo de eventos', categoria: 'fotografia' },
  { nombre: 'Camarógrafo', categoria: 'fotografia' },
  { nombre: 'Editor de fotos', categoria: 'fotografia' },
  { nombre: 'Fotografía aérea con dron', categoria: 'fotografia' },

  // Otro
  { nombre: 'Chef a domicilio', categoria: 'otro' },
  { nombre: 'Cocinero', categoria: 'otro' },
  { nombre: 'Catering', categoria: 'otro' },
  { nombre: 'Mesero para eventos', categoria: 'otro' },
  { nombre: 'Decorador de eventos', categoria: 'otro' },
  { nombre: 'Organizador de eventos', categoria: 'otro' },
  { nombre: 'DJ', categoria: 'otro' },
  { nombre: 'Animador de fiestas', categoria: 'otro' },
  { nombre: 'Mudanzas', categoria: 'otro' },
  { nombre: 'Fletes', categoria: 'otro' },
  { nombre: 'Transportista', categoria: 'otro' },
  { nombre: 'Chofer privado', categoria: 'otro' },
  { nombre: 'Cerrajero', categoria: 'otro' },
  { nombre: 'Guardia de seguridad', categoria: 'otro' },
  { nombre: 'Entrenador personal', categoria: 'otro' },
  { nombre: 'Instructor de yoga', categoria: 'otro' },
  { nombre: 'Estilista', categoria: 'otro' },
  { nombre: 'Peluquero', categoria: 'otro' },
  { nombre: 'Barbero', categoria: 'otro' },
  { nombre: 'Manicurista', categoria: 'otro' },
  { nombre: 'Maquillista', categoria: 'otro' },
  { nombre: 'Sastre', categoria: 'otro' },
  { nombre: 'Modista', categoria: 'otro' },
  { nombre: 'Zapatero remendón', categoria: 'otro' },
  { nombre: 'Vidriero', categoria: 'otro' },
  { nombre: 'Soldador', categoria: 'otro' },
  { nombre: 'Herrero', categoria: 'otro' },
  { nombre: 'Techador', categoria: 'otro' },
  { nombre: 'Albañil', categoria: 'otro' },
  { nombre: 'Maestro de obra', categoria: 'otro' },
  { nombre: 'Reparación de celulares', categoria: 'otro' },
  { nombre: 'Técnico en computadoras', categoria: 'otro' },
  { nombre: 'Instalador de internet y redes', categoria: 'otro' },
];

// Quita tildes/diacríticos y pasa a minúsculas para comparar sin depender
// de que el usuario escriba los acentos correctos.
export const normalizar = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

// Sugerencias para el buscador: coincidencia de substring en cualquier
// parte del nombre de la profesión (no solo al inicio), para que "domicilio"
// también encuentre "Enfermera a domicilio".
export const sugerirProfesiones = (termino, limite = 8) => {
  const t = normalizar(termino);
  if (!t) return [];
  return PROFESIONES.filter((p) => normalizar(p.nombre).includes(t)).slice(0, limite);
};

// Coincidencia exacta (normalizada) — usada cuando el usuario escribe el
// nombre completo de una profesión y busca directamente sin pasar por el
// dropdown de sugerencias.
export const buscarProfesionExacta = (termino) => {
  const t = normalizar(termino);
  return PROFESIONES.find((p) => normalizar(p.nombre) === t) ?? null;
};
