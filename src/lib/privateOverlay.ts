import type { PrivateOverlayModule } from '@/types/privateOverlay'

const privateOverlayModules = import.meta.glob<PrivateOverlayModule>('../private/index.{ts,tsx}')

export function isPrivateOverlayEnabled() {
  return import.meta.env.VITE_ENABLE_PRIVATE_OVERLAY !== '0'
}

export function hasPrivateOverlayModule() {
  return Object.keys(privateOverlayModules).length > 0
}

export async function loadPrivateOverlay() {
  if (!isPrivateOverlayEnabled()) return null

  const loader = Object.values(privateOverlayModules)[0]
  if (!loader) return null

  return loader()
}
