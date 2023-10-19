export function printHelp() {
  const messages = [
    "",
    `test-o-matiq CLI\x1b[32;1m __VERSION\x1b[0m`,
    "",
    "Usage: test-o-matiq [options]",
    "",
    "Options:",
    "--file,      -f     Location of the file, containing the run book data",
    "--json       -j     Indicates that the run book file is in JSON format",
    "--output,    -o     Saves the result in the provided path",
    "--connect,   -c     Test the connectivity. No tests are ran",
    "--sample,    -s     Generate sample run book files in the current folder",
    "--help,      -h     Shows this message",
    "--variables, -v     Location of the variable file (if needed)",
    "--global,    -g     Use global variable file as source of variables values ($HOME/.test-o-matiq)",
    "--env,       -e     Use environment variables as source of variables values",
    "--inline,    -i     Provide inline/command variables values",
    "",
    "Examples:",
    "$ test-o-matiq --file ./test-suite.yaml",
    "$ test-o-matiq --file ./test-suite.json --json",
    "$ test-o-matiq --file ./test-suite.json -v ./path/to/some/variables.yaml",
    "$ test-o-matiq --file ./test-suite.yaml --output ./deployment_result.json",
    "",
    "\x1b[33;1mIf you find test-o-matiq CLI useful, please consider sponsoring the project:",
    "https://github.com/informatiqal/test-o-matiq-cli\x1b[0m",
    "",
  ];

  messages.forEach((message) => {
    console.log(message);
  });

  process.exit(0);
}
