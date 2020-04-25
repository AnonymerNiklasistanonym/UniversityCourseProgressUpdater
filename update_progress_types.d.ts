export interface ProgressJsonExerciseSubmission {
    points: number
    achievedPoints?: number
}

export interface ProgressJsonExercise {
    number: number
    directory?: string
    submission?: ProgressJsonExerciseSubmission
}

export interface ProgressJsonOptions {
    totalSubmissionPercentage?: number
}

export interface ProgressJson {
    name: string,
    progressName: string,
    version: number,
    exercises: ProgressJsonExercise[];
    options?: ProgressJsonOptions;
}

export interface ReadmeProgressIndicators {
    begin: string
    end: string
}

export interface CliArgsCustomProgressJson {
    filePath: string
}

export interface CliArgs {
    customProgressJson?: CliArgsCustomProgressJson
}
