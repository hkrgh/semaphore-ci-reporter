// https://probot.github.io/docs/
// https://probot.github.io/docs/development/

const get = require('lodash.get')
const request = require('request-promise-native')
const unescape = require('unescape')
const { projectHash, authToken } = require('./hidden')

const SEMAPHORE_CONTEXT = 'semaphoreci'
const SUCCESS = 'success'
const FAILURE = 'failure'
const ERROR = 'error'
const STATES = [SUCCESS, FAILURE, ERROR]
const BUILD_NUMBER_RE = /builds\/(\d+)/

function parseEventMeta (context) {
  const { owner, repo } = context.repo()
  const targetUrl = get(context, 'payload.target_url')
  return {
    context,
    eventContext: get(context, 'payload.context'),
    state: get(context, 'payload.state'),
    targetUrl,
    buildNumber: get(targetUrl.match(BUILD_NUMBER_RE), 1),
    commitId: get(context, 'payload.commit.sha'),
    senderName: get(context, 'payload.sender.login'),
    branchName: get(context, 'payload.branches[0].name'),
    // TODO Is it possible to have more than one branch here?
    owner,
    repo
  }
}

function isSemaphoreEvent ({ eventContext, state }) {
  return eventContext === SEMAPHORE_CONTEXT && STATES.includes(state)
}

async function getPullRequestNumber ({
  context,
  owner,
  repo,
  senderName,
  branchName
}) {
  // https://octokit.github.io/rest.js/#api-PullRequests-getAll
  const pullRequests = await context.github.pullRequests.getAll({
    owner,
    repo,
    head: `${senderName}:${branchName}`
  })
  const pullRequest = get(pullRequests, 'data[0]', {})
  const { number } = pullRequest
  return number
}

async function getSemaphoreBranchNumber (branchName) {
  // https://semaphoreci.com/docs/branches-and-builds-api.html#project_branches
  const semaphoreBranches = await request({
    uri: `https://semaphoreci.com/api/v1/projects/${projectHash}/branches`,
    qs: { auth_token: authToken },
    json: true
  })
  const semaphoreBranchMeta = semaphoreBranches.find(
    branch => get(branch, 'name') === branchName
  )
  return get(semaphoreBranchMeta, 'id')
}

async function getSemaphoreProblemCommands (branchNumber, buildNumber) {
  // https://semaphoreci.com/docs/branches-and-builds-api.html#build_log
  const semaphoreLog = await request({
    uri: `https://semaphoreci.com/api/v1/projects/${projectHash}/${branchNumber}/builds/${buildNumber}/log`,
    qs: { auth_token: authToken },
    json: true
  })
  const allCommands = get(semaphoreLog, 'threads').reduce(
    (prev, thread) => prev.concat(get(thread, 'commands')),
    []
  )
  return allCommands.filter(command => get(command, 'result') !== '0')
}

function formatSemaphoreLog (commands) {
  // Not sanitising data... assuming GitHub does sanitization for us
  return (
    commands
      .map(
        command => `
- Job: **${get(command, 'name')}** (Result: ${get(command, 'result')})
\`\`\`${unescape(get(command, 'output'))}\`\`\``
      )
      .join('\n') || ''
  )
}

async function getSemaphoreBuildLog (branchName, buildNumber) {
  const branchNumber = await getSemaphoreBranchNumber(branchName)
  const commands = await getSemaphoreProblemCommands(branchNumber, buildNumber)
  return formatSemaphoreLog(commands)
}

async function getCommentBody ({ state, targetUrl, branchName, buildNumber }) {
  if (state === SUCCESS) {
    return `
:green_heart: _Congrats!_
Semaphore passed the pull request. You can look at [the build](${targetUrl})!`
  }
  const logString = await getSemaphoreBuildLog(branchName, buildNumber)
  return `
:x: _Oh no!_
Semaphore failed the pull request. You can look at [the build](${targetUrl}).

${logString}`
}

async function onStatusHook (context) {
  const meta = parseEventMeta(context)
  if (!isSemaphoreEvent(meta)) return
  context.log('Found SemaphoreCI status event,')
  const issueNumber = await getPullRequestNumber(meta)
  const body = await getCommentBody(meta)
  // https://octokit.github.io/rest.js/#api-Issues-createComment
  // Pull request and issue number are identical!
  await context.github.issues.createComment({
    owner: meta.owner,
    repo: meta.repo,
    number: issueNumber,
    body
  })
  context.log('Added Semaphore comment.')
}

function createRobot (robot) {
  robot.log('Started Semaphore CI Reporter')

  // https://probot.github.io/docs/webhooks/
  // https://developer.github.com/v3/activity/events/types/#statusevent
  robot.on('status', onStatusHook)

  // TODO: Check if the build already has the latest commit status.
  //       If so, display the result.
  // robot.on('pull_request.opened', async context => {
  //   context.log('pull_request.opened')
  // })
}

module.exports = {
  parseEventMeta,
  isSemaphoreEvent,
  getPullRequestNumber,
  getSemaphoreBranchNumber,
  getSemaphoreProblemCommands,
  formatSemaphoreLog,
  getSemaphoreBuildLog,
  getCommentBody,
  onStatusHook,
  createRobot
}
