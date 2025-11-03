export class NoResultsError {
  readonly _tag = "NoResultsError";
  constructor(
    readonly lat: number,
    readonly lng: number
  ) {}
}

export class GeocodingError {
  readonly _tag = "GeocodingError";
  constructor(readonly message: string) {}
}
