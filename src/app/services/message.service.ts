import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor() { }

  add(message: any) {
    console.log('logging message')
    console.log(message)
  }
}
