<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Card } from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import {
  Bath,
  Clock,
  Coffee,
  DoorOpen,
  Droplets,
  Footprints,
  Info,
  LogOut,
  MapPin,
  Minus,
  Plus,
  ShieldPlus,
  Users,
  X,
  Zap
} from 'lucide-svelte'

interface RoomData {
  id: string
  name: string
  capacity?: number
  floor?: string
  order: number
}

interface SlotData {
  id: string
  roomId: string
  date: string
  startTime: string
  endTime: string
}

interface SessionData {
  id: string
  title: string
  slotId: string
  trackId?: string
  type: string
  talkId?: string
}

interface TrackData {
  id: string
  name: string
  color?: string
}

interface FloorAmenityData {
  floor: string
  amenities: string[]
}

interface Props {
  rooms: RoomData[]
  sessions: SessionData[]
  slots: SlotData[]
  tracks: TrackData[]
  floorAmenities?: FloorAmenityData[]
  selectedRoomId?: string | null
  editionSlug: string
  onClose: () => void
  onSelectSession?: (sessionId: string) => void
}

function getAmenityLabel(type: string): string {
  const labels: Record<string, () => string> = {
    toilets: () => m.amenity_toilets(),
    elevator: () => m.amenity_elevator(),
    stairs: () => m.amenity_stairs(),
    cafeteria: () => m.amenity_cafeteria(),
    water_fountain: () => m.amenity_water_fountain(),
    first_aid: () => m.amenity_first_aid(),
    cloakroom: () => m.amenity_cloakroom(),
    charging_station: () => m.amenity_charging_station(),
    info_desk: () => m.amenity_info_desk(),
    exit: () => m.amenity_exit()
  }
  return labels[type]?.() ?? type
}

const {
  rooms,
  sessions,
  slots,
  tracks,
  floorAmenities = [],
  selectedRoomId = null,
  editionSlug: _editionSlug,
  onClose,
  onSelectSession
}: Props = $props()

function getFloorAmenities(floor: string): string[] {
  const entry = floorAmenities.find((fa) => fa.floor === floor)
  return entry?.amenities ?? []
}

// Transform state
let scale = $state(1)
let panX = $state(0)
let panY = $state(0)
let lastTouchDist = $state(0)
let lastTouchMidX = $state(0)
let lastTouchMidY = $state(0)
let isPanning = $state(false)
let isDragging = $state(false)
let dragStartX = $state(0)
let dragStartY = $state(0)
let dragStartPanX = $state(0)
let dragStartPanY = $state(0)
let activeRoomId = $state<string | null>(selectedRoomId ?? null)

const MIN_SCALE = 0.5
const MAX_SCALE = 3
const ZOOM_STEP = 0.25

// Isometric floor slab dimensions (internal SVG units)
const FLOOR_W = 320
const ISO_DX = 60
const ISO_DY = 20
const WALL_H = 75
const VB_W = FLOOR_W + ISO_DX + 2
const VB_H = ISO_DY + WALL_H + 2

// Group rooms by floor (descending: highest floor at top, floor 0 at bottom)
const floorGroups = $derived(() => {
  const groups = new Map<string, RoomData[]>()
  const sortedRooms = [...rooms].sort((a, b) => a.order - b.order)

  for (const room of sortedRooms) {
    const floor = room.floor || '__main__'
    if (!groups.has(floor)) {
      groups.set(floor, [])
    }
    groups.get(floor)?.push(room)
  }

  const entries = Array.from(groups.entries()).sort((a, b) => {
    if (a[0] === '__main__') return 1
    if (b[0] === '__main__') return -1
    return b[0].localeCompare(a[0], undefined, { numeric: true })
  })

  return entries.map(([floor, floorRooms]) => ({
    floor,
    label: floor === '__main__' ? m.app_map_no_floor() : m.app_map_floor({ floor }),
    rooms: floorRooms
  }))
})

interface RoomLayout {
  room: RoomData
  x1: number
  x2: number
  cx: number
  cy: number
  widthUnits: number
}

// Compute room positions for a floor (proportional to capacity, filling full width)
function computeFloorLayout(floorRooms: RoomData[]): RoomLayout[] {
  const totalCap = floorRooms.reduce((sum, r) => sum + (r.capacity || 50), 0)
  let accum = 0
  return floorRooms.map((room) => {
    const cap = room.capacity || 50
    const x1 = (accum / totalCap) * FLOOR_W
    accum += cap
    const x2 = (accum / totalCap) * FLOOR_W
    return {
      room,
      x1,
      x2,
      cx: (x1 + x2) / 2 + ISO_DX / 2,
      cy: ISO_DY / 2,
      widthUnits: x2 - x1
    }
  })
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Session lookup with time comparison
function getCurrentSession(
  roomId: string
): { session: SessionData; slot: SlotData; track?: TrackData } | null {
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  for (const slot of slots) {
    const slotDate = typeof slot.date === 'string' ? slot.date.split('T')[0] : ''
    if (slot.roomId !== roomId || slotDate !== currentDate) continue
    if (slot.startTime <= currentTime && slot.endTime > currentTime) {
      const session = sessions.find((s) => s.slotId === slot.id)
      if (session) {
        const track = session.trackId ? tracks.find((t) => t.id === session.trackId) : undefined
        return { session, slot, track }
      }
    }
  }
  return null
}

// Get next session for a room
function getNextSession(
  roomId: string
): { session: SessionData; slot: SlotData; track?: TrackData } | null {
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const upcoming = slots
    .filter((slot) => {
      const slotDate = typeof slot.date === 'string' ? slot.date.split('T')[0] : ''
      return (
        slot.roomId === roomId &&
        (slotDate > currentDate || (slotDate === currentDate && slot.startTime > currentTime))
      )
    })
    .sort((a, b) => {
      const dateA = typeof a.date === 'string' ? a.date.split('T')[0] : ''
      const dateB = typeof b.date === 'string' ? b.date.split('T')[0] : ''
      const dateComp = dateA.localeCompare(dateB)
      if (dateComp !== 0) return dateComp
      return a.startTime.localeCompare(b.startTime)
    })

  for (const slot of upcoming) {
    const session = sessions.find((s) => s.slotId === slot.id)
    if (session) {
      const track = session.trackId ? tracks.find((t) => t.id === session.trackId) : undefined
      return { session, slot, track }
    }
  }
  return null
}

// Selected room detail
const selectedRoomDetails = $derived(() => {
  if (!activeRoomId) return null
  const room = rooms.find((r) => r.id === activeRoomId)
  if (!room) return null
  const current = getCurrentSession(activeRoomId)
  const next = getNextSession(activeRoomId)
  return { room, current, next }
})

// Zoom
function zoomIn(): void {
  scale = Math.min(MAX_SCALE, scale + ZOOM_STEP)
}
function zoomOut(): void {
  scale = Math.max(MIN_SCALE, scale - ZOOM_STEP)
}

// Select
function selectRoom(roomId: string): void {
  activeRoomId = activeRoomId === roomId ? null : roomId
}

// Keyboard
function handleMapKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case 'Escape':
      event.preventDefault()
      if (activeRoomId) activeRoomId = null
      else onClose()
      break
  }
}

// Touch
function handleTouchStart(event: TouchEvent): void {
  if (event.touches.length === 2) {
    const dx = event.touches[0].clientX - event.touches[1].clientX
    const dy = event.touches[0].clientY - event.touches[1].clientY
    lastTouchDist = Math.sqrt(dx * dx + dy * dy)
    lastTouchMidX = (event.touches[0].clientX + event.touches[1].clientX) / 2
    lastTouchMidY = (event.touches[0].clientY + event.touches[1].clientY) / 2
  } else if (event.touches.length === 1) {
    isPanning = true
    dragStartX = event.touches[0].clientX
    dragStartY = event.touches[0].clientY
    dragStartPanX = panX
    dragStartPanY = panY
  }
}

function handleTouchMove(event: TouchEvent): void {
  if (event.touches.length === 2) {
    event.preventDefault()
    const dx = event.touches[0].clientX - event.touches[1].clientX
    const dy = event.touches[0].clientY - event.touches[1].clientY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (lastTouchDist > 0) {
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * (dist / lastTouchDist)))
    }
    const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2
    const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2
    panX += midX - lastTouchMidX
    panY += midY - lastTouchMidY
    lastTouchMidX = midX
    lastTouchMidY = midY
    lastTouchDist = dist
  } else if (event.touches.length === 1 && isPanning) {
    panX = dragStartPanX + (event.touches[0].clientX - dragStartX)
    panY = dragStartPanY + (event.touches[0].clientY - dragStartY)
  }
}

function handleTouchEnd(): void {
  lastTouchDist = 0
  isPanning = false
}

// Mouse drag
function handleMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return
  isDragging = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragStartPanX = panX
  dragStartPanY = panY
}
function handleMouseMove(event: MouseEvent): void {
  if (!isDragging) return
  panX = dragStartPanX + (event.clientX - dragStartX)
  panY = dragStartPanY + (event.clientY - dragStartY)
}
function handleMouseUp(): void {
  isDragging = false
}

// Wheel zoom (non-passive for preventDefault)
function wheelZoom(node: HTMLElement): { destroy: () => void } {
  function handler(event: WheelEvent): void {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta))
  }
  node.addEventListener('wheel', handler, { passive: false })
  return {
    destroy() {
      node.removeEventListener('wheel', handler)
    }
  }
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return `${text.substring(0, maxLen - 1)}…`
}

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function getRoomAriaLabel(room: RoomData): string {
  const parts = [room.name]
  if (room.capacity) parts.push(m.app_map_capacity({ capacity: String(room.capacity) }))
  const current = getCurrentSession(room.id)
  if (current) {
    parts.push(`${m.app_map_current_session()}: ${current.session.title}`)
  } else {
    const next = getNextSession(room.id)
    if (next) parts.push(`${m.app_map_next_session()}: ${next.session.title}`)
    else parts.push(m.app_map_no_session())
  }
  return parts.join(', ')
}
</script>

<div
	class="venue-map fixed inset-0 z-[90] flex flex-col bg-background"
	role="dialog"
	aria-modal="true"
	aria-label={m.app_map_title()}
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
		<div class="flex items-center gap-2">
			<MapPin class="h-5 w-5 text-primary" />
			<h2 class="text-lg font-semibold">{m.app_map_title()}</h2>
		</div>
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="icon" class="h-8 w-8" onclick={zoomOut} disabled={scale <= MIN_SCALE} aria-label={m.app_map_zoom_out()} data-testid="map-zoom-out">
				<Minus class="h-4 w-4" />
			</Button>
			<span class="min-w-[3rem] text-center text-xs text-muted-foreground" aria-live="polite">{Math.round(scale * 100)}%</span>
			<Button variant="ghost" size="icon" class="h-8 w-8" onclick={zoomIn} disabled={scale >= MAX_SCALE} aria-label={m.app_map_zoom_in()} data-testid="map-zoom-in">
				<Plus class="h-4 w-4" />
			</Button>
			<Button variant="ghost" size="icon" class="h-8 w-8 ml-2" onclick={onClose} aria-label={m.app_map_close()} data-testid="map-close">
				<X class="h-5 w-5" />
			</Button>
		</div>
	</div>

	<!-- Map area with vignette -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="flex-1 overflow-hidden touch-none cursor-grab active:cursor-grabbing"
		role="application"
		aria-label={m.app_map_title()}
		aria-roledescription="interactive map"
		tabindex="0"
		onkeydown={handleMapKeydown}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		use:wheelZoom
		data-testid="venue-map-svg"
	>
		<div
			class="mx-auto flex min-h-full max-w-2xl flex-col justify-end px-4 pb-8 pt-4"
			style="transform: scale({scale}) translate({panX / scale}px, {panY / scale}px); transform-origin: center center;"
		>
			{#each floorGroups() as group}
				{@const layouts = computeFloorLayout(group.rooms)}
				<div class="mb-6">
					<!-- Floor label with decorative lines -->
					<div class="mb-3 flex items-center gap-3">
						<div class="h-px flex-1 bg-gradient-to-r from-transparent to-border"></div>
						<p class="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{group.label}</p>
						<div class="h-px flex-1 bg-gradient-to-l from-transparent to-border"></div>
					</div>

					<!-- Isometric floor slab -->
					<svg viewBox="0 0 {VB_W} {VB_H}" class="w-full h-auto" preserveAspectRatio="xMidYMid meet" overflow="visible">
						<defs>
							<!-- Glow filter for selected room -->
							<filter id="selectedGlow-{group.floor}" x="-20%" y="-20%" width="140%" height="140%">
								<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
								<feComposite in="SourceGraphic" in2="blur" operator="over" />
							</filter>

							<!-- Live dot glow -->
							<filter id="dotGlow-{group.floor}" x="-100%" y="-100%" width="300%" height="300%">
								<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
							</filter>
						</defs>

						<!-- Layer 1: Per-room — front face only is interactive -->
						{#each layouts as layout}
							{@const isSelected = layout.room.id === activeRoomId}
							{@const current = getCurrentSession(layout.room.id)}
							{@const tc = current?.track?.color}
							{@const maxChars = Math.max(4, Math.floor(layout.widthUnits / 5))}

							<!-- Front face clickable area (transparent, only for interaction) -->
							<rect
								x={layout.x1}
								y={ISO_DY}
								width={layout.x2 - layout.x1}
								height={WALL_H}
								fill={isSelected ? (tc || 'var(--color-primary, #3b82f6)') : 'transparent'}
								opacity={isSelected ? 0.1 : 0}
								class="cursor-pointer" style="transition: opacity 0.3s ease"
								role="button"
								tabindex="-1"
								aria-label={getRoomAriaLabel(layout.room)}
								onclick={(e) => { e.stopPropagation(); selectRoom(layout.room.id) }}
								data-testid="map-room-{layout.room.id}"
							/>

							{@const frontCx = (layout.x1 + layout.x2) / 2}
							{@const frontCy = ISO_DY + WALL_H / 2}

							<!-- Room name on front face -->
							<text
								x={frontCx}
								y={frontCy - 14}
								text-anchor="middle"
								dominant-baseline="middle"
								class="pointer-events-none fill-current text-foreground"
								font-size="11"
								font-weight="600"
								letter-spacing="0.5"

							>
								{truncateText(layout.room.name, maxChars)}
							</text>

							<!-- Session info on front face -->
							<text
								x={frontCx}
								y={frontCy + 4}
								text-anchor="middle"
								dominant-baseline="middle"
								class="pointer-events-none fill-current {current ? 'text-foreground' : 'text-muted-foreground'}"
								font-size={current ? '11' : '10'}

							>
								{current
									? truncateText(current.session.title, maxChars)
									: m.app_map_no_session()}
							</text>

							<!-- Time on front face -->
							{#if current}
								<text
									x={frontCx}
									y={frontCy + 18}
									text-anchor="middle"
									dominant-baseline="middle"
									class="pointer-events-none fill-current text-muted-foreground"
									font-size="8"
	
								>
									{formatTime(current.slot.startTime)} – {formatTime(current.slot.endTime)}
								</text>
							{/if}

							<!-- Capacity bottom of front face -->
							{#if layout.room.capacity}
								<text
									x={frontCx}
									y={ISO_DY + WALL_H - 8}
									text-anchor="middle"
									dominant-baseline="middle"
									class="pointer-events-none fill-current text-muted-foreground"
									font-size="9"
									opacity="0.7"
								>
									{layout.room.capacity} places
								</text>
							{/if}

							<!-- Door(s) on front face sides -->
							{@const doorH = WALL_H * 0.7}
							{@const doorBottom = ISO_DY + WALL_H}
							{@const doorTop = doorBottom - doorH}
							{@const doorW = 26}
							{@const isDoubleDoor = layout.widthUnits > FLOOR_W * 0.5}
							{#if isDoubleDoor}
								{@const gap = 1.5}
								{@const leftDoorX = layout.x1 + 6}
								{@const rightDoorX = layout.x2 - doorW - 6}
								<!-- Left double door -->
								<rect x={leftDoorX} y={doorTop} width={doorW / 2 - gap / 2} height={doorH} fill="none" stroke="var(--color-border, #3f3f46)" stroke-width="0.6" stroke-opacity="0.4" class="pointer-events-none" />
								<rect x={leftDoorX + doorW / 2 + gap / 2} y={doorTop} width={doorW / 2 - gap / 2} height={doorH} fill="none" stroke="var(--color-border, #3f3f46)" stroke-width="0.6" stroke-opacity="0.4" class="pointer-events-none" />
								<circle cx={leftDoorX + doorW / 2 - gap / 2 - 1} cy={doorTop + doorH / 2} r="0.8" fill="var(--color-border, #3f3f46)" opacity="0.5" class="pointer-events-none" />
								<circle cx={leftDoorX + doorW / 2 + gap / 2 + 1} cy={doorTop + doorH / 2} r="0.8" fill="var(--color-border, #3f3f46)" opacity="0.5" class="pointer-events-none" />
								<!-- Right double door -->
								<rect x={rightDoorX} y={doorTop} width={doorW / 2 - gap / 2} height={doorH} fill="none" stroke="var(--color-border, #3f3f46)" stroke-width="0.6" stroke-opacity="0.4" class="pointer-events-none" />
								<rect x={rightDoorX + doorW / 2 + gap / 2} y={doorTop} width={doorW / 2 - gap / 2} height={doorH} fill="none" stroke="var(--color-border, #3f3f46)" stroke-width="0.6" stroke-opacity="0.4" class="pointer-events-none" />
								<circle cx={rightDoorX + doorW / 2 - gap / 2 - 1} cy={doorTop + doorH / 2} r="0.8" fill="var(--color-border, #3f3f46)" opacity="0.5" class="pointer-events-none" />
								<circle cx={rightDoorX + doorW / 2 + gap / 2 + 1} cy={doorTop + doorH / 2} r="0.8" fill="var(--color-border, #3f3f46)" opacity="0.5" class="pointer-events-none" />
							{:else}
								{@const singleDoorX = layout.x1 + 6}
								<!-- Single door on left side -->
								<rect x={singleDoorX} y={doorTop} width={doorW} height={doorH} fill="none" stroke="var(--color-border, #3f3f46)" stroke-width="0.6" stroke-opacity="0.4" class="pointer-events-none" />
								<circle cx={singleDoorX + doorW - 2} cy={doorTop + doorH / 2} r="0.8" fill="var(--color-border, #3f3f46)" opacity="0.5" class="pointer-events-none" />
							{/if}

							<!-- "Now" beacon on top face -->
							{#if current}
								<!-- Glow halo -->
								<circle
									cx={layout.x1 + ISO_DX + 8}
									cy={8}
									r="6"
									fill="#22c55e"
									filter="url(#dotGlow-{group.floor})"
									opacity="0.5"
									class="pointer-events-none"
								/>
								<!-- Ripple ring 1 -->
								<circle
									cx={layout.x1 + ISO_DX + 8}
									cy={8}
									r="4"
									fill="none"
									stroke="#22c55e"
									stroke-width="1"
									class="pointer-events-none"
								>
									<animate attributeName="r" values="4;10" dur="2s" repeatCount="indefinite" />
									<animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
								</circle>
								<!-- Ripple ring 2 (staggered) -->
								<circle
									cx={layout.x1 + ISO_DX + 8}
									cy={8}
									r="4"
									fill="none"
									stroke="#22c55e"
									stroke-width="0.75"
									class="pointer-events-none"
								>
									<animate attributeName="r" values="4;10" dur="2s" begin="0.8s" repeatCount="indefinite" />
									<animate attributeName="opacity" values="0.4;0" dur="2s" begin="0.8s" repeatCount="indefinite" />
								</circle>
								<!-- Core dot -->
								<circle
									cx={layout.x1 + ISO_DX + 8}
									cy={8}
									r="3"
									fill="#22c55e"
									class="pointer-events-none"
								/>
							{/if}
						{/each}

						<!-- Layer 2: Wireframe edges -->
						<!-- Outer top face -->
						<polygon
							points="0,{ISO_DY} {FLOOR_W},{ISO_DY} {VB_W - 4},0 {ISO_DX},0"
							fill="none"
							stroke="var(--color-border, #3f3f46)"
							stroke-width="0.8"
							stroke-opacity="0.6"
							stroke-linejoin="round"
							class="pointer-events-none"
						/>
						<!-- Front face -->
						<polygon
							points="0,{ISO_DY} {FLOOR_W},{ISO_DY} {FLOOR_W},{ISO_DY + WALL_H} 0,{ISO_DY + WALL_H}"
							fill="none"
							stroke="var(--color-border, #3f3f46)"
							stroke-width="0.8"
							stroke-opacity="0.6"
							stroke-linejoin="round"
							class="pointer-events-none"
						/>
						<!-- Right side face -->
						<polygon
							points="{FLOOR_W},{ISO_DY} {VB_W - 4},0 {VB_W - 4},{WALL_H} {FLOOR_W},{ISO_DY + WALL_H}"
							fill="none"
							stroke="var(--color-border, #3f3f46)"
							stroke-width="0.8"
							stroke-opacity="0.4"
							stroke-linejoin="round"
							class="pointer-events-none"
						/>

						<!-- Room divider lines (solid) -->
						{#each layouts as layout, i}
							{#if i > 0}
								<!-- Top face divider -->
								<line
									x1={layout.x1}
									y1={ISO_DY}
									x2={layout.x1 + ISO_DX}
									y2={0}
									stroke="var(--color-border, #3f3f46)"
									stroke-width="0.8"
									stroke-opacity="0.5"
									class="pointer-events-none"
								/>
								<!-- Front face divider -->
								<line
									x1={layout.x1}
									y1={ISO_DY}
									x2={layout.x1}
									y2={ISO_DY + WALL_H}
									stroke="var(--color-border, #3f3f46)"
									stroke-width="0.8"
									stroke-opacity="0.5"
									class="pointer-events-none"
								/>
							{/if}
						{/each}

						<!-- Selected room highlight (front face glow + outline) -->
						{#each layouts as layout}
							{#if layout.room.id === activeRoomId}
								<!-- Glow layer -->
								<rect
									x={layout.x1}
									y={ISO_DY}
									width={layout.x2 - layout.x1}
									height={WALL_H}
									fill="none"
									stroke="var(--color-primary, #3b82f6)"
									stroke-width="3"
									stroke-opacity="0.4"
									rx="2"
									filter="url(#selectedGlow-{group.floor})"
									class="pointer-events-none" style="animation: venue-glow-pulse 2.5s ease-in-out infinite"
								/>
								<!-- Crisp border -->
								<rect
									x={layout.x1}
									y={ISO_DY}
									width={layout.x2 - layout.x1}
									height={WALL_H}
									fill="none"
									stroke="var(--color-primary, #3b82f6)"
									stroke-width="1.5"
									rx="2"
									class="pointer-events-none"
								/>
							{/if}
						{/each}
					</svg>

					<!-- Floor amenities badges -->
					{#if getFloorAmenities(group.floor).length > 0}
						<div class="mt-2 flex flex-wrap gap-2">
							{#each getFloorAmenities(group.floor) as amenity}
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
									title={getAmenityLabel(amenity)}
								>
									{#if amenity === 'toilets'}
										<Bath class="h-3.5 w-3.5" />
									{:else if amenity === 'elevator'}
										<DoorOpen class="h-3.5 w-3.5" />
									{:else if amenity === 'stairs'}
										<Footprints class="h-3.5 w-3.5" />
									{:else if amenity === 'cafeteria'}
										<Coffee class="h-3.5 w-3.5" />
									{:else if amenity === 'water_fountain'}
										<Droplets class="h-3.5 w-3.5" />
									{:else if amenity === 'first_aid'}
										<ShieldPlus class="h-3.5 w-3.5" />
									{:else if amenity === 'cloakroom'}
										<Footprints class="h-3.5 w-3.5" />
									{:else if amenity === 'charging_station'}
										<Zap class="h-3.5 w-3.5" />
									{:else if amenity === 'info_desk'}
										<Info class="h-3.5 w-3.5" />
									{:else if amenity === 'exit'}
										<LogOut class="h-3.5 w-3.5" />
									{/if}
									<span>{getAmenityLabel(amenity)}</span>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Selected room detail panel -->
	{#if selectedRoomDetails()}
		{@const details = selectedRoomDetails()!}
		<div
			class="border-t bg-card/90 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm safe-area-bottom"
			role="region"
			aria-live="polite"
			aria-label="{details.room.name} details"
			data-testid="map-room-details"
		>
			<div class="mx-auto max-w-4xl">
				<div class="flex items-start justify-between">
					<div>
						<h3 class="font-semibold">{details.room.name}</h3>
						<div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
							{#if details.room.capacity}
								<span class="flex items-center gap-1">
									<Users class="h-3 w-3" />
									{m.app_map_capacity({ capacity: String(details.room.capacity) })}
								</span>
							{/if}
							{#if details.room.floor}
								<span class="flex items-center gap-1">
									<MapPin class="h-3 w-3" />
									{m.app_map_floor({ floor: details.room.floor })}
								</span>
							{/if}
						</div>
					</div>
					<Button variant="ghost" size="icon" class="h-7 w-7 shrink-0" onclick={() => (activeRoomId = null)} aria-label={m.app_map_close()}>
						<X class="h-4 w-4" />
					</Button>
				</div>

				<div class="mt-3 space-y-2">
					{#if details.current}
						<Card class="p-3">
							<div class="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
								<span class="relative flex h-2 w-2">
									<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
									<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
								</span>
								{m.app_map_current_session()}
							</div>
							<button type="button" class="mt-1 w-full text-left" onclick={() => { if (onSelectSession && details.current) onSelectSession(details.current.session.id) }}>
								<p class="text-sm font-medium hover:underline">{details.current.session.title}</p>
							</button>
							<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
								<Clock class="h-3 w-3" />
								<span>{formatTime(details.current.slot.startTime)} - {formatTime(details.current.slot.endTime)}</span>
								{#if details.current.track}
									<span class="inline-block h-2 w-2 rounded-full" style="background-color: {details.current.track.color}"></span>
									<span>{details.current.track.name}</span>
								{/if}
							</div>
						</Card>
					{/if}

					{#if details.next}
						<Card class="p-3">
							<div class="text-xs text-muted-foreground">{m.app_map_next_session()}</div>
							<button type="button" class="mt-1 w-full text-left" onclick={() => { if (onSelectSession && details.next) onSelectSession(details.next.session.id) }}>
								<p class="text-sm font-medium hover:underline">{details.next.session.title}</p>
							</button>
							<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
								<Clock class="h-3 w-3" />
								<span>{formatTime(details.next.slot.startTime)} - {formatTime(details.next.slot.endTime)}</span>
								{#if details.next.track}
									<span class="inline-block h-2 w-2 rounded-full" style="background-color: {details.next.track.color}"></span>
									<span>{details.next.track.name}</span>
								{/if}
							</div>
						</Card>
					{/if}

					{#if !details.current && !details.next}
						<p class="text-sm text-muted-foreground">{m.app_map_no_session()}</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

