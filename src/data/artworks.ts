/**
 * Cada entrada es una puerta del pasillo.
 *
 * Para colgar tus fotografías:
 * 1. Copia JPG o WEBP a public/obras/ (lado largo entre 2000 y 3000 px, sRGB).
 * 2. Cambia src, room, title, year, medium y caption.
 * 3. Pon sample: false cuando la pieza ya sea tuya.
 *
 * El lado de la pared se alterna solo. Puedes agregar o quitar objetos de la lista.
 */

export const exhibition = {
  title: "Habitaciones",
  kicker: "Portafolio",
  lede: "Desliza para avanzar sobre el piso. Cada puerta abre una sola imagen, con la luz de una sala de museo.",
  sampleNote:
    "Las imágenes de ahora son estudios de muestra. Las tuyas ocupan el mismo marco.",
}

export type Artwork = {
  id: string
  room: string
  title: string
  year: string
  medium: string
  caption: string
  src: string
  width: number
  height: number
  /** True mientras el marco todavía tiene un estudio de muestra. */
  sample: boolean
}

export const artworks: Artwork[] = [
  {
    id: "01",
    room: "201",
    title: "Cuatro de la tarde",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "La luz entra baja y se queda en la pared.",
    src: "/obras/01.svg",
    width: 1200,
    height: 1500,
    sample: true,
  },
  {
    id: "02",
    room: "202",
    title: "Después de la mesa",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "Lo que queda cuando la silla ya está vacía.",
    src: "/obras/02.svg",
    width: 1600,
    height: 1100,
    sample: true,
  },
  {
    id: "03",
    room: "203",
    title: "Puerta de servicio",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "Una rendija alcanza para saber que hay otra sala.",
    src: "/obras/03.svg",
    width: 1200,
    height: 1500,
    sample: true,
  },
  {
    id: "04",
    room: "204",
    title: "Sombra rosa",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "El color llega antes que el mueble.",
    src: "/obras/04.svg",
    width: 1200,
    height: 1500,
    sample: true,
  },
  {
    id: "05",
    room: "205",
    title: "La cortina",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "El aire parte la tela en columnas.",
    src: "/obras/05.svg",
    width: 1200,
    height: 1500,
    sample: true,
  },
  {
    id: "06",
    room: "206",
    title: "Sin huésped",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "La mañana ocupa solo el lado de la ventana.",
    src: "/obras/06.svg",
    width: 1600,
    height: 1100,
    sample: true,
  },
  {
    id: "07",
    room: "207",
    title: "Un vaso",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "El brillo es más fino que el vidrio.",
    src: "/obras/07.svg",
    width: 1200,
    height: 1500,
    sample: true,
  },
  {
    id: "08",
    room: "208",
    title: "Horizonte",
    year: "2026",
    medium: "Estudio de muestra",
    caption: "Casi nada: una línea y el resto es pared.",
    src: "/obras/08.svg",
    width: 1600,
    height: 1100,
    sample: true,
  },
]
