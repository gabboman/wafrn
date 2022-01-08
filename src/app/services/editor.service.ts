import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WafrnMedia } from '../interfaces/wafrn-media';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  base_url = environment.baseUrl;

  constructor(
    private http: HttpClient,
  ) { }

  async createPost(content: string, tags?: string, idPostToReblog?: string): Promise<boolean> {
    let success: boolean = false;

    try {
      const formdata: FormData = new FormData;
      formdata.append('content', content);
      if(idPostToReblog) {
        formdata.append('parent', idPostToReblog);
      }
      if (tags) {
        formdata.append('tags', tags);
      }
      let petitionResponse: any = await this.http.post(this.base_url + '/createPost', formdata);
      success = petitionResponse.id;

    } catch (exception) {
      console.log(exception);
    }


    return success;
  }

  async getMedia(page: number): Promise<WafrnMedia[]> {
    let res: WafrnMedia[] = [];
    try {
      let formData: FormData = new FormData();
      formData.append('page', Math.floor(page).toString());
      let response = await  this.http.post<WafrnMedia[]> (this.base_url + '/myRecentMedia', formData).toPromise();
      if(response) {
        res = response;
      }

    } catch (exception) {
      console.log(exception);
    }

    return res;
  }

  async uploadMedia(description: string, nsfw: boolean, img: File): Promise<WafrnMedia | undefined > {
    let res: WafrnMedia | undefined = undefined;
    try {
      let payload =  new FormData();
      payload.append('files', img);
      payload.append('description', description);
      payload.append('nsfw', nsfw.toString());
      let petition: any = await this.http.post<Array<WafrnMedia>>(environment.baseUrl + '/uploadMedia',
       payload).toPromise();
      if (petition) {
        res = petition[0];
      }
    } catch (exception) {
      console.error(exception);
    }

    return res;
  }
}
