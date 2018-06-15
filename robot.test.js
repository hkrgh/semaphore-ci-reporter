const {
  SEMAPHORE_CONTEXT,
  SUCCESS,
  FAILURE,
  // ERROR,
  // STATES,
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
} = require('./robot')

const request = require('request-promise-native')

jest.mock('request-promise-native')
jest.mock('./hidden', () => ({
  projectHash: 'b217cd26b913456fb3836a8e9e87f0ef',
  authToken: '093c28a53b18408aa7da66c52e460ae7'
}))

const testContext = {
  repo: () => ({ owner: 'HKRGH', repo: 'test-repo' }),
  payload: {
    target_url: 'https://example.com/build/25',
    context: SEMAPHORE_CONTEXT,
    state: SUCCESS,
    commit: {
      sha: '57afc8ccede244a88a219d6ad2ca1110',
      html_url: 'https://example.com/57afc8ccede244a88a219d6ad2ca1110'
    },
    sender: {
      login: 'HKRGH'
    },
    branches: [{
      name: 'test-branch'
    }]
  },
  github: {
    pullRequests: {
      async getAll () {
        return { data: [{ number: '16' }] }
      }
    },
    issues: {
      createComment: jest.fn()
    }
  },
  log: jest.fn()
}

const mockBranchNumberResult = [{
  name: 'test-branch',
  id: '25'
}]

const mockCommandResult = {
  threads: [{
    commands: [{
      name: 'npm install',
      result: '0'
    }]
  }, {
    commands: [{
      name: 'npm test',
      result: '256'
    }, {
      name: 'npm lint',
      result: '32'
    }]
  }]
}

describe('Semaphore CI Reporter', () => {
  describe('#parseEventMeta', () => {
    test('format data from the context that we need', () => {
      expect(parseEventMeta(testContext)).toMatchSnapshot()
    })
  })

  describe('#isSemaphoreEvent', () => {
    test('true if semaphore and done', () => {
      expect(isSemaphoreEvent({
        eventContext: SEMAPHORE_CONTEXT,
        state: SUCCESS
      })).toBe(true)
    })

    test('false if semaphore and not done', () => {
      expect(isSemaphoreEvent({
        eventContext: SEMAPHORE_CONTEXT,
        state: 'pending'
      })).toBe(false)
    })

    test('false if not semaphore', () => {
      expect(isSemaphoreEvent({
        eventContext: 'travisci',
        state: SUCCESS
      })).toBe(false)
    })
  })

  describe('#getPullRequestNumber', () => {
    test('get the pull request number', async () => {
      const meta = parseEventMeta(testContext)
      const number = await getPullRequestNumber(meta)
      expect(number).toEqual('16')
    })
  })

  describe('#getSemaphoreBranchNumber', () => {
    test('get the branch number', async () => {
      const branchName = 'test-branch'
      request.mockReturnValueOnce(mockBranchNumberResult)
      const branchNumber = await getSemaphoreBranchNumber(branchName)
      expect(branchNumber).toBe('25')
    })
  })

  describe('#getSemaphoreProblemCommands', () => {
    test('get the problem commands', async () => {
      const branchNumber = '25'
      const buildNumber = '16'
      request.mockReturnValueOnce(mockCommandResult)
      const commands = await getSemaphoreProblemCommands(branchNumber, buildNumber)
      expect(commands).toMatchSnapshot()
    })
  })

  describe('#formatSemaphoreLog', () => {
    test('format the failed commands', () => {
      const commands = [{
        name: 'npm test',
        result: '256',
        output: '&gt; Your test failed.'
      }]
      expect(formatSemaphoreLog(commands)).toMatchSnapshot()
    })

    test('give empty string if no failed commands', () => {
      expect(formatSemaphoreLog([])).toEqual('')
    })
  })

  describe('#getSemaphoreBuildLog', () => {
    test('it should get the build log', async () => {
      const branchName = 'test-branch'
      const buildNumber = '16'
      request
        .mockReturnValueOnce(mockBranchNumberResult)
        .mockReturnValueOnce(mockCommandResult)
      const log = await getSemaphoreBuildLog(branchName, buildNumber)
      expect(log).toMatchSnapshot()
    })
  })

  describe('#getCommentBody', () => {
    test('get a success comment', async () => {
      const meta = parseEventMeta(testContext)
      const body = await getCommentBody(meta)
      expect(body).toMatchSnapshot()
    })

    test('get a failed comment', async () => {
      let meta = parseEventMeta(testContext)
      meta.state = FAILURE
      request
        .mockReturnValueOnce(mockBranchNumberResult)
        .mockReturnValueOnce(mockCommandResult)
      const body = await getCommentBody(meta)
      expect(body).toMatchSnapshot()
    })
  })

  describe('#onStatusHook', () => {
    test('do nothing with events that arent Semaphore', async () => {
      const context = {
        ...testContext,
        payload: {
          ...testContext.payload,
          context: 'travisci'
        }
      }
      await onStatusHook(context)
      expect(context.log).not.toBeCalled()
      expect(context.github.issues.createComment).not.toBeCalled()
    })

    test('create a comment on status update', async () => {
      await onStatusHook(testContext)
      expect(testContext.log).toMatchSnapshot()
      expect(testContext.github.issues.createComment).toMatchSnapshot()
    })
  })

  describe('#createRobot', () => {
    test('create a status listening robot', () => {
      const robot = {
        log: jest.fn(),
        on: jest.fn()
      }
      createRobot(robot)
      expect(robot.log).toMatchSnapshot()
      expect(robot.on).toMatchSnapshot()
    })
  })
})
