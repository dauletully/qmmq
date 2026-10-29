import * as migration_20261029_194201_initial from './20261029_194201_initial';
import * as migration_20261029_203817_remove_pricing_payment_note from './20261029_203817_remove_pricing_payment_note';
import * as migration_20261029_214830_add_lead_steps from './20261029_214830_add_lead_steps';
import * as migration_20261029_215816_site_v1 from './20261029_215816_site_v1';

export const migrations = [
  {
    up: migration_20261029_194201_initial.up,
    down: migration_20261029_194201_initial.down,
    name: '20261029_194201_initial',
  },
  {
    up: migration_20261029_203817_remove_pricing_payment_note.up,
    down: migration_20261029_203817_remove_pricing_payment_note.down,
    name: '20261029_203817_remove_pricing_payment_note',
  },
  {
    up: migration_20261029_214830_add_lead_steps.up,
    down: migration_20261029_214830_add_lead_steps.down,
    name: '20261029_214830_add_lead_steps',
  },
  {
    up: migration_20261029_215816_site_v1.up,
    down: migration_20261029_215816_site_v1.down,
    name: '20261029_215816_site_v1'
  },
];
