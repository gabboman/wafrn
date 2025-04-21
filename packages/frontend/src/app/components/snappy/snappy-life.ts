export interface SnappyShow {
  snOnShow(): void;
}

export interface SnappyHide {
  snOnHide(): void;
}

export interface SnappyCreate {
  snOnCreate(data: any): void;
}
