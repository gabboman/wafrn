import { Injectable } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SimpleSeoService {
  constructor(private titleService: Title, private metaTagService: Meta) {}

  setSEOTags(
    title: string,
    description: string,
    author: string,
    image: string
  ): void {
    const sanitizedDescription = description;
    this.titleService.setTitle(title);
    const tags: MetaDefinition[] = [
      {name: 'description', content: sanitizedDescription },
      {name: 'author', content: author },
      {name: 'image', content: image},
      {name: 'og:description', content: sanitizedDescription },
      {name: 'og:author', author },
      {name: 'og:image', content: image},
      {name: 'og:title', content: title},
      {name: 'og:site_name', content: environment.frontUrl},
      {name: 'twitter:card', content: 'summary' },
      {name: 'twitter:title', content: title },
      {name: 'twitter:site', content: environment.frontUrl },
      {name: 'twitter:description', content: sanitizedDescription },
      {name: 'twitter:image', content: image},
    ];
    this.metaTagService.addTags(tags);
  }
}
