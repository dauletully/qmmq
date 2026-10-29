import * as migration_20261029_194201_initial from './20261029_194201_initial';
import * as migration_20261029_203817_remove_pricing_payment_note from './20261029_203817_remove_pricing_payment_note';

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
];
