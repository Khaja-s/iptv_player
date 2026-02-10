---
trigger: always_on
---

🎨 Design System: "Organic Soft UI" (Japandi)
Core Philosophy: Warm, tactile, and minimalist. Avoid harsh contrasts and pure blacks/whites. Think "paper and ink" or "nature," not "startup tech."

1. Color Palette (Strict Adherence)
Use the defined Colors object in 
constants/Colors.ts
. Do not hardcode hex values.

Primary: Sage Green (Colors.primary / #5B7A65) - Use for main actions, active states.
Background: Warm Cream (Colors.background / #FAF7F2) - The main canvas.
Surface/Card: Warm White (Colors.card / #FFFDFB) - For all cards/tiles.
Text: Espresso (Colors.text / #3D352E) - Primary text. never pure black.
Text Muted: Stone (Colors.textMuted / #7A7068) - Secondary text.
2. UI Elements
Shadows: Soft, diffuse, warm-tinted shadows. Use Shadows.card or Shadows.sm.
Corners: "Super-rounded" / Bubble effect. Standard cards use BorderRadius.xl (28) or BorderRadius.lg (24).
Gradients: Use LinearGradient for prayer cards. See Colors.prayerFajr, etc.
Icons: Ionicons from @expo/vector-icons.