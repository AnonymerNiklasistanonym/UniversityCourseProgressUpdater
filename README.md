# UniversityCourseProgressUpdater

Updates a `README.md` file on execution with a visualization of the latest progress state.

- 100% NodeJs without any dependencies
- 1 executable JavaScript file
- 1 JSON data file with 1 JSON schema file (optional but recommended)

## How to use

Prerequisites:

1. Have `nodejs` installed and install all dev dependencies (not necessary afterwards)

   ```sh
   npm install
   ```

2. Create `updateProgress.mjs` (and optionally `progress.schema.json`)

   ```sh
   npm run build
   npm run createBundle
   # Optionally
   npm run createJsonSchema
   ```

3. Create for example the following file structure:

   ```text
   repo
     |_ README.md
     |_ progress
         |_ progress.json        (create yourself)
         |_ progress.schema.json (copy from repo dir ./)
         |_ updateProgress.mjs   (copy from repo dir ./dist/)
   ```

   Insert in the `README.md` a begin/end comment somewhere:

   ```markdown
   ....
   # Progress title

   [//]: # (Progress ID begin)

   you progress will be rendered in here

   [//]: # (Progress ID end)

   ...
   ```

   An example `progress.json`: (you can check the [`examples`](./examples/) directory for more examples)

   ```json
   {
      "$schema": "./progress.schema.json",
      "exercises": [
         {
            "directory": "ex01",
            "feedbackFile": "feedback.pdf",
            "name": 1,
            "submission": [
               {
                  "achievedPoints": 12.5,
                  "name": "theoretical",
                  "points": 15
               },
               {
                  "achievedPoints": 10,
                  "name": "programming",
                  "points": 15
               }
            ],
            "submissionDate": "2020-09-06T22:00:00.000Z"
         },
      ],
      "name": "Course Example 02 SS20",
      "progressName": "ID",
      "requirements": {
         "minimumPointsPercentage": {
            "allSubmissions": 0.5
         },
         "minimumPassedExercises": {
            "number": 4
         }
      },
      "version": 5
   }
   ```

4. Run the program without any other dependencies:

   ```sh
   node ./progress/updateProgress.mjs PROGRESS_JSON=progress/progress.json
   ```

## Development

- Lint (and automatically fix) most errors: `npm run lint:fix`
- Run tests: `npm test`
- Run examples: `npm run runExamples`
- Debug code using the examples in [VSCode](https://code.visualstudio.com/): Open the repository as working directory and click `Ctrl` + `Shift` + `D`

## Timezones

If you use the date property and want to change the timezone (because it is executed on a server somewhere else or something do the following):

Add `TZ='XYZ'` before running `node` to set the timezone for the process.
Possible values are for example:

- `UTC` (UTC+00:00)
- `Europe/Amsterdam` (UTC+05:00 / DST mixes this up)
- `Europe/Berlin` (UTC+01:00 / DST mixes this up)
- `America/Washington` (UTC−08:00 / DST mixes this up)

Example for `America/Washington`:

```sh
TZ='America/Washington' node ./progress/updateProgress.mjs
```

## TODO

- [x] Add examples
  - [ ] More/Better examples
  - [ ] Automate example generation and README content so it's never wrong or outdated
- [ ] Add tests to verify its actually correct
  - [ ] More test coverage (80% would be nice)
- [ ] Add more options
  - [x] Option for minimum points/percentage of points per submission
  - [x] Option for multiple subtasks of a single exercise
  - [x] Option to declare exercise as not submitted
  - [ ] Add predictions (very complex but would be cool)
  - [ ] Add more requirements and validate the existing ones
