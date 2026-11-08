import type {
  APIMessageReminder,
  APINotification,
  APIScheduledMessage,
} from "@mutualzz/types";
import { makeAutoObservable, observable } from "mobx";

export type GatewayAck<Data = object> =
  | ({ ok: true } & Data)
  | { ok: false; message?: string };

export interface InboxGateway {
  sendBookmark(
    action: "add" | "remove",
    messageId: string,
  ): Promise<GatewayAck>;
  setReminder(
    messageId: string,
    remindAt: string,
  ): Promise<GatewayAck<{ reminder: APIMessageReminder }>>;
  deleteReminder(messageId: string): Promise<GatewayAck>;
  editScheduledMessage(
    id: string,
    changes: { content?: string; scheduledFor?: string },
  ): Promise<GatewayAck<{ scheduledMessage: APIScheduledMessage }>>;
  deleteScheduledMessage(id: string): Promise<GatewayAck>;
  listNotifications(
    before?: string,
  ): Promise<{ notifications: APINotification[]; hasMore: boolean } | null>;
  markNotificationsRead(ids?: string[]): Promise<GatewayAck>;
  deleteNotification(id: string): Promise<GatewayAck>;
}

export interface InboxStoreDeps {
  gateway: () => InboxGateway;
  showError: (message: string) => void;
}

const byTime = (first: string, second: string) =>
  new Date(first).getTime() - new Date(second).getTime();

export class BookmarkStore {
  private readonly messageIds = observable.set<string>();

  constructor(private readonly deps: InboxStoreDeps) {
    makeAutoObservable<this, "deps">(this, { deps: false }, { autoBind: true });
  }

  get size() {
    return this.messageIds.size;
  }

  clear() {
    this.messageIds.clear();
  }

  replaceAll(messageIds: string[]) {
    this.messageIds.replace(messageIds);
  }

  has(messageId: string) {
    return this.messageIds.has(messageId);
  }

  markAdded(messageId: string) {
    this.messageIds.add(messageId);
  }

  markRemoved(messageId: string) {
    this.messageIds.delete(messageId);
  }

  async toggle(messageId: string) {
    const wasBookmarked = this.has(messageId);

    if (wasBookmarked) this.markRemoved(messageId);
    else this.markAdded(messageId);

    const ack = await this.deps
      .gateway()
      .sendBookmark(wasBookmarked ? "remove" : "add", messageId);

    if (!ack.ok) {
      if (wasBookmarked) this.markAdded(messageId);
      else this.markRemoved(messageId);
      this.deps.showError(ack.message ?? "Couldn't update bookmark");
    }

    return ack;
  }
}

export class ReminderStore {
  private readonly reminders = observable.map<string, APIMessageReminder>();

  constructor(private readonly deps: InboxStoreDeps) {
    makeAutoObservable<this, "deps">(this, { deps: false }, { autoBind: true });
  }

  get size() {
    return this.reminders.size;
  }

  get all() {
    return [...this.reminders.values()].sort((first, second) =>
      byTime(first.remindAt, second.remindAt),
    );
  }

  get dueCount() {
    return this.all.filter((reminder) => reminder.firedAt !== null).length;
  }

  clear() {
    this.reminders.clear();
  }

  replaceAll(reminders: APIMessageReminder[]) {
    this.reminders.replace(
      reminders.map((reminder) => [reminder.messageId, reminder]),
    );
  }

  get(messageId: string) {
    return this.reminders.get(messageId);
  }

  has(messageId: string) {
    return this.reminders.has(messageId);
  }

  upsert(reminder: APIMessageReminder) {
    this.reminders.set(reminder.messageId, reminder);
  }

  remove(messageId: string) {
    this.reminders.delete(messageId);
  }

  async schedule(messageId: string, remindAt: Date) {
    const ack = await this.deps
      .gateway()
      .setReminder(messageId, remindAt.toISOString());

    if (ack.ok) this.upsert(ack.reminder);
    else this.deps.showError(ack.message ?? "Couldn't set reminder");

    return ack;
  }

  async complete(messageId: string) {
    const previous = this.get(messageId);
    this.remove(messageId);

    const ack = await this.deps.gateway().deleteReminder(messageId);

    if (!ack.ok) {
      if (previous) this.upsert(previous);
      this.deps.showError(ack.message ?? "Couldn't remove reminder");
    }

    return ack;
  }
}

export class ScheduledMessageStore {
  private readonly scheduled = observable.map<string, APIScheduledMessage>();

  constructor(private readonly deps: InboxStoreDeps) {
    makeAutoObservable<this, "deps">(this, { deps: false }, { autoBind: true });
  }

  get all() {
    return [...this.scheduled.values()].sort((first, second) =>
      byTime(first.scheduledFor, second.scheduledFor),
    );
  }

  get failedCount() {
    return this.all.filter((scheduled) => scheduled.status === "failed").length;
  }

  forChannel(channelId: string) {
    return this.all.filter((scheduled) => scheduled.channelId === channelId);
  }

  get(id: string) {
    return this.scheduled.get(id);
  }

  clear() {
    this.scheduled.clear();
  }

  replaceAll(scheduledMessages: APIScheduledMessage[]) {
    this.scheduled.replace(
      scheduledMessages.map((scheduled) => [scheduled.id, scheduled]),
    );
  }

  upsert(scheduled: APIScheduledMessage) {
    this.scheduled.set(scheduled.id, scheduled);
  }

  remove(id: string) {
    this.scheduled.delete(id);
  }

  async edit(id: string, changes: { content?: string; scheduledFor?: Date }) {
    const ack = await this.deps.gateway().editScheduledMessage(id, {
      ...(changes.content !== undefined ? { content: changes.content } : {}),
      ...(changes.scheduledFor
        ? { scheduledFor: changes.scheduledFor.toISOString() }
        : {}),
    });

    if (ack.ok) this.upsert(ack.scheduledMessage);
    else
      this.deps.showError(ack.message ?? "Couldn't update scheduled message");

    return ack;
  }

  sendNow(id: string) {
    return this.edit(id, { scheduledFor: new Date() });
  }

  async cancel(id: string) {
    const previous = this.get(id);
    this.remove(id);

    const ack = await this.deps.gateway().deleteScheduledMessage(id);

    if (!ack.ok) {
      if (previous) this.upsert(previous);
      this.deps.showError(ack.message ?? "Couldn't cancel scheduled message");
    }

    return ack;
  }
}

export class NotificationStore {
  private readonly notifications = observable.map<string, APINotification>();

  unreadCount = 0;
  hasMore = false;
  loaded = false;
  loading = false;

  constructor(private readonly deps: InboxStoreDeps) {
    makeAutoObservable<this, "deps">(this, { deps: false }, { autoBind: true });
  }

  get all() {
    return [...this.notifications.values()].sort((first, second) =>
      BigInt(second.id) > BigInt(first.id) ? 1 : -1,
    );
  }

  clear() {
    this.notifications.clear();
    this.unreadCount = 0;
    this.hasMore = false;
    this.loaded = false;
  }

  resetFromReady(unreadCount: number) {
    this.notifications.clear();
    this.unreadCount = unreadCount;
    this.hasMore = false;
    this.loaded = false;
  }

  private addPage(notifications: APINotification[], hasMore: boolean) {
    for (const notification of notifications)
      this.notifications.set(notification.id, notification);
    this.hasMore = hasMore;
    this.loaded = true;
  }

  private setLoading(loading: boolean) {
    this.loading = loading;
  }

  async load() {
    if (this.loading) return;
    this.setLoading(true);
    const page = await this.deps.gateway().listNotifications();
    this.setLoading(false);
    if (page) this.addPage(page.notifications, page.hasMore);
  }

  async loadMore() {
    const oldest = this.all.at(-1);
    if (this.loading || !this.hasMore || !oldest) return;
    this.setLoading(true);
    const page = await this.deps.gateway().listNotifications(oldest.id);
    this.setLoading(false);
    if (page) this.addPage(page.notifications, page.hasMore);
  }

  handleCreate(notification: APINotification) {
    this.notifications.set(notification.id, notification);
    if (!notification.readAt) this.unreadCount += 1;
  }

  handleRead(ids: string[], readAt: string) {
    for (const id of ids) {
      const existing = this.notifications.get(id);
      if (existing) this.notifications.set(id, { ...existing, readAt });
    }
    this.unreadCount = Math.max(0, this.unreadCount - ids.length);
  }

  handleDelete(id: string) {
    const existing = this.notifications.get(id);
    this.notifications.delete(id);
    if (existing && !existing.readAt)
      this.unreadCount = Math.max(0, this.unreadCount - 1);
  }

  markAllRead() {
    if (this.unreadCount === 0) return;
    void this.deps.gateway().markNotificationsRead();
  }

  dismiss(id: string) {
    this.handleDelete(id);
    void this.deps.gateway().deleteNotification(id);
  }
}
