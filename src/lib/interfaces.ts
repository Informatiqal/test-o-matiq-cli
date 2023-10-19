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
  variables?: string;
  /**
   * See "variables"
   */
  var?: string;
  /**
   * See "var"
   */
  v?: string;
  /**
   * Use global variables file as source for variables values
   * @default false
   */
  global?: string;
  /**
   * See: global
   */
  g?: string;
  /**
   * Use the environment variables as source for variable values
   *
   * @default false
   */
  env: boolean;
  /**
   * See: env
   */
  e?: boolean;
  /**
   * Provide inline/command variables values
   *
   * ```
   * --inline "my-variable=value123; another-variable = 456"
   * ```
   */
  inline?: string;
  /**
   * See: inline
   */
  i?: string;
  /**
   * Path where to store the runbook messages output
   */
  /**
   * Test the connectivity. No tests are ran during this command
   */
  connect?: boolean;
  /**
   * See "connect"
   */
  c?: boolean;
  /**
   * Output the raw Qlik Engine communication traffic in the specified file
   */
  traffic?: string;
  /**
   * see "traffic"
   */
  t?: string;
}
