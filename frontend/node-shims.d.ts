// The workspace intentionally avoids a registry dependency for Vite's dev-only image route.
declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array
}
declare module 'node:path' {
  export function join(...paths: string[]): string
}
declare module 'node:url' {
  export function fileURLToPath(url: URL): string
}
