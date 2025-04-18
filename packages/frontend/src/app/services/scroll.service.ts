import { Injectable } from "@angular/core";

export enum ScrollContext {
  Inactive,
  Dashboard,
  Blog,
}

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  context = ScrollContext.Inactive;
  unique: number = 0;

  targets = new Map<ScrollContext, string>();
  targetID: string = '';

  public getNext() {
    return this.unique++;
  }

  public setScrollContext(context: ScrollContext) {
    this.context = context;
  }

  public setLastPostID(id: string) {
    this.targets.set(this.context, id);
    this.targetID = id;
  }

  public getLastPostID(): string {
    if (this.targets.has(this.context)) {
      return this.targets.get(this.context)!;
    }
    return '';
  }
}
