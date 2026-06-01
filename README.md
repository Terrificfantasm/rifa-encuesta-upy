# Rifa Encuesta UPY

Página temporal para mostrar participantes registrados en una rifa escolar relacionada con una encuesta.

## Archivos principales

- `index.html`: estructura de la página.
- `styles.css`: estilos visuales.
- `script.js`: carga y búsqueda de participantes.
- `participantes.json`: datos públicos que lee la página.

## Privacidad

La página está pensada para mostrar correos institucionales censurados, no correos completos.

Ejemplo:

```txt
2310419@upy.edu.mx -> 23**419@upy.edu.mx
```

No subir a GitHub archivos de respuestas originales como Excel o CSV.

## Activación con GitHub Pages

Cuando el profesor autorice publicar la página:

1. Ir a Settings > Pages.
2. Source: Deploy from a branch.
3. Branch: main.
4. Folder: /(root).
5. Save.

## Actualización en tiempo casi real

La actualización se hará con Power Automate:

Microsoft Forms -> Get response details -> GitHub REST API -> actualizar `participantes.json`.
