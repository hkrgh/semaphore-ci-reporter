// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/

const get = require('lodash.get')

const SEMAPHORE_CONTEXT = 'semaphoreci'
const SUCCESS = 'success'

module.exports = robot => {
  robot.log('Started Semaphore CI Reporter')

  // https://probot.github.io/docs/webhooks/
  robot.on('status', async context => {
    const eventContext = get(context, 'payload.context')
    if (eventContext !== SEMAPHORE_CONTEXT) { return }
    context.log('Found SemaphoreCI status event')
    const state = get(context, 'payload.state')
    const targetUrl = get(context, 'payload.target_url')

    // TODO handle the other states
    const body =
      state === SUCCESS
        ? `Congrats! Semaphore gave your pull request a [green build](${targetUrl})!`
        : `Oh no! Semaphore did not pass the pull request. You can look at the [build](${targetUrl})`
    const { owner, repo } = context.repo()
    const commit_id = get(context, 'payload.commit.sha')

    const branchName = get(context, 'payload.branches[0].name')

    // https://octokit.github.io/rest.js/#api-PullRequests-getAll
    const allPullRequests = await context.github.pullRequests.getAll({ owner, repo })
    // TODO also filter by head: user:ref-name, and remove filter below:
    const pullRequest = get(allPullRequests, 'data', [])
      .filter(pr => get(pr, 'head.ref') === branchName)
      [0]

    if (!pullRequest) return
    const { number } = pullRequest  // Pull request and issue number are identical!

    // https://octokit.github.io/rest.js/#api-Issues-createComment
    await context.github.issues.createComment({ owner, repo, number, body })

    // https://octokit.github.io/rest.js/#api-PullRequests-createComment
    /* await context.github.pullRequests.createComment({
      owner, // √
      repo, // √
      number, // √
      body, // √
      commit_id, // √
      // TODO Add parameter: path, x
      // TODO Add parameter: position, x
    }) */

  })

  robot.on('pull_request.opened', async context => {
    context.log('pull_request.opened')
    // TODO: Check if the build already has the latest commit status.
    //       If so, display the result.
  })
}
