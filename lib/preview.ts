import { runSquad } from "./engine";
import { createSeed } from "./seed";
import type { AgentAction, Meeting } from "./types";

export function previewOffice(now = new Date()): { meeting: Meeting; actions: AgentAction[] } {
  const after = runSquad(createSeed(now), now);
  const meeting = after.meetings[0];
  const ids = new Set(meeting.actionIds);
  return {
    meeting,
    actions: after.actions.filter((action) => ids.has(action.id)),
  };
}
