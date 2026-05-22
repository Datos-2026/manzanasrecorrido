# Territorio App

Aplicación web fullstack para gestión interna de recorridos territoriales por manzana: asignación de manzanas, presentismo territorial y observaciones de higiene urbana.

## Requisitos

- Node.js 18+
- Docker (opcional, para PostgreSQL)
- npm

## Estructura

```
proyecto comunas manzanas/
├── backend/          # API Express + Sequelize
├── frontend/         # Vite + React
└── docker-compose.yml
```

## 1. Levantar PostgreSQL

```bash
docker compose up -d
```

Base de datos: `territorial_app`  
Usuario: `postgres` / Contraseña: `postgres`  
Puerto: `5432`

## 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API: http://localhost:4000

### Scripts backend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo con nodemon |
| `npm run start` | Producción |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:seed` | Cargar datos de prueba |
| `npm run db:reset` | Revertir, migrar y seed |

## 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@test.com | password123 |
| Coordinador | coordinador@test.com | password123 |
| Recorredor | recorredor@test.com | password123 |

Datos seed: Comuna 2, manzanas C2REC-001 a C2REC-010, 5 manzanas asignadas al recorredor.

## Dominio

- **Comuna**: unidad territorial (ej. Comuna 2)
- **Manzana (block)**: unidad asignable con código único (ej. C2REC-045)
- **Asignación**: relación activa usuario ↔ manzana
- **Recorrido (visit)**: carga de presentismo sobre una manzana en una fecha
- **Observación de higiene**: relevamiento simple durante el recorrido

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login JWT |
| GET | `/api/auth/me` | Usuario actual |
| GET/POST/PATCH/DELETE | `/api/users` | Usuarios |
| GET/POST/PATCH/DELETE | `/api/communes` | Comunas |
| GET/POST/PATCH/DELETE | `/api/blocks` | Manzanas |
| GET/POST/PATCH/DELETE | `/api/assignments` | Asignaciones |
| GET | `/api/assignments/my-blocks` | Manzanas del recorredor |
| GET/POST/PATCH/DELETE | `/api/visits` | Recorridos |
| GET | `/api/dashboard/weekly` | Cobertura semanal |
| GET | `/api/dashboard/summary` | Indicadores generales |

## Roles

- **admin**: acceso total
- **coordinador**: solo su comuna (usuarios, manzanas, asignaciones, recorridos, dashboard)
- **recorredor**: sus manzanas asignadas y sus recorridos

## Flujo de prueba rápido

1. Login como `admin@test.com` → ver dashboard de cobertura
2. Ir a Manzanas → listar C2REC-001…010
3. Ir a Asignaciones → ver asignaciones al recorredor
4. Login como `recorredor@test.com` → Mis manzanas → Cargar recorrido
5. Completar formulario y guardar
6. Login admin → Dashboard actualizado con cobertura

## Variables de entorno

**Backend** (`backend/.env`):

```
PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/territorial_app
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):

```
VITE_API_URL=http://localhost:4000/api
```
