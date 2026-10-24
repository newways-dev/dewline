// Byte offsets inside the Assetto Corsa (2014) shared memory pages.
// The game's structs use #pragma pack(4); wchar_t strings are UTF-16LE (2 bytes per char).
// Offsets follow the official Kunos struct order. probe.ts prints them live so they can be verified in-game.

export const PAGE_NAMES = {
  physics: 'Local\\acpmf_physics',
  graphics: 'Local\\acpmf_graphics',
  static: 'Local\\acpmf_static',
} as const

// How many bytes of each page we read. Only the fields we need for now.
export const READ_BYTES = {
  physics: 32,
  graphics: 252,
  static: 200,
} as const

export const PHYSICS = {
  packetId: 0, // int32, increases with every physics step
  gas: 4, // float32, 0..1
  brake: 8, // float32, 0..1
  gear: 16, // int32, expected: 0 = R, 1 = N, 2 = 1st gear
  rpms: 20, // int32
  steerAngle: 24, // float32, -1..1
  speedKmh: 28, // float32
} as const

export const GRAPHICS = {
  packetId: 0, // int32
  status: 4, // int32: 0 = OFF, 1 = REPLAY, 2 = LIVE, 3 = PAUSE
  completedLaps: 132, // int32
  iCurrentTime: 140, // int32, ms of the current lap
  iLastTime: 144, // int32, ms of the last lap
  iBestTime: 148, // int32, ms of the best lap
  isInPit: 160, // int32, 0 or 1
  normalizedCarPosition: 248, // float32, 0..1 along the track
} as const

export const STATIC = {
  smVersion: { offset: 0, chars: 15 },
  acVersion: { offset: 30, chars: 15 },
  carModel: { offset: 68, chars: 33 },
  track: { offset: 134, chars: 33 },
} as const
