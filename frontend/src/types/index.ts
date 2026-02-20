export interface User {
  id: number;
  email: string;
  full_name: string;
  specialization: string | null;
  photo_path: string | null;
  voice_sample_path: string | null;
  is_onboarded: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Reel {
  id: number;
  topic: string;
  language: string;
  status: ReelStatus;
  script_text: string | null;
  audio_path: string | null;
  video_raw_path: string | null;
  video_final_path: string | null;
  error_message: string | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
}

export type ReelStatus =
  | 'pending'
  | 'generating_script'
  | 'script_ready'
  | 'generating_audio'
  | 'generating_video'
  | 'post_processing'
  | 'completed'
  | 'failed';

export interface ReelList {
  reels: Reel[];
  total: number;
  page: number;
  per_page: number;
}

export interface ReelCreate {
  topic: string;
  language: string;
}

export interface ScriptUpdate {
  script_text: string;
}
