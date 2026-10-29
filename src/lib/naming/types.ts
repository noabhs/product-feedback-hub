/** What the naming tool stores inside NamingItem.data, and what the UI reads. */

export type DeliveryLink = {
  key: string;
  type: string;
  status: string;
  title: string;
  /** rename = takes the idea's new name with it; leave = stays as is. */
  action: "rename" | "leave";
  reason: string;
  done?: "renamed" | "left" | "failed";
  error?: string;
};

export type ReleaseChild = {
  key: string;
  type: string;
  status: string;
  title: string;
  /** Title after the event's old title, with its separator. null = leave this step. */
  suffix: string | null;
  done?: "renamed" | "left" | "failed";
  error?: string;
};

export type ReleaseLink = {
  key: string;
  type: string;
  status: string;
  title: string;
  /** The delivery Epic this event hangs under. */
  epic: string;
  action: "rename" | "leave";
  reason: string;
  children: ReleaseChild[];
  done?: "renamed" | "left" | "failed";
  error?: string;
};

export type ItemData = {
  level: string;
  inferred: boolean;
  question: string | null;
  jstatus: string;
  desc: string;
  delivery: DeliveryLink[];
  releases: ReleaseLink[];
  error: string | null;
  edited?: boolean;
};

export type ItemState = "pending" | "needs_context" | "rejected" | "applied" | "failed";

/** A row of the project's ideas as shown while choosing what to review. */
export type IdeaRow = {
  key: string;
  summary: string;
  status: string;
  team: string;
  product: string;
};
