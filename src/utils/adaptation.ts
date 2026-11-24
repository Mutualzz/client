import type { APITheme } from "@mutualzz/types";
import {
  baseDarkTheme,
  baseLightTheme,
  createColor,
  extractColors,
  formatColor,
  isValidGradient,
  randomHexColor,
  type ColorLike,
} from "@mutualzz/ui-core";
import chroma from "chroma-js";

interface AdaptColors {
  baseColor: ColorLike;
  primaryColor: ColorLike;
  primaryText: ColorLike;
  prefersDark: boolean;
}

const ensureContrast = (bg: chroma.Color, fg: chroma.Color, minRatio = 4.5) => {
  let lighten = bg;
  let darken = bg;
  let lightenSteps = 0;
  let darkenSteps = 0;
  const stepAmount = 0.03;

  while (chroma.contrast(lighten, fg) < minRatio && lightenSteps < 40) {
    lighten = lighten.brighten(stepAmount);
    lightenSteps++;
  }
  while (chroma.contrast(darken, fg) < minRatio && darkenSteps < 40) {
    darken = darken.darken(stepAmount);
    darkenSteps++;
  }
  return lightenSteps < darkenSteps ? lighten.hex() : darken.hex();
};

const ensureContrastAgainst = (
  color: chroma.Color,
  references: chroma.Color[],
  minRatio: number,
) => {
  const lowestContrast = (candidate: chroma.Color) =>
    Math.min(
      ...references.map((reference) => chroma.contrast(candidate, reference)),
    );
  const stepAmount = 0.03;
  const maxSteps = 100;

  let lighter = color;
  let darker = color;
  let lighterSteps = 0;
  let darkerSteps = 0;

  while (lowestContrast(lighter) < minRatio && lighterSteps < maxSteps) {
    lighter = lighter.brighten(stepAmount);
    lighterSteps++;
  }
  while (lowestContrast(darker) < minRatio && darkerSteps < maxSteps) {
    darker = darker.darken(stepAmount);
    darkerSteps++;
  }

  const lighterPasses = lowestContrast(lighter) >= minRatio;
  const darkerPasses = lowestContrast(darker) >= minRatio;

  if (lighterPasses && darkerPasses)
    return (lighterSteps <= darkerSteps ? lighter : darker).hex();
  if (lighterPasses) return lighter.hex();
  if (darkerPasses) return darker.hex();
  return (
    lowestContrast(lighter) >= lowestContrast(darker) ? lighter : darker
  ).hex();
};

function blendSemantic(baseHex: string, themeBase: chroma.Color) {
  return chroma
    .mix(baseHex, themeBase, 0.4, "lab")
    .saturate(1)
    .set("hsl.l", 0.6);
}

function averageColors(colors: string[]): chroma.Color {
  if (colors.length === 1) return chroma(colors[0]);
  let avg = chroma(colors[0]);
  for (let i = 1; i < colors.length; i++) {
    avg = chroma.mix(avg, colors[i], 1 / (i + 1));
  }
  return avg;
}

export const adaptColors = ({
  baseColor,
  primaryColor,
  primaryText,
  prefersDark,
}: AdaptColors) => {
  const gradientColors = isValidGradient(baseColor)
    ? (extractColors(baseColor) ?? [randomHexColor()])
    : [baseColor];

  const SEMANTIC_BASES = prefersDark
    ? {
        danger: baseDarkTheme.colors.danger,
        info: baseDarkTheme.colors.info,
        success: baseDarkTheme.colors.success,
        warning: baseDarkTheme.colors.warning,
      }
    : {
        danger: baseLightTheme.colors.danger,
        info: baseLightTheme.colors.info,
        success: baseLightTheme.colors.success,
        warning: baseLightTheme.colors.warning,
      };

  const base = averageColors(gradientColors);

  const primary = chroma(primaryColor);
  const text = chroma(primaryText);

  const background = baseColor;

  const surface = formatColor(baseColor, {
    lighten: prefersDark ? 10 : 50,
  });

  const surfaceColors = gradientColors.map((stopColor) =>
    formatColor(stopColor, { lighten: prefersDark ? 10 : 50 }),
  );
  const surfaceBase = averageColors(surfaceColors);

  const neutralBase = chroma.mix(base, surfaceBase, 0.5);
  const neutralLightness = prefersDark ? 0.85 : 0.25;
  const neutral = neutralBase
    .desaturate(5)
    .set("hsl.l", neutralLightness)
    .hex();

  const textBackgrounds = [base, surfaceBase];
  const typographyPrimary = ensureContrastAgainst(text, textBackgrounds, 4.5);
  const typographySecondary = ensureContrastAgainst(
    text.brighten(0.5),
    textBackgrounds,
    4.5,
  );
  const typographyAccent = ensureContrastAgainst(primary, textBackgrounds, 4.5);
  const typographyMuted = ensureContrastAgainst(
    chroma.mix(text.desaturate(2), base, 0.35),
    textBackgrounds,
    3,
  );

  const danger = ensureContrast(
    blendSemantic(SEMANTIC_BASES.danger, base),
    text,
  );
  const success = ensureContrast(
    blendSemantic(SEMANTIC_BASES.success, base),
    text,
  );
  const info = ensureContrast(blendSemantic(SEMANTIC_BASES.info, base), text);
  const warning = ensureContrast(
    blendSemantic(SEMANTIC_BASES.warning, base),
    text,
  );

  return {
    colors: {
      common: {
        white: "#FFFFFF",
        black: "#000000",
      },
      primary: primary.hex(),
      neutral,
      background,
      surface,
      danger,
      info,
      success,
      warning,
    },
    typography: {
      colors: {
        primary: typographyPrimary,
        secondary: typographySecondary,
        accent: typographyAccent,
        muted: typographyMuted,
      },
    },
  };
};

export const isDarkBaseColor = (baseColor: ColorLike) => {
  const gradientStops = isValidGradient(baseColor)
    ? (extractColors(baseColor) ?? [])
    : [];
  return createColor(gradientStops[0] ?? baseColor).isDark();
};

export const applyAdaptiveThemeValues = (values: APITheme): APITheme => {
  const generateDark = isDarkBaseColor(values.colors.background);
  const adapted = adaptColors({
    baseColor: values.colors.background,
    primaryColor: values.colors.primary,
    primaryText: values.typography.colors.primary,
    prefersDark: generateDark,
  });

  return {
    ...values,
    type: generateDark ? "dark" : "light",
    colors: adapted.colors as APITheme["colors"],
    typography: {
      ...values.typography,
      colors: adapted.typography.colors as APITheme["typography"]["colors"],
    },
  };
};
