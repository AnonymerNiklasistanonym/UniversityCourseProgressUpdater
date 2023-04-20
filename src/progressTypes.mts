/**
 * Structured data object that can contain all information about submissions of exercises of a course (or part of a course) plus the requirements to pass it or any predictions that should be visualized on the basis of them
 */
export interface CourseProgressData {
  /**
   * All course exercises that should be visualized
   */
  exercises: CourseExercise[];
  /**
   * Course name
   */
  name: string;
  /**
   * Optional predictions that should be visualized based on the course exercises
   */
  predictions?: CoursePredictions;
  /**
   * Name of the course progress that is represented by the data when inserted in a markdown file for visualization
   * (this allows for multiple progress updaters)
   */
  progressName: string;
  /**
   * Optional requirements that should be visualized based on the course exercises
   */
  requirements?: CourseRequirements;
  /**
   * Version of the progress updater
   * @TJS-type integer
   */
  version: number;
}
interface CourseExerciseInfo {
  /**
   * Optionally a specific directory file path of the exercise/task
   */
  directory?: string;
  /**
   * A name/number for the exercise/task
   */
  name: string | number;
  /**
   * Optionally notes for the exercise/task
   */
  notes?: string;
}
interface CourseExerciseFeedback {
  /**
   * Optionally a file path (relative to the exercise/task directory) to feedback information about the submission
   */
  feedbackFile?: string;
}
/**
 * Represents an exercise (a collection of tasks or one task)
 */
export interface CourseExercise
  extends CourseExerciseFeedback,
    CourseExerciseInfo {
  /**
   * Tracks the progress of the submission either as one summary of all tasks or as a list of single tasks
   */
  submission?: CourseExerciseSubmission | CourseExerciseTaskSubmission[];
  /**
   * Optionally a submission date of the exercise (run `node` and then `new Date(new Date().toDateString())` or `new Date(new Date(YEAR, MONTH - 1, DATE).toDateString())`
   */
  submissionDate?: string;
}
/**
 * Represents a submission (of all tasks) of the exercise
 */
interface CourseExerciseSubmission {
  /**
   * An optional information of the achieved points of the submission
   */
  achievedPoints?: number;
  /**
   * An optional information if never a submission was made
   */
  notSubmitted?: boolean;
  /**
   * The maximum points of the submission
   * @minimum 0
   */
  points: number;
}
/**
 * Represents one task of all tasks of the exercise
 */
type CourseExerciseTaskSubmission = CourseExerciseSubmission &
  CourseExerciseFeedback &
  CourseExerciseInfo;
/**
 * Predictions that should be enabled for the visualization
 */
interface CoursePredictions {
  /**
   * Shows the points that need to be achieved to pass the course (if still possible)
   */
  predictPointsToPass?: boolean;
}

/**
 * Requirement: Check if a minimum number of points was achieved
 */
interface CourseRequirementsMinimumPoints {
  /**
   * Checks:
   * Was a minimum number of points was achieved for each submission
   * @minimum 0
   */
  perSubmission: number;
  /**
   * If set checks:
   * Was a minimum number of points was achieved over all submissions
   * @minimum 0
   */
  allSubmissions?: number;
}
/**
 * Requirement: Check if a minimum percentage of points was achieved
 */
interface CourseRequirementsMinimumPointsPercentage {
  /**
   * If set checks:
   * Was a minimum percentage of points achieved for each submission
   * @maximum 1
   * @minimum 0
   */
  perSubmission?: number;
  /**
   * If set checks:
   * Was the minimum percentage of all points achieved over all submissions
   * @maximum 1
   * @minimum 0
   */
  allSubmissions?: number;
}
/**
 * Requirement: Check if a minimum count of passed exercises was achieved
 */
interface CourseRequirementsMinimumPassedExercises {
  /**
   * If set checks if a given minimum submission count was achieved
   * @minimum 0
   * @TJS-type integer
   */
  number?: number;
  /**
   * If set checks if a given minimum submission count percentage was achieved
   * @maximum 1
   * @minimum 0
   */
  percentage?: number;
}
/**
 * Requirements to pass course
 */
export interface CourseRequirements {
  minimumPoints?: CourseRequirementsMinimumPoints;
  minimumPointsPercentage?: CourseRequirementsMinimumPointsPercentage;
  minimumPassedExercises?: CourseRequirementsMinimumPassedExercises;
}
