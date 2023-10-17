export interface IArguments {
  /**
   * Path to the test suite file
   */
  file?: string;
  /**
   * See "file"
   */
  f?: string;
  /**
   * Does the test suite is in JSON format (default is YAML)
   */
  json?: boolean;
  /**
   * Where to store the output information
   */
  output?: string;
  /**
   * See "output"
   */
  o?: string;
  /**
   * Generate sample test suite file
   */
  sample?: string;
  /**
   * Print help commands
   */
  /**
   * See "sample"
   */
  s?: string;
  help?: boolean;
  /**
   * See "help"
   */
  h?: boolean;
  /**
   * Path to a file where the variables definitions are stored
   */
  var?: string;
  /**
   * See "var"
   */
  v?: string;
  /**
   * Test the connectivity. No tests are ran during this command
   */
  connect?: boolean;
  /**
   * See "connect"
   */
  c?: boolean;
}
