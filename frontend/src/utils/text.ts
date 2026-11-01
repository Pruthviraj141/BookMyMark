/**
 * Cleans captions and descriptions for saved reels, tweets, and bookmarks.
 * - Extracts clean caption text from raw share payloads and Instagram meta wrappers.
 * - Removes engagement metrics (likes, comments count, share count, view count).
 * - Removes raw URLs and tracking query strings.
 * - Strips meta-descriptions like "A tweet saying...", "A reel saying...", "This reel shows...", "Watch this reel by...".
 * - Gets directly to the point.
 */
export function cleanCaption(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  let text = input.trim();

  // 1. If Instagram/X/TikTok metadata has author/date with quote e.g. "... on Date: \"Caption...\""
  const quoteMatch = text.match(/:\s*["“](.+?)(?:["”]|[\s.]*$)/s);
  if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim().length > 3) {
    text = quoteMatch[1].trim();
  }

  // 2. Strip all http/https URLs
  text = text.replace(/https?:\/\/[^\s]+/gi, '').trim();

  // 3. Remove engagement metrics (e.g., "12.4k likes", "340 comments", "50 shares", "1.2M views")
  text = text.replace(/\b\d+[\d,.]*[kKmM]?\s*(?:likes?|comments?|shares?|views?|retweets?|reactions?)\b/gi, '').trim();
  text = text.replace(/\b(?:likes?|comments?|shares?|views?):\s*\d+[\d,.]*[kKmM]?\b/gi, '').trim();

  // 4. Remove meta preamble phrases and commentary:
  // e.g. "A tweet warning that...", "A tweet humorously likening...", "A TikTok reel featuring...", "A reel saying..."
  text = text.replace(
    /^(?:a\s+)?(?:tweet|reel|tiktok(?:\s+reel)?|video|post)\s+(?:warning|humorously\s+likening|likening|featuring|explaining|discussing|describing|showing|highlighting|stating|sharing|saying|about|critiquing|comparing)\s+(?:that\s+)?/gi,
    ''
  ).trim();

  text = text.replace(
    /^(?:a\s+tweet\s+saying|a\s+reel\s+saying|this\s+reel\s+shows|a\s+video\s+showing|tweet\s+saying|reel\s+saying|in\s+this\s+reel|in\s+this\s+video|watch\s+this\s+reel(?:\s+by\s+@[a-zA-Z0-9._]+)?|check\s+out\s+this\s+reel|shared\s+via\s+instagram|see\s+instagram\s+photos\s+and\s+videos\s+from|the\s+user\s+shares\s+a\s+reel|the\s+post\s+discusses|this\s+post\s+is\s+about)[\s:,-]*/gi,
    ''
  ).trim();

  // If text starts with "that " e.g. "that not knowing..." -> "Not knowing..."
  text = text.replace(/^that\s+/i, '').trim();

  // 5. Clean up surrounding quotes, brackets, and punctuation
  text = text.replace(/^["'“‘\s,:-]+|["'”’\s,:-]+$/g, '').trim();

  // 6. Normalize internal spacing
  text = text.replace(/\s{2,}/g, ' ');

  // 7. Capitalize first letter if present
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text;
}
