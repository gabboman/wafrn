import { ActivatedRouteSnapshot, DetachedRouteHandle, Route, RouteReuseStrategy, UrlSegment } from '@angular/router'

export class CustomReuseStrategy implements RouteReuseStrategy {
  readonly storedRouteHandles = new Map<string, DetachedRouteHandle>()

  // Decides if the route should be stored
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.data['reuseRoute'] === true
  }

  // Store the information for the route we're destructing
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (route.routeConfig?.path !== undefined) {
      const id = this.createIdentifier(route)
      this.storedRouteHandles.set(id, handle)
    }
  }

  // Return true if we have a stored route object for the next route
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const id = this.createIdentifier(route)
    return this.storedRouteHandles.has(id)
  }

  // If we returned true in shouldAttach(), now return the actual route data for restoration
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    const id = this.createIdentifier(route)
    return this.storedRouteHandles.get(id) as DetachedRouteHandle
  }

  // Reuse the route if we're going to and from the same route
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig
  }

  private createIdentifier(route: ActivatedRouteSnapshot): string {
    // Build the complete path from the root to the input route
    const segments: UrlSegment[][] = route.pathFromRoot.map((r) => r.url)
    const subpaths = ([] as UrlSegment[]).concat(...segments).map((segment) => segment.path)
    // Result: ${route_depth}-${path}
    return segments.length + '-' + subpaths.join('/')
  }
}
