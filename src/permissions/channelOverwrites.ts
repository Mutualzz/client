import {
  BitField,
  permissionFlags,
  type PermissionFlag,
} from "@mutualzz/bitfield";

export type OverwriteState = "allow" | "deny" | "neutral";

export type OverwriteTargetKind = "role" | "member";

export interface OverwriteDraft {
  allow: bigint;
  deny: bigint;
}

export type OverwriteDraftMap = Map<string, OverwriteDraft>;

export interface OverwriteKeySource {
  roleId?: string | null;
  userId?: string | null;
}

export interface OverwriteDraftSource extends OverwriteKeySource {
  allow: { bits: bigint };
  deny: { bits: bigint };
}

export interface ParsedOverwriteKey {
  id: string;
  kind: OverwriteTargetKind;
}

export function overwriteKey(ow: OverwriteKeySource): string {
  if (ow.roleId) return `r:${ow.roleId}`;
  if (ow.userId) return `u:${ow.userId}`;
  return "x";
}

export function makeOverwriteKey(id: string, kind: OverwriteTargetKind): string {
  return kind === "role" ? `r:${id}` : `u:${id}`;
}

export function parseOverwriteKey(key: string): ParsedOverwriteKey {
  const [prefix, id] = key.split(":");
  return { id, kind: prefix === "r" ? "role" : "member" };
}

export function createEmptyOverwriteDraft(): OverwriteDraft {
  return { allow: 0n, deny: 0n };
}

export function overwriteDraftsEqual(a: OverwriteDraft, b: OverwriteDraft) {
  return a.allow === b.allow && a.deny === b.deny;
}

export function getOverwriteState(
  draft: OverwriteDraft,
  flag: PermissionFlag,
): OverwriteState {
  const allow = BitField.fromString(permissionFlags, draft.allow.toString());
  const deny = BitField.fromString(permissionFlags, draft.deny.toString());
  if (allow.has(flag)) return "allow";
  if (deny.has(flag)) return "deny";
  return "neutral";
}

export function applyOverwriteState(
  draft: OverwriteDraft,
  flag: PermissionFlag,
  next: OverwriteState,
): OverwriteDraft {
  let allow = BitField.fromString(permissionFlags, draft.allow.toString());
  let deny = BitField.fromString(permissionFlags, draft.deny.toString());
  allow = allow.remove(flag);
  deny = deny.remove(flag);
  if (next === "allow") allow = allow.add(flag);
  if (next === "deny") deny = deny.add(flag);
  return { allow: allow.bits, deny: deny.bits };
}

export function toggleOverwriteState(
  draft: OverwriteDraft,
  flag: PermissionFlag,
  next: OverwriteState,
): OverwriteDraft {
  const current = getOverwriteState(draft, flag);
  return applyOverwriteState(
    draft,
    flag,
    current === next ? "neutral" : next,
  );
}

export function buildOverwriteDraftMap(
  overwrites: Iterable<OverwriteDraftSource>,
): OverwriteDraftMap {
  const map = new Map<string, OverwriteDraft>();
  for (const ow of overwrites) {
    map.set(overwriteKey(ow), {
      allow: ow.allow.bits,
      deny: ow.deny.bits,
    });
  }
  return map;
}

export function getDirtyOverwriteKeys(
  drafts: OverwriteDraftMap,
  bases: OverwriteDraftMap,
): Set<string> {
  const set = new Set<string>();
  for (const [key, draft] of drafts) {
    const base = bases.get(key);
    if (!base || !overwriteDraftsEqual(draft, base)) {
      set.add(key);
    }
  }
  return set;
}

export function serializeOverwriteDraft(draft: OverwriteDraft) {
  return {
    allow: draft.allow.toString(),
    deny: draft.deny.toString(),
  };
}

export const getState = getOverwriteState;
export const applyState = applyOverwriteState;
export const makeKey = makeOverwriteKey;
export const parseKey = parseOverwriteKey;
export const draftsEqual = overwriteDraftsEqual;
