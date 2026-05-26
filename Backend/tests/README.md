# 🧪 Tests — StudyMind Backend

## Archivos generados

| Archivo | Qué prueba |
|---|---|
| `auth.test.js` | Registro, login, GET /auth/me |
| `tasks-subjects.test.js` | CRUD de tareas y materias |
| `evaluations-users.test.js` | CRUD de evaluaciones, perfil, contraseña, estadísticas |
| `middleware.test.js` | Middleware JWT: tokens válidos, expirados, inválidos |

---

## 1. Instalar dependencias de test

Dentro de la carpeta `Backend/`:

```bash
npm install --save-dev vitest supertest @vitest/coverage-v8
```

---

## 2. Agregar scripts al package.json del Backend

```json
"scripts": {
  "test":          "vitest run",
  "test:watch":    "vitest",
  "test:coverage": "vitest run --coverage"
}
```

---

## 3. Copiar archivos de test

Copia los 4 archivos `.test.js` a `Backend/tests/`  
Copia `vitest.config.js` a la raíz de `Backend/`

Estructura final:
```
Backend/
├── src/
│   ├── middleware/auth.js
│   ├── models/database.js
│   └── routes/
│       ├── auth.js
│       ├── tasks.js
│       ├── subjects.js
│       ├── evaluations.js
│       └── users.js
├── tests/
│   ├── auth.test.js
│   ├── tasks-subjects.test.js
│   ├── evaluations-users.test.js
│   └── middleware.test.js
├── vitest.config.js
└── package.json
```

---

## 4. Verificar que package.json usa ESModules

Asegúrate de tener esto en `Backend/package.json`:

```json
{
  "type": "module"
}
```

---

## 5. Ejecutar los tests

```bash
# Ejecutar todos los tests una vez
npm test

# Modo watch (re-ejecuta al guardar)
npm run test:watch

# Ver cobertura de código
npm run test:coverage
```

---

## Resultados esperados

```
✓ auth.test.js (8 tests)
✓ tasks-subjects.test.js (12 tests)
✓ evaluations-users.test.js (15 tests)
✓ middleware.test.js (8 tests)

Test Files  4 passed
Tests       43 passed
```

---

## ¿Qué cubre cada test?

### auth.test.js
- ✅ Registro exitoso con token y perfil (sin contraseña)
- ✅ Registro falla sin campos obligatorios (400)
- ✅ Registro falla con correo duplicado (409)
- ✅ Iniciales generadas automáticamente del nombre
- ✅ Contraseña hasheada antes de guardar
- ✅ Login exitoso con credenciales correctas
- ✅ Login falla con contraseña incorrecta (401)
- ✅ GET /auth/me con token válido / sin token / token inválido

### tasks-subjects.test.js
- ✅ Listar tareas del usuario autenticado
- ✅ Crear, actualizar, eliminar tarea
- ✅ 404 al actualizar tarea que no existe
- ✅ 401/403 en todas las rutas sin token válido
- ✅ CRUD completo de materias con los mismos casos

### evaluations-users.test.js
- ✅ CRUD completo de evaluaciones con campos extendidos
- ✅ Perfil sin contraseña en la respuesta
- ✅ Cambio de contraseña: exitoso, incorrecta, muy corta
- ✅ Bloqueo de cambio de contraseña para cuentas Google
- ✅ Recálculo de iniciales al cambiar nombre
- ✅ getUserStats: tareas vencidas, promedios, por materia

### middleware.test.js
- ✅ Token válido → inyecta userId en req
- ✅ Sin token → 401
- ✅ Formato incorrecto → 401
- ✅ Clave incorrecta → 403
- ✅ Token expirado → 403
- ✅ generarToken genera JWT con userId y expiración correctos
