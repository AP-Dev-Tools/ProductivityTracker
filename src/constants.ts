import { PurposeCategory, TimeSlot, Person } from './types';
import { DelegationPotential, Alignment } from './enums';

export const START_HOUR = 8;
export const END_HOUR = 17;
export const END_MINUTE = 30;

export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = START_HOUR; hour < END_HOUR + 1; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === END_HOUR && minute >= END_MINUTE) {
        break;
      }
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push({ time: `${h}:${m}`, isStartOfHour: minute === 0 });
    }
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

export const COLOR_PALETTE: { bg: string; border: string; text: string }[] = [
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
  { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800' },
];

export const DEFAULT_PURPOSE_CATEGORIES: PurposeCategory[] = [
  { id: 'bau_team_support', label: 'BAU / Team Support', extraInfoType: 'none', extraInfoPrompt: '', color: COLOR_PALETTE[0] },
  { id: 'bigger_picture_strategy', label: 'Bigger Picture / Strategy', extraInfoType: 'none', extraInfoPrompt: '', color: COLOR_PALETTE[1] },
  { id: 'other_dept_support', label: 'Other Dept Support', extraInfoType: 'person', extraInfoPrompt: 'Who was it for?', color: COLOR_PALETTE[2] },
  { id: 'meeting', label: 'Meeting', extraInfoType: 'person', extraInfoPrompt: 'Who set the meeting?', color: COLOR_PALETTE[3] },
];

export const DEFAULT_PEOPLE: Person[] = [
  { id: 'alan_f', name: 'Alan F' },
  { id: 'daz_f', name: 'Daz F' },
  { id: 'roxy', name: 'Roxy' },
  { id: 'michelle', name: 'Michelle' },
  { id: 'lee', name: 'Lee' },
  { id: 'laura', name: 'Laura' },
  { id: 'adam_me', name: 'Adam (me)' },
];

export const DELEGATION_POTENTIAL_OPTIONS: { value: DelegationPotential; label: string }[] = [
  { value: DelegationPotential.ONLY_ME, label: 'Only I Can Do This' },
  { value: DelegationPotential.SOMEONE_ELSE, label: 'Someone Else Could Do This' },
  { value: DelegationPotential.ELIMINATE, label: 'Could Be Eliminated' },
];

export const ALIGNMENT_OPTIONS: { value: Alignment; label: string }[] = [
    { value: Alignment.ALIGNED, label: 'Aligned (Planned Work)' },
    { value: Alignment.DISRUPTION, label: 'Disruption (Unplanned)' },
];
