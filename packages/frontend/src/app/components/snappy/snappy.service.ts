import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, Subject } from "rxjs";

/**
 * Service to provide methods to navigate and interact with the Snappy
 * data stream
 */
@Injectable({
  providedIn: 'root'
})
export class SnappyService {
  private readonly router = inject(Router);
  private readonly stream = new Subject<{ token: string, data: any }>();

  /**
   * @description Place data into the snappy stream, to be consumed upon the
   * next navigation.
   * @param data - The data to be consumed, must be decorated with `@SnappyInjecatble`
   */
  public injectData(data: any) {
    if (!(data?.Ψsnappyid)) return;
    this.stream.next({ token: data.Ψsnappyid, data: data });
  }

  /**
   * @description Navigate to a given via the router url and inject data into the Snappy
   * stream.
   * @param url - The url to navigate to.
   * @param data - The data to be consumed.
   */
  public navigateTo(url: string, data: any) {
    this.injectData(data);
    this.router.navigateByUrl(url);
  }

  /**
   * @description Get the stream of new data as an Observable.
   * @returns An Observable of the stream of data.
   */
  public getStream(): Observable<{ token: string, data: any }> {
    return this.stream.asObservable();
  }
}
