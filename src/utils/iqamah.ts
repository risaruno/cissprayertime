export function zeroPad(n: number) {
  return n.toString().padStart(2, '0');
}

export interface EffectiveIqamah {
  effectiveMinutes: number;
  iqamahTimeStr: string;
}

/**
 * Compute effective iqamah offset and time, applying Subuh/Isya special caps:
 * - Subuh (Fajr): if raw iqamah < 04:00, cap at 04:00
 * - Isya (Isha):  if raw iqamah > 22:00, cap at 22:00
 */
export function getEffectiveIqamah(
  adhanTimeStr: string,
  iqamahMinutes: number,
  prayerName: string,
  ref: Date,
): EffectiveIqamah {
  if (iqamahMinutes <= 0) return { effectiveMinutes: 0, iqamahTimeStr: adhanTimeStr };

  const [h, m] = adhanTimeStr.split(':').map(Number);
  const adhanDate = new Date(ref);
  adhanDate.setHours(h, m, 0, 0);
  const rawIqamah = new Date(adhanDate.getTime() + iqamahMinutes * 60_000);

  let effectiveDate = rawIqamah;

  if (prayerName === 'Fajr') {
    // Subuh: if raw iqamah < 04:00, cap at 04:00
    const fourAM = new Date(ref);
    fourAM.setHours(4, 0, 0, 0);
    if (rawIqamah < fourAM) {
      effectiveDate = fourAM;
    }
  } else if (prayerName === 'Isha') {
    // Isya: if raw iqamah > 22:00, cap at 22:00
    const tenPM = new Date(ref);
    tenPM.setHours(22, 0, 0, 0);
    if (rawIqamah > tenPM) {
      effectiveDate = tenPM;
    }
  }

  const effectiveMinutes = Math.round((effectiveDate.getTime() - adhanDate.getTime()) / 60_000);
  const iqamahTimeStr = `${zeroPad(effectiveDate.getHours())}:${zeroPad(effectiveDate.getMinutes())}`;

  return { effectiveMinutes, iqamahTimeStr };
}
