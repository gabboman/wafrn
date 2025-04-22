import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SnappyService {
  router = inject(Router);

  private readonly stream = new Subject<{ token: string, data: any }>();

  public navigateTo(url: string, data: any) {
    this.stream.next({ token: data.Ψsnappyid, data: data });
    this.router.navigateByUrl(url);
  }

  public getStream(): Observable<{ token: string, data: any }> {
    return this.stream.asObservable();
  }
}
