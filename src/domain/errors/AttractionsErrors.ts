export class NoAttractionsFoundError {
  readonly _tag = "NoAttractionsFoundError";
  constructor(
    readonly location: { lat: number; lng: number },
    readonly searchType: "attractions" | "restaurants" = "attractions"
  ) {}
}

export class AttractionsAPIError {
  readonly _tag = "AttractionsAPIError";
  constructor(readonly message: string) {}
}
