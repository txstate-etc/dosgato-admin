import type { Reporter } from '@playwright/test/reporter'

class DosgatoReporter implements Reporter {
  onBegin(config, suite) {
    console.log("==============================")
    console.log(`Starting the run with ${suite.allTests().length} tests`);
    console.log("==============================")
  }

  onEnd(result) {
    console.log("==============================")
    console.log(`Finished the run: ${result.status}`);
    console.log("==============================")
  }
}
export default DosgatoReporter;