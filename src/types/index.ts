export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  language: string;
}

export interface Playlist {
  url: string;
  name: string;
  channels: Channel[];
  categories: string[];
  lastUpdated: number;
}

export interface PlaylistMeta {
  url: string;
  name: string;
  channelCount: number;
  lastUpdated: number;
}
