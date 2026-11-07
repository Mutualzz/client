import type { InventoryEditOp } from "@mutualzz/validators";

export interface InventorySlot {
  slot: number;
  type: string;
  amount: number;
  enchanted?: boolean;
  color?: number;
  trim?: { pattern: string; material: string };
}

export interface BridgeInventory {
  serverId: string;
  minecraftUuid: string;
  minecraftName: string;
  inventory: InventorySlot[];
  enderChest: InventorySlot[];
  capturedAt: string;
}

export type SlotRef = Extract<InventoryEditOp, { kind: "move" }>["from"];
export type SlotContainer = SlotRef["container"];

export interface InventoryEdit {
  id: string;
  serverId: string;
  minecraftUuid: string;
  op: InventoryEditOp;
  status: "pending" | "applied" | "rejected" | "cancelled";
  message: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export type InventoryEditAck =
  | { ok: true; edit?: InventoryEdit; cancelled?: number }
  | { ok: false; message: string };

export interface InventoryEditsState {
  edits: InventoryEdit[];
  editableServers: string[];
  recentResults: InventoryEdit[];
}

export interface InventoryView {
  inventory: InventorySlot[];
  enderChest: InventorySlot[];
  pending: Set<string>;
}

export const EMPTY_EDITS: InventoryEditsState = {
  edits: [],
  editableServers: [],
  recentResults: [],
};

export const ARMOR_SLOTS = [39, 38, 37, 36, 40];

export const inventoryQueryKey = (bridgeId: string, minecraftUuid: string) =>
  ["bridges", bridgeId, "inventories", minecraftUuid.toLowerCase()] as const;

export const inventoryEditsQueryKey = (
  bridgeId: string,
  minecraftUuid: string,
) =>
  ["bridges", bridgeId, "inventoryEdits", minecraftUuid.toLowerCase()] as const;

export const knownPlayersQueryKey = (bridgeId: string) =>
  ["bridges", bridgeId, "inventories", "known"] as const;

export const slotKeyOf = (ref: SlotRef) => `${ref.container}:${ref.slot}`;

export const editSlotKeys = (op: InventoryEditOp) =>
  op.kind === "move" ? [slotKeyOf(op.from), slotKeyOf(op.to)] : [slotKeyOf(op)];

export const compareEditIds = (first: InventoryEdit, second: InventoryEdit) =>
  BigInt(first.id) < BigInt(second.id) ? -1 : 1;

export const applyEditUpdates = (
  state: InventoryEditsState,
  updates: InventoryEdit[],
): InventoryEditsState => {
  const finished = updates.filter((edit) => edit.status !== "pending");
  const finishedIds = new Set(
    [...finished, ...state.recentResults].map((edit) => edit.id),
  );
  const changed = new Set(updates.map((edit) => edit.id));

  const edits = [
    ...state.edits.filter((edit) => !changed.has(edit.id)),
    ...updates.filter(
      (edit) => edit.status === "pending" && !finishedIds.has(edit.id),
    ),
  ].sort(compareEditIds);

  return {
    ...state,
    edits,
    recentResults: finished.length > 0 ? finished : state.recentResults,
  };
};

export const projectInventory = (
  snapshot: BridgeInventory,
  edits: InventoryEdit[],
): InventoryView => {
  const slots = new Map<string, InventorySlot | undefined>();
  for (const item of snapshot.inventory)
    slots.set(`inventory:${item.slot}`, item);
  for (const item of snapshot.enderChest)
    slots.set(`enderChest:${item.slot}`, item);
  const pending = new Set<string>();

  for (const { op } of edits.filter(
    (edit) => edit.serverId === snapshot.serverId && edit.status === "pending",
  )) {
    if (op.kind === "move") {
      const from = slotKeyOf(op.from);
      const to = slotKeyOf(op.to);
      const moving = slots.get(from);
      slots.set(from, slots.get(to));
      slots.set(to, moving);
      pending.add(from).add(to);
      continue;
    }

    const key = slotKeyOf(op);
    const current = slots.get(key);
    if (op.kind === "remove") slots.set(key, undefined);
    if (op.kind === "amount" && current) {
      slots.set(key, { ...current, amount: op.amount });
    }
    if (op.kind === "give") {
      slots.set(key, { slot: op.slot, type: op.type, amount: op.amount });
    }
    pending.add(key);
  }

  const collect = (container: SlotContainer) =>
    [...slots].flatMap(([key, item]) =>
      item && key.startsWith(`${container}:`)
        ? [{ ...item, slot: Number(key.slice(container.length + 1)) }]
        : [],
    );

  return {
    inventory: collect("inventory"),
    enderChest: collect("enderChest"),
    pending,
  };
};

export const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

export const itemName = (type: string) =>
  type
    .replace(/^minecraft:/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const toSlotRef = (key: string): SlotRef => {
  const [container, slot] = key.split(":");
  return { container: container as SlotContainer, slot: Number(slot) };
};

export const itemAt = (
  view: { inventory: InventorySlot[]; enderChest: InventorySlot[] },
  key: string,
) => {
  const ref = toSlotRef(key);
  return view[ref.container].find((item) => item.slot === ref.slot);
};

export const normalizeItemId = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/^minecraft:/, "")
    .replace(/\s+/g, "_");

export const isValidItemId = (itemId: string) =>
  /^[a-z0-9_]{1,64}$/.test(itemId);

export const clampStackAmount = (input: string) =>
  Math.max(1, Math.min(99, Number.parseInt(input, 10) || 1));

export interface BridgeServerStatus {
  serverId: string;
  tps: number;
  mspt: number;
  maxPlayers: number;
  version: string;
  motd: string;
  updatedAt: string;
}

export const tpsColor = (tps: number): "success" | "warning" | "danger" => {
  if (tps >= 19) return "success";
  if (tps >= 15) return "warning";
  return "danger";
};

export interface BridgeKnownPlayer {
  minecraftUuid: string;
  minecraftName: string;
  servers: string[];
  lastSeenAt: string;
  online: boolean;
}

export interface ModerationResult {
  serverId: string;
  ok: boolean;
  message: string;
}
