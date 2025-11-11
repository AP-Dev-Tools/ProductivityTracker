import { DelegationPotential, Alignment } from './enums';

export interface Person {
  id: string;
  name: string;
}

export interface PurposeCategory {
  id: string;
  label: string;
  extraInfoType: 'none' | 'text' | 'person';
  extraInfoPrompt: string;
  color: { bg: string; border: string; text: string };
}


export interface NewLogEntry {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in minutes
  activityDescription: string;
  projectPurposeId: string; // ID of the PurposeCategory
  purposeExtraInfo?: string; // For text-based info
  personId?: string; // For person-based info
  delegationPotential: DelegationPotential;
  alignment: Alignment;
  disruptionReason?: string;
}

export interface LogEntry extends NewLogEntry {
  id: string;
}

export interface NewPlanEntry {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in minutes
  activityDescription: string;
  projectPurposeId: string; // ID of the PurposeCategory
}

export interface PlanEntry extends NewPlanEntry {
  id: string;
}


export interface Selection {
  date: Date;
  startTime: string; // HH:MM
  duration: number; // in minutes
}

export interface TimeSlot {
    time: string; // HH:MM
    isStartOfHour: boolean;
}
