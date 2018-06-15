# semaphore-ci-reporter

A CI bot reporter for Semaphore CI integration with Github.
A GitHub App built with [Probot](https://github.com/probot/probot).

*Please note: this project is for demonstration purposes, and is not intended for public consumption.*

[![Build Status](https://semaphoreci.com/api/v1/hkrgh/semaphore-ci-reporter/branches/master/badge.svg)](https://semaphoreci.com/hkrgh/semaphore-ci-reporter)

## Demonstration

Here's what a [successful build](https://github.com/hkrgh/test-semaphore-ci-reporter/pull/33) looks like:

[<img src="https://i.imgur.com/rhKIT5Q.png" width="400" />](https://github.com/hkrgh/test-semaphore-ci-reporter/pull/33)

And here's what a [failed build](https://github.com/hkrgh/test-semaphore-ci-reporter/pull/32) looks like:

[<img src="https://i.imgur.com/VVpopXd.png" width="400" />](https://github.com/hkrgh/test-semaphore-ci-reporter/pull/32)

At this time, this project has 100% unit test coverage.

<img src="https://i.imgur.com/QHEbCS5.png" width="400" />

## Setup

Follow the instructions in the [Probot Docs](https://probot.github.io/docs/development/#configuring-a-github-app) to set up local development. Then...

```sh
# Install dependencies
npm install

# Run the bot in development
npm run dev

# Run the bot for production
npm start

# Run the tests
npm test
```

## Contributing

If you have suggestions for how test-probot-app could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## Approach and Challenges

...

## Identified Improvements with GitHub, Probot, and Semaphore

- `create-probot-app` names the `module.exports` variable `app`, yet the Probot docs use `robot`
- The screenshot on [Developing an app](https://probot.github.io/docs/development/) is out of date, and the `app id` is on a different part of the page.
- GitHub has [lots of data types](https://octokit.github.io/rest.js) and relationships between them, as well as rather specific terminology. Sometimes, I made my best guess based on the naming. I looked for and didn't find a "GitHub Dictionary".

## Potential Improvements to this project

- For development purposes, I enabled all permissions and events for the GitHub app. For production use, this should be pared down to just what is required. On that note, it would be nice to have a GitHub app development mode, so that developers don't need to click every option in the settings.
- If the commit has a build before the pull request is raised, with the current code you will not get a comment. We would need to listen to `pull_request.opened` and determine if the latest commit already has a build, and if so go ahead and render the comment.
- I didn't handle the situation if the pull request is updated with a new commit. We'd likely want to update the comment instead of creating a new one each time.
- It's possible to use the pull request review comments instead of issue comments to link to specific files and lines. That might be helpful to users of GitHub.
- I've only tested this on this GitHub account. I do not know if this code works correctly when a different user creates a fork and a pull request onto the test project.
- Add `try/catch` to all request handling and handle errors appropriately.
- Parallelize more of the work instead of always using a single line `await`.
- Add more comments to the code. This could help in the situation of additional contributors. Right now most of the code comments are links to GitHub and Semaphore documentation.
- The commit log is messy. I did all my committing just using the GitHub web interface. (I had a rather situation-specific reason for doing so.) Generally speaking, I would not raise a commit without sufficient tests and a green build. We could potentially squash the early commits to get a cleaner log, but I'm not sure its worth losing the history either.
 
## Timeline

- 2018-06-12 (20 minutes) Evaluate project, create task list
- 2018-06-13 (10 minutes) Create account, create repositories, set up Semaphore account and projects
- 2018-06-14 (10 minutes) Install create-probot-app, add defacto Probot app files, setup Jest in test repo
- 2018-06-14 (90 minutes) Setup Probot app local development with test repository, listen to `status` webhook, filter events, find the pull request from the commit, create basic comment on pull request
- 2018-06-14 (40 minutes) Grab build information from Semaphore and parse information
- 2018-06-14 (60 minutes) Organizing code and start tidying; adding commit sha/link to comment
- 2018-06-15 (45 minutes) Write unit tests, including 100% coverage
- 2018-06-15 (??? minutes) Update this README

## License
[Apache-2.0](LICENSE) © 2018 HKRGH <40249649+hkrgh@users.noreply.github.com>
