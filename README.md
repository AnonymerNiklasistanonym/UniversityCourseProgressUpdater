# UniversityCourseProgressUpdater

Updates a `README.md` file on execution with a visualization of the latest progress state.

- 100% NodeJs without any dependencies
- 1 executable JavaScript file
- 1 JSON data file with 1 JSON schema file (optional but recommended)

## How to use

Prerequisites:

1. Have `nodejs` installed

2. Create `updateProgress.js` (and copy connected files) in the directory `dist`

   ```sh
   npm run dist
   ```

3. Create the following file structure (use the created files from the `dist` directory):

   ```text
   repo
     |_ README.md
     |_ progress
         |_ progress.json
         |_ progress.schema.json
         |_ updateProgress.js
   ```

4. `README.md` begin/end comment:

   ```markdown
   ....
   # Progress

   [//]: # (Progress ID begin)
   [//]: # (Progress ID end)
   ...
   ```

5. Run the program without any other dependencies:

   ```sh
   node ./progress/updateProgress.js # without 'node' possible
   ```

## Development

- Lint and automatically fix most linting errors: `npm run lintAndFix`, `npm run lintAndFixTs`
- Run tests: `npm test`
- Get test coverage: `npm run coverage` (for best visualization open the created `coverage/lcov-report/index.html` file in your browser)
- Update examples: `npm run examples`

## TODO

- [x] Add examples
  - [ ] More examples
- [x] Add tests to verify its actually correct
  - [ ] More test coverage (80% would be nice)
- [ ] Add more options
  - [ ] Option for minimum points/percentage of points per submission (this is done through an additional column between `Exercise` and `Points` called `Necessary Points` and works the same as the total points over all submissions part)
  - [ ] Option for multiple exercises where each exercise can have max and achieved points and it's own feedback which could for example be rendered like "5/10 + 12/12 = 17/22 (XY%)"
  - [x] Option to declare exercise as not submitted
    - [ ] Needs to be tested
- [ ] Add default `progress.json` in which some default options are enabled
- [ ] Add predictions (very complex but would be cool)
