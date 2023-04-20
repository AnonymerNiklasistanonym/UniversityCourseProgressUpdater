// Package imports
import path from "path";
// Relative imports
import { cleanupUndefinedList, merge, sum } from "./util.mjs";
import {
  convertBooleanToEmoji,
  createMdTable,
  renderDate,
  renderPercentage,
  TableRowValues,
} from "./markdown.mjs";
// Type imports
import type {
  CourseExercise,
  CourseProgressData,
  CourseRequirements,
} from "./progressTypes.mjs";

interface ExerciseSubmissionInfo {
  totalPoints: number;
  achievedPoints: number;
  foundSubmission: boolean;
}

/**
 * Get info about the exercise submission
 * @param exercise The exercise
 * @returns Information about single exercise submission
 */
const getExerciseSubmissionInfo = (
  exercise: Readonly<CourseExercise>
): ExerciseSubmissionInfo => {
  if (Array.isArray(exercise.submission)) {
    const achievedPoints = sum(
      exercise.submission,
      (submission) => submission.achievedPoints ?? 0
    );
    return {
      achievedPoints,
      foundSubmission: achievedPoints > 0,
      totalPoints: sum(exercise.submission, (submission) => submission.points),
    };
  }
  if (exercise.submission?.points !== undefined) {
    const achievedPoints = exercise.submission?.achievedPoints ?? 0;
    return {
      achievedPoints,
      foundSubmission: achievedPoints > 0,
      totalPoints: exercise.submission.points,
    };
  }
  return {
    achievedPoints: 0,
    foundSubmission: false,
    totalPoints: 0,
  };
};

interface PassedInfoRequirement {
  passed: boolean;
  requirement: string;
  status: string;
}
interface PassedInfo {
  passed: boolean;
  requirements: PassedInfoRequirement[];
}

/**
 * Check if a exercise submission was passed
 * @param submissionPointsExercise The exercise
 * @param courseRequirements Optional requirements to check if passed
 * @returns Was the exercise submission passed
 */
const getExercisePassedInfo = (
  submissionPointsExercise: Readonly<ExerciseSubmissionInfo>,
  courseRequirements: Readonly<CourseRequirements> = {}
): PassedInfo => {
  const requirements: PassedInfoRequirement[] = [];
  if (!submissionPointsExercise.foundSubmission) {
    return { passed: false, requirements };
  }
  let passed = true;
  // Check if achieved points fit the requirements
  if (courseRequirements.minimumPoints?.perSubmission !== undefined) {
    // Minimum points per submission is achieved?
    const passedMinimumPoints =
      submissionPointsExercise.achievedPoints >=
      courseRequirements.minimumPoints.perSubmission;
    requirements.push({
      requirement: `>= ${courseRequirements.minimumPoints.perSubmission}`,
      status: `${submissionPointsExercise.achievedPoints}/${courseRequirements.minimumPoints.perSubmission}`,
      passed: passedMinimumPoints,
    });
    if (passed) {
      passed = passedMinimumPoints;
    }
  }
  if (courseRequirements.minimumPointsPercentage?.perSubmission !== undefined) {
    // Minimum percentage per submission is achieved?
    const passedMinimumPointsPercentage =
      submissionPointsExercise.achievedPoints /
        submissionPointsExercise.totalPoints >=
      courseRequirements.minimumPointsPercentage.perSubmission;
    requirements.push({
      requirement: `>= ${renderPercentage(
        courseRequirements.minimumPointsPercentage.perSubmission
      )}%`,
      status: `${renderPercentage(
        submissionPointsExercise.achievedPoints /
          submissionPointsExercise.totalPoints
      )}%/${renderPercentage(
        courseRequirements.minimumPointsPercentage.perSubmission
      )}%`,
      passed: passedMinimumPointsPercentage,
    });
    if (passed) {
      passed = passedMinimumPointsPercentage;
    }
  }
  return { requirements, passed };
};

/**
 * Check if a course was passed
 * @param exercises The exercises
 * @param requirements Optional requirements to check if passed
 * @returns Was the exercise submission passed
 */
const getCoursePassedInfo = (
  exercises: ReadonlyArray<CourseExercise>,
  requirements: Readonly<CourseRequirements> = {}
): PassedInfo => {
  const requirementInfos: PassedInfoRequirement[] = [];
  const allExerciseSubmissionInfos = merge(exercises, (exercise) =>
    getExerciseSubmissionInfo(exercise)
  );
  let passed = true;
  // Check if achieved points fit the requirements
  const achievedPoints = sum(
    allExerciseSubmissionInfos,
    (exerciseSubmissionInfo) => exerciseSubmissionInfo.achievedPoints
  );
  const totalPoints = sum(
    allExerciseSubmissionInfos,
    (exerciseSubmissionInfo) => exerciseSubmissionInfo.totalPoints
  );
  if (requirements.minimumPoints?.allSubmissions !== undefined) {
    // Minimum points over all submission is achieved?
    const passedMinimumPoints =
      achievedPoints >= requirements.minimumPoints.allSubmissions;
    requirementInfos.push({
      requirement: `Points >= ${requirements.minimumPoints.allSubmissions}`,
      status: `${achievedPoints}/${requirements.minimumPoints.allSubmissions}`,
      passed: passedMinimumPoints,
    });
    if (passed) {
      passed = passedMinimumPoints;
    }
  }
  if (requirements.minimumPointsPercentage?.allSubmissions !== undefined) {
    // Minimum percentage over all submission is achieved?
    const passedMinimumPointsPercentage =
      achievedPoints / totalPoints >=
      requirements.minimumPointsPercentage.allSubmissions;
    requirementInfos.push({
      requirement: `Points >= ${renderPercentage(
        requirements.minimumPointsPercentage.allSubmissions
      )}%`,
      status: `${renderPercentage(
        achievedPoints / totalPoints
      )}%/${renderPercentage(
        requirements.minimumPointsPercentage.allSubmissions
      )}%`,
      passed: passedMinimumPointsPercentage,
    });
    if (passed) {
      passed = passedMinimumPointsPercentage;
    }
  }
  // Check if passed exercises submissions fit the requirements
  const totalSubmissions = sum(allExerciseSubmissionInfos, () => 1);
  const achievedSubmissions = sum(
    allExerciseSubmissionInfos,
    (exerciseSubmissionInfo) => (exerciseSubmissionInfo.foundSubmission ? 1 : 0)
  );
  if (requirements.minimumPassedExercises?.number !== undefined) {
    // Minimum submission count is achieved?
    const passedMinimumCount =
      achievedSubmissions >= requirements.minimumPassedExercises.number;
    requirementInfos.push({
      requirement: `Passed Exercises >= ${requirements.minimumPassedExercises.number}`,
      status: `${achievedSubmissions}/${requirements.minimumPassedExercises.number}`,
      passed: passedMinimumCount,
    });
    if (passed) {
      passed = passedMinimumCount;
    }
  }
  if (requirements.minimumPassedExercises?.percentage !== undefined) {
    // Minimum submission count percentage is achieved?
    const passedMinimumCountPercentage =
      achievedSubmissions / totalSubmissions >=
      requirements.minimumPassedExercises.percentage;
    requirementInfos.push({
      requirement: `Passed Exercises >= ${renderPercentage(
        requirements.minimumPassedExercises.percentage
      )}%`,
      status: `${renderPercentage(
        achievedSubmissions / totalSubmissions
      )}%/${renderPercentage(requirements.minimumPassedExercises.percentage)}%`,
      passed: passedMinimumCountPercentage,
    });
    if (passed) {
      passed = passedMinimumCountPercentage;
    }
  }
  return { requirements: requirementInfos, passed };
};

const renderExerciseRow = (
  exercise: Readonly<CourseExercise>,
  requirements: Readonly<CourseRequirements> = {}
): TableRowValues => {
  // If exercise directory is given link it on the exercise number (= id)
  let exerciseNameString = `${exercise.name}`;
  if (exercise.directory) {
    exerciseNameString = `[${exerciseNameString}](${exercise.directory})`;
  }
  if (exercise.submissionDate) {
    exerciseNameString += ` (${renderDate(new Date(exercise.submissionDate))})`;
  }
  let exercisePointsString = "";
  let notesString = "";
  if (exercise.submission) {
    const pointsInfo = getExerciseSubmissionInfo(exercise);
    if (Array.isArray(exercise.submission)) {
      if (exercise.submission.length > 0) {
        let oneTaskWasSubmitted = false;
        let oneTaskWasNotSubmitted = false;
        let allTasksWereNotSubmitted = true;
        const pointsColumnString = exercise.submission
          .map((taskSubmission) => {
            // Task name string part
            let taskNamePart = "";
            if (taskSubmission.name) {
              const taskDirectory = cleanupUndefinedList(
                [exercise.directory, taskSubmission.directory],
                (a) => path.posix.join(...a)
              );
              taskNamePart = taskSubmission.directory
                ? ` (*[${taskSubmission.name}](${taskDirectory})*)`
                : ` (*${taskSubmission.name}*)`;
            }
            // Points string part
            let pointsStringPart = "";
            if (taskSubmission.achievedPoints !== undefined) {
              oneTaskWasSubmitted = true;
              allTasksWereNotSubmitted = false;
              pointsStringPart = `${taskSubmission.achievedPoints}/${taskSubmission.points}`;
              if (taskSubmission.feedbackFile) {
                const feedbackPath = cleanupUndefinedList(
                  [
                    exercise.directory,
                    taskSubmission.directory,
                    taskSubmission.feedbackFile,
                  ],
                  (a) => path.posix.join(...a)
                );
                pointsStringPart = `[${pointsStringPart}](${feedbackPath})`;
              }
            } else if (pointsInfo.achievedPoints > 0) {
              pointsStringPart = `${0}/${taskSubmission.points}`;
            } else if (taskSubmission.notSubmitted) {
              pointsStringPart = `~${taskSubmission.points}~`;
            } else {
              pointsStringPart = `${taskSubmission.points}`;
            }
            if (taskSubmission.notSubmitted === false) {
              allTasksWereNotSubmitted = false;
            } else if (taskSubmission.notSubmitted === true) {
              oneTaskWasNotSubmitted = true;
            }
            return `${pointsStringPart}${taskNamePart}`;
          })
          .join(" + ");
        // Check if a global feedback file is given and update its path if a directory is given too
        let pointsSumColumnString = "";
        let exercisePointsPercentageString = "";
        if (oneTaskWasSubmitted) {
          pointsSumColumnString = `${pointsInfo.achievedPoints}/${pointsInfo.totalPoints}`;
          exercisePointsPercentageString = ` (${renderPercentage(
            pointsInfo.achievedPoints / pointsInfo.totalPoints
          )}%)`;
        } else {
          if (oneTaskWasNotSubmitted && allTasksWereNotSubmitted) {
            pointsSumColumnString = `~${pointsInfo.totalPoints}~`;
            exercisePointsPercentageString = ` (${renderPercentage(0)}%)`;
          } else {
            pointsSumColumnString = `${pointsInfo.totalPoints}`;
          }
        }
        if (exercise.feedbackFile) {
          const feedbackPath = cleanupUndefinedList(
            [exercise.directory, exercise.feedbackFile],
            (a) => path.posix.join(...a)
          );
          exercisePointsString = `${pointsColumnString} = [${pointsSumColumnString}](${feedbackPath})`;
        } else {
          exercisePointsString = `${pointsColumnString} = ${pointsSumColumnString}`;
        }
        exercisePointsString += exercisePointsPercentageString;
      }
    } else {
      // Check if a global feedback file is given and update its path if a directory is given too
      let exercisePointsPercentageString = "";
      if (exercise.submission.achievedPoints !== undefined) {
        exercisePointsString = `${pointsInfo.achievedPoints}/${pointsInfo.totalPoints}`;
        exercisePointsPercentageString = ` (${renderPercentage(
          pointsInfo.achievedPoints / pointsInfo.totalPoints
        )}%)`;
      } else {
        if (exercise.submission.notSubmitted) {
          exercisePointsString = `${0}/${pointsInfo.totalPoints}`;
        } else {
          exercisePointsString = `${pointsInfo.totalPoints}`;
        }
      }
      if (exercise.feedbackFile) {
        const feedbackPath = cleanupUndefinedList(
          [exercise.directory, exercise.feedbackFile],
          (a) => path.posix.join(...a)
        );
        exercisePointsString = `[${exercisePointsString}](${feedbackPath})`;
      }
      if (exercise.submission.notSubmitted) {
        exercisePointsString = `~${exercisePointsString}~`;
        exercisePointsPercentageString = ` (${renderPercentage(0)}%)`;
      }
      exercisePointsString += exercisePointsPercentageString;
    }
    notesString += getExercisePassedInfo(pointsInfo, requirements)
      .requirements.map(
        (requirementInfo) =>
          `${requirementInfo.requirement} ${convertBooleanToEmoji(
            requirementInfo.passed
          )}`
      )
      .join(", ");
    // TODO Predictions in external method (how many points at least, are there already enough points accumulated, ...)
    // Probably add new entry to config file for this
  }
  if (exercise.notes) {
    if (notesString.length > 0) {
      notesString += " - ";
    }
    notesString += exercise.notes;
  }
  return [exerciseNameString, exercisePointsString, notesString];
};

export const renderNewProgressContent = (
  progressJsonData: Readonly<CourseProgressData>
) => {
  const newProgressContent: string[] = [];

  // Render the summary header (progress info tables)
  const coursePassInfo = getCoursePassedInfo(
    progressJsonData.exercises,
    progressJsonData.requirements
  );
  if (coursePassInfo.requirements.length > 0) {
    newProgressContent.push(
      createMdTable(
        coursePassInfo.requirements.map((a) => a.requirement),
        [
          coursePassInfo.requirements.map(
            (a) => `${a.status} ${convertBooleanToEmoji(a.passed)}`
          ),
        ]
      )
    );
  }

  // Render main table that lists the submissions
  newProgressContent.push(
    createMdTable(
      ["Exercise", "Points", "Notes"],
      merge(progressJsonData.exercises, (exercise) =>
        renderExerciseRow(exercise, progressJsonData.requirements)
      )
    )
  );

  return newProgressContent.join("\n\n");
};
