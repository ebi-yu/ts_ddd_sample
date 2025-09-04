import type { Title } from "./Title.js";
import type { Content } from "./Content.js";
import { PlainDate } from "../../../../shared/vo/PlainDate.js";

export interface EditRecord {
  type: "title" | "content";
  originalValue: Title | Content;
  changedAt: PlainDate;
}
