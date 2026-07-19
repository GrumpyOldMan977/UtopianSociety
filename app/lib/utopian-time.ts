export const MONTHS = [
  ["Florent", "Lunara"],
  ["Verdara", "Lover’s Moon"],
  ["Aureleth", "Mother’s Moon"],
  ["Ember", "Zenith Moon"],
  ["Solvane", "Anvil Moon"],
  ["Aura", "Keeper’s Moon"],
  ["Branna", "Provision Moon"],
  ["Gleirn", "Wind Moon"],
  ["Fallon", "Copia Moon"],
  ["Dusken", "Wisp Moon"],
  ["Nocturne", "Veil Moon"],
  ["Caldris", "Hiberna Moon"],
  ["Iskareth", "Primora Moon"],
] as const;

export const WEEKDAYS = [
  "Convergeday",
  "Kineticday",
  "Conceptday",
  "Minday",
  "Emoday",
  "Percepday",
  "Spiraday",
] as const;

const DAY_IN_MS = 86_400_000;
const EPOCH_YEAR = 1;
const EPOCH_UTC = Date.UTC(2026, 2, 20);
const DEEP_BRIDGE_REMAINDERS = new Set([1, 5, 9, 13, 17, 22, 26, 30]);

export function isDeepBridgeYear(year: number) {
  const remainder = ((year % 33) + 33) % 33;
  return DEEP_BRIDGE_REMAINDERS.has(remainder);
}

export function utopianYearLength(year: number) {
  return isDeepBridgeYear(year) ? 366 : 365;
}

function utcCivilDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function utopianDate(date: Date) {
  const target = utcCivilDay(date);

  if (target < EPOCH_UTC) {
    return {
      year: null,
      yearLabel: "The Founding Interval",
      monthIndex: -1,
      month: "The Founding Interval",
      moon: "Before Year 1",
      day: 0,
      weekday: "Beyond the Calendar",
      bridge: false,
      deepBridgeYear: false,
    } as const;
  }

  let year = EPOCH_YEAR;
  let yearStart = EPOCH_UTC;

  if (target >= yearStart) {
    while (target >= yearStart + utopianYearLength(year) * DAY_IN_MS) {
      yearStart += utopianYearLength(year) * DAY_IN_MS;
      year += 1;
    }
  } else {
    while (target < yearStart) {
      year -= 1;
      yearStart -= utopianYearLength(year) * DAY_IN_MS;
    }
  }

  const dayOfYear = Math.floor((target - yearStart) / DAY_IN_MS);

  if (dayOfYear < 364) {
    const monthIndex = Math.floor(dayOfYear / 28);
    const day = (dayOfYear % 28) + 1;
    return {
      year,
      yearLabel: `Utopian Year ${year}`,
      monthIndex,
      month: MONTHS[monthIndex][0],
      moon: MONTHS[monthIndex][1],
      day,
      weekday: WEEKDAYS[(day - 1) % 7],
      bridge: false,
      deepBridgeYear: isDeepBridgeYear(year),
    } as const;
  }

  return {
    year,
    yearLabel: `Utopian Year ${year}`,
    monthIndex: -1,
    month: "The Bridging",
    moon: "Continuance",
    day: dayOfYear - 363,
    weekday: "Beyond the Week",
    bridge: true,
    deepBridgeYear: isDeepBridgeYear(year),
  } as const;
}

export function gregorianDateUTC(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
