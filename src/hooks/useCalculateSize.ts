import { useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function useCalculateSize(
  el: React.RefObject<HTMLButtonElement>,
  startSize: number,
  mouseX: number | undefined,
  magnificationMax: number,
) {
  const magnification = useMotionValue(0)

  // Transform the magnification value from a number between 0 and 1 to a
  // number based on the magnificationMax value
  const transformedMagnification = useTransform(
    magnification,
    [0, 1],
    [1, magnificationMax],
  )

  // Create a motion value with a spring animation
  const size = useSpring(startSize, {
    mass: 0.5,
  })

  // Limit in pixels. Elements who's centers are further from the mouse position
  // than this distance will not be magnified.
  const limit = 200

  if (el.current !== null) {
    if (mouseX === undefined) {
      magnification.set(0)
    } else {
      const rect = el.current.getBoundingClientRect()
      const elCenter = rect.left + rect.width / 2
      const distance = Math.abs(mouseX - elCenter)

      if (distance <= limit) {
        magnification.set(1 - distance / limit)
      } else {
        magnification.set(0)
      }
    }

    size.set(startSize * transformedMagnification.get())
  }

  return size
}