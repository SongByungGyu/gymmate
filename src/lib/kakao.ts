export type Place = {
  id: string;
  place_name: string;
  address: string;
  road_address: string;
  lat: number;
  lng: number;
  distance?: number;
};

type KakaoDocument = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  distance: string;
};

export async function searchGyms(
  query: string,
  opts?: { lat?: number; lng?: number }
): Promise<Place[]> {
  const params = new URLSearchParams({
    query: `${query} 헬스장`,
    size: '15',
    category_group_code: 'SPO',
  });
  if (opts?.lat != null && opts?.lng != null) {
    params.set('x', String(opts.lng));
    params.set('y', String(opts.lat));
    params.set('sort', 'distance');
  }
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
      cache: 'no-store',
    }
  );
  if (!res.ok) throw new Error(`Kakao API ${res.status}`);
  const data = await res.json();
  const docs = (data.documents ?? []) as KakaoDocument[];
  return docs.map((d) => ({
    id: d.id,
    place_name: d.place_name,
    address: d.address_name,
    road_address: d.road_address_name,
    lat: Number(d.y),
    lng: Number(d.x),
    distance: d.distance ? Number(d.distance) : undefined,
  }));
}
