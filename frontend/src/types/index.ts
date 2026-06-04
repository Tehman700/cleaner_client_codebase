export type Role = 'cleaner' | 'admin';
export type Day  = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface Plot {
  id: string;
  name: string;
  address: string;
  tasks: string[];
}

export interface ScheduleEntry {
  id: string;
  day: Day;
  plotId: string;
}

export interface Job {
  tasks: Record<string, boolean>;
  photo: string | null;
  photoName: string | null;
}
