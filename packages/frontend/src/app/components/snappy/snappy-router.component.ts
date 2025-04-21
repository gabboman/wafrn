import {
  Component,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injector,
  OnDestroy,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ScrollService, SnappyNavigation } from 'src/app/services/scroll.service';
import { SnappyCreate, SnappyHide, SnappyShow } from './snappy-life';
import { filter, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'snappy-router',
  template: ''
})
export class SnappyOutletDirective extends RouterOutlet implements OnInit, OnDestroy {
  observer: Observable<SnappyNavigation>;
  data?: any;

  navigationSub: Subscription;
  observerSub: Subscription;

  constructor(
    private readonly element: ViewContainerRef,
    private readonly injector: Injector,
    private readonly router: Router,
    private readonly scrollService: ScrollService,
  ) {
    super();
    this.observer = this.scrollService.getObservable();
    this.observerSub = this.observer.subscribe((e) => {
      this.router.navigateByUrl(e.url);
    })

    this.navigationSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.scrollService.claimData();
      });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.navigationSub.unsubscribe();
    this.observerSub.unsubscribe();
  }

  // We don't know if popstate is forwards, back or otherwise, so here we are.
  urlStack: string[] = [];
  // AFAIK we can't get the component ref back from a view ref :(
  components: any[] = [];

  override activateWith(activatedRoute: ActivatedRoute, environmentInjector: EnvironmentInjector): void {

    if (this.router.getCurrentNavigation()?.trigger === 'popstate') {
      if (this.urlStack.length > 1 && (this.urlStack[this.urlStack.length - 2] === this.router.url)) {
        this.pop();
        return;
      }
    }

    if (!activatedRoute.component) return;

    // If we refresh the page our data will be borked, so clean the DOM
    if (this.urlStack.length === 0) {
      for (let i = this.element.length - 1; i >= 0; i--) {
        this.element.remove(i)
      }
    }

    const inj = Injector.create({
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      parent: this.injector
    });


    let newComponent = this.element.createComponent(activatedRoute.component,
      {
        index: 0,
        injector: inj,
        environmentInjector: environmentInjector
      });

    if ((newComponent.instance as SnappyCreate).snOnCreate) {
      (newComponent.instance as SnappyCreate).snOnCreate();
    }
    if ((newComponent.instance as SnappyShow).snOnShow) {
      (newComponent.instance as SnappyShow).snOnShow();
    }

    this.components.push(newComponent);

    for (let i = this.element.length - 1; i >= 0; i--) {
      const v = this.element.get(i) as EmbeddedViewRef<any>;
      v.rootNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (i != 0) {
            if (!node.classList.contains("snappy-hide")) {
              let component = this.components[i];
              if ((component.instance as SnappyHide).snOnHide) {
                (component.instance as SnappyHide).snOnHide();
              }
              node.classList.add("snappy-hide");
            }
          }
        }
      })
    }

    this.urlStack.push(this.router.url);
  }

  pop(): void {
    if (this.element.length <= 1) {
      return;
    }
    this.components.pop();
    this.element.remove(0);
    let show = this.element.get(0) as EmbeddedViewRef<any>;
    let component = this.components[this.components.length - 1];


    show.rootNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.classList.remove("snappy-hide");
      }
    });

    if ((component.instance as SnappyShow).snOnShow) {
      (component.instance as SnappyShow).snOnShow();
    }

    this.urlStack.pop();
  }
}
