declare module 'react-simple-maps' {
  import type { ReactNode, SVGProps, MouseEvent } from 'react'

  export interface ProjectionConfig {
    rotate?: [number, number, number]
    center?: [number, number]
    scale?: number
    parallels?: [number, number]
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: ProjectionConfig
    width?: number
    height?: number
    style?: React.CSSProperties
    className?: string
    children?: ReactNode
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element

  export interface GeographiesChildrenProps {
    geographies: GeoFeature[]
    outline: GeoFeature
    borders: GeoFeature
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: GeographiesChildrenProps) => ReactNode
    parseGeographies?: (features: GeoFeature[]) => GeoFeature[]
  }

  export function Geographies(props: GeographiesProps): JSX.Element

  export interface GeoFeature {
    rsmKey: string
    id: string | number
    type: string
    properties: Record<string, string | number | undefined>
    geometry: object
  }

  export interface GeographyStyle {
    fill?: string
    stroke?: string
    strokeWidth?: number
    outline?: string
    cursor?: string
  }

  export interface GeographyStyleProp {
    default?: GeographyStyle
    hover?: GeographyStyle
    pressed?: GeographyStyle
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeoFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: GeographyStyleProp
    onMouseEnter?: (event: MouseEvent<SVGPathElement>) => void
    onMouseLeave?: (event: MouseEvent<SVGPathElement>) => void
    onClick?: (event: MouseEvent<SVGPathElement>) => void
    className?: string
  }

  export function Geography(props: GeographyProps): JSX.Element

  export interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
    className?: string
    style?: GeographyStyleProp
    onMouseEnter?: (event: MouseEvent<SVGGElement>) => void
    onMouseLeave?: (event: MouseEvent<SVGGElement>) => void
    onClick?: (event: MouseEvent<SVGGElement>) => void
  }

  export function Marker(props: MarkerProps): JSX.Element

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    translateExtent?: [[number, number], [number, number]]
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }, event: MouseEvent) => void
    onMove?: (position: { x: number; y: number; zoom: number; dragging: boolean }, event: MouseEvent) => void
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }, event: MouseEvent) => void
    children?: ReactNode
    className?: string
    style?: React.CSSProperties
  }

  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element

  export interface SphereProps extends SVGProps<SVGPathElement> {
    id?: string
    fill?: string
    stroke?: string
    strokeWidth?: number
  }

  export function Sphere(props: SphereProps): JSX.Element

  export interface GraticuleProps extends SVGProps<SVGPathElement> {
    step?: [number, number]
    fill?: string
    stroke?: string
    strokeWidth?: number
  }

  export function Graticule(props: GraticuleProps): JSX.Element
}
