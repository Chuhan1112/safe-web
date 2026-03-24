import type { ComponentType } from 'react'

export interface PrivateOverlayMeta {
  label?: string
  description?: string
  preferredView?: 'safe' | 'private'
}

export interface PrivateOverlayModule {
  default: ComponentType
  overlayMeta?: PrivateOverlayMeta
}
