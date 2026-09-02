export function tm128ToWgs84(mapx: number, mapy: number): { lat: number; lng: number } {
  const RE = 6378137.0;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 128.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;
  const RADDEG = 180.0 / Math.PI;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  const x = mapx / 10 - XO;
  const y = ro - (mapy / 10 - YO);
  const ra = Math.sqrt(x * x + y * y);
  const alat = 2 * Math.atan(Math.pow((re * sf) / (sn > 0 ? ra : -ra), 1 / sn)) - Math.PI * 0.5;
  let theta: number;
  if (Math.abs(x) <= 0) theta = 0;
  else if (Math.abs(y) <= 0) theta = Math.PI * 0.5 * (x < 0 ? -1 : 1);
  else theta = Math.atan2(x, y);
  const alon = theta / sn + olon;

  return { lat: alat * RADDEG, lng: alon * RADDEG };
}
