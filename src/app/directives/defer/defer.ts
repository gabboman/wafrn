// FROM PRIMENG UNDER MIT LICENSE. THIS FILE HAS MIT LICENSE, ITS FROM PRIMENG
// https://github.com/primefaces/primeng/blob/master/src/app/components/defer/defer.ts
import {  DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, ContentChild, Directive, ElementRef, EmbeddedViewRef, EventEmitter, Inject, NgModule, OnDestroy, Output, PLATFORM_ID, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { Nullable } from 'src/app/interfaces/nullable';
/**
 * Defer postpones the loading the content that is initially not in the viewport until it becomes visible on scroll.
 * @group Components
 */
@Directive({
    selector: '[defer]',
})
export class DeferredLoader implements AfterViewInit, OnDestroy {
    /**
     * Callback to invoke when deferred content is loaded.
     * @param {Event} event - Browser event.
     * @group Emits
     */
    @Output() onLoad: EventEmitter<Event> = new EventEmitter<Event>();

    @ContentChild(TemplateRef) template: TemplateRef<any> | undefined;

    documentScrollListener: Nullable<Function>;

    view: Nullable<EmbeddedViewRef<any>>;

    window: Window;

    constructor(@Inject(DOCUMENT) private document: Document, @Inject(PLATFORM_ID) private platformId: any, public el: ElementRef, public renderer: Renderer2, public viewContainer: ViewContainerRef, private cd: ChangeDetectorRef) {
        this.window = this.document.defaultView as Window;
    }

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            if (this.shouldLoad()) {
                this.load();
            }

            if (!this.isLoaded()) {
                this.documentScrollListener = this.renderer.listen(this.window, 'scroll', () => {
                    if (this.shouldLoad()) {
                        this.load();
                        this.documentScrollListener && this.documentScrollListener();
                        this.documentScrollListener = null;
                    }
                });
            }
        }
    }

    shouldLoad(): boolean {
        if (this.isLoaded()) {
            return false;
        } else {
            const rect = this.el.nativeElement.getBoundingClientRect();
            const docElement = this.document.documentElement;
            const winHeight = docElement.clientHeight;

            return winHeight >= rect.top;
        }
    }

    load(): void {
        this.view = this.viewContainer.createEmbeddedView(this.template as TemplateRef<any>);
        this.onLoad.emit();
        this.cd.detectChanges();
    }

    isLoaded() {
        return this.view != null && isPlatformBrowser(this.platformId);
    }

    ngOnDestroy() {
        this.view = null;

        if (this.documentScrollListener) {
            this.documentScrollListener();
        }
    }
}

