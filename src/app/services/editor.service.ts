import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WafrnMedia } from '../interfaces/wafrn-media';
import { ProcessedPost } from '../interfaces/processed-post';
import { Action, EditorLauncherData } from '../interfaces/editor-launcher-data';

@Injectable({
  providedIn: 'any'
})
export class EditorService {

  base_url = environment.baseUrl;
  public launchPostEditorEmitter: BehaviorSubject<EditorLauncherData> = new BehaviorSubject<EditorLauncherData>({
    action: Action.None
  });


  constructor(
    private http: HttpClient,
  ) {
    this.launchPostEditorEmitter.subscribe((data)=> {
      if (data.action !== Action.None) {
        this.launchPostEditorEmitter.next({
          action: Action.None
        })
      }
    })
  }

  async createPost(content: string,privacy: number, tags?: string, idPostToReblog?: string, contentWarning?: string): Promise<boolean> {
    let success: boolean = false;
    try {
      const formdata = {
        content: content,
        parent: idPostToReblog,
        tags: tags,
        privacy: privacy,
        content_warning: contentWarning ? contentWarning : ''
      };
      const petitionResponse: any = await this.http.post(`${this.base_url}/createPost`, formdata).toPromise();
      success = petitionResponse.id;

    } catch (exception) {
      console.log(exception);
    }


    return success;
  }

  async uploadMedia(description: string, nsfw: boolean, img: File): Promise<WafrnMedia | undefined > {
    let res: WafrnMedia | undefined = undefined;
    try {
      const payload =  new FormData();
      payload.append('files', img);
      payload.append('description', description);
      payload.append('nsfw', nsfw.toString());
      const petition: any = await this.http.post<Array<WafrnMedia>>(`${environment.baseUrl}/uploadMedia`,
       payload).toPromise();
      if (petition) {
        res = petition[0];
      }
    } catch (exception) {
      console.error(exception);
    }

    return res;
  }

  async searchUser(url: string) {
    return await this.http.get(`${environment.baseUrl}/userSearch/${encodeURIComponent(url)}`).toPromise();
  }

  async getEditorComponent(): Promise<typeof PostEditorComponent> {
    const { PostEditorComponent } = await import("../components/post-editor/post-editor.component");
    return PostEditorComponent
  }
}
