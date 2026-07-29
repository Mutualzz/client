export interface MessageAuthorColorInput {
  showRoleColors: boolean;
  primaryTextColor: string;
  roleColor?: string | null;
  accentColor?: string | null;
}

export function getMessageAuthorColor({
  showRoleColors,
  primaryTextColor,
  roleColor,
  accentColor,
}: MessageAuthorColorInput): string {
  if (!showRoleColors) {
    return primaryTextColor;
  }

  return roleColor ?? accentColor ?? primaryTextColor;
}
