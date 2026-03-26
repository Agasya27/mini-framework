// Creates a virtual DOM node — a plain JS object describing UI
export function createElement(type, props, ...children) {
  return {
    type,                          // string ('div') or Function (component)
    props: props || {},
    children: flattenChildren(children),
    key: props?.key ?? null,
  };
}

// Flatten nested arrays, convert primitives to text vnodes
export function flattenChildren(children) {
  return children.flat(Infinity).map(child => {
    if (child === null || child === undefined || child === false) return null;
    if (typeof child === 'string' || typeof child === 'number') {
      return { type: '__text__', value: String(child) };
    }
    return child;
  }).filter(Boolean);
}
