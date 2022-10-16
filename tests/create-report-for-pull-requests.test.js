/* Copyright Jeremy Nation <jeremy@jeremynation.me>.
 * Licensed under the GNU General Public License (GPL) v3.
 */
const assert = require('assert');
const fs = require('fs');
const {
  getOctokit,
  getStartAndEndNums,
  getStartAndEndPages,
  main,
  updateTracker,
} = require('../create-report-for-pull-requests');

describe('getStartAndEndPages', () => {
  it('all items on first page', () => {
    const [numStartPage, numEndPage] = getStartAndEndPages(0, 5, 5);
    assert.strictEqual(numStartPage, 0);
    assert.strictEqual(numEndPage, 0);
  });

  it('some items on first page', () => {
    const [numStartPage, numEndPage] = getStartAndEndPages(3, 8, 20);
    assert.strictEqual(numStartPage, 0);
    assert.strictEqual(numEndPage, 0);
  });

  it('only last item on first page', () => {
    const [numStartPage, numEndPage] = getStartAndEndPages(4, 1, 5);
    assert.strictEqual(numStartPage, 0);
    assert.strictEqual(numEndPage, 0);
  });

  it('spans two pages', () => {
    const [numStartPage, numEndPage] = getStartAndEndPages(0, 6, 5);
    assert.strictEqual(numStartPage, 0);
    assert.strictEqual(numEndPage, 1);
  });

  it('spans three pages', () => {
    const [numStartPage, numEndPage] = getStartAndEndPages(3, 8, 5);
    assert.strictEqual(numStartPage, 0);
    assert.strictEqual(numEndPage, 2);
  });
});

describe('getStartAndEndNums', () => {
  describe('only one page', () => {
    it('entire page', () => {
      const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(0, 0, 5, 5);
      assert.strictEqual(numToProcessStart, 0);
      assert.strictEqual(numToProcessEnd, 5);
    });

    it('partial page', () => {
      const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(0, 3, 8, 20);
      assert.strictEqual(numToProcessStart, 3);
      assert.strictEqual(numToProcessEnd, 11);
    });
  });

  describe('spans two pages', () => {
    let numStartPR;
    let numTotalPRs;
    let numPerPage;
    before(() => {
      numStartPR = 3;
      numTotalPRs = 3;
      numPerPage = 5;
    });

    it('first page', () => {
      const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(
        0,
        numStartPR,
        numTotalPRs,
        numPerPage,
      );
      assert.strictEqual(numToProcessStart, 3);
      assert.strictEqual(numToProcessEnd, 5);
    });

    it('second page', () => {
      const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(
        1,
        numStartPR,
        numTotalPRs,
        numPerPage,
      );
      assert.strictEqual(numToProcessStart, 0);
      assert.strictEqual(numToProcessEnd, 1);
    });
  });

  describe(('spans three pages'), () => {
    let numStartPR;
    let numTotalPRs;
    let numPerPage;
    before(() => {
      numStartPR = 3;
      numTotalPRs = 8;
      numPerPage = 5;
    });

    it('first page', () => {
      const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(
        0,
        numStartPR,
        numTotalPRs,
        numPerPage,
      );
      assert.strictEqual(numToProcessStart, 3);
      assert.strictEqual(numToProcessEnd, 5);
    });

    it('second page', () => {
      const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(
        1,
        numStartPR,
        numTotalPRs,
        numPerPage,
      );
      assert.strictEqual(numToProcessStart, 0);
      assert.strictEqual(numToProcessEnd, 5);
    });

    it('third page', () => {
      const [numToProcessStart, numToProcessEnd] = getStartAndEndNums(
        2,
        numStartPR,
        numTotalPRs,
        numPerPage,
      );
      assert.strictEqual(numToProcessStart, 0);
      assert.strictEqual(numToProcessEnd, 1);
    });
  });
});

describe('updateTracker', () => {
  it('should add row', () => {
    const number = 1;
    const createdAt = '1970-01-20T00:00:00.000Z';
    const mergedAt = '1970-01-21T00:00:00.000Z';
    const mergedByLogin = 'abcd';
    const htmlURL = 'https://example.com';
    const getRes = {
      data: {
        number,
        created_at: createdAt,
        merged_at: mergedAt,
        merged_by: {
          login: mergedByLogin,
        },
        html_url: htmlURL,
      },
    };
    const tracker = [];
    updateTracker(getRes, tracker);
    assert.deepStrictEqual(tracker, [
      [
        number.toString(),
        mergedByLogin,
        createdAt,
        mergedAt,
        htmlURL,
      ],
    ]);
  });
});

describe('main', () => {
  const listOfPRs = undefined;
  const numStartPR = 0;
  const numTotalPRs = 1;
  const numPerPage = 100;
  const owner = 'octokit';
  const repo = 'rest.js';
  const outputFileName = 'test_results.csv';
  const githubToken = undefined;
  const octokit = getOctokit(githubToken);

  before(function beforeFunc(done) {
    this.timeout(4000);
    main(listOfPRs, numStartPR, numTotalPRs, numPerPage, owner, repo, outputFileName, octokit);
    setTimeout(done, 2000);
  });

  after(() => {
    fs.unlinkSync(outputFileName);
  });

  it('should write valid output', () => {
    const lines = fs.readFileSync(outputFileName, 'utf8').split('\n');
    assert.strictEqual(lines.length, 3);
  });
});
