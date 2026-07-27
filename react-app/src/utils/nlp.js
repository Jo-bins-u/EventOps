// Rule-based NLP for detecting actionable messages

const DEADLINE_PATTERNS = [
  /by (tomorrow|today|tonight)/gi,
  /by (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
  /by (end of (?:day|week|month))/gi,
  /by (may|june|july|august|september|october|november|december)\s+\d+/gi,
  /due (on|by)?\s*([\w\s]+\d*)/gi,
  /deadline[:\s]+([\w\s]+)/gi,
  /no later than ([\w\s]+)/gi,
  /before ([\w\s]+)/gi,
];

const TIME_PATTERNS = [
  /at (\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi,
  /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi,
];

const MEETING_PATTERNS = [
  /\b(meeting|call|sync|standup|stand-up|review|catch.?up|discussion|session)\b/gi,
];

const ACTION_PATTERNS = [
  /\b(please|need to|must|should|have to|make sure|ensure|don't forget)\s+(\w+)/gi,
  /\b(confirm|finalize|finish|complete|send|book|schedule|submit|upload|prepare|review|check|update|create|write|fix|resolve)\b/gi,
];

/**
 * Analyze a message and extract actionable entities
 * @param {string} text
 * @returns {{ entities: Array, suggestions: Array, isActionable: boolean }}
 */
export function analyzeMessage(text) {
  const entities = [];
  const seen = new Set();

  const addEntity = (type, value, color) => {
    const key = `${type}:${value.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      entities.push({ type, value, color });
    }
  };

  DEADLINE_PATTERNS.forEach((rx) => {
    const matches = [...text.matchAll(rx)];
    matches.forEach((m) => addEntity('deadline', m[1] || m[0], '#A32D2D'));
  });

  TIME_PATTERNS.forEach((rx) => {
    const matches = [...text.matchAll(rx)];
    matches.forEach((m) => addEntity('time', m[1] || m[0], '#185FA5'));
  });

  MEETING_PATTERNS.forEach((rx) => {
    const matches = [...text.matchAll(rx)];
    matches.forEach((m) => addEntity('meeting', m[1] || m[0], '#0F6E56'));
  });

  ACTION_PATTERNS.forEach((rx) => {
    const matches = [...text.matchAll(rx)];
    matches.forEach((m) => addEntity('action', m[1] || m[2] || m[0], '#854F0B'));
  });

  const isActionable = entities.length > 0;
  const suggestions = buildSuggestions(entities, text);

  return { entities, suggestions, isActionable };
}

function buildSuggestions(entities, text) {
  const suggestions = [];
  const hasDeadline = entities.some((e) => e.type === 'deadline');
  const hasTime = entities.some((e) => e.type === 'time');
  const hasMeeting = entities.some((e) => e.type === 'meeting');
  const hasAction = entities.some((e) => e.type === 'action');

  if (hasDeadline || hasAction) {
    const deadline = entities.find((e) => e.type === 'deadline');
    suggestions.push({
      type: 'task',
      label: 'Create Task',
      description: `Extracted: "${truncate(text, 50)}"${deadline ? ` · Due: ${deadline.value}` : ''}`,
      icon: '☑',
    });
  }

  if (hasMeeting || hasTime) {
    const time = entities.find((e) => e.type === 'time');
    const meeting = entities.find((e) => e.type === 'meeting');
    suggestions.push({
      type: 'calendar',
      label: 'Add to Calendar',
      description: `${meeting?.value || 'Meeting'}${time ? ` at ${time.value}` : ''}`,
      icon: '📅',
    });
  }

  if (hasDeadline || hasMeeting) {
    suggestions.push({
      type: 'reminder',
      label: 'Set Reminder',
      description: 'Get notified before this is due',
      icon: '🔔',
    });
  }

  return suggestions;
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
