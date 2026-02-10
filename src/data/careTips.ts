import { Plant, Location, WeatherData } from '../types';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface TipContext {
  season: Season;
  weather: WeatherData | null;
  plants: Plant[];
  location: Location | null;
}

export interface CareTip {
  id: string;
  category: 'seasonal' | 'weather' | 'care' | 'general';
  condition: (context: TipContext) => boolean;
  icon: string;
  title: string;
  message: string;
  priority: number; // 1-10, mayor = mas importante
}

export const CARE_TIPS: CareTip[] = [
  // === ESTACIONALES ===
  {
    id: 'winter-less-water',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'winter',
    icon: '❄️',
    title: 'Riego invernal',
    message: 'En invierno reduci el riego a la mitad. Las plantas crecen mas lento y necesitan menos agua.',
    priority: 8,
  },
  {
    id: 'spring-fertilize',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'spring',
    icon: '🌱',
    title: 'Hora de fertilizar',
    message: 'La primavera es el mejor momento para fertilizar. Las plantas estan despertando y necesitan nutrientes.',
    priority: 9,
  },
  {
    id: 'summer-early-water',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'summer',
    icon: '🌅',
    title: 'Rega temprano',
    message: 'En verano rega a primera hora de la manana o al atardecer para evitar que el agua se evapore.',
    priority: 8,
  },
  {
    id: 'fall-prepare',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'fall',
    icon: '🍂',
    title: 'Preparate para el invierno',
    message: 'En otono es buen momento para podar y preparar las plantas para el frio que viene.',
    priority: 7,
  },
  {
    id: 'spring-repot',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'spring',
    icon: '🪴',
    title: 'Transplantes de primavera',
    message: 'Si tus plantas ya no tienen espacio en su maceta, este es el mejor momento para trasplantarlas.',
    priority: 6,
  },
  {
    id: 'summer-mulch',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'summer',
    icon: '🌿',
    title: 'Protege la tierra',
    message: 'Agrega mantillo o corteza sobre la tierra para mantener la humedad y proteger las raices del calor.',
    priority: 5,
  },

  // === CLIMA ===
  {
    id: 'cloudy-less-evaporation',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      // Weather codes 2, 3 (partly cloudy, overcast)
      const code = ctx.weather.current.weatherCode;
      return code >= 2 && code <= 3;
    },
    icon: '☁️',
    title: 'Dia nublado',
    message: 'Los dias nublados tienen menos evaporacion. Podes espaciar un poco mas el riego.',
    priority: 6,
  },
  {
    id: 'high-humidity-fungus',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.humidity > 75;
    },
    icon: '💧',
    title: 'Humedad alta',
    message: 'Con humedad alta, cuidado con los hongos. Asegurate de que haya buena ventilacion entre las plantas.',
    priority: 7,
  },
  {
    id: 'hot-day-shade',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.temperature > 30;
    },
    icon: '🔥',
    title: 'Mucho calor',
    message: 'Con mas de 30 grados, considera mover las plantas sensibles a un lugar con sombra parcial.',
    priority: 9,
  },
  {
    id: 'rain-coming',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather || ctx.weather.daily.length < 2) return false;
      // Check if rain is expected tomorrow
      return ctx.weather.daily[1]?.precipitation > 5;
    },
    icon: '🌧️',
    title: 'Lluvia manana',
    message: 'Se esperan lluvias para manana. Podes saltear el riego de las plantas de exterior.',
    priority: 8,
  },
  {
    id: 'windy-protect',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.windSpeed > 30;
    },
    icon: '💨',
    title: 'Dia ventoso',
    message: 'Con viento fuerte, protege las plantas delicadas y revisa que las macetas esten estables.',
    priority: 7,
  },
  {
    id: 'cold-night',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather || ctx.weather.daily.length < 1) return false;
      return ctx.weather.daily[0]?.tempMin < 5;
    },
    icon: '🥶',
    title: 'Noche fria',
    message: 'Se esperan temperaturas bajas esta noche. Considera entrar las plantas sensibles al frio.',
    priority: 9,
  },

  // === CUIDADO ===
  {
    id: 'yellow-leaves-overwater',
    category: 'care',
    condition: () => true,
    icon: '💛',
    title: 'Hojas amarillas',
    message: 'Si una planta tiene hojas amarillas, puede ser exceso de agua. Deja secar la tierra entre riegos.',
    priority: 4,
  },
  {
    id: 'brown-tips-humidity',
    category: 'care',
    condition: () => true,
    icon: '🤎',
    title: 'Puntas marrones',
    message: 'Las hojas con puntas marrones suelen indicar falta de humedad. Probas pulverizar con agua.',
    priority: 4,
  },
  {
    id: 'droopy-leaves',
    category: 'care',
    condition: () => true,
    icon: '😔',
    title: 'Hojas caidas',
    message: 'Si las hojas estan decaidas pero la tierra esta humeda, puede ser exceso de riego. Deja secar.',
    priority: 5,
  },
  {
    id: 'pale-leaves-light',
    category: 'care',
    condition: () => true,
    icon: '🌞',
    title: 'Hojas palidas',
    message: 'Las hojas palidas o estiradas indican falta de luz. Mova la planta a un lugar mas iluminado.',
    priority: 4,
  },
  {
    id: 'check-drainage',
    category: 'care',
    condition: () => true,
    icon: '🕳️',
    title: 'Buen drenaje',
    message: 'Asegurate de que todas tus macetas tengan agujeros de drenaje. Las raices no deben quedar en agua.',
    priority: 5,
  },

  // === GENERALES ===
  {
    id: 'rotate-pots',
    category: 'general',
    condition: () => true,
    icon: '🔄',
    title: 'Rota las macetas',
    message: 'Rota las macetas cada 1-2 semanas para que las plantas crezcan parejas y no se inclinen hacia la luz.',
    priority: 3,
  },
  {
    id: 'clean-leaves',
    category: 'general',
    condition: () => true,
    icon: '🧹',
    title: 'Limpia las hojas',
    message: 'Limpia las hojas con un pano humedo cada 2 semanas. Asi respiran mejor y absorben mas luz.',
    priority: 3,
  },
  {
    id: 'water-quality',
    category: 'general',
    condition: () => true,
    icon: '💧',
    title: 'Agua reposada',
    message: 'Deja reposar el agua del grifo 24 horas antes de regar. Asi se evapora el cloro.',
    priority: 2,
  },
  {
    id: 'morning-routine',
    category: 'general',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '☀️',
    title: 'Rutina matutina',
    message: 'Revisar tus plantas cada manana te ayuda a detectar problemas temprano. Una miradita rapida basta.',
    priority: 2,
  },
  {
    id: 'group-humidity',
    category: 'general',
    condition: (ctx) => ctx.plants.length > 2,
    icon: '👯',
    title: 'Agrupa las plantas',
    message: 'Agrupar las plantas crea un microclima con mas humedad. Se ayudan entre ellas.',
    priority: 3,
  },
  {
    id: 'quarantine-new',
    category: 'general',
    condition: () => true,
    icon: '🏥',
    title: 'Cuarentena',
    message: 'Las plantas nuevas deben estar separadas 2 semanas antes de juntarlas con las demas. Previene plagas.',
    priority: 4,
  },
];
