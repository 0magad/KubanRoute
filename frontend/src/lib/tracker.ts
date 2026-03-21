interface EventItem {
  event_type: string;
  place_id: string;
  metadata: object;
}

class EventTracker {
  private batch: EventItem[] = [];
  private timer: NodeJS.Timeout | null = null;
  private openTime = 0;
  private maxScroll = 0;

  onCardOpen(placeId: string) {
    this.openTime = Date.now();
    this.maxScroll = 0;
    this.push('card_view', placeId, {});
  }

  onScroll(placeId: string, pct: number) {
    this.maxScroll = Math.max(this.maxScroll, pct);
    if (pct >= 80) {
      this.push('card_read', placeId, {
        time_spent_ms: Date.now() - this.openTime,
        scroll_depth: pct
      });
    }
  }

  onCardClose(placeId: string) {
    this.push('card_view', placeId, {
      time_spent_ms: Date.now() - this.openTime,
      scroll_depth: this.maxScroll
    });
    this.flush();
  }

  onLike(placeId: string) { this.push('card_like', placeId, {}); this.flush(); }
  onUnlike(placeId: string) { this.push('card_unlike', placeId, {}); this.flush(); }
  onRevisit(placeId: string) { this.push('card_revisit', placeId, {}); this.flush(); }
  onSaveRoute(placeId: string) { this.push('route_save', placeId, {}); this.flush(); }

  private push(type: string, placeId: string, meta: object) {
    this.batch.push({ event_type: type, place_id: placeId, metadata: meta });
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 10000);
    }
  }

  async flush() {
    if (!this.batch.length) return;
    const events = [...this.batch];
    this.batch = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    try {
      // Must use absolute URL or ensure API prefix matches setup
      await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/events', {
        method: 'POST',
        body: JSON.stringify({ events }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error("Tracker: failed to flush events", err);
    }
  }
}

export const tracker = new EventTracker();
