declare module "page-flip" {
  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, unknown>)
    loadFromHTML(items: NodeListOf<Element> | Element[]): void
    turnToPage(page: number): void
    destroy(): void
    on(event: string, handler: (e: unknown) => void): void
  }
}
