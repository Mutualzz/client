import { modeKeyFromPath, type AppMode, type ModeKey } from "@mutualzz/types";

export type ModeRouteTarget =
  | { type: "feed" }
  | { type: "dms"; channelId?: string }
  | { type: "spaces"; spaceId: string; channelId?: string }
  | { type: "spaces-list" };

export type ModeRouteStyle = "mobile" | "desktop";

interface ModeNavigationApp {
  mode: AppMode | null;
  setMode: (mode: AppMode) => void;
  spaces: {
    setActive: (spaceId: string) => void;
    setMostRecentSpace: (spaceId: string) => void;
    setSidebarTab: (spaceId: string, tab: "channels" | "bridges") => void;
    mostRecentSpace?: { id: string } | null;
    all: { id: string }[];
  };
  channels: {
    setActive: () => void;
  };
  bridgeChat?: {
    hasUnreadForSpace: (spaceId: string) => boolean;
  };
  setSpacesDrawerOpen?: (open: boolean) => void;
  setDMDrawerOpen?: (open: boolean) => void;
}

interface ChannelNavCandidate {
  id: string;
  canRedirect?: boolean;
}

interface SpaceNavApp {
  id: string;
  channels: ChannelNavCandidate[];
  members: {
    me?: { canViewChannel: (channel: ChannelNavCandidate) => boolean } | null;
  };
}

interface ModeRouteApp {
  spaces: {
    mostRecentSpace?: SpaceNavApp | null;
    all: SpaceNavApp[];
    get: (spaceId: string) => SpaceNavApp | undefined;
  };
  channels: {
    getMostRecentChannelForSpace: (
      spaceId: string,
    ) => ChannelNavCandidate | undefined;
    getFirstNavigableChannel?: (
      spaceId: string,
    ) => ChannelNavCandidate | undefined;
    dms?: ChannelNavCandidate[];
  };
}

export function resolveActiveModeKey(
  pathname: string,
  pending: ModeKey | null,
  appMode: AppMode | null,
): ModeKey {
  return (
    pending ??
    modeKeyFromPath(pathname) ??
    (appMode === "@me" ? "dms" : appMode === "feed" ? "feed" : "spaces")
  );
}

export function shouldClearPendingMode(
  pathname: string,
  pending: ModeKey | null,
) {
  if (!pending) return false;
  return modeKeyFromPath(pathname) === pending;
}

export function modeKeyToAppMode(key: ModeKey): AppMode {
  return key === "dms" ? "@me" : key;
}

export function isAtMobileSpacesHub(
  pathname: string,
  spacesDrawerOpen: boolean,
) {
  return (
    spacesDrawerOpen &&
    pathname.startsWith("/spaces") &&
    !pathname.includes("/channel/") &&
    !pathname.includes("/bridges/") &&
    !pathname.includes("/settings")
  );
}

export function shouldIgnoreSpacesHubTap(
  modeKey: ModeKey,
  active: ModeKey,
  pending: ModeKey | null,
  atSpacesHub: boolean,
) {
  return modeKey === "spaces" && active === "spaces" && !pending && atSpacesHub;
}

export function isResumeRoutePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

  if (
    normalized === "/feed" ||
    normalized.startsWith("/feed/") ||
    normalized === "/@me" ||
    normalized.startsWith("/@me/")
  ) {
    return true;
  }

  if (!normalized.startsWith("/spaces")) return false;
  if (normalized.includes("/settings")) return false;

  return true;
}

export function modeRouteTargetToPath(
  target: ModeRouteTarget,
  style: ModeRouteStyle = "mobile",
): string {
  switch (target.type) {
    case "feed":
      return "/feed";
    case "dms":
      return target.channelId ? `/@me/${target.channelId}` : "/@me";
    case "spaces-list":
      return "/spaces";
    case "spaces":
      if (target.channelId) {
        return style === "desktop"
          ? `/spaces/${target.spaceId}/${target.channelId}`
          : `/spaces/channel/${target.channelId}`;
      }
      return `/spaces/${target.spaceId}`;
  }
}

function normalizeResumeRoute(
  app: ModeRouteApp,
  route: string,
  style: ModeRouteStyle,
): string | undefined {
  const normalized = route.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  const mobileChannelMatch = normalized.match(/^\/spaces\/channel\/([^/]+)$/);
  const desktopChannelMatch = normalized.match(/^\/spaces\/([^/]+)\/([^/]+)$/);

  if (style === "mobile" && desktopChannelMatch) {
    return `/spaces/channel/${desktopChannelMatch[2]}`;
  }

  if (style !== "desktop" || !mobileChannelMatch) return normalized;

  const channelId = mobileChannelMatch[1];
  const space = app.spaces.all.find((candidate) =>
    candidate.channels.some((channel) => channel.id === channelId),
  );

  return space ? `/spaces/${space.id}/${channelId}` : undefined;
}

export function resolveResumePath(
  app: ModeRouteApp,
  lastRoute: string | null | undefined,
  fallbackMode: AppMode | null = null,
  style: ModeRouteStyle = "mobile",
): string {
  if (lastRoute && isResumeRoutePath(lastRoute)) {
    const normalized = normalizeResumeRoute(app, lastRoute, style);
    if (normalized) return normalized;
  }

  const mode =
    fallbackMode ?? (lastRoute ? modeKeyFromPath(lastRoute) : null) ?? "spaces";

  return modeRouteTargetToPath(
    resolveModeRouteTarget(app, mode === "@me" ? "dms" : mode),
    style,
  );
}

export function prepareSpaceHubNavigation(
  app: ModeNavigationApp,
  spaceId: string,
) {
  app.setMode("spaces");
  app.spaces.setActive(spaceId);
  app.spaces.setMostRecentSpace(spaceId);
  if (app.bridgeChat?.hasUnreadForSpace(spaceId)) {
    app.spaces.setSidebarTab(spaceId, "bridges");
  }
  app.channels.setActive();
  app.setSpacesDrawerOpen?.(true);
}

export function prepareFeedModeNavigation(app: ModeNavigationApp) {
  app.setMode("feed");
}

export function prepareDmsModeNavigation(app: ModeNavigationApp) {
  app.setMode("@me");
  app.spaces.setActive("@me");
  app.channels.setActive();
  app.setDMDrawerOpen?.(true);
}

export function prepareEmptySpacesNavigation(app: ModeNavigationApp) {
  app.setMode("spaces");
  app.channels.setActive();
  app.setSpacesDrawerOpen?.(true);
}

export function preferredChannelForSpace(app: ModeRouteApp, spaceId: string) {
  const space = app.spaces.get(spaceId);
  if (!space) return undefined;

  const mostRecent = app.channels.getMostRecentChannelForSpace(spaceId);
  if (mostRecent?.canRedirect && space.members.me?.canViewChannel(mostRecent)) {
    return mostRecent;
  }

  return (
    app.channels.getFirstNavigableChannel?.(spaceId) ??
    space.channels.find(
      (channel) =>
        channel.canRedirect && space.members.me?.canViewChannel(channel),
    )
  );
}

export function resolveModeRouteTarget(
  app: ModeRouteApp,
  mode: ModeKey | AppMode,
): ModeRouteTarget {
  const target = mode === "dms" ? "@me" : mode;

  if (target === "feed") {
    return { type: "feed" };
  }

  if (target === "@me") {
    const preferredDM =
      app.channels.getMostRecentChannelForSpace("@me") ?? app.channels.dms?.[0];
    return { type: "dms", channelId: preferredDM?.id };
  }

  const space = app.spaces.mostRecentSpace ?? app.spaces.all[0];
  if (!space) {
    return { type: "spaces-list" };
  }

  const channel = preferredChannelForSpace(app, space.id);
  return {
    type: "spaces",
    spaceId: space.id,
    channelId: channel?.id,
  };
}
