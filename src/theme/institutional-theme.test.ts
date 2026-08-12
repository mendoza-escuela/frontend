import { describe, expect, it } from "vitest";
import { INSTITUTIONAL_COLORS } from "./institutional-theme";

describe("institutional color accessibility", () => {
  it.each([
    ["main text on surface", INSTITUTIONAL_COLORS.text, INSTITUTIONAL_COLORS.surface],
    ["muted text on surface", INSTITUTIONAL_COLORS.muted, INSTITUTIONAL_COLORS.surface],
    ["white text on institutional blue", INSTITUTIONAL_COLORS.surface, INSTITUTIONAL_COLORS.blue],
    ["institutional blue on background", INSTITUTIONAL_COLORS.blue, INSTITUTIONAL_COLORS.background],
  ])("keeps WCAG AA contrast for %s", (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
