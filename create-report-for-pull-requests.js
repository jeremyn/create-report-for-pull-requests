#!/usr/bin/env node
const fs = require('fs');
const octokit = require('@octokit/rest')();
const yargs = require('yargs');

function handlePromiseError(err) {
  console.log(err);
  process.exitCode = 1;
}

function getPRsToCheck(getAllRes, numToProcessStart, numToProcessEnd) {
  const PRsToCheck = [];
  getAllRes.data.forEach((currRes, numCurrRes) => {
    const shouldMakeGetRequest = (
      (numCurrRes >= numToProcessStart) &&
      (numCurrRes < numToProcessEnd) &&
      (currRes.merged_at !== null)
    );

    if (shouldMakeGetRequest) {
      const { number } = currRes;
      PRsToCheck.push(number);
    }
  });
  return PRsToCheck;
}

function getStartAndEndPages(numStartPR, numTotalPRs, numPerPage) {
  const numStartPage = Math.floor(numStartPR / numPerPage);
  const numEndPage = Math.floor((numStartPR + (numTotalPRs - 1)) / numPerPage);
  return [numStartPage, numEndPage];
}

function getStartAndEndNums(numCurrPage, numStartPR, numTotalPRs, numPerPage) {
  const [numStartPage, numEndPage] = getStartAndEndPages(
    numStartPR,
    numTotalPRs,
    numPerPage,
  );
  let numToProcessStart;
  let numToProcessEnd;

  if (numCurrPage === numStartPage) {
    numToProcessStart = numStartPR % numPerPage;
  } else {
    numToProcessStart = 0;
  }

  if (numCurrPage === numEndPage) {
    const remainder = (numStartPR + numTotalPRs) % numPerPage;
    if (remainder === 0) {
      numToProcessEnd = numPerPage;
    } else {
      numToProcessEnd = remainder;
    }
  } else {
    numToProcessEnd = numPerPage;
  }

  return [numToProcessStart, numToProcessEnd];
}

function getYargsArgv(yargs_) {
  return yargs_
    .usage('Usage: $0 [options]')
    .nargs('o', 1)
    .alias('o', 'owner')
    .describe('o', 'owner of repo')
    .nargs('r', 1)
    .alias('r', 'repo')
    .describe('r', 'name of repo')
    .nargs('l', 1)
    .alias('l', 'list-of-pull-requests')
    .describe('l', 'comma-delimited list of PRs numbers to check')
    .nargs('p', 1)
    .alias('p', 'per-page-num')
    .describe('p', 'number of PRs to load per page')
    .default('p', 100) // max accepted by GitHub
    .nargs('s', 1)
    .alias('s', 'start-num')
    .describe('s', 'first PR to check (zero-indexed)')
    .nargs('t', 1)
    .alias('t', 'total-num')
    .describe('t', 'total number of PRs to check')
    .demandOption(['owner', 'repo'])
    .conflicts('l', ['s', 't'])
    .nargs('f', 1)
    .alias('f', 'output-file')
    .describe('f', 'output CSV filename')
    .default('f', 'results.csv')
    .nargs('g', 1)
    .alias('g', 'github-token')
    .describe('g', 'GitHub personal access token')
    .help('h')
    .alias('h', 'help')
    .version(false)
    .argv;
}

function updateTracker(getRes, tracker) {
  const { data } = getRes;
  tracker.push([
    data.number.toString(),
    data.merged_by.login,
    data.created_at,
    data.merged_at,
    data.html_url,
  ]);
}

function writeTrackerToCSV(tracker, fileName) {
  const headers = [
    'PR number',
    'merged_by.login',
    'created_at',
    'merged_at',
    'html_url',
  ];
  let fd;
  try {
    fd = fs.openSync(fileName, 'w');
    fs.appendFileSync(fileName, `${headers.join()}\n`, 'utf8');
    tracker.forEach((row) => {
      fs.appendFileSync(fileName, `${row.join()}\n`, 'utf8');
    });
    console.log(`Finished writing ${fileName}.`);
  } catch (err) {
    console.log(err);
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
    process.exitCode = 1;
  }
}

function processListOfPRs(listOfPRs, owner, repo, outputFileName) {
  const getRequests = [];
  listOfPRs.forEach((number) => {
    getRequests.push(octokit.pullRequests.get({ owner, repo, number }));
  });

  Promise
    .all(getRequests)
    .then((getRequestsRes) => {
      const tracker = [];
      getRequestsRes.forEach((getRes) => {
        updateTracker(getRes, tracker);
      });
      writeTrackerToCSV(tracker, outputFileName);
    })
    .catch(handlePromiseError);
}

function processRangeOfPRs(numStartPR, numTotalPRs, numPerPage, owner, repo, outputFileName) {
  const [numStartPage, numEndPage] = getStartAndEndPages(
    numStartPR,
    numTotalPRs,
    numPerPage,
  );

  const getAllRequests = [];
  for (let numCurrPage = numStartPage; numCurrPage < numEndPage + 1; numCurrPage += 1) {
    getAllRequests.push(
      octokit.pullRequests
        .getAll({
          owner,
          repo,
          sort: 'created',
          direction: 'desc',
          state: 'closed',
          page: numCurrPage + 1,
          per_page: numPerPage,
        })
        .then((getAllRes) => {
          const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(
            numCurrPage,
            numStartPR,
            numTotalPRs,
            numPerPage,
          );
          return getPRsToCheck(
            getAllRes,
            numToProcessStart,
            numToProcessEnd,
          );
        })
        .catch(handlePromiseError),
    );
  }

  const allPRsToCheck = [];
  Promise
    .all(getAllRequests)
    .then((getAllRequestsRes) => {
      getAllRequestsRes.forEach((thesePRsToCheck) => {
        thesePRsToCheck.forEach(thisPR => allPRsToCheck.push(thisPR));
      });
      processListOfPRs(allPRsToCheck, owner, repo, outputFileName);
    })
    .catch(handlePromiseError);
}

function main() {
  const argv = getYargsArgv(yargs);

  if (argv.githubToken !== undefined) {
    octokit.authenticate({
      type: 'token',
      token: argv.githubToken,
    });
  }

  const [owner, repo] = [argv.owner, argv.repo];
  const listOfPRs = argv.listOfPullRequests;
  const numStartPR = argv.startNum;
  const numTotalPRs = argv.totalNum;
  const numPerPage = argv.perPageNum;
  const outputFileName = argv.outputFile;

  if (listOfPRs === undefined) {
    processRangeOfPRs(numStartPR, numTotalPRs, numPerPage, owner, repo, outputFileName);
  } else {
    processListOfPRs(
      listOfPRs.split(',').sort().reverse(),
      owner,
      repo,
      outputFileName,
    );
  }
}

module.exports = {
  getStartAndEndNums,
  getStartAndEndPages,
  updateTracker,
};

if (require.main === module) {
  main();
}
