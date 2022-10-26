# Cloudflare API

A company I work for asked me to conduct analysis on their web request data
using their competitor's price change data to find out if they were being
scraped by their competitors. As they wanted me to conduct this analysis quite
frequently (every 3 days or so), I decided to automate this process with
TypeScript.

## Technologies used

- [Deno.js](https://deno.land/) (similar to Node.js, made by the same person)
  - Runtime environment
  - Reading and writing files
  - Testing
- [Cloudflare API](https://test.com)
  - Pulling request data
- [Prettier](https://test.com)
  - Formatting
- [Yarn](https://test.com)
  - Simplifying Deno commands

## Steps for Analysis

**Reading competitor price data csv file**

- Read text file
- Convert to custom `CSV` object

**Reading our products price data csv file**

- Read text file
- Convert to custom `CSV` object

**Creating a new CSV with added column for price difference between us and
competitor**

- Create new `CSV` object from competitor `CSV` with added column for price
  difference using our price data `CSV`

**Pulling Cloudflare web request data from some date in the past 7 days**

- Pull Cloudflare web request data using Cloudflare API
  - Cloudflare API only allows pulling requests in a one hour time interval in
    the past 7 days
  - Create a range of dates from start to end date spaced by one hour
  - Pull logs for each hour to create one large dataset

**Filtering Cloudflare logs for requests to product pages**

- Filter Cloudflare logs by request path including `/products`

**Find products where price difference is greater than some threshold (i.e.
competitor price is $5 less than us)**

- Filter price difference `CSV` by some threshold (e.g. $5)

**Count number of requests from the same IP or User Agent to suspicious
products**

- Use Cloudflare logs data to count number of requests to products where
  threshold is suspicious and IP or User Agent is the same
- This would be considered scraping and be flagged for manual verification
