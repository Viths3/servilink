# ServiLink — Contexto para Claude Code

## Qué es este proyecto
Plataforma web para la oferta y contratación de servicios independientes
en Cuenca, Ecuador. Trabajo de Titulación — UCACUE, Ingeniería de Software, 2026.
Estudiante: Juan Carlos Guaman Tituaña.

---

## Stack tecnológico (NO modificar sin consultar)

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Node.js + Express | 20 LTS |
| Base de datos | MongoDB + Mongoose | 7+ |
| Autenticación | JWT + bcrypt | jsonwebtoken + bcryptjs |
| Archivos | Multer | multipart/form-data |
| Notificaciones | WhatsApp Business Cloud API (Meta) | v19+ |
| Frontend | React.js + Vite | 18+ (Fase 3) |
| Estilos | Tailwind CSS | v3 (Fase 3) |
| Deploy | Railway o Render | CI/CD desde Git |

---

## Variables de entorno (.env)

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secreto_muy_largo_y_aleatorio
JWT_EXPIRES_IN=7d
WHATSAPP_TOKEN=EAAx...
WHATSAPP_PHONE_NUMBER_ID=1234567890
PORT=5000
NODE_ENV=development
```

**NUNCA commitear el .env real. Solo commitear .env.example.**

---

## Estructura de carpetas backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── providerController.js
│   │   ├── announcementController.js
│   │   ├── serviceRequestController.js
│   │   ├── upgradeController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Announcement.js
│   │   ├── ServiceRequest.js
│   │   ├── UpgradeRequest.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── announcement.routes.js
│   │   ├── serviceRequest.routes.js
│   │   ├── upgrade.routes.js
│   │   └── admin.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      — verifica JWT
│   │   ├── role.middleware.js      — verifica roles[]
│   │   └── upload.middleware.js    — Multer config
│   ├── services/
│   │   └── whatsappService.js      — envío de mensajes WA
│   └── app.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## Modelo de datos central: Usuario

```javascript
{
  nombre:      String,          // requerido
  email:       String,          // único, requerido
  password:    String,          // bcrypt, nunca en texto plano
  telefono:    String,          // formato E.164: +593XXXXXXXXX
  roles:       [String],        // ['cliente'] | ['proveedor'] | ['admin'] | ['cliente','proveedor']
  fotoPerfil:  String,          // URL del archivo
  activo:      Boolean,         // default: true
  providerData: {               // solo si tiene rol proveedor
    cedula:             String,
    categoria:          String,
    descripcion:        String,
    verificationStatus: String, // 'none' | 'pendiente' | 'aprobado' | 'rechazado'
    documentos:         [String],
    comentarioAdmin:    String,
    fechaVerificacion:  Date
  },
  createdAt:   Date,
  updatedAt:   Date
}
```

---

## Modelo Anuncio

```javascript
{
  proveedor:    ObjectId,   // ref: User (debe tener verificationStatus='aprobado')
  titulo:       String,
  descripcion:  String,
  categoria:    String,     // 'electricidad'|'plomeria'|'medicina'|'carpinteria'|'asesoria'|'otro'
  precioRef:    Number,     // opcional, precio referencial
  estado:       String,     // 'activo' | 'inactivo' | 'suspendido'
  reportes: [{
    usuario:    ObjectId,
    motivo:     String,
    descripcion:String,
    fecha:      Date,
    revisado:   Boolean
  }],
  createdAt:    Date,
  updatedAt:    Date
}
```

---

## Modelo ServiceRequest (Solicitud)

```javascript
{
  cliente:          ObjectId,   // ref: User
  proveedor:        ObjectId,   // ref: User
  anuncio:          ObjectId,   // ref: Announcement (opcional)
  descripcion:      String,
  fechaPropuesta:   Date,
  fechaConfirmada:  Date,
  estado:           String,     // 'pendiente'|'aceptada'|'rechazada'|'reagendada'|'completada'|'cancelada'
  motivoRechazo:    String,
  createdAt:        Date
}
```

---

## Modelo UpgradeRequest

```javascript
{
  usuario:     ObjectId,   // ref: User (quien solicita)
  cedula:      String,
  categoria:   String,
  descripcion: String,
  documentos:  [String],
  estado:      String,     // 'pendiente' | 'aprobada' | 'rechazada'
  comentario:  String,
  revisadoPor: ObjectId,   // ref: User (admin)
  createdAt:   Date
}
```

---

## Reglas de negocio críticas

1. Un proveedor puede contratar servicios con la misma cuenta (rol dual RF-15).
2. Un proveedor NO puede enviarse una solicitud a sí mismo.
3. Solo proveedores con verificationStatus='aprobado' pueden publicar anuncios.
4. Un usuario no puede reportar el mismo anuncio más de una vez.
5. El admin NO puede desactivar otra cuenta de admin.
6. Validar cédula ecuatoriana siempre con algoritmo módulo 10.
7. JWT payload: `{ userId, roles[] }` — nunca incluir datos sensibles.
8. Todos los endpoints excepto GET /announcements (público) requieren JWT.
9. Endpoints /admin/* requieren adicionalmente el rol 'admin'.

---

## Algoritmo módulo 10 — Cédula ecuatoriana

```javascript
function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  const digitos = cedula.split('').map(Number);
  const verificador = digitos[9];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = digitos[i] * (i % 2 === 0 ? 2 : 1);
    if (val > 9) val -= 9;
    suma += val;
  }
  const residuo = suma % 10;
  return residuo === 0 ? verificador === 0 : (10 - residuo) === verificador;
}
```

---

## WhatsApp Service — eventos y plantillas

```javascript
// services/whatsappService.js
// Función base:
sendWhatsApp(telefono, templateName, params[])

// Plantillas requeridas (crear en Meta Business):
'verificacion_aprobada'     — RF-07
'verificacion_rechazada'    — RF-07
'nueva_solicitud'           — RF-12 evento 1
'cita_confirmada'           — RF-12 evento 2
'cita_rechazada'            — RF-12 evento 3
'reagendamiento_propuesto'  — RF-12 evento 4
'respuesta_reagendamiento'  — RF-12 evento 5
'upgrade_aprobado'          — RF-17
'upgrade_rechazado'         — RF-17
'anuncio_editado'           — RF-22
'anuncio_suspendido'        — RF-22
```

---

## Endpoints API (referencia completa)

### Auth
```
POST   /api/auth/register           — RF-01 registro cliente
POST   /api/auth/register-provider  — RF-02 registro proveedor
POST   /api/auth/login              — RF-03 login JWT
POST   /api/auth/logout             — RF-04 logout
```

### Usuarios / Verificación
```
GET    /api/users/me                — perfil propio (auth)
PATCH  /api/users/me                — actualizar perfil (auth)
POST   /api/users/upload-docs       — carga documentos (auth, proveedor)
GET    /api/users/:id/public        — perfil público (público)
```

### Anuncios
```
GET    /api/announcements           — listar/buscar (público)
GET    /api/announcements/:id       — detalle (público)
POST   /api/announcements           — crear (auth, proveedor verificado)
PATCH  /api/announcements/:id       — editar (auth, dueño)
DELETE /api/announcements/:id       — desactivar (auth, dueño)
POST   /api/announcements/:id/report — reportar (auth)
```

### Solicitudes
```
POST   /api/service-requests                       — enviar (auth)
GET    /api/service-requests/sent                  — enviadas por mí (auth)
GET    /api/service-requests/received              — recibidas (auth, proveedor)
PATCH  /api/service-requests/:id/accept            — aceptar (auth, proveedor)
PATCH  /api/service-requests/:id/reject            — rechazar (auth, proveedor)
PATCH  /api/service-requests/:id/reschedule        — reagendar (auth, proveedor)
PATCH  /api/service-requests/:id/accept-reschedule — cliente acepta reagend. (auth)
PATCH  /api/service-requests/:id/reject-reschedule — cliente rechaza reagend. (auth)
```

### Upgrade de rol
```
POST   /api/upgrade-requests        — solicitar upgrade (auth, cliente)
GET    /api/upgrade-requests/me     — ver mi solicitud (auth)
```

### Admin
```
GET    /api/admin/stats             — métricas dashboard
GET    /api/admin/verifications     — verificaciones pendientes
PATCH  /api/admin/verifications/:id — aprobar/rechazar
GET    /api/admin/upgrade-requests  — upgrades pendientes
PATCH  /api/admin/upgrade-requests/:id — aprobar/rechazar
GET    /api/admin/announcements/reported — anuncios reportados
PATCH  /api/admin/announcements/:id — editar/suspender/desestimar
GET    /api/admin/users             — listar usuarios
PATCH  /api/admin/users/:id         — activar/desactivar
```

---

## Sprints de desarrollo

### Sprint 1 — Auth + Estructura base
RF-01, RF-02, RF-03, RF-04
- Inicializar proyecto, modelos, middlewares de auth y roles
- Registro cliente, registro proveedor (con validación cédula)
- Login JWT, logout

### Sprint 2 — Verificación + Rol dual
RF-05, RF-06, RF-07, RF-15, RF-16, RF-17
- Carga de documentos con Multer
- Flujo verificación admin + WhatsApp
- Solicitudes de upgrade de rol

### Sprint 3 — Anuncios + Solicitudes + Búsqueda
RF-08 al RF-13, RF-20, RF-21, RF-22
- CRUD anuncios (múltiples por proveedor)
- Búsqueda y filtrado público
- Ciclo completo de solicitudes + WhatsApp
- Sistema de reportes de anuncios

### Sprint 4 — Admin + Pruebas + Deploy
RF-18, RF-19
- Panel admin completo
- Colección Postman documentada
- Despliegue en Railway/Render
- Variables de entorno en producción

---

## Convenciones de código

- Siempre usar `async/await` con try/catch, nunca callbacks.
- Respuestas de error: `{ error: 'Mensaje claro' }` con código HTTP correcto.
- Respuestas de éxito: `{ data: {...}, mensaje: '...' }`.
- Nunca retornar el campo `password` en ninguna respuesta.
- Usar `const` por defecto, `let` solo si reasignas.
- Nombres de archivos: camelCase para JS, kebab-case para rutas.
- Comentar solo lo que no es obvio. No comentar obviedades.

---

## Estado actual del proyecto

- [x] Fase 1 completa: SRS v3.1, UML v5.0, Wireframes v2.0
- [ ] Sprint 1: Auth + estructura base
- [ ] Sprint 2: Verificación + Rol dual
- [ ] Sprint 3: Anuncios + Solicitudes
- [ ] Sprint 4: Admin + Deploy
- [ ] Fase 3: Frontend React.js
