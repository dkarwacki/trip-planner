export class WikimediaAPIError {
  readonly _tag = "WikimediaAPIError";
  constructor(readonly message: string) {}
}

export class NoWikimediaPhotosFoundError {
  readonly _tag = "NoWikimediaPhotosFoundError";
  constructor(
    readonly lat: number,
    readonly lng: number,
    readonly radius: number
  ) {}
}










