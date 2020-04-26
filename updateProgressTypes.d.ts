export interface ReadmeProgressIndicators {
    begin: string
    end: string
}

export interface CliArgs {
    customReadmeFilePath?: string;
    customProgressJsonFilePath?: string
}

export interface CheckerInfoDataSet {
    achievedCount: number
    count: number
    percentage: number
}

export interface CheckerInfo {
    minimumPointsAllSubmissions?: CheckerInfoDataSet
    minimumSubmissions?: CheckerInfoDataSet
}
