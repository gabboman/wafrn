import {
  Component,
  ComponentRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injector,
  OnInit,
  QueryList,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ForumComponent } from 'src/app/pages/forum/forum.component';
import { ScrollService } from 'src/app/services/scroll.service';
import { SnappyLife } from './snappy-life';

@Component({
  selector: 'snappy-router',
  template: ''
})
export class SnappyOutletDirective extends RouterOutlet implements OnInit {
  @ViewChildren('snappysource', { read: ViewContainerRef })
  source!: QueryList<ViewContainerRef>;
  top: number = 0;
  pops: number = 0;

  constructor(
    private element: ViewContainerRef,
    private injector: Injector,
    private router: Router,
    private readonly scrollService: ScrollService,
  ) {
    super();
  }

  // We don't know if popstate is forwards, back or otherwise, so here we are.
  urlStack: string[] = [];

  override activateWith(activatedRoute: ActivatedRoute, environmentInjector: EnvironmentInjector): void {
    // TODO: This only assumes backwards navigation at the moment.
    if (this.router.getCurrentNavigation()?.trigger === 'popstate') {
      if (this.urlStack.length > 1 && (this.urlStack[this.urlStack.length - 2] === this.router.url)) {
        this.pop();
        return;
      }
    }

    const inj = Injector.create({
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      parent: this.injector
    });

    let newComponent = this.element.createComponent(activatedRoute.component!,
      {
        index: 0,
        injector: inj,
        environmentInjector: environmentInjector
      });

    if (newComponent.instance instanceof SnappyLife) {
      (newComponent.instance as SnappyLife).snOnCreate();
    }

    if (newComponent.instance instanceof ForumComponent) {
      newComponent.instance.post.set(this.scrollService.getLastPost().parentCollection);
      newComponent.instance.postId.set(this.scrollService.getLastPost().id);
    }


    for (let i = this.element.length - 1; i >= 0; i--) {
      const v = this.element.get(i) as EmbeddedViewRef<any>;
      v.rootNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (i != 0) {
            node.classList.add("snappy-hide");
          }
        }
      })
    }

    this.urlStack.push(this.router.url);
    this.top++;
    this.pops = 0;
  }

  pop(): void {
    if (this.element.length <= 1) {
      return;
    }
    this.element.remove(0);
    let show = this.element.get(0) as EmbeddedViewRef<any>;

    show.rootNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.classList.remove("snappy-hide");
      }
    });
    this.top--;
    this.urlStack.pop();
  }

  private ManageLife(c: ComponentRef<any>) {
  }
}
