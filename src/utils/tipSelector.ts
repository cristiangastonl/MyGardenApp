import { CARE_TIPS, CareTip, TipContext, Season } from '../data/careTips';

/**
 * Determina la estacion basandose en la latitud.
 * Hemisferio sur: diciembre-febrero = verano, junio-agosto = invierno
 * Hemisferio norte: diciembre-febrero = invierno, junio-agosto = verano
 */
export function getSeason(latitude: number): Season {
  const month = new Date().getMonth(); // 0-11
  const isSouthernHemisphere = latitude < 0;

  // Meses: 0=Ene, 1=Feb, 2=Mar, 3=Abr, 4=May, 5=Jun, 6=Jul, 7=Ago, 8=Sep, 9=Oct, 10=Nov, 11=Dic
  // Verano norte: Jun-Ago (5,6,7), Invierno norte: Dic-Feb (11,0,1)
  // Verano sur: Dic-Feb (11,0,1), Invierno sur: Jun-Ago (5,6,7)

  let season: Season;

  if (month >= 2 && month <= 4) {
    // Mar-May
    season = 'spring';
  } else if (month >= 5 && month <= 7) {
    // Jun-Aug
    season = 'summer';
  } else if (month >= 8 && month <= 10) {
    // Sep-Nov
    season = 'fall';
  } else {
    // Dec-Feb (11, 0, 1)
    season = 'winter';
  }

  // Invertir para hemisferio sur
  if (isSouthernHemisphere) {
    const seasonMap: Record<Season, Season> = {
      spring: 'fall',
      summer: 'winter',
      fall: 'spring',
      winter: 'summer',
    };
    season = seasonMap[season];
  }

  return season;
}

/**
 * Obtiene la estacion actual. Si no hay ubicacion, asume hemisferio sur (Argentina).
 */
export function getCurrentSeason(latitude: number | null): Season {
  // Si no hay ubicacion, asumimos Argentina (hemisferio sur, lat negativa)
  const lat = latitude ?? -34.6;
  return getSeason(lat);
}

/**
 * Selecciona los tips relevantes para el contexto actual.
 * Filtra por condicion, ordena por prioridad y retorna los top N.
 */
export function selectTips(context: TipContext, maxTips: number = 3): CareTip[] {
  // Filtrar tips cuya condicion se cumple
  const applicableTips = CARE_TIPS.filter((tip) => {
    try {
      return tip.condition(context);
    } catch {
      return false;
    }
  });

  // Ordenar por prioridad (mayor primero)
  const sortedTips = applicableTips.sort((a, b) => b.priority - a.priority);

  // Retornar top N
  return sortedTips.slice(0, maxTips);
}

/**
 * Selecciona un tip aleatorio de los disponibles, excluyendo IDs ya vistos.
 * Prioriza los de mayor prioridad pero con algo de aleatoriedad.
 */
export function selectRandomTip(
  context: TipContext,
  seenTipIds: string[]
): CareTip | null {
  // Filtrar tips cuya condicion se cumple y no se han visto
  const applicableTips = CARE_TIPS.filter((tip) => {
    if (seenTipIds.includes(tip.id)) return false;
    try {
      return tip.condition(context);
    } catch {
      return false;
    }
  });

  if (applicableTips.length === 0) {
    // Si ya se vieron todos, reiniciar y mostrar cualquiera
    const allApplicable = CARE_TIPS.filter((tip) => {
      try {
        return tip.condition(context);
      } catch {
        return false;
      }
    });
    if (allApplicable.length === 0) return null;
    return allApplicable[Math.floor(Math.random() * allApplicable.length)];
  }

  // Dar mas peso a los de mayor prioridad
  // Usamos prioridad como peso: tip con prioridad 9 tiene 9x mas chances que uno con 1
  const totalWeight = applicableTips.reduce((sum, tip) => sum + tip.priority, 0);
  let random = Math.random() * totalWeight;

  for (const tip of applicableTips) {
    random -= tip.priority;
    if (random <= 0) {
      return tip;
    }
  }

  // Fallback
  return applicableTips[0];
}
