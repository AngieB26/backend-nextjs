# 📚 Guía de Integración - Backend API

## Base URL
```
https://backend-nextjs-one.vercel.app
```

## 📋 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/categories | Listar categorías |
| POST | /api/categories | Crear categoría |
| GET | /api/notes | Listar notas |
| POST | /api/notes | Crear nota |
| GET | /api/notes/[id] | Obtener nota específica |
| PATCH | /api/notes/[id] | Actualizar nota parcialmente |
| DELETE | /api/notes/[id] | Eliminar nota |
| POST | /api/ai/analyze | Resumir texto con IA |

---

## 1️⃣ Gestionar Categorías

### Crear categoría
```javascript
async function createCategory(name, color = '#3B82F6', icon = '📌') {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color, icon })
  });
  
  const { ok, data } = await response.json();
  if (ok) return data.id;
  throw new Error('Category creation failed');
}

// Uso:
const categoryId = await createCategory('Trabajo', '#E74C3C', '💼');
```

### Obtener todas las categorías
```javascript
async function getCategories() {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/categories');
  const { data } = await response.json();
  return data; // Array de categorías
}

// Uso:
const categories = await getCategories();
categories.forEach(cat => console.log(cat.name, cat.icon));
```

---

## 2️⃣ Gestionar Notas

### Crear nota
```javascript
async function createNote(title, content, categoryId, userId, isPinned = false) {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, categoryId, userId, isPinned })
  });
  
  const { ok, data } = await response.json();
  if (ok) return data;
  throw new Error('Note creation failed');
}

// Uso - Opción 1: Sin usuario (anónimo) ni categoría
const note = await createNote('Mi nota', 'Contenido');
// → userId = null (anónimo)
// → categoryId se asigna a "General" automáticamente
// → isPinned = false por defecto

// Uso - Opción 2: Solo con categoría
const note = await createNote(
  'Mi nota',
  'Contenido',
  'cmj3k8pmz0001jgbuquphop4q' // categoryId
);

// Uso - Opción 3: Con usuario y categoría
const note = await createNote(
  'Mi nota',
  'Contenido',
  'cmj3k8pmz0001jgbuquphop4q', // categoryId (opcional)
  'cmj3k8oyp0000jgbubth55gak'  // userId (opcional)
);

// Uso - Opción 4: Crear nota fijada (pinned)
const pinnedNote = await createNote(
  'Nota importante',
  'Contenido urgente',
  null, // categoryId (usará "General")
  null, // userId (anónimo)
  true  // isPinned
);
```

### Obtener todas las notas
```javascript
async function getNotes() {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/notes');
  const { data } = await response.json();
  return data; // Array de notas con categoría incluida
}

// Uso:
const notes = await getNotes();
notes.forEach(note => {
  console.log(note.title, '→', note.category.name);
});
```

### Actualizar nota (PATCH)
```javascript
async function updateNote(noteId, updates) {
  const response = await fetch(`https://backend-nextjs-one.vercel.app/api/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates) // { title?, content?, categoryId?, isPinned? }
  });
  
  const { ok, data } = await response.json();
  if (ok) return data;
  throw new Error('Note update failed');
}

// Uso - Toggle pin:
await updateNote('cmj3k8pmz0001jgbu...', { isPinned: true });

// Uso - Cambiar título:
await updateNote('cmj3k8pmz0001jgbu...', { title: 'Nuevo título' });
```

### Eliminar nota (DELETE)
```javascript
async function deleteNote(noteId) {
  const response = await fetch(`https://backend-nextjs-one.vercel.app/api/notes/${noteId}`, {
    method: 'DELETE'
  });
  
  const { ok, message } = await response.json();
  if (ok) return true;
  throw new Error('Note deletion failed');
}

// Uso:
await deleteNote('cmj3k8pmz0001jgbu...');
```

---

## 3️⃣ Resumir Nota con IA (Gemini)

### Generar resumen automático
```javascript
async function summarizeNote(content) {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  
  const { ok, data, summary } = await response.json();
  if (ok) return summary; // data o summary contienen el resumen
  throw new Error('Summarization failed');
}

// Uso:
const largeText = 'Texto largo que necesita ser resumido...';
const summary = await summarizeNote(largeText);
console.log(summary);
```

---

## 📋 Flujo Completo: Nota → Resumir

```javascript
async function completeFlow() {
  // Opción 1: Crear nota SIN usuario ni categoría (recomendado para demostración)
  const noteData = await createNote(
    'Mi nota de prueba',
    'Este es un contenido largo que será resumido por IA'
  );
  
  // Opción 2: Crear nota CON categoría específica
  const categories = await getCategories();
  const noteData = await createNote(
    'Mi nota de prueba',
    'Este es un contenido largo que será resumido por IA',
    categories[0]?.id
  );
  
  // Resumir nota con IA
  const summary = await summarizeNote(noteData.content);
  console.log('Resumen:', summary);
  
  return { noteId: noteData.id, userId: noteData.userId, summary };
}

// Ejecutar
completeFlow().then(result => {
  console.log('✅ Nota creada y resumida:', result);
});
```

---

## 🔍 Respuestas de la API

### Éxito
```json
{
  "ok": true,
  "data": { /* objeto creado */ }
}
```

### Error
```json
{
  "ok": false,
  "error": "Descripción del error",
  "message": "Detalles técnicos (opcional)"
}
```

---

## 🚀 Variables de Entorno Recomendadas

Guardar en `localStorage` del navegador:
```javascript
localStorage.setItem('userId', '...');
localStorage.setItem('userEmail', '...');
localStorage.setItem('defaultCategoryId', '...');
```

---

## ✅ Headers CORS Configurados

- **Origin**: `https://frontend-lovable.vercel.app`
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: true

---

## 📞 Endpoints Resumen

| Endpoint | Método | Descripción |
|----------|--------|-----------|
| `/api/categories` | GET | Obtener todas las categorías |
| `/api/categories` | POST | Crear nueva categoría |
| `/api/notes` | GET | Obtener todas las notas |
| `/api/notes` | POST | Crear nueva nota (requiere userId y categoryId) |
| `/api/ai/analyze` | POST | Resumir contenido con IA |

---

## 🐛 Troubleshooting

**Error: "categoryId is required"**
- Asegúrate de crear una categoría primero o obtener una existente

**Error: "userId is required"**
- El `userId` debe estar guardado en `localStorage` del frontend
- Usa el endpoint `/api/auth/signup` (GET) para obtener un usuario

**Error: CORS error**
- Verifica que el frontend está en `https://frontend-lovable.vercel.app`
- Confirma que estás usando las URLs correctas del backend

---

Creado: 2025-12-12
Backend Status: ✅ Funcionando
