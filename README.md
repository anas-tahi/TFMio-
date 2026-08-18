# TFMio

Encuentra tu TFM. Gestiona tu camino.

Plataforma de emparejamiento y gestion de Trabajos Fin de Master y Trabajos Fin de Grado, desarrollada para ETSIIT, Universidad de Granada.

Combina un sistema de descubrimiento de temas al estilo Tinder con un motor de recomendacion basado en modelos de lenguaje, ademas de un sistema de gestion del ciclo de vida completo del TFM/TFG: desde encontrar un tema hasta la calificacion final.

TFM autor: Anas Tahir
Tutor: Prof. Miguel Garcia Silvente (DECSAI)
Programa: Master en Ingenieria Informatica (MII)

---

## Estado del proyecto

Fase 1 (fundamentos) y Fase 2 (motor de emparejamiento con IA) completadas. Fase 3 (gestion del ciclo de vida) en curso. Fase 4 (pulido, tests, despliegue) pendiente.

## Estructura del monorepo

```
TFMio/
├── server/     API en Node.js + Express + TypeScript
└── client/     Frontend en React + Vite + TypeScript
```

## Stack tecnologico

- Frontend: React, Vite, TypeScript, Tailwind CSS, Zustand
- Backend: Node.js, Express, TypeScript
- Base de datos: MongoDB Atlas
- IA: Ollama en local, usando llama3.2 para texto y nomic-embed-text para embeddings
- Ranking de recomendaciones: similitud de coseno calculada directamente en Node.js
- Auth: JWT + bcrypt, control de acceso por rol

El proyecto usa Ollama en lugar de la API de OpenAI para poder desarrollar sin coste. En vez de configurar el indice $vectorSearch de MongoDB Atlas, la similitud entre embeddings se calcula en el propio backend — mas simple de mantener y suficiente para el volumen de temas que maneja esta plataforma.

## Puesta en marcha

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

API en `http://localhost:5000`.

### Frontend

```bash
cd client
npm install
npm run dev
```

App en `http://localhost:5173`.

### IA local (Ollama)

Requiere Ollama (https://ollama.com) instalado y corriendo:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

## Roles

- Estudiante: completa su perfil, recibe recomendaciones de IA, muestra interes en temas y sigue el progreso de su TFM/TFG
- Tutor: publica temas, revisa solicitudes de estudiantes (con explicacion generada por IA) y decide si aceptarlas
- Coordinador: supervisa el ciclo de vida completo de su titulacion — aprueba emparejamientos, programa defensas y gestiona calificaciones

## Arquitectura multi-titulacion

La plataforma soporta varias titulaciones desde el principio, no como algo añadido despues:

- Degree representa una titulacion (MII, GII, etc.), cada una con su propio coordinador
- Cada estudiante pertenece a una titulacion
- Un tutor puede supervisar en varias titulaciones
- Cada coordinador esta vinculado a una sola titulacion y solo ve sus propios estudiantes y temas
- Cada tema declara a que titulacion o titulaciones esta abierto

## Motor de emparejamiento con IA

1. El perfil de cada estudiante (habilidades, intereses, estilo de trabajo) se convierte en un embedding con nomic-embed-text, y llama3.2 genera un resumen del perfil
2. Cada tema publicado pasa por el mismo proceso
3. La afinidad entre un estudiante y cada tema se calcula por similitud de coseno entre los embeddings, generando un ranking con porcentaje de coincidencia
4. El estudiante explora sus recomendaciones con una interfaz de tarjetas deslizables
5. Al mostrar interes en un tema, la IA genera una explicacion de por que ese estudiante encaja, que el tutor revisa antes de aceptar o rechazar la solicitud
6. Si el tutor acepta, se crea un emparejamiento oficial (Work)

## Datos de prueba

Todo lo que hay ahora mismo en la base de datos es informacion inventada: estudiantes, profesores y temas ficticios, nunca personas reales.

```bash
cd server
npm run seed
```

Este comando borra y reemplaza las colecciones de titulaciones, usuarios y temas. Crea 3 titulaciones, 2 coordinadores, 3 tutores, 3 estudiantes con perfiles variados y 4 temas — suficiente para probar el swipe, el emparejamiento y las recomendaciones de principio a fin. Todas las cuentas usan la contraseña Password123.

Cuando la plataforma este lista para pruebas piloto con estudiantes y profesores reales de ETSIIT (con su consentimiento), estos datos de prueba se eliminaran.

## Seguridad

No subas tu archivo .env al repositorio. Esta en el .gitignore por defecto. Solo .env.example, con valores de ejemplo, debe estar en el repositorio.
