"use client";

/**
 * Toggle for likes and similar reactions: the icon gets Arc's kick (https://uiarc.dev, MIT License, see
 * THIRD_PARTY_NOTICES.md) when the viewer reacts and the counter rolls in the direction of the change. The (optimistic) reaction state is owned by the caller.
 */
import { useEffect, useRef, type ComponentType, type CSSProperties, type MouseEvent, type SVGProps } from "react";
import { HeartIcon } from "lucide-react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { AnimatedCount } from "./animated-count.js";
import { ControlButton } from "./control-button.js";

/**
 * Arc's kick: an impulse rather than a keyframe. The icon starts at rest with velocity, overshoots and settles, and a
 * quick second reaction adds to the running motion instead of restarting it.
 */
const REACTION_KICK = { type: "spring", stiffness: 420, damping: 17 } as const;
/** Scale velocity, per second, the kick gives the icon. */
const REACTION_KICK_SCALE_VELOCITY = 11;
/** Rotation velocity, in degrees per second, the kick gives the icon. */
const REACTION_KICK_ROTATE_VELOCITY = -420;

/**
 * Looks of a disabled reaction. It stays focusable, so it is not `:disabled`; Base UI marks it with `data-disabled`.
 */
const DISABLED_REACTION_CLASS =
  "data-disabled:cursor-not-allowed data-disabled:bg-muted data-disabled:text-muted-foreground data-disabled:hover:bg-muted data-disabled:hover:shadow-none data-disabled:active:bg-muted";

/**
 * Stops a click on a disabled reaction from reaching its parents, as the click on a native disabled button does not.
 * @param event - Click on the reaction.
 */
function swallowClick(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

/** Exposes the active color to the icon classes. */
type ReactionButtonStyle = CSSProperties & { "--golfo-reaction-active-color"?: string };

export interface ReactionButtonProps {
  /** Accessible name, including the current count (for example "Me gusta 3"). */
  ariaLabel: string;
  isActive: boolean;
  count: number;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Turns the reaction off without taking it out of the keyboard order: the button keeps its focus (`aria-disabled`),
   * so a tooltip or hover card on it still opens, and it swallows clicks, so a clickable parent does not react either.
   */
  isDisabled?: boolean;
  /** Icon of the reaction; it is filled with `activeColor` while active. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * CSS color of the active icon, such as `var(--primary)` or `currentColor` to follow the
   * button text. Defaults to the destructive color, the usual tone of a like.
   */
  activeColor?: string;
  /** Formats the visible count, for example with a locale-aware compact format. */
  formatCount?: (count: number) => string;
  className?: string;
}

/**
 * Renders an outline toggle button exposing its state with `aria-pressed`. Server-rendered and already-active
 * reactions never kick on load; only a change to active does, and not at all with reduced motion.
 * @param props - Accessible name, state, count, click handler and optional icon.
 * @returns The reaction button.
 */
export function ReactionButton({
  ariaLabel,
  isActive,
  count,
  onClick,
  isDisabled = false,
  icon: Icon = HeartIcon,
  formatCount,
  activeColor,
  className,
}: ReactionButtonProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);
  const wasActive = useRef(isActive);
  const kickControls = useRef<AnimationPlaybackControls[]>([]);
  useEffect(() => {
    const becameActive = isActive && !wasActive.current;
    wasActive.current = isActive;
    if (shouldReduceMotion) {
      // Turning reduced motion on mid-kick stops it and puts the icon straight back at rest.
      kickControls.current.forEach((controls) => controls.stop());
      kickControls.current = [];
      scale.jump(1);
      rotate.jump(0);
      return;
    }
    if (!becameActive) return;
    // The kick is not stopped when the reaction is undone: the icon always settles back at rest.
    kickControls.current = [
      animate(scale, 1, { ...REACTION_KICK, velocity: scale.getVelocity() + REACTION_KICK_SCALE_VELOCITY }),
      animate(rotate, 0, { ...REACTION_KICK, velocity: rotate.getVelocity() + REACTION_KICK_ROTATE_VELOCITY }),
    ];
  }, [isActive, rotate, scale, shouldReduceMotion]);
  const activeColorStyle: ReactionButtonStyle | undefined = activeColor ? { "--golfo-reaction-active-color": activeColor } : undefined;

  return (
    <ControlButton
      data-slot="reaction-button"
      data-active={isActive || undefined}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      aria-disabled={isDisabled || undefined}
      className={cn("group/reaction", DISABLED_REACTION_CLASS, className)}
      disabled={isDisabled}
      focusableWhenDisabled
      onClick={onClick}
      onClickCapture={isDisabled ? swallowClick : undefined}
      style={activeColorStyle}
      type="button"
      variant="outline"
    >
      <motion.span
        aria-hidden
        className="inline-flex origin-center items-center justify-center"
        style={{ scale, rotate }}
      >
        <Icon className="size-4 transition-[fill,color] group-data-active/reaction:fill-current group-data-active/reaction:text-[var(--golfo-reaction-active-color,var(--destructive))]" />
      </motion.span>
      <AnimatedCount className="min-w-[1ch]" value={count} format={formatCount} />
    </ControlButton>
  );
}
