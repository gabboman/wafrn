import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }


  objectToFormData(obj: any): FormData {
    const res = new FormData();
    Object.keys(obj).forEach((key: string) => {
      res.append(key, obj[key]);
    })
    return res;
  }

}
