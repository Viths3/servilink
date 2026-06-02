# ServiLink

Plataforma web para la oferta y contratación de servicios independientes en Cuenca, Ecuador.

**Trabajo de Titulación — Ingeniería de Software, UCACUE 2026**
Estudiante: Juan Carlos Guaman Tituaña | Director: Ing. Diana Ximena Poma Japon

---

## Stack

- **Backend:** Node.js 20 + Express
- **Base de datos:** MongoDB Atlas + Mongoose
- **Autenticación:** JWT + bcrypt
- **Archivos:** Multer
- **Notificaciones:** WhatsApp Business Cloud API (Meta)
- **Frontend:** React.js 18 + Vite + Tailwind (Fase 3)
- **Deploy:** Railway / Render

---

## Requisitos previos

- Node.js 20 LTS
- npm 10+
- Cuenta en MongoDB Atlas (free tier suficiente)
- Cuenta Meta Business (para WhatsApp API)
- Git

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/servilink.git
cd servilink

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 4. Iniciar en modo desarrollo
npm run dev
```

---

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/servilink
JWT_SECRET=cambia_esto_por_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=7d
WHATSAPP_TOKEN=tu_token_de_meta
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
PORT=5000
NODE_ENV=development
```

---

## Scripts disponibles

```bash
npm run dev      # Servidor con nodemon (desarrollo)
npm start        # Servidor producción
npm test         # Tests (próximamente)
```

---

## Estructura del proyecto

```
servilink/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── models/        # Esquemas Mongoose
│   │   ├── routes/        # Definición de endpoints
│   │   ├── middlewares/   # Auth, roles, upload
│   │   ├── services/      # WhatsApp service
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/              # React.js (Fase 3)
├── docs/                  # Documentación académica
│   ├── ServiLink_Requerimientos_v3.1.docx
│   ├── ServiLink_DiagramasUML_v5.0.docx
│   └── ServiLink_Wireframes_v2.0.docx
├── CLAUDE.md              # Contexto para Claude Code
└── README.md
```

---

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro de cliente |
| POST | `/api/auth/register-provider` | Registro de proveedor |
| POST | `/api/auth/login` | Login (retorna JWT) |
| POST | `/api/auth/logout` | Logout |

### Anuncios (público)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/announcements` | Listar/buscar anuncios |
| GET | `/api/announcements/:id` | Detalle de anuncio |

Ver `CLAUDE.md` para la lista completa de endpoints.

---

## Fases del proyecto

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Análisis, diseño, modelado | ✅ Completa |
| Fase 2 | Desarrollo backend | 🔄 En progreso |
| Fase 3 | Frontend + integración | ⏳ Pendiente |
| Fase 4 | Pruebas + deploy | ⏳ Pendiente |

---

## Documentación académica

Los documentos de la Fase 1 están en la carpeta `/docs`:
- **SRS v3.1** — 21 requerimientos funcionales, 19 no funcionales
- **UML v5.0** — 8 UC + 10 Secuencia + Clases + Componentes (20 figuras)
- **Wireframes v2.0** — Desktop + Móvil, 14 pantallas

---

## Licencia

Proyecto académico — Universidad Católica de Cuenca, 2026.
