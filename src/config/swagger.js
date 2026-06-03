const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ServiLink API',
      version: '1.0.0',
      description:
        'API REST para ServiLink — plataforma web de oferta y contratación de servicios independientes en Cuenca, Ecuador. ' +
        'Trabajo de Titulación UCACUE, Ingeniería de Software 2026.',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Servidor de desarrollo' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ── Usuario ─────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id:        { type: 'string', example: '664a1f2e3b4c5d6e7f8a9b0c' },
            nombre:     { type: 'string', example: 'María López' },
            email:      { type: 'string', format: 'email', example: 'maria@example.com' },
            telefono:   { type: 'string', example: '+593991234567' },
            roles:      { type: 'array', items: { type: 'string', enum: ['cliente', 'proveedor', 'admin'] }, example: ['cliente'] },
            fotoPerfil: { type: 'string', example: '/uploads/foto.jpg' },
            activo:     { type: 'boolean', example: true },
            providerData: { $ref: '#/components/schemas/ProviderData' },
            createdAt:  { type: 'string', format: 'date-time' },
            updatedAt:  { type: 'string', format: 'date-time' },
          },
        },
        ProviderData: {
          type: 'object',
          properties: {
            cedula:             { type: 'string', example: '0102030405' },
            categoria:          { type: 'string', enum: ['electricidad','plomeria','medicina','carpinteria','asesoria','otro'] },
            descripcion:        { type: 'string', example: 'Electricista con 5 años de experiencia.' },
            verificationStatus: { type: 'string', enum: ['none','pendiente','aprobado','rechazado'], example: 'aprobado' },
            documentos:         { type: 'array', items: { type: 'string' }, example: ['/uploads/cedula-anverso.jpg'] },
            comentarioAdmin:    { type: 'string', example: '' },
            fechaVerificacion:  { type: 'string', format: 'date-time' },
          },
        },
        // ── Anuncio ─────────────────────────────────────────────────
        Announcement: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '664b2a3c4d5e6f7a8b9c0d1e' },
            proveedor:   { $ref: '#/components/schemas/User' },
            titulo:      { type: 'string', example: 'Instalación eléctrica residencial' },
            descripcion: { type: 'string', example: 'Realizo instalaciones con garantía de 1 año.' },
            categoria:   { type: 'string', enum: ['electricidad','plomeria','medicina','carpinteria','asesoria','otro'] },
            precioRef:   { type: 'number', example: 80, nullable: true },
            estado:      { type: 'string', enum: ['activo','inactivo','suspendido'], example: 'activo' },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Solicitud de servicio ────────────────────────────────────
        ServiceRequest: {
          type: 'object',
          properties: {
            _id:             { type: 'string', example: '664c3b4d5e6f7a8b9c0d1e2f' },
            cliente:         { $ref: '#/components/schemas/User' },
            proveedor:       { $ref: '#/components/schemas/User' },
            anuncio:         { type: 'string', nullable: true, example: '664b2a3c4d5e6f7a8b9c0d1e' },
            descripcion:     { type: 'string', example: 'Revisar el tablero eléctrico del departamento.' },
            fechaPropuesta:  { type: 'string', format: 'date-time', example: '2026-07-15T10:00:00.000Z' },
            fechaConfirmada: { type: 'string', format: 'date-time', nullable: true },
            estado:          { type: 'string', enum: ['pendiente','aceptada','rechazada','reagendada','completada','cancelada'], example: 'pendiente' },
            motivoRechazo:   { type: 'string', example: '' },
            createdAt:       { type: 'string', format: 'date-time' },
          },
        },
        // ── Solicitud de upgrade ─────────────────────────────────────
        UpgradeRequest: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '664d4c5e6f7a8b9c0d1e2f3a' },
            usuario:     { $ref: '#/components/schemas/User' },
            cedula:      { type: 'string', example: '0102030405' },
            categoria:   { type: 'string', enum: ['electricidad','plomeria','medicina','carpinteria','asesoria','otro'] },
            descripcion: { type: 'string', example: 'Plomero con 8 años de experiencia.' },
            documentos:  { type: 'array', items: { type: 'string' } },
            estado:      { type: 'string', enum: ['pendiente','aprobada','rechazada'], example: 'pendiente' },
            comentario:  { type: 'string', example: '' },
            revisadoPor: { type: 'string', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Respuestas de error ──────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensaje descriptivo del error' },
          },
        },
        // ── Respuesta paginada genérica ──────────────────────────────
        Paginado: {
          type: 'object',
          properties: {
            data:       { type: 'array', items: {} },
            total:      { type: 'integer', example: 42 },
            page:       { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
      },
    },
  },
  // Escanea todos los archivos de rutas en busca de anotaciones @openapi
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
