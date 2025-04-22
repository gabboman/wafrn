import {
  ComponentRef,
  Directive,
  EmbeddedViewRef,
  EnvironmentInjector,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  Signal,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, ChildrenOutletContexts, NavigationEnd, PRIMARY_OUTLET, Router, ROUTER_OUTLET_DATA, RouterOutlet } from '@angular/router';
import { SnappyCreate, SnappyHide, SnappyShow } from './snappy-life';
import { filter, Subject, Subscription } from 'rxjs';
import { SnappyService } from './snappy.service';

interface SnappyComponent {
  component: any;
  injectables: Map<string, any>;
}

let creationsubject = new Subject<string>();

// If Angular thinks it can use unicode characters to commit crimes, I get to too
export function SnappyInjectable(ctr: Function) {
  (ctr as any).Ψsnappyid = ctr.name;
  ctr.prototype.Ψsnappyid = ctr.name;
}

// Haters will say this is bad and evil. They're right!
export function snappyInject<T>(Ψinst: new (...args: any[]) => T): ((router: SnappyRouter) => T) {
  const key = (Ψinst as any).Ψsnappyid;
  if (!key) throw new Error("Parameter is not injectable by snappy!");
  creationsubject.next(key);

  // Would like to accept router somewhere else if possible
  return ((router: SnappyRouter): T => {
    return router.get(key) as T;
  })
}

// TODO: Implement routeroutletcontract rather than extend routeroutlet
@Directive({
  selector: 'snappy-router',
  exportAs: 'outlet',
})
export class SnappyRouter extends RouterOutlet implements OnInit, OnDestroy {
  private readonly parentCtx = inject(ChildrenOutletContexts);
  n = PRIMARY_OUTLET;
  data?: any;
  navigationSub: Subscription;
  creationSub: Subscription;
  dataSub: Subscription;

  currentComponent?: SnappyComponent;
  currentRoute?: ActivatedRoute;

  dataStack: { token: string, data: any }[] = [];
  creationStack: string[] = [];



  constructor(
    private readonly element: ViewContainerRef,
    private readonly router: Router,
    private readonly snappy: SnappyService
  ) {
    super();
    this.creationSub = creationsubject.asObservable().subscribe((e) => {
      this.creationStack.push(e);
    });

    this.navigationSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // We clear the these on every nav end, no claiming data that isn't yours >:(
        this.dataStack = [];
        this.creationStack = [];
      });

    this.dataSub = this.snappy.getStream().subscribe((e) => {
      this.dataStack.push(e);
    })
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.navigationSub.unsubscribe();
    this.creationSub.unsubscribe()
  }

  override get component(): Object {
    return this.components[this.components.length - 1].component.instance;
  }

  override get activatedRoute(): ActivatedRoute {
    return this.currentRoute as ActivatedRoute;
  }

  // We don't know if popstate is forwards, back or otherwise, so here we are.
  urlStack: string[] = [];
  // AFAIK we can't get the component ref back from a view ref :(
  components: SnappyComponent[] = [];

  override activateWith(activatedRoute: ActivatedRoute, environmentInjector: EnvironmentInjector): void {
    this.currentRoute = activatedRoute;

    if (this.router.getCurrentNavigation()?.trigger === 'popstate') {
      if (this.urlStack.length > 1 && (this.urlStack[this.urlStack.length - 2] === this.router.url)) {
        if (this.element.length > 1) {
          this.pop();
          return;
        }
        this.element.remove(0);
      }
    }

    if (!activatedRoute.component) return;

    this.cleanDOM();
    let newComponent = this.createComponent(activatedRoute, environmentInjector);

    if ((newComponent.instance as SnappyCreate).snOnCreate) {
      (newComponent.instance as SnappyCreate).snOnCreate();
    }
    if ((newComponent.instance as SnappyShow).snOnShow) {
      (newComponent.instance as SnappyShow).snOnShow();
    }

    for (let i = this.element.length - 1; i >= 0; i--) {
      const v = this.element.get(i) as EmbeddedViewRef<any>;
      v.rootNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (i != 0) {
            if (!node.classList.contains("snappy-hide")) {
              let component = this.components[i].component;
              if ((component.instance as SnappyHide).snOnHide) {
                (component.instance as SnappyHide).snOnHide();
              }
              node.classList.add("snappy-hide");
            }
          }
        }
      })
    }

    if (this.element.length === 5) {
      this.element.remove(this.element.length - 1);
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
    let component = this.components[this.components.length - 1].component;


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

  cleanDOM() {
    // If we refresh the page our data will be borked, so clean the DOM
    if (this.urlStack.length === 0) {
      for (let i = this.element.length - 1; i >= 0; i--) {
        this.element.remove(i)
      }
    }
  }

  createComponent(route: ActivatedRoute, env: EnvironmentInjector): ComponentRef<any> {
    const childContexts = this.parentCtx.getOrCreateContext(this.n).children;
    const ina = new OutletInjector(
      route,
      childContexts,
      this.element.injector,
      this.routerOutletData
    );

    let newComponent = this.element.createComponent(route.component!,
      {
        index: 0,
        injector: ina,
        environmentInjector: env
      });

    this.components.push(
      {
        component: newComponent,
        injectables: new Map<string, any>()
      });

    let c = this.components[this.components.length - 1];

    for (const o of this.creationStack) {
      c.injectables.set(o, null);
    }

    this.claim();

    return newComponent;
  }

  // Public Methods
  public get(key: string): any {
    let c = this.components[this.components.length - 1];
    return c.injectables.get(key);
  }
  public claim(): void {
    if (!this.components.length) { return; };
    let c = this.components[this.components.length - 1];

    for (const o of this.dataStack) {
      if (c.injectables.has(o.token)) {
        c.injectables.set(o.token, o.data);
      }
    }

    this.dataStack = [];
  }


  public navigateTo(url: string, data: any = null) {
    this.dataStack.push({ token: data?.Ψsnappyid, data: data });
    this.router.navigateByUrl(url);
  }
}


class OutletInjector implements Injector {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly childContexts: ChildrenOutletContexts,
    private readonly parent: Injector,
    private readonly outletData: Signal<unknown>,
  ) { }

  get(token: any, notFoundValue?: any): any {
    if (token === ActivatedRoute) {
      return this.route;
    }

    if (token === ChildrenOutletContexts) {
      return this.childContexts;
    }

    if (token === ROUTER_OUTLET_DATA) {
      return this.outletData;
    }

    return this.parent.get(token, notFoundValue);
  }
}
