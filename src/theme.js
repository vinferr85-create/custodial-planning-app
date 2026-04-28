export const C = {
  navy:    '#0B1F3A',
  teal:    '#0D7377',
  tealLt:  '#14CFBC',
  slate:   '#1E3A5F',
  gold:    '#E8A838',
  white:   '#FFFFFF',
  off:     '#F0F4F8',
  g2:      '#94A3B8',
  g3:      '#475569',
  red:     '#E53E3E',
  green:   '#38A169',
  amber:   '#D69E2E',
};

export const uid = () => Math.random().toString(36).slice(2, 8);

export const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const SHIFTS  = ['Day (7am–3pm)', 'Evening (3pm–11pm)'];
export const DOFF    = ['Sat-Sun','Sun-Mon','Mon-Tue','Fri-Sat'];
export const PROD_HRS = 7;
