import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WafrnMedia } from '../interfaces/wafrn-media';
import { Action, EditorLauncherData } from '../interfaces/editor-launcher-data';
import { MatDialog } from '@angular/material/dialog';
import { ProcessedPost } from '../interfaces/processed-post';
import { Ask } from '../interfaces/ask';
import { DashboardService } from './dashboard.service';
import { Router } from '@angular/router';
import { EditorData } from '../interfaces/editor-data';

@Injectable({
  providedIn: 'any',
})
export class EditorService implements OnDestroy {
  base_url = environment.baseUrl;
  public launchPostEditorEmitter: BehaviorSubject<EditorLauncherData> =
    new BehaviorSubject<EditorLauncherData>({
      action: Action.None,
    });

  editorSubscription: Subscription;
  // TODO do something about this when angular 19, I dont like this too much
  public static editorData: EditorData | undefined
  constructor(
    private http: HttpClient,
    private dashboardService: DashboardService,
    private router: Router
  ) {
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
    ask?: Ask
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
        postToQuote: options.idPosToQuote,
        ask: options.ask?.id
      };
      const petitionResponse: any = await this.http
        .post(`${this.base_url}/v2/createPost`, formdata)
        .toPromise();
      success = petitionResponse.id;
      if(success){
        // HACK wait 0.3 seconds so post is fully processed?
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
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

  public async replyPost(post: ProcessedPost, edit = false) {
    await this.openDialogWithData({ post: post, edit: edit })
  }

  public async quotePost(quoteTo: ProcessedPost,) {
    await this.openDialogWithData({ quote: quoteTo })
  }

  public async replyAsk(ask: Ask,) {
    await this.openDialogWithData({ ask: ask })
  }

  public async openDialogWithData(data: any) {
    EditorService.editorData = {
      ...data,
      scrollDate: this.dashboardService.startScrollDate,
      path: window.location.pathname
    }
    this.router.navigate(['/editor'])
  }
}
