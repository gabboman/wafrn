/**
 * Part of the SnappyRouter lifecycle which may be used in conjunction with
 * Angular's lifecycle.
 *
 * Defines the method `snOnShow()`
 * Called upon by snappy router when becomes visible, including when first created.
 */
export interface SnappyShow {
  snOnShow(): void;
}

/**
 * Part of the SnappyRouter lifecycle which may be used in conjunction with
 * Angular's lifecycle.
 *
 * Defines the method `snOnHide()`
 * Called upon by snappy router when a component is hidden in the DOM.
 */
export interface SnappyHide {
  snOnHide(): void;
}

/**
 * Part of the SnappyRouter lifecycle which may be used in conjunction with
 * Angular's lifecycle.
 *
 * Defines the method `snOnCreate()`
 * Called upon by snappy router when a component is first created.
 */
export interface SnappyCreate {
  snOnCreate(): void;
}
