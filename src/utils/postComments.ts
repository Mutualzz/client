export type CommentSort = "newest" | "oldest";

export type CommentLike = {
  id: string;
  createdAt: Date;
  content?: string | null;
  repliedToId?: string | null;
};

export interface CommentThread<T extends CommentLike = CommentLike> {
  comment: T;
  replies: T[];
}

export const REPLY_PREVIEW_COUNT = 2;
export const COMMENTS_PAGE_SIZE = 50;

function compareComments<T extends CommentLike>(
  a: T,
  b: T,
  sort: CommentSort,
) {
  const delta = b.createdAt.getTime() - a.createdAt.getTime();
  return sort === "newest" ? delta : -delta;
}

export function buildCommentThreads<T extends CommentLike>(
  comments: readonly T[],
  sort: CommentSort,
): CommentThread<T>[] {
  const topLevel = comments.filter((comment) => !comment.repliedToId);
  const repliesByParentId = new Map<string, T[]>();

  for (const comment of comments) {
    if (!comment.repliedToId) continue;
    const list = repliesByParentId.get(comment.repliedToId) ?? [];
    list.push(comment);
    repliesByParentId.set(comment.repliedToId, list);
  }

  for (const replies of repliesByParentId.values()) {
    replies.sort((a, b) => compareComments(a, b, sort));
  }

  return [...topLevel]
    .sort((a, b) => compareComments(a, b, sort))
    .map((comment) => ({
      comment,
      replies: repliesByParentId.get(comment.id) ?? [],
    }));
}

export function getOldestCommentId<T extends CommentLike>(
  comments: readonly T[],
) {
  if (comments.length === 0) return null;

  return comments.reduce((oldest, comment) =>
    BigInt(comment.id) < BigInt(oldest.id) ? comment : oldest,
  ).id;
}

export function getCommentPlainText(comment: CommentLike) {
  return comment.content?.trim() ?? "";
}
