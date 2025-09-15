import type { PlainDate } from "@shared/domain/vo/PlainDate.ts";
import type { Content } from "./Content.ts";
import type { Title } from "./Title.ts";

export interface EditRecord {
  type: "title" | "content";
  originalValue: Title | Content;
  changedAt: PlainDate;
}
