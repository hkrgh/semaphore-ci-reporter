// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/

const get = require('lodash.get')
const request = require('request-promise-native')
const unescape = require('unescape')
const { projectHash, authToken } = require('./hidden')

const SEMAPHORE_CONTEXT = 'semaphoreci'
const SUCCESS = 'success'
const BUILD_NUMBER_RE = /builds\/(\d+)/

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

    if (state === SUCCESS) return


    // Let's get the Semaphore build information :)

    // https://semaphoreci.com/docs/branches-and-builds-api.html#project_branches
    const projectBranchesUrl = `https://semaphoreci.com/api/v1/projects/${projectHash}/branches?auth_token=${authToken}`;
    context.log('#projectBranchesUrl', projectBranchesUrl);
    const semaphoreBranches = await request({
      uri: projectBranchesUrl,
      json: true,
    })
    const semaphoreBranchMeta = semaphoreBranches
      .filter(br => get(br, 'name') === branchName)
      [0]
    const branchNumber = get(semaphoreBranchMeta, 'id')
    const buildNumber = get(targetUrl.match(BUILD_NUMBER_RE), 1)
    // https://semaphoreci.com/docs/branches-and-builds-api.html#build_log
    const buildLogUrl = `https://semaphoreci.com/api/v1/projects/${projectHash}/${branchNumber}/builds/${buildNumber}/log?auth_token=${authToken}`
    context.log('#buildLogUrl', buildLogUrl);
    const semaphoreLog = await request({
      uri: buildLogUrl,
      json: true,
    })
    const allCommands = get(semaphoreLog, 'threads')
      .reduce((prev, thread) => prev.concat(get(thread, 'commands')), [])
    const problemCommands = allCommands.filter(command => get(command, 'result') !== '0')
    // Not sanitising data... assuming GitHub does sanitization for us
    const problemString = problemCommands.map(command => `
- Job: ${get(command, 'name')} (Result: ${get(command, 'result')})
\`\`\`${unescape(get(command, 'output'))}\`\`\`
    `).join('\n')

    await context.github.issues.createComment({ owner, repo, number, body: problemString })
  })

  robot.on('pull_request.opened', async context => {
    context.log('pull_request.opened')
    // TODO: Check if the build already has the latest commit status.
    //       If so, display the result.
  })
}
