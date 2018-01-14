# create-report-for-pull-requests

This program creates a CSV file based on merged pull requests for a given repository on GitHub. In particular, it reports who merged pull requests. It uses Node.js with the [octokit/node-github](https://github.com/octokit/node-github) library to make requests to GitHub.

## Author

[Jeremy Nation](https://jeremynation.me).

## License

GPLv3 or later (see included `LICENSE` file).

## Notes

Install dependencies with `npm install`. You can run the program with:

```
$ ./create-report-for-pull-requests.js [options]
```

The `--help` option will show supported options.

This program uses two types of GitHub API requests: one [lists information](https://developer.github.com/v3/pulls/#list-pull-requests) about multiple pull requests, and the other [gets more information](https://developer.github.com/v3/pulls/#get-a-single-pull-request) about a single pull request. Unfortunately, the list-information approach doesn't report who merged each pull request. Instead, you need to make a second get-more-information request for each pull request to find out who merged it. So, the strategy this program uses is to request information for all closed pull requests and then make a second request for each merged pull request to find out who merged it.

GitHub rate limits requests to their API. You can see the current rules [here](https://developer.github.com/v3/#rate-limiting). For a repository with very many pull requests, you might not be able to make all the necessary requests at one time within the allowed limits. However, the program returns the data sorted by pull request creation date, starting with the most recent, and supports specifying a range of pull requests, so you can run the program multiple times with different ranges to get data for a large number of pull requests. For example, `--start-num 0 ---total-num 50` will get data on the first 50 pull requests, `--start-num 50 ---total-num 50` will get data on the second 50 pull requests, and so on. Note that `--start-num` starts counting at 0. You can create a different output file each time with the `--output-file` option and then manually combine the files to get a full report.

The program does not account for changes that happen to the repository while the program is running or between requests, for example if someone merges a pull request. You should be careful when combining your reports at the end, and you should consider the results to be an approximation, not exact.

GitHub's rate limit for unauthenticated requests is very low, but is much higher for authenticated requests. You can send authenticated requests by creating a "personal access token" at https://github.com/settings/tokens and then passing the token to the program with the `--github-token` option. You don't need to specify any special permissions when you create the token.

GitHub also enforces [abuse rate limits](https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits) that are different from their regular time-based rate limits. If you encounter these, try running with smaller `--total-num` batches.

You can run tests with `npm test`.

Related links:

* https://developer.github.com/v3/
* https://octokit.github.io/node-github/
