// Relative imports
import { merge, sum } from "./util.mjs";
import { renderPercentage } from "./markdown.mjs";
// Type imports
import type { CourseExercise, CourseRequirements } from "./progressTypes.mjs";

interface ExerciseSubmissionInfo {
  foundSubmission: boolean;
}
interface ExerciseInfoNoSubmission {
  foundSubmission: false;
}
interface ExerciseInfo extends ExerciseSubmissionInfo {
  achievedPoints: number;
  foundSubmission: true;
  pending: boolean;
  submitted: boolean;
  totalPoints: number;
}

/**
 * Get info about the exercise submission
 * @param exercise The exercise
 * @returns Information about single exercise submission
 */
export const getExerciseInfo = (
  exercise: Readonly<CourseExercise>
): ExerciseInfoNoSubmission | ExerciseInfo => {
  if (Array.isArray(exercise.submission)) {
    const achievedPoints = sum(
      exercise.submission,
      (submission) => submission.achievedPoints ?? 0
    );
    return {
      achievedPoints,
      foundSubmission: exercise.submission.length > 0,
      pending: exercise.submission.some(
        (a) => a.achievedPoints === undefined && a.notSubmitted !== true
      ),
      submitted: exercise.submission.some((a) => a.notSubmitted !== true),
      totalPoints: sum(exercise.submission, (submission) => submission.points),
    };
  }
  if (exercise.submission?.points !== undefined) {
    return {
      achievedPoints: exercise.submission?.achievedPoints ?? 0,
      foundSubmission: true,
      pending:
        exercise.submission.achievedPoints === undefined &&
        exercise.submission.notSubmitted !== true,
      submitted: exercise.submission.notSubmitted !== true,
      totalPoints: exercise.submission.points,
    };
  }
  return { foundSubmission: false };
};

interface PassedInfoBase {
  passed: boolean;
}
interface PassedInfoPending extends PassedInfoBase {
  passed: false;
  pending: true;
}
interface PassedInfoRequirement {
  passed: boolean;
  requirement: string;
  status: string;
}
interface PassedInfo extends PassedInfoBase {
  requirements: PassedInfoRequirement[];
}

/**
 * Check if a exercise submission was passed
 * @param exerciseInfo The exercise
 * @param courseRequirements Optional requirements to check if passed
 * @returns Was the exercise submission passed
 */
export const getExercisePassedInfo = (
  exerciseInfo: Readonly<ExerciseInfoNoSubmission | ExerciseInfo>,
  courseRequirements: Readonly<CourseRequirements> = {}
): PassedInfo | PassedInfoPending => {
  const requirements: PassedInfoRequirement[] = [];
  if (!exerciseInfo.foundSubmission) {
    return { passed: false, requirements };
  }
  // Check if the exercise submission is still pending
  if (exerciseInfo.pending) {
    return { passed: false, pending: true };
  }
  let passed = true;
  // Check if it was not submitted
  if (exerciseInfo.submitted === false) {
    if (passed) {
      passed = false;
    }
  }
  // Check if achieved points fit the requirements
  if (courseRequirements.minimumPoints?.perSubmission !== undefined) {
    // Minimum points per submission is achieved?
    const passedMinimumPoints =
      exerciseInfo.achievedPoints >=
      courseRequirements.minimumPoints.perSubmission;
    requirements.push({
      requirement: `>= ${courseRequirements.minimumPoints.perSubmission} (pass course)`,
      status: `${exerciseInfo.achievedPoints}/${courseRequirements.minimumPoints.perSubmission}`,
      passed: passedMinimumPoints,
    });
    if (passed) {
      passed = passedMinimumPoints;
    }
  }
  if (
    courseRequirements.minimumPassedExercises?.minimumPointsForPass !==
    undefined
  ) {
    // Minimum points for pass is achieved?
    const passedMinimumPoints =
      exerciseInfo.achievedPoints >=
      courseRequirements.minimumPassedExercises.minimumPointsForPass;
    requirements.push({
      requirement: `>= ${courseRequirements.minimumPassedExercises.minimumPointsForPass} (pass exercise)`,
      status: `${exerciseInfo.achievedPoints}/${courseRequirements.minimumPassedExercises.minimumPointsForPass}`,
      passed: passedMinimumPoints,
    });
    if (passed) {
      passed = passedMinimumPoints;
    }
  }
  if (courseRequirements.minimumPointsPercentage?.perSubmission !== undefined) {
    // Minimum percentage per submission is achieved?
    const passedMinimumPointsPercentage =
      exerciseInfo.achievedPoints / exerciseInfo.totalPoints >=
      courseRequirements.minimumPointsPercentage.perSubmission;
    requirements.push({
      requirement: `>= ${renderPercentage(
        courseRequirements.minimumPointsPercentage.perSubmission
      )}% (pass course)`,
      status: `${renderPercentage(
        exerciseInfo.achievedPoints / exerciseInfo.totalPoints
      )}/${renderPercentage(
        courseRequirements.minimumPointsPercentage.perSubmission
      )}%`,
      passed: passedMinimumPointsPercentage,
    });
    if (passed) {
      passed = passedMinimumPointsPercentage;
    }
  }
  if (
    courseRequirements.minimumPassedExercises
      ?.minimumPointsPercentageForPass !== undefined
  ) {
    // Minimum percentage per submission is achieved?
    const passedMinimumPointsPercentage =
      exerciseInfo.achievedPoints / exerciseInfo.totalPoints >=
      courseRequirements.minimumPassedExercises.minimumPointsPercentageForPass;
    requirements.push({
      requirement: `>= ${renderPercentage(
        courseRequirements.minimumPassedExercises.minimumPointsPercentageForPass
      )}% (pass exercise)`,
      status: `${renderPercentage(
        exerciseInfo.achievedPoints / exerciseInfo.totalPoints
      )}/${renderPercentage(
        courseRequirements.minimumPassedExercises.minimumPointsPercentageForPass
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
export const getCoursePassedInfo = (
  exercises: ReadonlyArray<CourseExercise>,
  requirements: Readonly<CourseRequirements> = {}
): PassedInfo => {
  const requirementInfos: PassedInfoRequirement[] = [];
  const allExerciseInfos = merge(exercises, getExerciseInfo);
  let passed = true;
  // Check if achieved points fit the requirements
  const achievedPoints = sum(allExerciseInfos, (exerciseSubmissionInfo) =>
    exerciseSubmissionInfo.foundSubmission
      ? exerciseSubmissionInfo.achievedPoints
      : 0
  );
  const totalPoints = sum(allExerciseInfos, (exerciseSubmissionInfo) =>
    exerciseSubmissionInfo.foundSubmission
      ? exerciseSubmissionInfo.totalPoints
      : 0
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
      )}/${renderPercentage(
        requirements.minimumPointsPercentage.allSubmissions
      )}%`,
      passed: passedMinimumPointsPercentage,
    });
    if (passed) {
      passed = passedMinimumPointsPercentage;
    }
  }
  // Check if passed exercise submissions fit the requirements
  const totalExercises = allExerciseInfos.length;
  const allExercisePassedInfos = merge(allExerciseInfos, (info) =>
    getExercisePassedInfo(info, requirements)
  );
  const passedExercises = sum(allExercisePassedInfos, (exerciseInfo) =>
    exerciseInfo.passed ? 1 : 0
  );
  if (requirements.minimumPassedExercises?.number !== undefined) {
    // Minimum submission count is achieved?
    const passedMinimumCount =
      passedExercises >= requirements.minimumPassedExercises.number;
    requirementInfos.push({
      requirement: `Passed Exercises >= ${requirements.minimumPassedExercises.number}`,
      status: `${passedExercises}/${requirements.minimumPassedExercises.number}`,
      passed: passedMinimumCount,
    });
    if (passed) {
      passed = passedMinimumCount;
    }
  }
  if (requirements.minimumPassedExercises?.percentage !== undefined) {
    // Minimum submission count percentage is achieved?
    const passedMinimumCountPercentage =
      passedExercises / totalExercises >=
      requirements.minimumPassedExercises.percentage;
    requirementInfos.push({
      requirement: `Passed Exercises >= ${renderPercentage(
        requirements.minimumPassedExercises.percentage
      )}%`,
      status: `${renderPercentage(
        passedExercises / totalExercises
      )}/${renderPercentage(requirements.minimumPassedExercises.percentage)}%`,
      passed: passedMinimumCountPercentage,
    });
    if (passed) {
      passed = passedMinimumCountPercentage;
    }
  }
  return { requirements: requirementInfos, passed };
};
