const multer = require('multer');
const path = require('path');
const fs = require('fs');
// file-type es ESM-only (no se puede require() directo desde CommonJS sin
// arriesgar romper el arranque en versiones de Node <22) — se importa de
// forma dinámica y perezosa, compatible con cualquier versión de Node.
let fileTypeFromFilePromise;
const getFileTypeFromFile = () => {
  if (!fileTypeFromFilePromise) {
    fileTypeFromFilePromise = import('file-type').then((mod) => mod.fileTypeFromFile);
  }
  return fileTypeFromFilePromise;
};

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Configuración de almacenamiento ──────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// ── Filtro de tipos de archivo ────────────────────────────────────
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const tiposImagenPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const tiposDocumentoPermitidos = ['application/pdf'];
  const todosPermitidos = [...tiposImagenPermitidos, ...tiposDocumentoPermitidos];

  // Validar tipo MIME
  if (!todosPermitidos.includes(file.mimetype)) {
    return cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG, WebP o PDF.'), false);
  }

  // Validar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  if (!extensionesPermitidas.includes(ext)) {
    return cb(new Error('Extensión de archivo no permitida.'), false);
  }

  // Validar que el nombre no contenga caracteres peligrosos
  if (/[<>:"|?*\\]|\.{2,}/.test(file.originalname)) {
    return cb(new Error('Nombre de archivo contiene caracteres no permitidos.'), false);
  }

  // Validar que no sea un ejecutable disfrazado
  const nombreBajo = file.originalname.toLowerCase();
  const archivosProhibidos = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.html', '.htm', '.php', '.asp', '.aspx', '.jsp', '.cfm', '.cgi'];
  for (const prohibido of archivosProhibidos) {
    if (nombreBajo.endsWith(prohibido)) {
      return cb(new Error('Tipo de archivo no permitido.'), false);
    }
  }

  cb(null, true);
};

// ── Instancia de Multer ───────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB máximo por archivo
  },
});

// ── Middlewares exportados ────────────────────────────────────────

// Para registro de proveedor: foto de perfil + documentos de cédula
const uploadDocs = upload.fields([
  { name: 'fotoPerfil', maxCount: 1 },
  { name: 'documentos', maxCount: 2 },
]);

// Para foto de perfil (1 archivo)
const uploadFoto = upload.single('fotoPerfil');

// Para imagen de anuncio (hasta 5 archivos)
const uploadImagenes = upload.array('imagenes', 5);

// Para evidencia de servicio completado (hasta 5 archivos)
const uploadEvidencia = upload.array('evidencia', 5);

// ── Verificación del contenido real del archivo (magic bytes) ────
// El fileFilter de arriba solo valida el MIME/extensión que el cliente
// DECLARA, que puede falsificarse. Esta verificación se ejecuta después de
// que multer ya guardó el archivo, e inspecciona sus bytes reales — si no
// coincide con un tipo permitido, se borra y se rechaza la petición.
const listaArchivos = (req) => {
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === 'object') return Object.values(req.files).flat();
  if (req.file) return [req.file];
  return [];
};

const verificarContenidoReal = (tiposPermitidos) => async (req, res, next) => {
  const archivos = listaArchivos(req);
  if (archivos.length === 0) return next();

  try {
    const fileTypeFromFile = await getFileTypeFromFile();
    for (const archivo of archivos) {
      const tipoReal = await fileTypeFromFile(archivo.path);
      if (!tipoReal || !tiposPermitidos.includes(tipoReal.mime)) {
        archivos.forEach((a) => fs.unlink(a.path, () => {}));
        return res.status(400).json({ error: 'El contenido de uno de los archivos no coincide con un tipo de archivo permitido.' });
      }
    }
    next();
  } catch (err) {
    console.error('verificarContenidoReal:', err);
    archivos.forEach((a) => fs.unlink(a.path, () => {}));
    res.status(500).json({ error: 'Error al validar el archivo subido.' });
  }
};

// Para fotos de perfil, imágenes de anuncio y evidencia (solo imágenes)
const verificarImagenes = verificarContenidoReal(['image/jpeg', 'image/png', 'image/webp']);
// Para documentos de verificación (imagen o PDF)
const verificarDocumentos = verificarContenidoReal(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

// Manejo de errores de Multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el límite de 5 MB' });
    }
    return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  uploadDocs,
  uploadFoto,
  uploadImagenes,
  uploadEvidencia,
  handleUploadError,
  verificarImagenes,
  verificarDocumentos,
};
