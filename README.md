# UniversityCourseProgressUpdater

Updates a `README.md` file on execution with a visualization of the latest progress state.

- 100% NodeJs without any dependencies
- 1 executable JavaScript file
- 1 JSON data file with 1 JSON schema file (optional but recommended)

## How to use

Prerequisites:

1. Have `nodejs` installed

2. File structure:

   ```text
   repo
     |_ README.md
     |_ progress
         |_ progress.json
         |_ progress.schema.json
         |_ updateProgress.js
   ```

3. `README.md` begin/end comment:

   ```markdown
   ....
   # Progress

   [//]: # (Progress ID begin)
   [//]: # (Progress ID end)
   ...
   ```

4. Run the program without any other dependencies:

   ```sh
   ./progress/updateProgress.js
   ```

## TODO

Priority

- add optional feedback file integration
- fix/update point predictor when existing points are found

Other:

- Add examples
- Add tests to verify it actually is correct
- Add more options
  - Option for minimum points/percentage of points per submission
- Add emojis for each submission when option is enabled
- Add default `progress.json` in which some default options are enabled
- Allow a custom path to a README
