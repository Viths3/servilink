const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG o PDF.'), false);
  }
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

module.exports = { uploadDocs, uploadFoto, uploadImagenes, handleUploadError };
