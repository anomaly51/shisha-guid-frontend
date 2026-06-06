import 'twin.macro'
import styled, { css, keyframes } from 'styled-components'
import type { UserBadge } from '../api'

const shimmerSweep = keyframes`
  0% { transform: translateX(-175%) skewX(-19deg); opacity: 0; }
  16% { opacity: 0.78; }
  36% { opacity: 0.28; }
  52%, 100% { transform: translateX(190%) skewX(-19deg); opacity: 0; }
`

const frostDrift = keyframes`
  0% { transform: translate3d(-14px, 4px, 0) rotate(-4deg) scale(0.98); opacity: 0.28; }
  42% { opacity: 0.92; }
  100% { transform: translate3d(13px, -6px, 0) rotate(16deg) scale(1.04); opacity: 0.24; }
`

const emberRise = keyframes`
  0% { transform: translate3d(-3px, 8px, 0) scale(0.58); opacity: 0; filter: blur(0.1px); }
  22% { opacity: 0.98; }
  58% { opacity: 0.72; }
  100% { transform: translate3d(5px, -15px, 0) scale(1.18); opacity: 0; filter: blur(0.7px); }
`

const chemicalPulse = keyframes`
  0%, 100% { transform: translate3d(-4px, 2px, 0) scale(0.84); opacity: 0.3; filter: hue-rotate(0deg); }
  46% { transform: translate3d(4px, -2px, 0) scale(1.16); opacity: 0.9; filter: hue-rotate(18deg); }
  68% { transform: translate3d(1px, 1px, 0) scale(0.94); opacity: 0.48; }
`

const electricBlink = keyframes`
  0%, 51%, 100% { opacity: 0.12; transform: translateX(-8px) scaleX(0.78); }
  54% { opacity: 1; transform: translateX(3px) scaleX(1.16); }
  58% { opacity: 0.2; transform: translateX(-3px) scaleX(0.86); }
  63% { opacity: 0.9; transform: translateX(7px) scaleX(1); }
  68% { opacity: 0.34; transform: translateX(1px) scaleX(1.08); }
`

const cosmicShift = keyframes`
  0%, 100% { transform: translate3d(-5px, 2px, 0) rotate(-3deg) scale(1); filter: hue-rotate(0deg); opacity: 0.48; }
  50% { transform: translate3d(5px, -2px, 0) rotate(11deg) scale(1.04); filter: hue-rotate(80deg); opacity: 0.95; }
`

const auraBreathe = keyframes`
  0%, 100% { opacity: 0.56; transform: scale(0.985); }
  50% { opacity: 0.94; transform: scale(1.025); }
`

const effectCss = {
  frost: css`
    color: #f8fcff;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.48),
      inset 0 -8px 14px rgba(40, 88, 124, 0.22),
      0 0 0 1px rgba(213, 240, 255, 0.72),
      0 0 16px rgba(145, 213, 255, 0.58);
    &::before {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.55), transparent 52%),
        linear-gradient(100deg, transparent 9%, rgba(225, 246, 255, 0.72) 31%, transparent 48% 100%);
      mix-blend-mode: screen;
      opacity: 0.88;
      animation: ${auraBreathe} 3.4s ease-in-out infinite;
    }
    &::after {
      background:
        radial-gradient(circle at 12% 36%, rgba(255, 255, 255, 0.98) 0 1.2px, transparent 2px),
        radial-gradient(circle at 34% 78%, rgba(210, 242, 255, 0.9) 0 1px, transparent 2px),
        radial-gradient(circle at 55% 24%, rgba(255, 255, 255, 0.76) 0 1.3px, transparent 2.2px),
        radial-gradient(circle at 83% 64%, rgba(232, 248, 255, 0.88) 0 1.4px, transparent 2.4px),
        linear-gradient(135deg, transparent 12%, rgba(255, 255, 255, 0.24) 48%, transparent 70%);
      animation: ${frostDrift} 3.1s ease-in-out infinite;
    }
  `,
  fire: css`
    color: #fff7ed;
    box-shadow:
      inset 0 1px 0 rgba(255, 245, 190, 0.5),
      inset 0 -9px 15px rgba(137, 39, 13, 0.36),
      0 0 0 1px rgba(255, 183, 77, 0.5),
      0 0 19px rgba(255, 108, 28, 0.7);
    &::before {
      background:
        radial-gradient(ellipse at 50% 115%, rgba(255, 214, 102, 0.82), rgba(255, 123, 36, 0.42) 39%, transparent 72%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 48%);
      mix-blend-mode: screen;
      animation: ${auraBreathe} 1.7s ease-in-out infinite;
    }
    &::after {
      background:
        radial-gradient(circle at 18% 88%, rgba(255, 245, 157, 0.98) 0 1.4px, transparent 2.5px),
        radial-gradient(circle at 39% 84%, rgba(255, 186, 73, 0.94) 0 1.8px, transparent 3px),
        radial-gradient(circle at 64% 91%, rgba(255, 94, 28, 0.9) 0 1.7px, transparent 2.9px),
        radial-gradient(circle at 83% 82%, rgba(255, 226, 171, 0.76) 0 1.1px, transparent 2.1px);
      animation: ${emberRise} 1.25s cubic-bezier(0.2, 0.65, 0.24, 1) infinite;
    }
  `,
  chemical: css`
    color: #f4fff8;
    box-shadow:
      inset 0 1px 0 rgba(220, 252, 231, 0.46),
      inset 0 -8px 15px rgba(5, 89, 61, 0.3),
      0 0 0 1px rgba(134, 239, 172, 0.5),
      0 0 17px rgba(52, 211, 153, 0.58);
    &::before {
      background:
        radial-gradient(circle at 28% 100%, rgba(187, 247, 208, 0.72), transparent 34%),
        radial-gradient(circle at 72% 0%, rgba(103, 232, 249, 0.52), transparent 38%),
        linear-gradient(100deg, transparent 16%, rgba(217, 249, 157, 0.38) 46%, transparent 78%);
      mix-blend-mode: screen;
      animation: ${auraBreathe} 2.2s ease-in-out infinite;
    }
    &::after {
      background:
        radial-gradient(circle at 16% 68%, rgba(190, 255, 211, 0.95) 0 2px, transparent 3px),
        radial-gradient(circle at 38% 34%, rgba(236, 253, 245, 0.82) 0 1px, transparent 2.2px),
        radial-gradient(circle at 61% 49%, rgba(125, 249, 255, 0.82) 0 1.7px, transparent 2.8px),
        radial-gradient(circle at 86% 68%, rgba(217, 249, 157, 0.82) 0 1.3px, transparent 2.5px);
      animation: ${chemicalPulse} 2.05s ease-in-out infinite;
    }
  `,
  electric: css`
    color: #eff6ff;
    box-shadow:
      inset 0 1px 0 rgba(219, 234, 254, 0.48),
      inset 0 -8px 14px rgba(29, 78, 216, 0.3),
      0 0 0 1px rgba(147, 197, 253, 0.58),
      0 0 18px rgba(59, 130, 246, 0.7);
    &::before {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent 55%),
        radial-gradient(circle at 70% 50%, rgba(191, 219, 254, 0.58), transparent 46%);
      mix-blend-mode: screen;
    }
    &::after {
      background:
        linear-gradient(110deg, transparent 8%, rgba(255, 255, 255, 0.96) 38%, rgba(96, 165, 250, 0.52) 44%, transparent 64%),
        linear-gradient(28deg, transparent 34%, rgba(219, 234, 254, 0.94) 49%, transparent 65%),
        linear-gradient(152deg, transparent 41%, rgba(125, 211, 252, 0.72) 53%, transparent 62%);
      filter: drop-shadow(0 0 4px rgba(191, 219, 254, 0.95));
      animation: ${electricBlink} 1.34s steps(2, end) infinite;
    }
  `,
  cosmic: css`
    color: #fbf7ff;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.44),
      inset 0 -10px 16px rgba(88, 28, 135, 0.34),
      0 0 0 1px rgba(216, 180, 254, 0.54),
      0 0 20px rgba(168, 85, 247, 0.64);
    &::before {
      background:
        radial-gradient(circle at 25% 20%, rgba(125, 211, 252, 0.5), transparent 28%),
        radial-gradient(circle at 78% 62%, rgba(244, 114, 182, 0.44), transparent 32%),
        linear-gradient(120deg, rgba(59, 130, 246, 0.28), rgba(217, 70, 239, 0.34), rgba(45, 212, 191, 0.2));
      mix-blend-mode: screen;
      animation: ${auraBreathe} 2.6s ease-in-out infinite;
    }
    &::after {
      background:
        radial-gradient(circle at 18% 35%, rgba(255, 255, 255, 0.96) 0 1.2px, transparent 2px),
        radial-gradient(circle at 41% 71%, rgba(255, 255, 255, 0.76) 0 1px, transparent 1.9px),
        radial-gradient(circle at 58% 24%, rgba(216, 180, 254, 0.9) 0 1.5px, transparent 2.5px),
        radial-gradient(circle at 80% 68%, rgba(125, 211, 252, 0.82) 0 1.4px, transparent 2.3px);
      animation: ${cosmicShift} 2.7s ease-in-out infinite;
    }
  `,
  shimmer: css`
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.42),
      inset 0 -8px 13px rgba(0, 0, 0, 0.18),
      0 0 0 1px rgba(255, 255, 255, 0.22),
      0 0 15px rgba(255, 255, 255, 0.28);
    &::before {
      width: 52%;
      background:
        linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.32), transparent),
        linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent 58%);
      filter: blur(0.15px);
      animation: ${shimmerSweep} 2.15s ease-in-out infinite;
    }
    &::after {
      background:
        radial-gradient(circle at 18% 28%, rgba(255, 255, 255, 0.54) 0 1px, transparent 2px),
        radial-gradient(circle at 78% 70%, rgba(255, 255, 255, 0.38) 0 1px, transparent 2px);
      opacity: 0.72;
    }
  `,
}

const BadgePill = styled.span<{ $color: string; $effect: UserBadge['effect'] }>`
  position: relative;
  overflow: hidden;
  isolation: isolate;
  color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.28);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 46%),
    radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.22), transparent 38%),
    ${({ $color }) => $color};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -7px 12px rgba(0, 0, 0, 0.18),
    0 1px 2px rgba(23, 19, 18, 0.18);
  transform: translateZ(0);

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  ${({ $effect }) => $effect && $effect !== 'none' && effectCss[$effect]}

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      animation: none;
    }
  }
`

export const UserBadges = ({
  badges,
  maxVisible,
}: {
  badges?: UserBadge[] | null
  maxVisible?: number
}) => {
  const visibleBadges = (badges || []).slice(0, maxVisible || 1)

  if (!visibleBadges.length) return null

  return (
    <span
      aria-label={`User badges: ${visibleBadges.map((badge) => badge.label).join(', ')}`}
      tw="inline-flex min-w-0 flex-wrap items-center gap-1"
    >
      {visibleBadges.map((badge) => (
        <BadgePill
          key={`${badge.label}-${badge.color}-${badge.effect || 'none'}`}
          $color={badge.color}
          $effect={badge.effect || 'none'}
          tw="inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white"
        >
          <span tw="relative z-10">{badge.label}</span>
        </BadgePill>
      ))}
    </span>
  )
}
