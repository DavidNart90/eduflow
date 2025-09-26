// CSS module type declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.less' {
  const content: { [className: string]: string };
  export default content;
}

// Global CSS imports (side effect imports)
declare module '*.css' {
  const content: Record<string, unknown>;
  export = content;
}

declare module '*.scss' {
  const content: Record<string, unknown>;
  export = content;
}
