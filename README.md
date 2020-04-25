# UniversityCourseProgressUpdater

Updates a `README.md` file on execution with a visualization of the latest progress state.

## How to use

- Have `nodejs` installed
- Create a directory called `progress` in the root of your repo
- Copy the JSON schema and the JS file in it
- Add a `progress.json` file and insert there the points and options of your course
- Add block comments to your `README.md` between which the progress will be inserted
- Run the JS file to update/add a visualization of the progress located in the `progress.json` file

## TODO

- Add examples
- Add tests to verify it actually is correct
- Add more options
  - Option for optional wished minimum points/percentage per submission
  - Option for minimum points/percentage per submission
  - Option for a certain number of points that need to be reached
  - Option to display how much points should be achieved in all upcoming exercises to be successful
- Add emojis for each submission when option is enabled
- Add default `progress.json` in which some default options are enabled
- Allow a custom path to a README
