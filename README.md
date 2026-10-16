# Habitaciones

Portafolio de fotografía recorrido como un pasillo de hotel. El scroll avanza sobre el piso. Cada puerta abre una sala con una sola imagen, iluminada como en un museo.

Es una página estática. No hay cuentas, base de datos ni servidor: el navegador solo camina y abre las salas. `npm run build` deja el sitio en `dist/`, listo para cualquier hosting de archivos.

## No hace falta comprar un hotel en 3D

Muros, piso, alfombra, puertas, números y lámparas están construidos en código. No hay que comprar un pack de muebles, texturas ni un modelo de pasillo.

## Qué sí hace falta

Solo el contenido de la exposición:

1. **Tus fotografías.** JPG o WEBP, lado largo entre 2000 y 3000 px, color sRGB. Una imagen por puerta. Pueden ser verticales o apaisadas: el marco se ajusta.
2. **La ficha de cada pieza** en `src/data/artworks.ts`: número de habitación, título, año, medio y una frase.
3. **El nombre de la muestra**, si no quieres que se llame Habitaciones. Está al inicio del mismo archivo.

Las ocho imágenes que ves ahora son estudios de muestra. Para reemplazarlas:

1. Copia tus archivos a `public/obras/`.
2. En cada objeto de `artworks`, cambia `src`, los textos y `width` / `height`.
3. Pon `sample: false`.

Puedes agregar o quitar piezas de la lista. El pasillo crece solo y alterna las puertas de pared.

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

Sube la carpeta `dist/`. No hace falta un backend.
