import { Plant, Location, WeatherData } from '../types';
import i18n from '../i18n';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface TipContext {
  season: Season;
  weather: WeatherData | null;
  plants: Plant[];
  location: Location | null;
}

export interface CareTip {
  id: string;
  category: 'seasonal' | 'weather' | 'care' | 'general' | 'plant_type' | 'pest' | 'fertilizer';
  condition: (context: TipContext) => boolean;
  icon: string;
  title: string;
  message: string;
  priority: number; // 1-10, mayor = mas importante
}

// Helper: check if user has a specific plant type
const hasPlantType = (plants: Plant[], typeId: string) =>
  plants.some((p) => p.typeId === typeId);

// Helper: current month (0-indexed)
const currentMonth = () => new Date().getMonth();

// Helper: check if no rain is forecast for the next N days
const noRainForDays = (weather: WeatherData | null, days: number): boolean => {
  if (!weather || weather.daily.length < days) return false;
  return weather.daily.slice(0, days).every((d) => d.precipitation < 1);
};

// Helper: check consecutive hot days
const consecutiveHotDays = (weather: WeatherData | null, threshold: number, count: number): boolean => {
  if (!weather || weather.daily.length < count) return false;
  return weather.daily.slice(0, count).every((d) => d.tempMax >= threshold);
};

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

  // =========================================================================
  // NEW TIPS
  // =========================================================================

  // === PLANT_TYPE: SUCULENTAS ===
  {
    id: 'suculenta-propagation',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'suculenta'),
    icon: '🪴',
    title: 'Propaga tus suculentas',
    message: 'Podes propagar suculentas con una hoja sana: dejala secar 2-3 dias y apoyala sobre sustrato humedo. En semanas aparecen raicitas.',
    priority: 3,
  },
  {
    id: 'suculenta-substrate',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'suculenta'),
    icon: '🏜️',
    title: 'Sustrato para suculentas',
    message: 'Usa una mezcla de tierra comun con perlita o arena gruesa (50/50). Las suculentas necesitan un drenaje excelente para no pudrirse.',
    priority: 5,
  },
  {
    id: 'suculenta-sunburn',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'suculenta') && ctx.season === 'summer',
    icon: '☀️',
    title: 'Quemaduras en suculentas',
    message: 'Si tus suculentas tienen manchas blancas o marrones, puede ser quemadura solar. Movelas a semisombra y acostumbralas al sol gradualmente.',
    priority: 7,
  },
  {
    id: 'suculenta-etiolation',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'suculenta') && (ctx.season === 'winter' || ctx.season === 'fall'),
    icon: '📏',
    title: 'Suculentas estiradas',
    message: 'Si tu suculenta se estira y las hojas se separan, le falta luz. Acercala a una ventana o ponele unas horas de sol directo por dia.',
    priority: 6,
  },
  {
    id: 'suculenta-watering-method',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'suculenta'),
    icon: '💦',
    title: 'Como regar suculentas',
    message: 'Rega las suculentas a fondo y despues deja secar completamente. El metodo de "riego profundo" es mejor que poquitos de agua seguido.',
    priority: 5,
  },

  // === PLANT_TYPE: HELECHOS ===
  {
    id: 'helecho-humidity',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'helecho'),
    icon: '💨',
    title: 'Humedad para helechos',
    message: 'Los helechos aman la humedad. Pulveriza las hojas 2-3 veces por semana o poneles un plato con piedras y agua debajo.',
    priority: 6,
  },
  {
    id: 'helecho-bathroom',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'helecho'),
    icon: '🚿',
    title: 'Helechos en el bano',
    message: 'El bano es un lugar ideal para helechos: el vapor de la ducha les da la humedad que necesitan. Eso si, que tenga algo de luz natural.',
    priority: 4,
  },
  {
    id: 'helecho-no-direct-sun',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'helecho') && ctx.season === 'summer',
    icon: '🌥️',
    title: 'Helechos y sol directo',
    message: 'Nunca pongas un helecho al sol directo, se queman las hojas al toque. Luz indirecta brillante es lo ideal.',
    priority: 7,
  },
  {
    id: 'helecho-brown-fronds',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'helecho'),
    icon: '✂️',
    title: 'Frondes secas del helecho',
    message: 'Si ves frondes marrones o secas, cortalas desde la base. No van a revivir y le sacan energia a la planta.',
    priority: 4,
  },

  // === PLANT_TYPE: CACTUS ===
  {
    id: 'cactus-dormancy',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'cactus') && ctx.season === 'winter',
    icon: '😴',
    title: 'Cactus en reposo invernal',
    message: 'En invierno los cactus entran en dormancia. Rega muy poco (una vez al mes o menos) y ponelos en un lugar fresco. Asi florecen mejor en primavera.',
    priority: 7,
  },
  {
    id: 'cactus-overwatering',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'cactus'),
    icon: '⚠️',
    title: 'Cactus blando = exceso de agua',
    message: 'Si tu cactus esta blando o translucido, tiene exceso de riego. Sacalo de la maceta, deja secar las raices y transplantalo a sustrato seco.',
    priority: 8,
  },
  {
    id: 'cactus-repotting',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'cactus') && ctx.season === 'spring',
    icon: '🧤',
    title: 'Trasplantar cactus',
    message: 'Para trasplantar un cactus, envolvelo en varias capas de diario o usa guantes gruesos de cuero. Despues del transplante, espera 5-7 dias para regar.',
    priority: 5,
  },

  // === PLANT_TYPE: AROMATICAS ===
  {
    id: 'aromatica-harvest',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'aromatica'),
    icon: '🌿',
    title: 'Cosecha aromaticas seguido',
    message: 'Cortar las aromaticas regularmente las hace crecer mas tupidas. Nunca cortes mas de un tercio de la planta de una vez.',
    priority: 5,
  },
  {
    id: 'aromatica-pinch',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'aromatica') && (ctx.season === 'spring' || ctx.season === 'summer'),
    icon: '✂️',
    title: 'Despunta tus aromaticas',
    message: 'Cuando la albahaca o la menta saquen flor, corta las puntas florales. Asi la planta concentra energia en las hojas y no en semillas.',
    priority: 6,
  },
  {
    id: 'aromatica-companion',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'aromatica') && ctx.plants.length > 1,
    icon: '🤝',
    title: 'Aromaticas companeras',
    message: 'La albahaca cerca de los tomates repele pulgones. El romero y la lavanda atraen polinizadores. Aprovecha las aromaticas como companeras del huerto.',
    priority: 3,
  },
  {
    id: 'aromatica-sun-needs',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'aromatica'),
    icon: '☀️',
    title: 'Sol para aromaticas',
    message: 'La mayoria de las aromaticas necesita minimo 6 horas de sol directo. Si no tienen suficiente luz, pierden sabor y aroma.',
    priority: 5,
  },

  // === PLANT_TYPE: TREPADORAS ===
  {
    id: 'trepa-support',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'trepa'),
    icon: '🪜',
    title: 'Soporte para trepadoras',
    message: 'Las trepadoras necesitan por donde trepar: un tutor de musgo, una enrejado o hilos tensados. Sin soporte crecen desparramadas y mas debiles.',
    priority: 6,
  },
  {
    id: 'trepa-aerial-roots',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'trepa'),
    icon: '🌱',
    title: 'Raices aereas',
    message: 'Las raices aereas de las trepadoras no son un problema: son normales y ayudan a trepar. Podes dirigirlas hacia el tutor de musgo para que se agarre mejor.',
    priority: 3,
  },
  {
    id: 'trepa-propagation',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'trepa') && ctx.season === 'spring',
    icon: '🌿',
    title: 'Propagar trepadoras por esquejes',
    message: 'En primavera podes sacar esquejes de tus trepadoras. Corta debajo de un nudo, sacale las hojas de abajo y ponelo en agua hasta que saque raices.',
    priority: 4,
  },

  // === PLANT_TYPE: FRUTALES ===
  {
    id: 'frutal-pollination',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'frutal') && ctx.season === 'spring',
    icon: '🐝',
    title: 'Polinizacion de frutales',
    message: 'En primavera asegurate de que los frutales reciban polinizadores. Podes ayudar pasando un pincel suave de flor en flor si no ves abejas.',
    priority: 7,
  },
  {
    id: 'frutal-pruning-time',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'frutal') && ctx.season === 'winter',
    icon: '✂️',
    title: 'Poda invernal de frutales',
    message: 'El invierno es el momento de podar frutales de hoja caduca. Sacales las ramas secas, cruzadas y chupones para que produzcan mejor en primavera.',
    priority: 8,
  },
  {
    id: 'frutal-fruit-set',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'frutal') && ctx.season === 'summer',
    icon: '🍊',
    title: 'Cuidado con la fruta cuajada',
    message: 'Si tu frutal tiene muchos frutos chiquitos, sacale algunos. Parece una locura, pero el raleo hace que los que quedan crezcan mas grandes y dulces.',
    priority: 5,
  },

  // === PLANT_TYPE: FLORALES ===
  {
    id: 'floral-deadheading',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'floral'),
    icon: '🌸',
    title: 'Saca las flores marchitas',
    message: 'Corta las flores que se van secando. Asi la planta no gasta energia en hacer semillas y te da mas flores nuevas.',
    priority: 5,
  },
  {
    id: 'floral-bloom-cycle',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'floral') && ctx.season === 'spring',
    icon: '🌺',
    title: 'Ciclo de floracion',
    message: 'Las florales necesitan mas nutrientes en primavera. Agrega fertilizante con mas fosforo (el segundo numero del NPK) para estimular la floracion.',
    priority: 6,
  },
  {
    id: 'floral-light-hours',
    category: 'plant_type',
    condition: (ctx) => hasPlantType(ctx.plants, 'floral'),
    icon: '💡',
    title: 'Luz y floracion',
    message: 'Muchas flores necesitan cierta cantidad de horas de luz para florecer. Si tu planta no da flores, fijate si le llega suficiente sol directo.',
    priority: 4,
  },

  // === SEASONAL (NEW) ===
  {
    id: 'early-spring-pests',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'spring' && currentMonth() >= 8 && currentMonth() <= 9,
    icon: '🐛',
    title: 'Plagas de primavera',
    message: 'Con el calorcito llegan los pulgones y cochinillas. Revisa bien el reves de las hojas y los tallos nuevos. Detectarlos temprano es clave.',
    priority: 8,
  },
  {
    id: 'late-spring-growth',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'spring' && currentMonth() >= 10 && currentMonth() <= 11,
    icon: '🌿',
    title: 'Crecimiento explosivo',
    message: 'En esta parte de la primavera las plantas crecen a full. Asegurate de que tengan espacio, nutrientes y riego suficiente para bancar el envion.',
    priority: 6,
  },
  {
    id: 'summer-heatwave',
    category: 'seasonal',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.season === 'summer' && consecutiveHotDays(ctx.weather, 35, 3);
    },
    icon: '🌡️',
    title: 'Ola de calor',
    message: 'Varios dias seguidos de +35 grados. Rega mas seguido, pulveriza las hojas al atardecer y si podes move las macetas a la sombra.',
    priority: 10,
  },
  {
    id: 'summer-vacation-prep',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'summer',
    icon: '🧳',
    title: 'Te vas de vacaciones?',
    message: 'Antes de irte: rega bien, agrupa las macetas en sombra parcial y pone botellas invertidas como riego lento. Pedi a alguien que las revise cada 3-4 dias.',
    priority: 5,
  },
  {
    id: 'fall-bring-indoors',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'fall' && currentMonth() >= 3 && currentMonth() <= 4,
    icon: '🏠',
    title: 'Entra las sensibles',
    message: 'Las noches empiezan a enfriar. Tropicales, suculentas y florales que estuvieron afuera en verano es hora de entrarlas adentro.',
    priority: 7,
  },
  {
    id: 'fall-reduce-fertilizer',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'fall',
    icon: '⏸️',
    title: 'Frena el fertilizante',
    message: 'En otono reduci la fertilizacion. Las plantas empiezan a entrar en reposo y no necesitan tantos nutrientes. Forzarlas ahora las debilita.',
    priority: 6,
  },
  {
    id: 'winter-dormancy',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'winter',
    icon: '💤',
    title: 'Respeta el descanso',
    message: 'En invierno muchas plantas frenan su crecimiento. No te preocupes si no ves hojas nuevas, es normal. Rega poco y no fertilices.',
    priority: 5,
  },
  {
    id: 'winter-indoor-humidity',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'winter',
    icon: '🏠',
    title: 'Humedad interior en invierno',
    message: 'La calefaccion seca el aire. Pulveriza las plantas tropicales, poneles bandejas con agua y piedras o agrupa las macetas para crear humedad.',
    priority: 6,
  },
  {
    id: 'spring-check-roots',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'spring',
    icon: '🔍',
    title: 'Revisa las raices',
    message: 'A principio de primavera fijate si ves raices saliendo por los agujeros de drenaje. Es senal de que la planta necesita una maceta mas grande.',
    priority: 5,
  },
  {
    id: 'fall-last-pruning',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'fall',
    icon: '✂️',
    title: 'Ultima poda del ano',
    message: 'Antes de que llegue el frio, limpia hojas secas y ramas muertas. No hagas podas fuertes ahora porque los brotes nuevos no van a aguantar el invierno.',
    priority: 5,
  },
  {
    id: 'winter-light-position',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'winter',
    icon: '🪟',
    title: 'Aprovecha la luz',
    message: 'Los dias son mas cortos en invierno. Mova las plantas cerca de ventanas luminosas. El sol de invierno es suave y no las va a quemar.',
    priority: 5,
  },
  {
    id: 'summer-bottom-watering',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'summer',
    icon: '🛁',
    title: 'Riego por inmersion',
    message: 'En verano proba regar por abajo: mete la maceta en un recipiente con agua 15-20 min. La tierra absorbe lo que necesita de forma pareja.',
    priority: 4,
  },
  {
    id: 'spring-seed-starting',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'spring' && currentMonth() >= 8 && currentMonth() <= 9,
    icon: '🌱',
    title: 'Epoca de siembra',
    message: 'Septiembre es ideal para arrancar semillas de albahaca, tomate y perejil. Usa almacigueras con sustrato humedo y mantenelas con luz.',
    priority: 5,
  },
  {
    id: 'fall-compost-leaves',
    category: 'seasonal',
    condition: (ctx) => ctx.season === 'fall',
    icon: '🍂',
    title: 'Aprovecha las hojas caidas',
    message: 'Las hojas secas del otono son oro para el compost. Apilalas, mantenelas humedas y en unos meses tenes abono casero de primera.',
    priority: 3,
  },

  // === WEATHER (NEW) ===
  {
    id: 'uv-high-protect',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      const uv = ctx.weather.current.uvIndex;
      return uv !== null && uv > 8;
    },
    icon: '🛡️',
    title: 'UV muy alto',
    message: 'El indice UV esta altisimo. Las plantas de interior cerca de ventanas pueden quemarse. Correte las macetas un poco o usa cortina liviana.',
    priority: 8,
  },
  {
    id: 'dry-spell-alert',
    category: 'weather',
    condition: (ctx) => noRainForDays(ctx.weather, 5),
    icon: '🏜️',
    title: 'Sequia a la vista',
    message: 'No se esperan lluvias en los proximos 5 dias. Las plantas de exterior van a necesitar riego manual extra. Presta atencion a las que estan al sol.',
    priority: 7,
  },
  {
    id: 'temp-swing-stress',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather || ctx.weather.daily.length < 1) return false;
      const today = ctx.weather.daily[0];
      return today ? (today.tempMax - today.tempMin) > 18 : false;
    },
    icon: '🎢',
    title: 'Cambio brusco de temperatura',
    message: 'Hay mucha diferencia entre la maxima y la minima. Ese estres termico puede afectar a las plantas sensibles. Si podes, entralas de noche.',
    priority: 7,
  },
  {
    id: 'consecutive-heat',
    category: 'weather',
    condition: (ctx) => consecutiveHotDays(ctx.weather, 32, 3),
    icon: '🔥',
    title: 'Calor persistente',
    message: 'Llevamos varios dias de calor fuerte. Duplica la frecuencia de riego y fijate que la tierra no se separe de las paredes de la maceta.',
    priority: 8,
  },
  {
    id: 'frost-risk',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather || ctx.weather.daily.length < 1) return false;
      const today = ctx.weather.daily[0];
      return today ? (today.tempMin < 3 && ctx.weather.current.humidity > 70) : false;
    },
    icon: '🧊',
    title: 'Riesgo de helada',
    message: 'Frio + humedad alta = posible helada. Cubri las plantas de exterior con tela antihelada o mete las macetas adentro esta noche.',
    priority: 10,
  },
  {
    id: 'heavy-rain-drainage',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather || ctx.weather.daily.length < 1) return false;
      return ctx.weather.daily[0]?.precipitation > 20;
    },
    icon: '⛈️',
    title: 'Lluvias fuertes',
    message: 'Se esperan lluvias intensas. Revisa que tus macetas de exterior no se encharquen. Si no tienen buen drenaje, ponelas bajo techo.',
    priority: 8,
  },
  {
    id: 'low-wind-mist',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.windSpeed < 5 && ctx.weather.current.humidity < 40;
    },
    icon: '🌫️',
    title: 'Aire seco y calmo',
    message: 'Con poca brisa y baja humedad, las plantas transpiran mas rapido. Buen momento para pulverizar las hojas y agregar un platito con agua cerca.',
    priority: 5,
  },
  {
    id: 'uv-moderate-outdoor-time',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      const uv = ctx.weather.current.uvIndex;
      return uv !== null && uv >= 3 && uv <= 5;
    },
    icon: '🌤️',
    title: 'UV moderado: ideal para aclimatar',
    message: 'El UV esta moderado, perfecto para sacar plantas de interior a tomar sol un rato. Empeza con 1-2 horas en semisombra y anda aumentando.',
    priority: 3,
  },
  {
    id: 'post-rain-check',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather || ctx.weather.daily.length < 2) return false;
      return ctx.weather.daily[0]?.precipitation > 10 && ctx.weather.daily[1]?.precipitation < 2;
    },
    icon: '🌈',
    title: 'Despues de la lluvia',
    message: 'Despues de lluvias fuertes, revisa las macetas: vaciá los platitos si se llenaron y fijate que no haya barro tapando los agujeros de drenaje.',
    priority: 5,
  },
  {
    id: 'extreme-wind',
    category: 'weather',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.windSpeed > 50;
    },
    icon: '🌪️',
    title: 'Vientos muy fuertes',
    message: 'Con vientos de mas de 50 km/h, mete adentro las macetas livianas y asegura las trepadoras al soporte. Las ramas debiles pueden romperse.',
    priority: 9,
  },

  // === PEST ===
  {
    id: 'pest-spider-mites',
    category: 'pest',
    condition: (ctx) => {
      if (!ctx.weather) return ctx.season === 'summer';
      return ctx.weather.current.temperature > 27 && ctx.weather.current.humidity < 50;
    },
    icon: '🕷️',
    title: 'Ojo con la aranuela roja',
    message: 'Calor seco es paraiso para aranuela roja. Fijate si hay puntitos en las hojas o telaranas finas. Pulveriza con agua jabonosa o aceite de neem.',
    priority: 8,
  },
  {
    id: 'pest-mealybugs',
    category: 'pest',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🐛',
    title: 'Cochinilla algodonosa',
    message: 'Si ves motitas blancas algodonosas en tallos o axilas de hojas, es cochinilla. Sacalas con un hisopo mojado en alcohol o aplica aceite de neem.',
    priority: 7,
  },
  {
    id: 'pest-aphids',
    category: 'pest',
    condition: (ctx) => ctx.season === 'spring' || ctx.season === 'summer',
    icon: '🟢',
    title: 'Pulgones a la vista',
    message: 'Los pulgones aparecen en primavera-verano en brotes tiernos. Proba con agua a presion, jabon potasico o introduciendo mariquitas en tu jardin.',
    priority: 7,
  },
  {
    id: 'pest-fungus-gnats',
    category: 'pest',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.humidity > 65;
    },
    icon: '🦟',
    title: 'Mosquitas del sustrato',
    message: 'Las mosquitas negras chiquitas salen de la tierra humeda. Deja secar la capa superior entre riegos y agrega una capa de arena gruesa arriba.',
    priority: 6,
  },
  {
    id: 'pest-white-mold',
    category: 'pest',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.humidity > 80;
    },
    icon: '🍄',
    title: 'Moho blanco en la tierra',
    message: 'El moho blanco en el sustrato indica exceso de humedad y poca ventilacion. Saca la capa de moho, deja secar la tierra y mejora la circulacion de aire.',
    priority: 6,
  },
  {
    id: 'pest-scale-insects',
    category: 'pest',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🛡️',
    title: 'Cochinilla parda (escama)',
    message: 'Las escamas marrones pegadas a tallos y nervaduras de las hojas son cochinillas. Sacalas raspando con una unia y aplica aceite de neem preventivo.',
    priority: 6,
  },
  {
    id: 'pest-leaf-spot',
    category: 'pest',
    condition: (ctx) => {
      if (!ctx.weather) return false;
      return ctx.weather.current.humidity > 70 && ctx.weather.current.temperature > 20;
    },
    icon: '🟤',
    title: 'Manchas en las hojas',
    message: 'Humedad + calor = caldo de cultivo para hongos. Si ves manchas marrones o negras con halo amarillo, corta la hoja y mejora la ventilacion.',
    priority: 7,
  },
  {
    id: 'pest-thrips',
    category: 'pest',
    condition: (ctx) => ctx.season === 'summer',
    icon: '🪲',
    title: 'Trips en tus plantas',
    message: 'Los trips dejan marcas plateadas en las hojas. Son muy chiquitos y dificiles de ver. Sacudi una hoja sobre papel blanco: si ves bichitos moviéndose, trata con neem.',
    priority: 6,
  },
  {
    id: 'pest-root-rot',
    category: 'pest',
    condition: (ctx) => ctx.plants.some((p) => p.waterEvery <= 3),
    icon: '🤒',
    title: 'Podredumbre de raiz',
    message: 'Las plantas que regas muy seguido son propensas a podredumbre. Si la planta se marchita aunque la tierra este humeda, revisa las raices: deben ser blancas, no marrones.',
    priority: 8,
  },
  {
    id: 'pest-neem-preventive',
    category: 'pest',
    condition: (ctx) => ctx.season === 'spring' && ctx.plants.length > 0,
    icon: '🧴',
    title: 'Neem preventivo en primavera',
    message: 'Aplicar aceite de neem cada 15 dias en primavera previene un monton de plagas. Pulveriza al atardecer para no quemar las hojas.',
    priority: 6,
  },

  // === FERTILIZER ===
  {
    id: 'fertilizer-npk-basics',
    category: 'fertilizer',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🔬',
    title: 'Que es NPK?',
    message: 'Los fertilizantes dicen NPK: Nitrogeno (hojas), Fosforo (flores y raices), Potasio (salud general). Para hojas verdes usa mas N, para flores mas P.',
    priority: 3,
  },
  {
    id: 'fertilizer-spring-schedule',
    category: 'fertilizer',
    condition: (ctx) => ctx.season === 'spring',
    icon: '📅',
    title: 'Fertiliza cada 2 semanas',
    message: 'En primavera y verano fertiliza cada 15 dias con la mitad de la dosis recomendada. Mas vale poquito y seguido que mucho de golpe.',
    priority: 6,
  },
  {
    id: 'fertilizer-overfeeding-signs',
    category: 'fertilizer',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🚨',
    title: 'Exceso de fertilizante',
    message: 'Costras blancas en la tierra, hojas quemadas en los bordes o crecimiento debil son senales de exceso. Rega abundante para lavar las sales acumuladas.',
    priority: 7,
  },
  {
    id: 'fertilizer-organic-options',
    category: 'fertilizer',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '♻️',
    title: 'Fertilizantes organicos',
    message: 'Humus de lombriz, te de compost o cascara de banana son opciones organicas geniales. Liberan nutrientes lento y mejoran la estructura de la tierra.',
    priority: 3,
  },
  {
    id: 'fertilizer-winter-stop',
    category: 'fertilizer',
    condition: (ctx) => ctx.season === 'winter',
    icon: '🚫',
    title: 'No fertilices en invierno',
    message: 'Las plantas en reposo no absorben nutrientes. Fertilizar en invierno satura el sustrato de sales y puede quemar las raices. Espera a la primavera.',
    priority: 7,
  },
  {
    id: 'fertilizer-succulents',
    category: 'fertilizer',
    condition: (ctx) => hasPlantType(ctx.plants, 'suculenta') || hasPlantType(ctx.plants, 'cactus'),
    icon: '🌵',
    title: 'Fertilizar suculentas y cactus',
    message: 'Suculentas y cactus necesitan poca comida. Usa fertilizante especifico diluido al 25% de lo indicado, solo en primavera-verano y una vez al mes como mucho.',
    priority: 4,
  },
  {
    id: 'fertilizer-flowering',
    category: 'fertilizer',
    condition: (ctx) => hasPlantType(ctx.plants, 'floral') && (ctx.season === 'spring' || ctx.season === 'summer'),
    icon: '🌷',
    title: 'Fertilizante para floracion',
    message: 'Las plantas con flor necesitan mas fosforo y potasio. Busca un fertilizante con formula tipo 10-30-20 cuando arranque la temporada de floracion.',
    priority: 5,
  },
  {
    id: 'fertilizer-banana-peel',
    category: 'fertilizer',
    condition: (ctx) => ctx.plants.length > 2,
    icon: '🍌',
    title: 'Te de cascara de banana',
    message: 'Remoja cascaras de banana en agua 48 horas y usa ese agua para regar. Es rica en potasio y les encanta a las florales y frutales.',
    priority: 2,
  },

  // === CARE (NEW) ===
  {
    id: 'care-leggy-growth',
    category: 'care',
    condition: (ctx) => ctx.plants.length > 0 && (ctx.season === 'winter' || ctx.season === 'fall'),
    icon: '🌿',
    title: 'Crecimiento larguirucho',
    message: 'Si tus plantas se estiran con tallos flacos y hojas separadas, necesitan mas luz. En invierno es comun. Acercalas a la ventana mas luminosa.',
    priority: 5,
  },
  {
    id: 'care-repot-signs',
    category: 'care',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🪴',
    title: 'Senales de transplante',
    message: 'Raices saliendo por abajo, agua que drena al toque sin mojar la tierra o crecimiento frenado son senales de que necesita maceta mas grande.',
    priority: 5,
  },
  {
    id: 'care-bottom-leaves-normal',
    category: 'care',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🍃',
    title: 'Hojas inferiores secas',
    message: 'Que se sequen las hojas mas viejas (de abajo) es normal en la mayoria de las plantas. La planta reabsorbe los nutrientes. Solo preocupate si son muchas a la vez.',
    priority: 3,
  },
  {
    id: 'care-water-temperature',
    category: 'care',
    condition: (ctx) => ctx.season === 'winter',
    icon: '🌡️',
    title: 'Temperatura del agua',
    message: 'En invierno no riegues con agua helada de la canilla. Deja que el agua tome temperatura ambiente antes de regar, asi no estresás las raices.',
    priority: 5,
  },
  {
    id: 'care-soil-compaction',
    category: 'care',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🪵',
    title: 'Tierra compactada',
    message: 'Si el agua corre por los bordes sin mojar bien la tierra, esta compactada. Pinchalos suavemente con un palito y afloja la capa superior.',
    priority: 5,
  },

  // === GENERAL (NEW) ===
  {
    id: 'general-consistent-routine',
    category: 'general',
    condition: (ctx) => ctx.plants.length > 3,
    icon: '📋',
    title: 'La constancia es clave',
    message: 'Las plantas prefieren una rutina constante que cuidados erraticos. Mejor regar un poquito tarde que saltear y despues inundar.',
    priority: 3,
  },
  {
    id: 'general-terracotta-vs-plastic',
    category: 'general',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🏺',
    title: 'Maceta de barro vs plastico',
    message: 'Las macetas de barro transpiran y secan mas rapido (mejor para suculentas). Las de plastico retienen humedad (mejor para helechos y tropicales).',
    priority: 2,
  },
  {
    id: 'general-finger-test',
    category: 'general',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '👆',
    title: 'El test del dedo',
    message: 'Mete el dedo 2-3 cm en la tierra. Si esta seca, rega. Si esta humeda, espera. Es el metodo mas simple y efectivo para saber cuando regar.',
    priority: 4,
  },
  {
    id: 'general-patience',
    category: 'general',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🐌',
    title: 'Paciencia con las plantas nuevas',
    message: 'Una planta nueva puede tardar 2-4 semanas en aclimatarse. Si pierde algunas hojas al principio, no te desesperes. Dale tiempo y cuidados constantes.',
    priority: 3,
  },
  {
    id: 'general-watch-pets',
    category: 'general',
    condition: (ctx) => ctx.plants.length > 0,
    icon: '🐱',
    title: 'Plantas y mascotas',
    message: 'Muchas plantas comunes son toxicas para perros y gatos. Si tenes mascotas, fijate que las plantas esten fuera de su alcance o elegí variedades seguras.',
    priority: 4,
  },
];

// Get translated title and message for a care tip
export function getTranslatedTip(tip: CareTip): { title: string; message: string } {
  const t = i18n.t.bind(i18n);
  return {
    title: t(`${tip.id}.title`, { ns: 'tips', defaultValue: tip.title }),
    message: t(`${tip.id}.message`, { ns: 'tips', defaultValue: tip.message }),
  };
}
