import { Injectable } from '@angular/core';
import { MetaDefinition } from '@angular/platform-browser';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(
    private titleService: Title,
    private metaTagService: Meta,

  ) { }


  objectToFormData(obj: any): FormData {
    let res = new FormData();
    Object.keys(obj).forEach((key: string) => {
      res.append(key, obj[key]);
    })
    return res;
  }

  setSEOTags(title: string, description: string, author: string, image: string): void{
    
    this.titleService.setTitle(title);
    this.metaTagService.addTags([
      {name: 'description', content: description },
      {name: 'author', content: author },
      {name: 'image', content: image},
      {name: 'og:description', description },
      {name: 'og:author', author },
      {name: 'og:image', content: image}
    ]);
    
    
  }
}
