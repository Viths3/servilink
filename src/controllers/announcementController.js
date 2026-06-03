const Announcement = require('../models/Announcement');

// ── RF-08 / RF-20: GET /api/announcements (público) ──────────────
// Soporta filtros: categoria, search (título/descripción). Paginado.
const listarAnuncios = async (req, res) => {
  try {
    const { categoria, search, page = 1, limit = 10 } = req.query;

    const filtro = { estado: 'activo' };

    if (categoria) {
      const categoriasValidas = ['electricidad', 'plomeria', 'medicina', 'carpinteria', 'asesoria', 'otro'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({ error: 'Categoría inválida' });
      }
      filtro.categoria = categoria;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filtro.$or = [{ titulo: regex }, { descripcion: regex }];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [anuncios, total] = await Promise.all([
      Announcement.find(filtro)
        .select('-reportes')
        .populate('proveedor', 'nombre fotoPerfil')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Announcement.countDocuments(filtro),
    ]);

    res.json({
      data: anuncios,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('listarAnuncios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-08: GET /api/announcements/:id (público) ───────────────────
const obtenerAnuncio = async (req, res) => {
  try {
    const anuncio = await Announcement.findOne({
      _id: req.params.id,
      estado: 'activo',
    })
      .select('-reportes')
      .populate('proveedor', 'nombre fotoPerfil providerData.categoria providerData.descripcion');

    if (!anuncio) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    res.json({ data: anuncio });
  } catch (err) {
    console.error('obtenerAnuncio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-09: POST /api/announcements (auth, proveedor verificado) ───
const crearAnuncio = async (req, res) => {
  try {
    // Solo proveedores con verificationStatus='aprobado' pueden publicar
    if (!req.usuario.roles.includes('proveedor') || !req.usuario.providerData) {
      return res.status(403).json({ error: 'Solo proveedores pueden publicar anuncios' });
    }
    if (req.usuario.providerData.verificationStatus !== 'aprobado') {
      return res.status(403).json({ error: 'Tu cuenta debe estar verificada para publicar anuncios' });
    }

    const { titulo, descripcion, categoria, precioRef } = req.body;

    if (!titulo || !descripcion || !categoria) {
      return res.status(400).json({ error: 'Título, descripción y categoría son requeridos' });
    }

    const anuncio = new Announcement({
      proveedor: req.usuario._id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      precioRef: precioRef != null ? Number(precioRef) : null,
    });

    await anuncio.save();

    res.status(201).json({ mensaje: 'Anuncio publicado exitosamente', data: anuncio });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('crearAnuncio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-10: PATCH /api/announcements/:id (auth, dueño) ────────────
const editarAnuncio = async (req, res) => {
  try {
    const anuncio = await Announcement.findById(req.params.id);

    if (!anuncio) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    if (anuncio.proveedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar este anuncio' });
    }

    if (anuncio.estado === 'suspendido') {
      return res.status(403).json({ error: 'No puedes editar un anuncio suspendido' });
    }

    const { titulo, descripcion, categoria, precioRef } = req.body;
    const cambios = {};
    if (titulo) cambios.titulo = titulo.trim();
    if (descripcion) cambios.descripcion = descripcion.trim();
    if (categoria) cambios.categoria = categoria;
    if (precioRef != null) cambios.precioRef = Number(precioRef);

    const actualizado = await Announcement.findByIdAndUpdate(
      req.params.id,
      cambios,
      { new: true, runValidators: true }
    ).select('-reportes');

    res.json({ mensaje: 'Anuncio actualizado', data: actualizado });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('editarAnuncio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-11: DELETE /api/announcements/:id (auth, dueño) ───────────
// Soft-delete: cambia estado a 'inactivo'.
const desactivarAnuncio = async (req, res) => {
  try {
    const anuncio = await Announcement.findById(req.params.id);

    if (!anuncio) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    if (anuncio.proveedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este anuncio' });
    }

    if (anuncio.estado === 'inactivo') {
      return res.status(409).json({ error: 'El anuncio ya está inactivo' });
    }

    anuncio.estado = 'inactivo';
    await anuncio.save();

    res.json({ mensaje: 'Anuncio desactivado correctamente' });
  } catch (err) {
    console.error('desactivarAnuncio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-21: POST /api/announcements/:id/report (auth) ─────────────
// Reglas: el dueño no puede reportar su propio anuncio.
//         un usuario no puede reportar el mismo anuncio más de una vez.
const reportarAnuncio = async (req, res) => {
  try {
    const anuncio = await Announcement.findOne({
      _id: req.params.id,
      estado: 'activo',
    });

    if (!anuncio) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    // El dueño no puede reportar su propio anuncio
    if (anuncio.proveedor.toString() === req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No puedes reportar tu propio anuncio' });
    }

    // No puede reportar dos veces el mismo anuncio
    const yaReporto = anuncio.reportes.some(
      (r) => r.usuario.toString() === req.usuario._id.toString()
    );
    if (yaReporto) {
      return res.status(409).json({ error: 'Ya reportaste este anuncio anteriormente' });
    }

    const { motivo, descripcion } = req.body;

    if (!motivo) {
      return res.status(400).json({ error: 'El motivo del reporte es requerido' });
    }

    anuncio.reportes.push({
      usuario: req.usuario._id,
      motivo,
      descripcion: descripcion?.trim() || '',
    });

    await anuncio.save();

    res.status(201).json({ mensaje: 'Reporte enviado. Nuestro equipo lo revisará.' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('reportarAnuncio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  listarAnuncios,
  obtenerAnuncio,
  crearAnuncio,
  editarAnuncio,
  desactivarAnuncio,
  reportarAnuncio,
};
