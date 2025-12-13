# 📚 Guía de Integración - Backend API

## Base URL
```
https://backend-nextjs-one.vercel.app

---

## 1️⃣ Autenticación / Registro de Usuario

### Registrar nuevo usuario
```javascript
async function signup(email, name, password) {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password })
  });
  
  const { ok, data, isNew } = await response.json();
  if (ok) {
    localStorage.setItem('userId', data.id);
    return { userId: data.id, isNew, email: data.email };
  }
  throw new Error('Signup failed');
}

// Uso:
const user = await signup('user@example.com', 'John', 'pass123');
console.log(user.userId); // Guardar para futuras operaciones
```

### Obtener usuario demo (sin registro)
```javascript
async function getDemoUser() {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/auth/signup');
  const { data } = await response.json();
  localStorage.setItem('userId', data.id);
  return data.id;
}

// Uso:
const userId = await getDemoUser();
```

---

## 2️⃣ Gestionar Categorías

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

## 3️⃣ Gestionar Notas

### Crear nota
```javascript
async function createNote(title, content, categoryId, userId) {
  const response = await fetch('https://backend-nextjs-one.vercel.app/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, categoryId, userId })
  });
  
  const { ok, data } = await response.json();
  if (ok) return data;
  throw new Error('Note creation failed');
}

// Uso:
const note = await createNote(
  'Mi primer nota',
  'Contenido de la nota',
  'cmj3k8pmz0001jgbuquphop4q', // categoryId
  'cmj3k8oyp0000jgbubth55gak'  // userId
);
console.log(note.id);
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

---

## 4️⃣ Resumir Nota con IA (Gemini)

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

## 📋 Flujo Completo: Crear Usuario → Nota → Resumir

```javascript
async function completeFlow() {
  // 1. Registrar o obtener usuario
  let userId;
  try {
    const user = await signup('user@example.com', 'User', 'pass123');
    userId = user.userId;
  } catch {
    userId = await getDemoUser();
  }
  
  // 2. Crear o obtener categoría
  let categories = await getCategories();
  let categoryId = categories[0]?.id;
  
  if (!categoryId) {
    categoryId = await createCategory('General', '#3B82F6', '📝');
  }
  
  // 3. Crear nota
  const noteData = await createNote(
    'Mi nota de prueba',
    'Este es un contenido largo que será resumido por IA',
    categoryId,
    userId
  );
  
  // 4. Resumir nota con IA
  const summary = await summarizeNote(noteData.content);
  console.log('Resumen:', summary);
  
  return { userId, categoryId, noteId: noteData.id, summary };
}

// Ejecutar
completeFlow().then(result => {
  console.log('✅ Flujo completado:', result);
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

| Endpoint | Método | Autenticación |
|----------|--------|---------------|
| `/api/auth/signup` | POST, GET | No requerida |
| `/api/categories` | GET, POST | No requerida |
| `/api/notes` | GET, POST | `userId` en POST |
| `/api/ai/analyze` | POST | No requerida |

---

## 🐛 Troubleshooting

**Error: "categoryId is required"**
- Asegúrate de crear una categoría primero o obtener una existente

**Error: "Foreign key constraint violated"**
- El `userId` no existe en la BD. Usa `/api/auth/signup` GET para obtener un usuario válido

**Error: CORS error**
- Verifica que el frontend está en `https://frontend-lovable.vercel.app`
- Confirma que estás usando las URLs correctas del backend

---

Creado: 2025-12-12
Backend Status: ✅ Funcionando
