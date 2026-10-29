import * as migration_20261029_194201_initial from './20261029_194201_initial';

export const migrations = [
  {
    up: migration_20261029_194201_initial.up,
    down: migration_20261029_194201_initial.down,
    name: '20261029_194201_initial'
  },
];
