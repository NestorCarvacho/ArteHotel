# Habitaciones

Portafolio de fotografía recorrido como un pasillo de hotel. El scroll avanza sobre el piso. Cada puerta abre una sala con una sola imagen, iluminada como en un museo.

El pasillo es una página estática: no hay cuentas ni base de datos, y el navegador solo camina y abre las salas. El mantenedor escribe esos cambios en archivos del proyecto, y solo está disponible mientras corre `npm run dev`. `npm run build` deja el sitio en `dist/`, listo para cualquier hosting de archivos.

## No hace falta comprar un hotel en 3D

Muros, piso, alfombra, puertas, números y lámparas están construidos en código. No hay que comprar un pack de muebles, texturas ni un modelo de pasillo.

## Mantenedor

Con el proyecto en marcha, abre [http://127.0.0.1:4731/mantener](http://127.0.0.1:4731/mantener). Ahí puedes:

- poner el nombre de cada habitación y el texto de la puerta
- subir o cambiar la foto
- escribir la descripción, el año y el medio
- agregar o quitar habitaciones, y cambiar el orden del recorrido

Guardar escribe `public/coleccion.json` y las fotos en `public/obras/`. El pasillo las lee al volver. No hace falta editar código.

Las ocho imágenes iniciales son estudios de muestra. Al subir una foto, esa puerta deja de ser muestra.

## Cómo verlo

```bash
npm install
npm run dev
```

Abre [http://127.0.0.1:4731](http://127.0.0.1:4731).

- Desliza, arrastra con el dedo o usa las flechas para caminar.
- Cuando una puerta está cerca, entra con el botón, con Enter o haciendo clic en la puerta.
- En la sala, Esc vuelve al pasillo. Las flechas laterales pasan a la pieza de al lado.

## Publicar

```bash
npm run build
npm run preview
```

Sube la carpeta `dist/`. El sitio publicado muestra las habitaciones guardadas. Para volver a editarlas, corre el proyecto en este computador y entra al mantenedor.
