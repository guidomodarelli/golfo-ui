"use client"

/**
 * Arc's Switch (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a pill track that crossfades between its
 * two fills while the thumb glides on a critically damped spring. Held down, the thumb widens toward the other side
 * with its far edge anchored, like a finger on it. With a `label` the text sits inside the control; without it the
 * switch renders the bare track, for rows that place their own label.
 */
import { useEffect, useRef, useState } from "react"
import type { ComponentProps } from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { animate, frameData, motion, useMotionValue } from "motion/react"
import type { MotionValue, Transition } from "motion/react"

import {
  SWITCH_CHANGE_STRETCH,
  SWITCH_PRESS_RELEASE_WINDOW_MS,
  SWITCH_PRESS_STRETCH_PX,
  SWITCH_PRIMARY_POINTER_BUTTON,
  SWITCH_THUMB_GEOMETRY_PX,
  SWITCH_THUMB_GLIDE_SPRING,
  SWITCH_TOGGLE_KEY,
} from "../constants/switch.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"

export type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> & {
  /** Visible text rendered inside the control, after the track; also its `aria-label` when none is passed. */
  label?: string
}

/**
 * Arc's control recipe. The bare switch keeps the track's own box and widens its hit area with a pseudo-element, so
 * rows that already lay it out do not grow; with a label it takes Arc's full control height. Hover only answers on
 * hover-capable fine pointers, and keyboard focus uses the theme's focus outline.
 */
const switchClassName =
  "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center gap-(--space-3) rounded-(--radius-pill) border-0 bg-transparent p-0 font-sans text-sm text-foreground [-webkit-tap-highlight-color:transparent] after:absolute after:-inset-x-2 after:-inset-y-2.5 disabled:cursor-not-allowed disabled:opacity-50 data-[labelled]:min-h-(--control-height-md) data-[labelled]:rounded-(--radius-control) data-[labelled]:after:hidden hover-fine:data-[state=unchecked]:not-disabled:[&_[data-slot=switch-track]]:bg-(--control-track-hover)"

/** Fixed box: the thumb moves inside it with transforms, so nothing around the switch shifts. */
const trackClassName =
  "relative isolate box-border flex flex-none items-center rounded-(--radius-pill) bg-(--control-track) transition-[background-color] duration-(--duration-fast) ease-(--ease-standard) before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:bg-(--control-on) before:opacity-0 before:transition-opacity before:duration-(--duration-standard) before:ease-(--ease-standard) group-data-[state=checked]/switch:before:opacity-100 group-aria-invalid/switch:shadow-[0_0_0_1px_var(--danger)] h-6 w-[42px] p-[3px] motion-reduce:transition-none motion-reduce:before:transition-none"

// No `will-change`: on iOS Safari a permanent layer lets the checked thumb (moved with `transform`) snap about 1px
// above or below its track's center. Motion promotes the thumb only while it glides.
const thumbClassName =
  "pointer-events-none block flex-none rounded-(--radius-pill) bg-(--control-thumb) shadow-(--control-thumb-shadow) transition-[background-color] duration-(--duration-standard) ease-(--ease-standard) group-data-[state=checked]/switch:bg-(--control-thumb-on) h-[18px] motion-reduce:transition-none"

/** The thumb values last written to the screen, which an interrupted glide continues from. */
type PaintedThumb = { x: number; width: number; scaleX: number }

/**
 * Springs a thumb value to its target from where it was last painted, carrying its velocity. Motion samples a stopped
 * animation at the current time, ahead of the last painted frame, and renders that sample right after the commit, so
 * a reversed glide would otherwise jump by up to a frame of travel, more when frames run long.
 * @param value - The motion value to animate.
 * @param paintedValue - The value last written to the screen.
 * @param target - Where the value should settle.
 * @param transition - Spring to travel on.
 * @returns The running animation, or `undefined` when the value already rests on its target.
 */
function glideFromPainted(value: MotionValue<number>, paintedValue: number, target: number, transition: Transition) {
  if (!value.isAnimating() && value.get() === target) return undefined
  const velocity = value.getVelocity()
  // Puts the sampled value back on the painted one before Motion's post-commit render can write the sample.
  value.jump(paintedValue)
  return animate(value, [paintedValue, target], { ...transition, velocity })
}

/**
 * A binary setting that applies at once, controlled or uncontrolled like Radix's switch.
 * @param switchProps - Every Radix switch prop, including `ref`, plus Arc's `label`.
 * @returns The switch button, with its label inside when one is passed.
 */
function Switch({
  className,
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: SwitchProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false)
  const [isPressed, setIsPressed] = useState(false)
  const isChecked = checked ?? uncontrolledChecked
  const geometry = SWITCH_THUMB_GEOMETRY_PX
  const stretch = isPressed && !reduceMotion && !disabled ? SWITCH_PRESS_STRETCH_PX : 0
  const targetX = isChecked ? geometry.travel - stretch : 0
  const targetWidth = geometry.size + stretch
  const x = useMotionValue(targetX)
  const width = useMotionValue(targetWidth)
  const scaleX = useMotionValue(1)
  const painted = useRef<PaintedThumb>({ x: targetX, width: targetWidth, scaleX: 1 })
  const shownChecked = useRef(isChecked)
  // A pointer or Space press already stretched the thumb, so its release should not add a second stretch on top.
  const releasedAt = useRef(-Infinity)

  useEffect(() => {
    const trackPainted = (key: keyof PaintedThumb) => (value: number) => {
      // Values set inside a frame are the ones written to the screen; a stopped animation samples ahead of them.
      if (frameData.isProcessing) painted.current[key] = value
    }
    const unsubscribes = [x.on("change", trackPainted("x")), width.on("change", trackPainted("width")), scaleX.on("change", trackPainted("scaleX"))]
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [x, width, scaleX])

  useEffect(() => {
    if (reduceMotion) {
      x.jump(targetX)
      width.jump(targetWidth)
      painted.current = { ...painted.current, x: targetX, width: targetWidth }
      return
    }
    const xControls = glideFromPainted(x, painted.current.x, targetX, SWITCH_THUMB_GLIDE_SPRING)
    const widthControls = glideFromPainted(width, painted.current.width, targetWidth, ARC_SPRING_SNAPPY)
    return () => {
      xControls?.stop()
      widthControls?.stop()
    }
  }, [targetX, targetWidth, reduceMotion, x, width])

  useEffect(() => {
    if (shownChecked.current === isChecked) return
    shownChecked.current = isChecked
    const isFromPress = performance.now() - releasedAt.current < SWITCH_PRESS_RELEASE_WINDOW_MS
    if (reduceMotion || isFromPress) return
    const { scaleX: keyframes, ...transition } = SWITCH_CHANGE_STRETCH
    // Starts from the scale on screen, so a change that interrupts a stretch continues it instead of snapping back.
    const [, peakScale, restingScale] = keyframes
    scaleX.jump(painted.current.scaleX)
    const controls = animate(scaleX, [painted.current.scaleX, peakScale, restingScale], { ...transition, times: [...transition.times], ease: [...transition.ease] })
    return () => controls.stop()
  }, [isChecked, reduceMotion, scaleX])

  const release = () => {
    if (isPressed && !disabled) releasedAt.current = performance.now()
    setIsPressed(false)
  }

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-labelled={label ? "" : undefined}
      className={cn(switchClassName, className)}
      {...props}
      disabled={disabled}
      checked={isChecked}
      aria-label={ariaLabel ?? label}
      onCheckedChange={(nextChecked) => {
        if (checked === undefined) setUncontrolledChecked(nextChecked)
        onCheckedChange?.(nextChecked)
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.button === SWITCH_PRIMARY_POINTER_BUTTON) setIsPressed(true)
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        release()
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        setIsPressed(false)
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        setIsPressed(false)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.key === SWITCH_TOGGLE_KEY) setIsPressed(true)
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event)
        release()
      }}
      onBlur={(event) => {
        onBlur?.(event)
        setIsPressed(false)
      }}
    >
      <span data-slot="switch-track" className={trackClassName}>
        <SwitchPrimitive.Thumb asChild>
          {/* The thumb stretches like a held finger and keeps its far edge anchored, then travels on a spring. */}
          <motion.span
            data-slot="switch-thumb"
            className={thumbClassName}
            style={{ x, width, scaleX }}
          />
        </SwitchPrimitive.Thumb>
      </span>
      {label ? (
        <span data-slot="switch-label" className="leading-(--leading-body)">
          {label}
        </span>
      ) : null}
    </SwitchPrimitive.Root>
  )
}

export { Switch }
