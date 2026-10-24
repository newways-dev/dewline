// Minimal Win32 bindings for reading named shared memory (memory-mapped files) via Koffi.
import koffi from 'koffi'

const kernel32 = koffi.load('kernel32.dll')

// HANDLE OpenFileMappingW(DWORD dwDesiredAccess, BOOL bInheritHandle, LPCWSTR lpName)
const OpenFileMappingW = kernel32.func(
  '__stdcall',
  'OpenFileMappingW',
  'void *',
  ['uint32', 'int', 'str16'],
)
// LPVOID MapViewOfFile(HANDLE hFileMappingObject, DWORD dwDesiredAccess, DWORD dwFileOffsetHigh, DWORD dwFileOffsetLow, SIZE_T dwNumberOfBytesToMap)
const MapViewOfFile = kernel32.func('__stdcall', 'MapViewOfFile', 'void *', [
  'void *',
  'uint32',
  'uint32',
  'uint32',
  'size_t',
])
// BOOL UnmapViewOfFile(LPCVOID lpBaseAddress)
const UnmapViewOfFile = kernel32.func('__stdcall', 'UnmapViewOfFile', 'int', [
  'void *',
])
// BOOL CloseHandle(HANDLE hObject)
const CloseHandle = kernel32.func('__stdcall', 'CloseHandle', 'int', ['void *'])

const FILE_MAP_READ = 0x0004

/** A read-only view of one named shared memory page. */
export class SharedMemoryPage {
  readonly #handle: unknown
  readonly #base: unknown
  readonly #length: number
  #closed = false

  private constructor(handle: unknown, base: unknown, length: number) {
    this.#handle = handle
    this.#base = base
    this.#length = length
  }

  /** Opens the page. Returns null when the game has not created it (yet). */
  static open(name: string, length: number): SharedMemoryPage | null {
    const handle = OpenFileMappingW(FILE_MAP_READ, 0, name)
    if (!handle) return null

    const base = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, length)
    if (!base) {
      CloseHandle(handle)
      return null
    }
    return new SharedMemoryPage(handle, base, length)
  }

  /** Copies the current bytes, so the values do not change while we read them. */
  snapshot(): DataView {
    const live: ArrayBuffer = koffi.view(this.#base, this.#length)
    return new DataView(live.slice(0))
  }

  close(): void {
    if (this.#closed) return
    UnmapViewOfFile(this.#base)
    CloseHandle(this.#handle)
    this.#closed = true
  }
}
