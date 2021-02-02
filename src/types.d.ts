declare module 'renderjson' {
  type DefaultFn = (object: any) => HTMLElement;

  interface RenderJson {
    set_show_to_level: (level: number) => DefaultFn;
    default: DefaultFn;
  }
  const renderJson: RenderJson;
  export default renderJson;
}
