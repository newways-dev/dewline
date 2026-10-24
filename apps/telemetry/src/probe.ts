// Step 1 probe: connects to Assetto Corsa shared memory and prints live values once per second.
// Goal: confirm that reading works and that the offsets in ac-layout.ts match what the game shows.
import { SharedMemoryPage } from './winapi.ts'
import {
  GRAPHICS,
  PAGE_NAMES,
  PHYSICS,
  READ_BYTES,
  STATIC,
} from './ac-layout.ts'

const STATUS_NAMES = ['OFF', 'REPLAY', 'LIVE', 'PAUSE']
const RETRY_MS = 2000
const PRINT_MS = 1000

type Pages = {
  physics: SharedMemoryPage
  graphics: SharedMemoryPage
  static: SharedMemoryPage
}

function readWString(view: DataView, offset: number, chars: number): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, chars * 2)
  const text = new TextDecoder('utf-16le').decode(bytes)
  const end = text.indexOf('\0')
  return end === -1 ? text : text.slice(0, end)
}

function gearLabel(raw: number): string {
  if (raw === 0) return 'R'
  if (raw === 1) return 'N'
  return String(raw - 1)
}

function formatLapTime(ms: number): string {
  if (ms <= 0) return '-:--.---'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis = ms % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function openAll(): Pages | null {
  const physics = SharedMemoryPage.open(PAGE_NAMES.physics, READ_BYTES.physics)
  const graphics = SharedMemoryPage.open(
    PAGE_NAMES.graphics,
    READ_BYTES.graphics,
  )
  const staticPage = SharedMemoryPage.open(PAGE_NAMES.static, READ_BYTES.static)
  if (physics && graphics && staticPage) {
    return { physics, graphics, static: staticPage }
  }
  physics?.close()
  graphics?.close()
  staticPage?.close()
  return null
}

function printStatic(pages: Pages): void {
  const s = pages.static.snapshot()
  console.log('Connected to Assetto Corsa shared memory')
  console.log(
    `  shared memory version: ${readWString(s, STATIC.smVersion.offset, STATIC.smVersion.chars)}`,
  )
  console.log(
    `  AC version:            ${readWString(s, STATIC.acVersion.offset, STATIC.acVersion.chars)}`,
  )
  console.log(
    `  car:                   ${readWString(s, STATIC.carModel.offset, STATIC.carModel.chars)}`,
  )
  console.log(
    `  track:                 ${readWString(s, STATIC.track.offset, STATIC.track.chars)}`,
  )
  console.log('')
}

function printLive(pages: Pages, lastPacketId: number): number {
  const p = pages.physics.snapshot()
  const g = pages.graphics.snapshot()
  const le = true // Windows x64 is little-endian

  const packetId = p.getInt32(PHYSICS.packetId, le)
  const status = STATUS_NAMES[g.getInt32(GRAPHICS.status, le)] ?? 'UNKNOWN'
  const fresh =
    packetId !== lastPacketId ? '' : '  (no new data: paused or in menu)'

  const line = [
    `status=${status}`,
    `lap=${g.getInt32(GRAPHICS.completedLaps, le) + 1}`,
    `pos=${g.getFloat32(GRAPHICS.normalizedCarPosition, le).toFixed(3)}`,
    `speed=${p.getFloat32(PHYSICS.speedKmh, le).toFixed(1)} km/h`,
    `gas=${Math.round(p.getFloat32(PHYSICS.gas, le) * 100)}%`,
    `brake=${Math.round(p.getFloat32(PHYSICS.brake, le) * 100)}%`,
    `gear=${gearLabel(p.getInt32(PHYSICS.gear, le))}`,
    `rpm=${p.getInt32(PHYSICS.rpms, le)}`,
    `steer=${p.getFloat32(PHYSICS.steerAngle, le).toFixed(2)}`,
    `time=${formatLapTime(g.getInt32(GRAPHICS.iCurrentTime, le))}`,
    `last=${formatLapTime(g.getInt32(GRAPHICS.iLastTime, le))}`,
    `pit=${g.getInt32(GRAPHICS.isInPit, le)}`,
  ].join('  ')

  console.log(line + fresh)
  return packetId
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
  let pages: Pages | null = null
  while (!pages) {
    pages = openAll()
    if (!pages) {
      console.log('Waiting for Assetto Corsa... (start a session in the game)')
      await sleep(RETRY_MS)
    }
  }

  const connected = pages
  process.on('SIGINT', () => {
    connected.physics.close()
    connected.graphics.close()
    connected.static.close()
    console.log('\nStopped.')
    process.exit(0)
  })

  printStatic(connected)
  let lastPacketId = -1
  for (;;) {
    lastPacketId = printLive(connected, lastPacketId)
    await sleep(PRINT_MS)
  }
}

await main()
