export type NavigationStackItem = {
  id: string;
  type: 'modal' | 'drawer' | 'subview' | 'dialog';
  onBack: () => boolean | void; // Return true to consume, false to pass
};

class NavigationService {
  private stack: NavigationStackItem[] = [];
  private historyPushedCount: number = 0;
  private rootExitConfirmTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState);
    }
  }

  private handlePopState = (event: PopStateEvent) => {
    if (this.stack.length > 0) {
      const topItem = this.stack.pop();
      if (topItem) {
        const handled = topItem.onBack();
        if (handled === false) {
          // If the handler didn't consume it, continue popping
          this.handlePopState(event);
        }
      }
    } else {
      // At root page
      const now = Date.now();
      if (now - this.rootExitConfirmTime < 2000) {
        // Double back within 2s lets browser go back / exit
      } else {
        this.rootExitConfirmTime = now;
        // Re-push root state to prevent exiting
        window.history.pushState({ root: true }, '');
      }
    }
  };

  /**
   * Register a back-button handler (e.g., when a modal or dialog opens)
   * Automatically pushes a dummy history state so hardware back pops it
   */
  public pushHandler(item: Omit<NavigationStackItem, 'id'>): string {
    const id = `nav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: NavigationStackItem = { ...item, id };
    this.stack.push(fullItem);

    if (typeof window !== 'undefined') {
      window.history.pushState({ stackId: id }, '');
      this.historyPushedCount++;
    }

    return id;
  }

  /**
   * Manually pop/close a modal when closed via UI (X button or overlay tap)
   * Reverts history state without triggering duplicate close listeners
   */
  public removeHandler(id: string) {
    const index = this.stack.findIndex(s => s.id === id);
    if (index !== -1) {
      this.stack.splice(index, 1);
      if (typeof window !== 'undefined' && this.historyPushedCount > 0) {
        this.historyPushedCount--;
        window.history.back();
      }
    }
  }

  public getStackDepth(): number {
    return this.stack.length;
  }

  public clearAll() {
    this.stack = [];
  }
}

export const navigationService = new NavigationService();
