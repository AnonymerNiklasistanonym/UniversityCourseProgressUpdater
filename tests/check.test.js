const assert = require('assert')
const sinon = require('sinon');
const path = require('path')
const updateProgress = require('../updateProgressLib')

describe('Helper functions', () => {

  describe('renderPercentage()', () => {
    it('Correct rendering of percentages to strings', () => {
      assert.equal(updateProgress.renderPercentage(1), "100")
      assert.equal(updateProgress.renderPercentage(0.1), "10")
      assert.equal(updateProgress.renderPercentage(0.01), "1")
      assert.equal(updateProgress.renderPercentage(0.53), "53")
    })
  })

  describe('renderFloatingPointNumber()', () => {
    it('Correct rendering of integer numbers to strings', () => {
      assert.equal(updateProgress.renderFloatingPointNumber(1), "1")
      assert.equal(updateProgress.renderFloatingPointNumber(10), "10")
      assert.equal(updateProgress.renderFloatingPointNumber(5), "5")
    })
    it('Correct rendering of floating point numbers to strings', () => {
      assert.equal(updateProgress.renderFloatingPointNumber(1.2345), "1.23")
      assert.equal(updateProgress.renderFloatingPointNumber(1.235), "1.24")
      assert.equal(updateProgress.renderFloatingPointNumber(0.1), "0.10")
      assert.equal(updateProgress.renderFloatingPointNumber(0.01), "0.01")
      assert.equal(updateProgress.renderFloatingPointNumber(0.53), "0.53")
    })
  })

  describe('createMdTableRow()', () => {
    it('Correct rendering string arguments to markdown table row', () => {
      assert.equal(
        updateProgress.createMdTableRow(["Column1", "Column2", "Column3"]),
        "| Column1 | Column2 | Column3 |"
      )
      assert.equal(
        updateProgress.createMdTableRow(["TestColumn1", "TestColumn2", "TestColumn3"]),
        "| TestColumn1 | TestColumn2 | TestColumn3 |"
      )
      assert.equal(
        updateProgress.createMdTableRow(["---", "---", "---"]),
        "| --- | --- | --- |"
      )
    })
  })

  describe('readmeProgressIndicators()', () => {
    it('Correct creation of progress indicators for markdown readme document', () => {
      assert.deepEqual(
        updateProgress.readmeProgressIndicators("Example"),
        {
          begin: `[//]: # (Progress Example begin)`,
          end: `[//]: # (Progress Example end)`
        }
      )
      assert.deepEqual(
        updateProgress.readmeProgressIndicators("Example 02"),
        {
          begin: `[//]: # (Progress Example 02 begin)`,
          end: `[//]: # (Progress Example 02 end)`
        }
      )
    })
  })

})

describe('File system functions', () => {

  describe('getProgressJsonData()', () => {
    it('Successful loading of example progress data', async () => {
      assert(await updateProgress.getProgressJsonData(path.join(__dirname, "..", "examples", "progress_course_task_list.json")) !== undefined)
      assert(await updateProgress.getProgressJsonData(path.join(__dirname, "..", "examples", "progress_course_task_summary.json")) !== undefined)
    })
  })

})

describe('CLI functions', () => {

  describe('parseCliArgs()', () => {
    it('Correct parsing of CLI args', () => {
      const cliArgs1 = updateProgress.parseCliArgs([
        "CUSTOM_README=README_TEST.md",
        "CUSTOM_PROGRESS_JSON=progress_test.json"
      ])
      /** @type {import('../updateProgressTypes').CliArgs} */
      const cliArgs1Expected = {
        customReadmeFilePath: "README_TEST.md",
        customProgressJsonFilePath: "progress_test.json"
      }
      assert.deepEqual(cliArgs1, cliArgs1Expected)

      const cliArgs2 = updateProgress.parseCliArgs([
        "CUSTOM_README=README_TEST1.md"
      ])
      /** @type {import('../updateProgressTypes').CliArgs} */
      const cliArgs2Expected = {
        customReadmeFilePath: "README_TEST1.md"
      }
      assert.deepEqual(cliArgs2, cliArgs2Expected)

      const cliArgs3 = updateProgress.parseCliArgs([
        "CUSTOM_PROGRESS_JSON=progress2_test.json"
      ])
      /** @type {import('../updateProgressTypes').CliArgs} */
      const cliArgs3Expected = {
        customProgressJsonFilePath: "progress2_test.json"
      }
      assert.deepEqual(cliArgs3, cliArgs3Expected)
    })

    it('Correct parsing of process exiting CLI arg --help', () => {
      sinon.stub(process, 'exit');
      sinon.stub(console, 'log');
      assert(process.exit.isSinonProxy);

      updateProgress.parseCliArgs([
        "--help"
      ])

      assert(process.exit.called);
      assert(process.exit.calledWith(0));
      process.exit.restore();
      assert(console.log.called);
      console.log.restore();
    })

    it('Correct parsing of process exiting CLI arg --version', () => {
      sinon.stub(process, 'exit');
      sinon.stub(console, 'log');
      assert(process.exit.isSinonProxy);

      updateProgress.parseCliArgs([
        "--version"
      ])

      assert(process.exit.called);
      assert(process.exit.calledWith(0));
      process.exit.restore();
      assert(console.log.called);
      assert(console.log.calledWith("2.1.4"));
      console.log.restore();
    })

    it('Correct parsing of process exiting CLI unsupported arg', () => {
      sinon.stub(process, 'exit');
      sinon.stub(console, 'log');
      assert(process.exit.isSinonProxy);

      try {
        updateProgress.parseCliArgs([
          "--unsupported"
        ])
        assert(false);
      } catch (error) {
        assert.equal(error.message, "Unsupported argument '--unsupported'!")
      }

      assert(!process.exit.called);
      process.exit.restore();
      assert(!console.log.called);
      console.log.restore();
    })
  })

})

describe('Course Progress Render functions', () => {

  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleSummaries01 = [
    {
      number: 1,
      submission: {
        points: 10,
      }
    },
    {
      number: 2,
      submission: {
        points: 4,
      }
    },
    {
      number: 3,
      submission: {
        points: 5,
      }
    }
  ]
  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleSummaries02 = [
    {
      number: 1,
      submission: {
        points: 10,
        achievedPoints: 5
      }
    },
    {
      number: 2,
      submission: {
        points: 4,
      }
    },
    {
      number: 3,
      submission: {
        points: 5,
        achievedPoints: 2
      }
    }
  ]

  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleLists01 = [
    {
      number: 1,
      submission: [{
        points: 10
      }, {
        points: 20
      }]
    },
    {
      number: 1,
      submission: [{
        points: 4
      }, {
        points: 18
      }]
    }
  ]
  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleLists02 = [
    {
      number: 1,
      submission: [{
        points: 10,
        achievedPoints: 6
      }, {
        points: 20,
        achievedPoints: 14
      }]
    },
    {
      number: 1,
      submission: [{
        points: 4,
        achievedPoints: 2
      }, {
        points: 18,
        achievedPoints: 15
      }]
    }
  ]
  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleLists03 = [
    {
      number: 1,
      submission: [{
        points: 10,
        achievedPoints: 6
      }, {
        points: 20,
        achievedPoints: 14
      }]
    },
    {
      number: 1,
      submission: [{
        points: 4,
        achievedPoints: 2
      }, {
        points: 18,
        achievedPoints: 15
      }]
    },
    {
      number: 3,
      submission: [{
        points: 4,
        achievedPoints: 2
      }]
    }
  ]

  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleMixed01 = [
    {
      number: 1,
      submission: {
        points: 20
      }
    },
    {
      number: 1,
      submission: [{
        points: 4
      }, {
        points: 3
      }]
    }
  ]
  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleMixed02 = [
    {
      number: 1,
      submission: {
        points: 20,
        achievedPoints: 12
      }
    },
    {
      number: 1,
      submission: [{
        points: 4,
        achievedPoints: 2
      }, {
        points: 3
      }]
    }
  ]
  /** @type {import('../progress').CourseExercise[]} */
  const exercisesExampleMixed03 = [
    {
      number: 1,
      submission: {
        points: 20,
        achievedPoints: 20
      }
    },
    {
      number: 2,
      submission: [{
        points: 4,
        achievedPoints: 2
      }, {
        points: 3
      }]
    },
    {
      number: 3,
      submission: []
    },
    {
      number: 4
    },
  ]

  /** @type {import('../progress').CourseRequirements} */
  const requirementsExampleNone = {}

  /** @type {import('../progress').CourseRequirements} */
  const requirementsExampleMinimumPointsPerSubmission01 = {
    minimumPointsPerSubmission: 10
  }
  /** @type {import('../progress').CourseRequirements} */
  const requirementsExampleMinimumPointsPerSubmission02 = {
    minimumPointsPerSubmission: 20
  }

  /** @type {import('../progress').CourseRequirements} */
  const requirementsExampleMinimumPointsPercentagePerSubmission01 = {
    minimumPointsPercentagePerSubmission: 0.5
  }
  /** @type {import('../progress').CourseRequirements} */
  const requirementsExampleMinimumPointsPercentagePerSubmission02 = {
    minimumPointsPercentagePerSubmission: 0.75
  }

  describe('getAllSubmissionPoints()', () => {
    it('Correct counting of submission points', () => {
      assert.equal(updateProgress.getAllSubmissionPoints([]), 0)
      assert.equal(updateProgress.getAllSubmissionPoints(exercisesExampleSummaries01), 19)
      assert.equal(updateProgress.getAllSubmissionPoints(exercisesExampleSummaries02), 19)
      assert.equal(updateProgress.getAllSubmissionPoints(exercisesExampleLists01), 52)
      assert.equal(updateProgress.getAllSubmissionPoints(exercisesExampleLists02), 52)
      assert.equal(updateProgress.getAllSubmissionPoints(exercisesExampleMixed01), 27)
      assert.equal(updateProgress.getAllSubmissionPoints(exercisesExampleMixed02), 27)
      assert.equal(updateProgress.getAllSubmissionPoints(exercisesExampleMixed03), 27)
    })
  })

  describe('getAllAchievedPoints()', () => {
    it('Correct counting of achieved submission points', () => {
      assert.equal(updateProgress.getAllAchievedSubmissionPoints([]), 0)
      assert.equal(updateProgress.getAllAchievedSubmissionPoints(exercisesExampleSummaries01), 0)
      assert.equal(updateProgress.getAllAchievedSubmissionPoints(exercisesExampleSummaries02), 7)
      assert.equal(updateProgress.getAllAchievedSubmissionPoints(exercisesExampleLists01), 0)
      assert.equal(updateProgress.getAllAchievedSubmissionPoints(exercisesExampleLists02), 37)
      assert.equal(updateProgress.getAllAchievedSubmissionPoints(exercisesExampleMixed01), 0)
      assert.equal(updateProgress.getAllAchievedSubmissionPoints(exercisesExampleMixed02), 14)
      assert.equal(updateProgress.getAllAchievedSubmissionPoints(exercisesExampleMixed03), 22)

    })
  })

  describe('getAllAchievedPoints()', () => {
    it('Correct counting of achieved submission points', () => {
      assert.equal(updateProgress.getAllValidSubmittedSubmissions([], requirementsExampleNone), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries01, requirementsExampleNone), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists01, requirementsExampleNone), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed01, requirementsExampleNone), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries02, requirementsExampleNone), 2)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists02, requirementsExampleNone), 2)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists03, requirementsExampleNone), 3)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed02, requirementsExampleNone), 2)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed03, requirementsExampleNone), 2)

      assert.equal(updateProgress.getAllValidSubmittedSubmissions([], requirementsExampleMinimumPointsPerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries01, requirementsExampleMinimumPointsPerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists01, requirementsExampleMinimumPointsPerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed01, requirementsExampleMinimumPointsPerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries02, requirementsExampleMinimumPointsPerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists02, requirementsExampleMinimumPointsPerSubmission01), 2)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists03, requirementsExampleMinimumPointsPerSubmission01), 2)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed02, requirementsExampleMinimumPointsPerSubmission01), 1)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed03, requirementsExampleMinimumPointsPerSubmission01), 1)

      assert.equal(updateProgress.getAllValidSubmittedSubmissions([], requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries01, requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists01, requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed01, requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries02, requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists02, requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists03, requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed02, requirementsExampleMinimumPointsPerSubmission02), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed03, requirementsExampleMinimumPointsPerSubmission02), 1)

      assert.equal(updateProgress.getAllValidSubmittedSubmissions([], requirementsExampleMinimumPointsPercentagePerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries01, requirementsExampleMinimumPointsPercentagePerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists01, requirementsExampleMinimumPointsPercentagePerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed01, requirementsExampleMinimumPointsPercentagePerSubmission01), 0)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleSummaries02, requirementsExampleMinimumPointsPercentagePerSubmission01), 1)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists02, requirementsExampleMinimumPointsPercentagePerSubmission01), 2)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleLists03, requirementsExampleMinimumPointsPercentagePerSubmission01), 3)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed02, requirementsExampleMinimumPointsPercentagePerSubmission01), 1)
      assert.equal(updateProgress.getAllValidSubmittedSubmissions(exercisesExampleMixed03, requirementsExampleMinimumPointsPercentagePerSubmission01), 1)
    })
  })

})
