// Package imports
import path from "path";
// Relative imports
import { cleanupUndefinedList, merge } from "./util.mjs";
import {
  convertBooleanToEmoji,
  createMdTable,
  renderDate,
  renderPercentage,
  TableRowValues,
} from "./markdown.mjs";
import {
  getCoursePassedInfo,
  getExerciseInfo,
  getExercisePassedInfo,
} from "./logic.mjs";
// Type imports
import type {
  CourseExercise,
  CourseExerciseTaskSubmission,
  CourseProgressData,
  CourseRequirements,
} from "./progressTypes.mjs";

const renderExerciseSubmissionTask = (
  task: Readonly<CourseExerciseTaskSubmission>,
  exerciseDir?: string
): string => {
  // Task name string part
  let taskNamePart = "";
  if (task.name) {
    const taskDirectory = cleanupUndefinedList(
      [exerciseDir, task.directory],
      (a) => path.posix.join(...a)
    );
    taskNamePart = task.directory
      ? ` (*[${task.name}](${taskDirectory})*)`
      : ` (*${task.name}*)`;
  }
  // Points string part
  let pointsStringPart = "";
  if (task.achievedPoints !== undefined) {
    const taskPointsStringRatio = `${task.achievedPoints}/${task.points}`;
    if (task.feedbackFile) {
      const feedbackPath = cleanupUndefinedList(
        [exerciseDir, task.directory, task.feedbackFile],
        (a) => path.posix.join(...a)
      );
      pointsStringPart = `[${taskPointsStringRatio}](${feedbackPath})`;
    } else {
      pointsStringPart = taskPointsStringRatio;
    }
  } else if (task.notSubmitted) {
    pointsStringPart = `~${task.points}~`;
  } else if (task.achievedPoints === undefined) {
    // Pending
    pointsStringPart = `?/${task.points}`;
  } else {
    pointsStringPart = `${task.points}`;
  }
  return `${pointsStringPart}${taskNamePart}`;
};

const renderExerciseRow = (
  exercise: Readonly<CourseExercise>,
  requirements: Readonly<CourseRequirements> = {}
): TableRowValues => {
  let exerciseNameString = `${exercise.name}`;
  if (exercise.directory) {
    exerciseNameString = `[${exerciseNameString}](${exercise.directory})`;
  }
  if (exercise.submissionDate) {
    exerciseNameString += ` (${renderDate(new Date(exercise.submissionDate))})`;
  }
  const exerciseInfo = getExerciseInfo(exercise);
  let exercisePointsString = "";
  let notesString = "";
  if (exerciseInfo.foundSubmission && exercise.submission) {
    if (Array.isArray(exercise.submission)) {
      exercisePointsString += exercise.submission
        .map((a) => renderExerciseSubmissionTask(a, exercise.directory))
        .join(" + ");
      exercisePointsString += " = ";
    }
    let exercisePointsStringRatio = `${exerciseInfo.achievedPoints}/${exerciseInfo.totalPoints}`;
    if (!exerciseInfo.submitted) {
      exercisePointsStringRatio = `~${exerciseInfo.totalPoints}~`;
    } else if (exerciseInfo.pending) {
      exercisePointsStringRatio = `?/${exerciseInfo.totalPoints}`;
    }
    if (exercise.feedbackFile) {
      const feedbackPath = cleanupUndefinedList(
        [exercise.directory, exercise.feedbackFile],
        (a) => path.posix.join(...a)
      );
      exercisePointsString += `[${exercisePointsStringRatio}](${feedbackPath})`;
    } else {
      exercisePointsString += exercisePointsStringRatio;
    }
    if (!exerciseInfo.pending && exerciseInfo.submitted) {
      exercisePointsString += ` (${renderPercentage(
        exerciseInfo.achievedPoints / exerciseInfo.totalPoints
      )}%)`;
    }
    const exercisePassedInfo = getExercisePassedInfo(
      exerciseInfo,
      requirements
    );
    if ("requirements" in exercisePassedInfo) {
      notesString += exercisePassedInfo.requirements
        .map(
          (requirementInfo) =>
            `${requirementInfo.requirement} ${convertBooleanToEmoji(
              requirementInfo.passed
            )}`
        )
        .join(", ");
    }
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
