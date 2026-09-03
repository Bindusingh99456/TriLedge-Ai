/**
 * Redis / In-Memory Dead-Letter Queue (DLQ) for Unresolved Financial Exceptions & Failed AI Audits
 */

export interface DLQItem {
  id: string;
  transactionId?: string;
  paymentId?: string;
  orderId?: string;
  reason: string;
  errorDetail?: string;
  payload: any;
  status: "PENDING_RETRY" | "MANUAL_REVIEW" | "RESOLVED" | "FAILED";
  retryCount: number;
  maxRetries: number;
  queuedAt: string;
  lastAttemptAt?: string;
}

class DeadLetterQueueService {
  private dlqStore: Map<string, DLQItem> = new Map();
  private redisKeyPrefix = "triledger:dlq:audit:";

  /**
   * Route failed or timed-out record to the DLQ
   */
  public async enqueue(item: Omit<DLQItem, "id" | "status" | "retryCount" | "queuedAt">): Promise<DLQItem> {
    const id = `DLQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const dlqItem: DLQItem = {
      ...item,
      id,
      status: "PENDING_RETRY",
      retryCount: 0,
      queuedAt: new Date().toISOString()
    };

    this.dlqStore.set(id, dlqItem);
    console.warn(`[DLQ] Enqueued item ${id} for transaction ${item.transactionId || item.paymentId || 'UNKNOWN'}: ${item.reason}`);
    return dlqItem;
  }

  /**
   * Fetch all records in the Dead-Letter Queue
   */
  public async getQueue(): Promise<DLQItem[]> {
    return Array.from(this.dlqStore.values()).sort(
      (a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime()
    );
  }

  /**
   * Re-process / retry a DLQ item
   */
  public async retryItem(id: string, processorFn: (item: DLQItem) => Promise<boolean>): Promise<{ success: boolean; item?: DLQItem; error?: string }> {
    const item = this.dlqStore.get(id);
    if (!item) {
      return { success: false, error: "DLQ Item not found" };
    }

    item.retryCount += 1;
    item.lastAttemptAt = new Date().toISOString();

    try {
      const success = await processorFn(item);
      if (success) {
        item.status = "RESOLVED";
        return { success: true, item };
      } else {
        if (item.retryCount >= item.maxRetries) {
          item.status = "MANUAL_REVIEW";
        }
        return { success: false, item, error: "Processor returned failure" };
      }
    } catch (err: any) {
      if (item.retryCount >= item.maxRetries) {
        item.status = "MANUAL_REVIEW";
      }
      return { success: false, item, error: err?.message || String(err) };
    }
  }

  /**
   * Manually update DLQ item status
   */
  public async updateStatus(id: string, status: DLQItem["status"]): Promise<boolean> {
    const item = this.dlqStore.get(id);
    if (!item) return false;
    item.status = status;
    return true;
  }

  /**
   * Clear or purge resolved items
   */
  public async purgeResolved(): Promise<number> {
    let count = 0;
    for (const [id, item] of this.dlqStore.entries()) {
      if (item.status === "RESOLVED") {
        this.dlqStore.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const dlqService = new DeadLetterQueueService();
