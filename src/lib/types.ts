export type Profile = {
  id: string;
  nickname: string;
  weekly_goal: number;
  gym_place_id: string | null;
  gym_name: string | null;
  gym_address: string | null;
  gym_lat: number | null;
  gym_lng: number | null;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  checked_in_at: string;
  local_date: string;
  memo: string | null;
  photo_url: string | null;
  verification_method: 'gps' | 'photo';
  lat: number | null;
  lng: number | null;
};
