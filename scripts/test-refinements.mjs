import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

// Test refined filters for ink and pastel
export function getRefinedFilter(preset, seed) {
  const s = (seed % 2147483646) + 1
  switch (preset) {
    case 'oil':
      return `<feTurbulence type="fractalNoise" baseFrequency="0.035 0.14" numOctaves="3" seed="${s}" result="bristles"/><feDisplacementMap in="SourceGraphic" in2="bristles" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="displaced"/><feColorMatrix in="bristles" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="bump"/><feDiffuseLighting in="bump" lighting-color="#ffffff" surfaceScale="2.4" diffuseConstant="1.1" result="diffuse"><feDistantLight azimuth="55" elevation="52"/></feDiffuseLighting><feSpecularLighting in="bump" lighting-color="#ffffff" surfaceScale="1.9" specularConstant="0.5" specularExponent="24" result="spec"><feDistantLight azimuth="55" elevation="52"/></feSpecularLighting><feComposite in="displaced" in2="diffuse" operator="arithmetic" k1="1.12" k2="0.03" k3="0" k4="0" result="lit"/><feComposite in="lit" in2="spec" operator="arithmetic" k1="0" k2="1" k3="0.30" k4="0" result="textured"/><feComposite in="textured" in2="displaced" operator="in"/>`

    case 'gouache':
      return `<feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="3" seed="${s}" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="chalkEdge"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="chalkBump"/><feDiffuseLighting in="chalkBump" lighting-color="#ffffff" surfaceScale="0.75" diffuseConstant="0.95" result="matteLight"><feDistantLight azimuth="120" elevation="62"/></feDiffuseLighting><feComposite in="chalkEdge" in2="matteLight" operator="arithmetic" k1="0.88" k2="0.16" k3="0" k4="0" result="mattePaint"/><feComposite in="mattePaint" in2="chalkEdge" operator="in"/>`

    case 'ink': {
      // Sumi Ink:
      // 1. Bristle streaks & flying white (dry-brush split hair streaks)
      // 2. Soft capillary bleed along edges
      // 3. Uneven value modulation across the body (五墨 tonal variation)
      // 4. Granulation in diluted wash
      // 5. NO OUTLINE RING
      return `
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.28" numOctaves="3" seed="${s}" result="hairStreaks"/>
        <feDisplacementMap in="SourceGraphic" in2="hairStreaks" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="streakDisplaced"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.18 0.18" numOctaves="2" seed="${s + 1}" result="paperGrain"/>
        <feDisplacementMap in="streakDisplaced" in2="paperGrain" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="roughEdge"/>
        <feGaussianBlur in="roughEdge" stdDeviation="0.45" result="softBleed"/>
        <feComponentTransfer in="hairStreaks" result="inkTone">
          <feFuncA type="linear" slope="1.4" intercept="-0.15"/>
          <feFuncR type="linear" slope="0.85" intercept="0.18"/>
          <feFuncG type="linear" slope="0.85" intercept="0.18"/>
          <feFuncB type="linear" slope="0.85" intercept="0.18"/>
        </feComponentTransfer>
        <feComposite in="roughEdge" in2="inkTone" operator="arithmetic" k1="0.9" k2="0.12" k3="0" k4="0" result="tonedInk"/>
        <feComponentTransfer in="paperGrain" result="drySplit">
          <feFuncA type="linear" slope="3.8" intercept="-0.85"/>
        </feComponentTransfer>
        <feComposite in="tonedInk" in2="drySplit" operator="in" result="sumiBody"/>
        <feMerge>
          <feMergeNode in="softBleed"/>
          <feMergeNode in="sumiBody"/>
        </feMerge>
      `
    }

    case 'pastel':
    case 'charcoal': {
      // Pastel / Charcoal:
      // 1. Directional laid paper tooth (e.g. 0.08 0.42 fine ribs)
      // 2. 75-85% coverage with fine specks of paper showing through
      // 3. Softer crumbly edges, reads as genuine chalk at 300px
      return `
        <feTurbulence type="fractalNoise" baseFrequency="0.08 0.38" numOctaves="3" seed="${s}" result="laidTooth"/>
        <feDisplacementMap in="SourceGraphic" in2="laidTooth" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="displacedChalk"/>
        <feComponentTransfer in="laidTooth" result="paperPeaks">
          <feFuncA type="linear" slope="2.6" intercept="-0.32"/>
        </feComponentTransfer>
        <feComposite in="displacedChalk" in2="paperPeaks" operator="in" result="chalkOnPaper"/>
        <feColorMatrix in="laidTooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="ribHeight"/>
        <feDiffuseLighting in="ribHeight" lighting-color="#ffffff" surfaceScale="0.9" diffuseConstant="1.0" result="ribShade">
          <feDistantLight azimuth="45" elevation="60"/>
        </feDiffuseLighting>
        <feComposite in="chalkOnPaper" in2="ribShade" operator="arithmetic" k1="0.92" k2="0.10" k3="0" k4="0" result="shadedChalk"/>
        <feGaussianBlur in="shadedChalk" stdDeviation="0.25" result="softChalk"/>
        <feComposite in="softChalk" in2="chalkOnPaper" operator="in"/>
      `
    }

    default:
      return ''
  }
}
