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
/**
 * Declares a class as Injectable by
 */
export function SnappyInjectable(ctr: Function) {
  (ctr as any).Ψsnappyid = ctr.name;
  ctr.prototype.Ψsnappyid = ctr.name;
}

// Haters will say this is bad and evil. They're right!

/**
 * Create an injectable property on within a component.
 *
 * This component must be associated with a route to automatically receive data.
 *
 * @param Ψinst - The
 */
export function snappyInject<T>(Ψinst: new (...args: any[]) => T): ((router: SnappyRouter) => T) {
  const key = (Ψinst as any).Ψsnappyid;
  if (!key) throw new Error("Parameter is not injectable by snappy!");
  creationsubject.next(key);

  // Would like to accept router somewhere else if possible
  return ((router: SnappyRouter): T => {
    return router.getInjectableData(key) as T;
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

  /**
   * Called by Angular when a router navigation event begins that belongs to this outlet.
   */
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
              let component = this.components[this.components.length - 1 - i].component;
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

  /**
   * Pops the top-most element from the ViewContainerRef and unhides the
   * next element.
   */
  pop(): void {
    let component = this.components[this.components.length - 1].component;
    if ((component.instance as SnappyHide).snOnHide) {
      (component.instance as SnappyHide).snOnHide();
    }
    this.components.pop();
    this.element.remove(0);
    let show = this.element.get(0) as EmbeddedViewRef<any>;
    component = this.components[this.components.length - 1].component;


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

  /**
   * Removes all elements from the ViewContainerRef if the URL stack is empty.
   */
  cleanDOM() {
    // If we refresh the page our data will be borked, so clean the DOM
    if (this.urlStack.length === 0) {
      for (let i = this.element.length - 1; i >= 0; i--) {
        this.element.remove(i)
      }
    }
  }

  /**
   * Creates a component and injects it into the route's ViewcContainer
   * @param route - The active route
   * @param env - The environment injector from `activateWithhWith()`.
   * @returns A ComponentRef of the component.
   */
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

  /**
   * Get data attached to a component via its token identifier.
   * @param key - The token of the data
   * @returns The data last associated with this token
   */
  public getInjectableData(key: string): any {
    let c = this.components[this.components.length - 1];
    return c.injectables.get(key);
  }

  /**
   * Places incoming snappy data into the active component's
   * injectables.
   * */
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


  /**
   * @param url - The URL to navigate to via the Angular router
   * @param data - Data to attach to this navigation. Should be defined with the @SnappyInjectable decorator.
   */
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
