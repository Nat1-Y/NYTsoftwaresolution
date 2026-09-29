/**
 * Isometric projection for the page's drawn plates.
 *
 * The logo is drawn as geometry rather than set in a typeface, and the
 * illustrations follow the same rule: objects are described as boxes and
 * planes in 3D and projected at build time, so every edge in a drawing sits
 * on the same 30° grid and nothing is eyeballed. The output is plain SVG
 * strings — no runtime code ships for any of this.
 *
 * Axes: x runs to the lower right, y to the lower left, z straight up.
 */

const C = Math.cos(Math.PI / 6);
const S = 0.5;

export type Pt = [number, number];

const r = (n: number) => Math.round(n * 10) / 10;

/** Project a 3D point to the page. */
export function p(x: number, y: number, z = 0): Pt {
  return [r((x - y) * C), r((x + y) * S - z)];
}

export const pts = (list: Pt[]) => list.map(([a, b]) => `${a},${b}`).join(' ');

/** A line through several projected points, as an SVG path `d`. */
export function path(points: [number, number, number?][]): string {
  return points
    .map(([x, y, z = 0], i) => {
      const [a, b] = p(x, y, z);
      return `${i ? 'L' : 'M'}${a} ${b}`;
    })
    .join(' ');
}

/** The three visible faces of an axis-aligned box. */
export function box(x: number, y: number, z: number, w: number, d: number, h: number) {
  const t = z + h;
  return {
    top: pts([p(x, y, t), p(x + w, y, t), p(x + w, y + d, t), p(x, y + d, t)]),
    /** Faces +y — the lower-left face. */
    left: pts([p(x, y + d, t), p(x + w, y + d, t), p(x + w, y + d, z), p(x, y + d, z)]),
    /** Faces +x — the lower-right face. */
    right: pts([p(x + w, y, t), p(x + w, y + d, t), p(x + w, y + d, z), p(x + w, y, z)]),
  };
}

/*
 * Affine maps from a flat 2D drawing onto a plane in the scene. A parallel
 * projection keeps parallel lines parallel, so a single SVG `matrix()` places
 * an interface drawn in ordinary screen units exactly onto a face — the
 * contents of every screen in a plate are drawn flat, then mapped.
 */

/** Upright plane facing +y (lower left). u runs along +x, v runs downward. */
export function faceY(x: number, y: number, zTop: number): string {
  const [e, f] = p(x, y, zTop);
  return `matrix(${r(C * 1000) / 1000} ${S} 0 1 ${e} ${f})`;
}

/** Upright plane facing +x (lower right). u runs along -y, v runs downward. */
export function faceX(x: number, y: number, zTop: number): string {
  const [e, f] = p(x, y, zTop);
  return `matrix(${r(C * 1000) / 1000} ${-S} 0 1 ${e} ${f})`;
}

/** Horizontal plane. u runs along +x, v along +y. */
export function faceTop(x: number, y: number, z: number): string {
  const [e, f] = p(x, y, z);
  const c = r(C * 1000) / 1000;
  return `matrix(${c} ${S} ${-c} ${S} ${e} ${f})`;
}

/** A vertical cylinder, as the three shapes that draw it. */
export function cylinder(x: number, y: number, z: number, radius: number, h: number) {
  const [cx, cyTop] = p(x, y, z + h);
  const [, cyBase] = p(x, y, z);
  const rx = r(radius * C * Math.SQRT2);
  const ry = r(radius * S * Math.SQRT2);
  return {
    top: { cx, cy: cyTop, rx, ry },
    body: `M${r(cx - rx)} ${cyTop} L${r(cx - rx)} ${cyBase} A${rx} ${ry} 0 0 0 ${r(cx + rx)} ${cyBase} L${r(cx + rx)} ${cyTop} Z`,
  };
}
