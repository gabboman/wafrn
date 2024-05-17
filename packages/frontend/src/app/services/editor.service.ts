import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WafrnMedia } from '../interfaces/wafrn-media';
import { Action, EditorLauncherData } from '../interfaces/editor-launcher-data';
import { MatDialog } from '@angular/material/dialog';
import { ProcessedPost } from '../interfaces/processed-post';

@Injectable({
  providedIn: 'any',
})
export class EditorService implements OnDestroy{
  base_url = environment.baseUrl;
  public launchPostEditorEmitter: BehaviorSubject<EditorLauncherData> =
    new BehaviorSubject<EditorLauncherData>({
      action: Action.None,
    });
  
  editorSubscription: Subscription;
  constructor(private http: HttpClient, private dialogService: MatDialog) {
    this.editorSubscription = this.launchPostEditorEmitter.subscribe((data) => {
      if (data.action !== Action.None) {
        this.launchPostEditorEmitter.next({
          action: Action.None,
        });
      }
    });
  }
  ngOnDestroy(): void {
    this.editorSubscription.unsubscribe();
  }

  async createPost(options: {
    content: string;
    media: WafrnMedia[];
    privacy: number;
    tags?: string;
    idPostToReblog?: string;
    contentWarning?: string;
    idPostToEdit?: string;
    idPosToQuote?: string;
  }): Promise<boolean> {
    const content = options.content;
    const media = options.media;
    const privacy = options.privacy;
    const tags = options.tags;
    const idPostToReblog = options.idPostToReblog;
    const contentWarning = options.contentWarning;
    let success: boolean = false;
    try {
      const formdata = {
        content: content,
        parent: idPostToReblog,
        medias: media,
        tags: tags,
        privacy: privacy,
        content_warning: contentWarning ? contentWarning : '',
        idPostToEdit: options.idPostToEdit,
        postToQuote: options.idPosToQuote
      };
      const petitionResponse: any = await this.http
        .post(`${this.base_url}/v2/createPost`, formdata)
        .toPromise();
      success = petitionResponse.id;
    } catch (exception) {
      console.log(exception);
    }

    return success;
  }

  async uploadMedia(
    description: string,
    nsfw: boolean,
    img: File
  ): Promise<WafrnMedia | undefined> {
    let res: WafrnMedia | undefined = undefined;
    try {
      const payload = new FormData();
      payload.append('files', img);
      payload.append('description', description);
      payload.append('nsfw', nsfw.toString());
      const petition: any = await this.http
        .post<Array<WafrnMedia>>(`${environment.baseUrl}/uploadMedia`, payload)
        .toPromise();
      if (petition) {
        res = petition[0];
      }
    } catch (exception) {
      console.error(exception);
    }

    return res;
  }

  async searchUser(url: string) {
    return await this.http
      .get(`${environment.baseUrl}/userSearch/${encodeURIComponent(url)}`)
      .toPromise();
  }

  async getEditorComponent(): Promise<typeof PostEditorComponent> {
    const { PostEditorComponent } = await import(
      '../components/post-editor/post-editor.component'
    );
    return PostEditorComponent;
  }

  public async replyPost(post: ProcessedPost, edit = false) {
    await this.openDialogWithData({post: post, edit: edit})
  }

  public async quotePost(quoteTo: ProcessedPost,) {
    await this.openDialogWithData({quote: quoteTo})
  }

  private async openDialogWithData(data: any) {
    this.dialogService.open(await this.getEditorComponent(), {
      data: data,
      width: 'min(960px, calc(100% - 30px))',
      maxWidth: '100%',
    });
  }
}
