export function getSpaceLockdownMessage(
  t: (key: string, options?: Record<string, unknown>) => string,
  isOwner: boolean,
) {
  return isOwner
    ? t("lockdown.ownerMessage", { ns: "space" })
    : t("lockdown.memberMessage", { ns: "space" });
}
