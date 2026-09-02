import { tm128ToWgs84 } from './utils/tm128';

export type Place = {
  id: string;
  place_name: string;
  address: string;
  road_address: string;
  lat: number;
  lng: number;
  distance?: number;
};

type NaverItem = {
  title: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

export async function searchGyms(query: string): Promise<Place[]> {
  const params = new URLSearchParams({
    query: `${query} 헬스장`,
    display: '5',
    start: '1',
    sort: 'random',
  });
  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?${params}`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
      },
      cache: 'no-store',
    }
  );
  if (!res.ok) throw new Error(`Naver API ${res.status}`);
  const data = await res.json();
  const items = (data.items ?? []) as NaverItem[];
  return items.map((it) => {
    const name = stripHtml(it.title);
    const { lat, lng } = tm128ToWgs84(Number(it.mapx), Number(it.mapy));
    return {
      id: `${name}|${it.address}`,
      place_name: name,
      address: it.address,
      road_address: it.roadAddress,
      lat, lng,
    };
  });
}
