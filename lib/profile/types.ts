export interface PlatformEntry {
  platform: string;
  handle: string;
  followers: string;
  engagementRate: string;
}

export interface AudienceInfo {
  age?: string;
  geo?: string;
  gender?: string;
}

export interface CreatorProfileData {
  niche: string;
  bio: string;
  platforms: PlatformEntry[];
  audience: AudienceInfo;
  tone: string;
  pastDeals: string;
  rateFloor: string;
}

export const EMPTY_PROFILE: CreatorProfileData = {
  niche: "",
  bio: "",
  platforms: [],
  audience: {},
  tone: "",
  pastDeals: "",
  rateFloor: "",
};
