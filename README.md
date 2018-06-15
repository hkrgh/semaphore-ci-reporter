# semaphore-ci-reporter

A CI bot reporter for Semaphore CI integration with Github.
A GitHub App built with [Probot](https://github.com/probot/probot).

[![Build Status](https://semaphoreci.com/api/v1/hkrgh/semaphore-ci-reporter/branches/master/badge.svg)](https://semaphoreci.com/hkrgh/semaphore-ci-reporter)

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how test-probot-app could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## Timeline

- 2018-06-12 (20 minutes) Evaluate project, create task list
- 2018-06-13 (10 minutes) Create account, create repositories, set up Semaphore account and projects
- 2018-06-14 (10 minutes) Install create-probot-app, add defacto Probot app files, setup Jest in test repo
- 2018-06-14 (90 minutes) Setup Probot app local development with test repository, listen to `status` webhook, filter events, find the pull request from the commit, create basic comment on pull request
- 2018-06-14 (40 minutes) Grab build information from Semaphore and parse information

## License
[Apache-2.0](LICENSE) © 2018 HKRGH <40249649+hkrgh@users.noreply.github.com>
