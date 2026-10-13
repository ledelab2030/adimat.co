# Gastos — control de egresos

PWA local-first para registrar tus egresos y entender en que se va tu dinero.
Funciona 100 % sin conexion, se instala en el celular y en el laptop, y se
abre siempre desde la misma URL. Moneda: peso colombiano (COP).

> **Estado del despliegue:** el codigo esta completo, compilado y probado,
> pero **no se ha publicado ni desplegado nada todavia**. Esta seccion y la
> de "Despliegue" mas abajo son los pasos exactos para cuando tu los
> apruebes.

## Stack

- **Frontend:** Vite + TypeScript + Preact + Tailwind CSS. Sin dependencias
  pesadas (el bundle final pesa ~85 KB sin comprimir, ~26 KB con gzip).
- **Datos:** IndexedDB en el dispositivo (via `idb`), local-first. La app
  funciona igual de bien con o sin sincronizacion configurada.
- **PWA:** `vite-plugin-pwa` genera el manifest, los iconos (192/512,
  normales y maskable) y el service worker con precache total.
- **Sincronizacion (opcional):** un Cloudflare Worker + D1 minimo,
  protegido con una clave personal que tu defines. Ver [`worker/`](./worker).
- **Pruebas:** Vitest (calculos, presupuesto, proyeccion, deduplicacion de
  importaciones) y Playwright (registro de un gasto sin conexion y
  sincronizacion al reconectar).

## Estructura

```
gastos/
├── src/               # app (componentes, pantallas, logica)
│   ├── lib/            # tipos, IndexedDB, calculos, sync, backup, etc.
│   ├── components/      # UI compartida
│   └── screens/          # las pantallas (Registro, Panel, Historial, ...)
├── e2e/                # prueba Playwright (offline + sincronizacion)
├── scripts/            # generador de iconos PWA (sin dependencias nativas)
├── worker/             # Cloudflare Worker de sincronizacion (D1)
└── public/             # iconos, favicon, robots.txt
```

## Instalacion y desarrollo

Requiere Node.js 20+.

```bash
cd gastos
npm install
npm run icons     # genera los iconos PWA (ya estan generados en public/icons)
npm run dev        # http://localhost:5173
```

## Pruebas

```bash
npm run test       # unitarias (Vitest): calculos, presupuesto, proyeccion,
                    # importacion sin duplicados, deteccion de fugas, etc.
npm run test:e2e   # e2e (Playwright): registra un gasto sin conexion,
                    # confirma que persiste, y que se sincroniza al reconectar
                    # con un servidor de sincronizacion simulado.
```

`npm run test:e2e` construye la app (`vite build`) y la sirve con
`vite preview` automaticamente antes de correr la prueba.

## Build de produccion

```bash
npm run build      # tsc -b && vite build -> genera dist/
npm run preview    # sirve dist/ en http://localhost:4173 para probarlo
```

El build ya fue probado en este entorno: compila sin errores de tipos,
genera el `manifest.webmanifest`, el `sw.js` con precache de 16 archivos
(~112 KB) y los 4 iconos PWA.

## Como instalar la PWA

La app se instala igual en cualquier dispositivo una vez estes en la URL
donde quede publicada (ver "Despliegue").

**Android (Chrome):**
1. Abre la URL de la app.
2. Toca el menu (⋮) → **Instalar aplicacion** (o espera el aviso automatico).
3. Confirma. Queda como un icono mas en el launcher, en una ventana propia.

**iPhone/iPad (Safari):**
1. Abre la URL de la app en Safari (debe ser Safari, no Chrome).
2. Toca el boton de compartir (el cuadrado con la flecha hacia arriba).
3. Elige **Agadir a la pantalla de inicio**.
4. Confirma. Queda como una app normal, abre sin la barra de Safari.

**Laptop/escritorio (Chrome, Edge, Brave):**
1. Abre la URL de la app.
2. Haz clic en el icono de instalar en la barra de direcciones (o menu → **Instalar Gastos...**).
3. Queda como una aplicacion de escritorio independiente.

Una vez instalada, la app abre siempre desde la misma URL/icono y funciona
completamente sin conexion (el registro rapido, el historial, el panel y los
ajustes no necesitan internet para nada salvo la sincronizacion opcional).

## Sincronizacion entre dispositivos (opcional)

Por defecto la app funciona **solo en este dispositivo**: todo vive en
IndexedDB local. Si quieres que los mismos datos aparezcan en tu celular y tu
laptop, despliega el Worker incluido en [`worker/`](./worker) (ver esa
carpeta para el paso a paso completo) y luego, en **Ajustes → Sincronizacion
entre dispositivos** de la app, en cada dispositivo:

1. Pon la misma **URL del worker** (ej. `https://gastos-sync.tu-cuenta.workers.dev`).
2. Pon la misma **clave personal** (una frase larga y unica, nunca la
   compartas; es tu unica proteccion de acceso).
3. Toca **Guardar**. La app sincronizara sola cuando haya conexion
   (tambien puedes tocar **Sincronizar ahora**).

Los cambios se guardan primero en el dispositivo y se sincronizan cuando hay
internet. Si dos dispositivos editan el mismo registro, gana la edicion mas
reciente (por `updatedAt`); los borrados son logicos (no se pierde el
historial de sincronizacion).

## Respaldo y restauracion

En **Ajustes** siempre tienes:
- **Descargar JSON**: respaldo completo (categorias, cuentas, gastos,
  recurrentes, presupuestos y ajustes generales).
- **Descargar CSV**: tus gastos en una hoja de calculo.
- **Importar JSON / Importar CSV**: restaura o combina datos. La
  importacion es segura de repetir: no duplica registros (deduplica por
  `id` en JSON, y por fecha+monto+nota+cuenta en CSV cuando no hay `id`).

## Datos de ejemplo

En **Ajustes → Datos de ejemplo** puedes cargar ~3 meses de gastos
simulados para explorar el panel de claridad, y quitarlos despues con un
boton (se eliminan solo los que cargo la demo, con la misma papelera de
deshacer que el resto de la app).

## Despliegue (preparado, pendiente de tu aprobacion)

Nada de esto se ha ejecutado todavia. Estos son los comandos exactos para
cuando quieras publicarlo.

### 1. Desplegar el Worker de sincronizacion (opcional, hazlo primero si lo quieres)

```bash
cd worker
npm install
cp wrangler.toml.example wrangler.toml
# Edita wrangler.toml: pon tu dominio en ALLOWED_ORIGIN

npx wrangler login
npm run db:create                 # crea la base D1 y te da un database_id
# Copia ese database_id dentro de wrangler.toml

npm run db:migrate:remote         # crea las tablas (ver schema.sql)
npm run secret:set                # te pide la clave personal; usa una frase larga
npm run deploy                    # publica el Worker y te da su URL
```

Copia la URL que te da `wrangler deploy` (algo como
`https://gastos-sync.<tu-cuenta>.workers.dev`): es la que vas a poner en
**Ajustes → URL del worker** en la app, junto con la misma clave que
definiste en `secret:set`.

### 2. Desplegar la app (Cloudflare Pages)

```bash
cd gastos
npm run build
npx wrangler pages deploy dist --project-name=gastos
```

La primera vez, Wrangler te pregunta si quieres crear el proyecto de Pages;
acepta. Te entrega una URL `https://gastos.pages.dev` (o tu dominio propio
si lo conectas despues en el dashboard de Cloudflare).

### Alternativa: GitHub Pages

Si prefieres algo aun mas simple (sin cuenta de Cloudflare):

```bash
cd gastos
npm run build
npx gh-pages -d dist   # requiere: npm i -D gh-pages (no incluido por defecto)
```

Activa GitHub Pages en el repositorio apuntando a la rama `gh-pages`. Ten en
cuenta que GitHub Pages no sirve para el Worker de sincronizacion (eso
siempre necesita Cloudflare, o cualquier otro host que corra el `worker/src/index.ts`
equivalente); la app seguira funcionando solo en local si no configuras el
Worker.

## Verificacion rapida de cada funcion

- **Registro rapido:** abre la app, toca un monto, una categoria y
  "Guardar gasto". Menos de 10 segundos en el celular.
- **Categorias:** Mas → Categorias. Reordena con las flechas, oculta,
  edita icono/color, o agrega una nueva.
- **Recurrentes:** Mas → Recurrentes → "+ Nuevo". Define frecuencia y dia;
  en Registro apareceran como propuestas para confirmar (no se registran
  solas).
- **Presupuestos:** Mas → Presupuestos. Define un monto por categoria y
  observa la barra (verde / amarilla al 80% / roja al 100%).
- **Panel de claridad:** pestana Panel. Cambia de mes con las flechas;
  revisa el total, la comparacion con el mes anterior, el gasto por
  categoria, la tendencia de 12 meses, el top 10, por cuenta/medio de pago,
  promedio diario, proyeccion de cierre y las fugas detectadas.
- **Historial:** pestana Historial. Filtra por mes, categoria, cuenta,
  medio de pago o rango de monto; toca un gasto para editarlo o borrarlo
  (con "Deshacer" en la notificacion).
- **Respaldo:** Ajustes → Descargar JSON/CSV e Importar JSON/CSV.
- **Ajustes:** moneda fija en COP, dia de inicio de mes, tema, clave de
  sincronizacion, borrar todos los datos (con doble confirmacion).
- **Estado de conexion:** la burbuja en la esquina superior muestra "Solo
  en este dispositivo", "Sin conexion", "Sincronizando...", "Sincronizado"
  o "Pendiente de sincronizar" con el numero de cambios por enviar.
- **Offline real:** instala la PWA, pon el celular/laptop en modo avion,
  abre la app y registra un gasto; sigue ahi al reconectar y sincroniza
  sola (esto es justo lo que cubre la prueba e2e en `e2e/offline-sync.spec.ts`).
