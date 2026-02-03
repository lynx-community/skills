declare module "npm-packlist" {
  interface Options {
    path?: string;
  }
  function packList(options?: Options): Promise<string[]>;
  export default packList;
}
