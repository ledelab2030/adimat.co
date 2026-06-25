# ADIMAT — sitio (adimat.co)

Landing estática de ADIMAT, marca comercial de I+DE S.A.S.
Línea PET (Oil & Gas) y línea Maderas. Una sola página, sin dependencias
salvo Google Fonts.

## Archivos
- `index.html` — la página completa (CSS y JS incrustados).
- `CNAME` — dominio personalizado (adimat.co). No borrar.
- `.nojekyll` — desactiva el procesado Jekyll de GitHub Pages.
- `404.html` — página de error que redirige al inicio.

## Publicar con GitHub Pages
1. Subir estos archivos a un repositorio **público**.
2. Settings → Pages → Build and deployment → Source: **Deploy from a branch**.
3. Branch: **main** / carpeta **/(root)** → Save.
4. En "Custom domain" escribir **adimat.co** → Save.
5. Configurar los registros DNS (ver chat) y activar **Enforce HTTPS**.

## Pendientes antes de difundir
- Confirmar dosis PET (PET-55, PET-200, PET-550) con Óscar.
- Conectar el formulario a bandeja real (Formspree o Cloudflare Worker);
  hoy abre el correo del visitante hacia gerencia@imasde.co.
- Reemplazar textos de muestra, logo y fotos definitivos.
