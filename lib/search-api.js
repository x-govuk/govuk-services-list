/**
 * Fetches all pages from the GOV.UK Search API matching the given format,
 * paginating through the full result set.
 *
 * @param {object} options
 * @param {string} options.format - The GOV.UK content format to filter by (e.g. 'transaction')
 * @returns {Promise<Array>} All matching search results
 */
export async function getGovukPages({ format }) {
  const count = 1000;
  let start = 0;
  const allResults = [];

  while (true) {
    const url = `https://www.gov.uk/api/search.json?filter_format=${encodeURIComponent(format)}&count=${count}&start=${start}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search API responded with status: ${response.status}`);
    }

    const json = await response.json();
    const results = json.results;

    if (results.length === 0) {
      break;
    }

    allResults.push(...results);
    start += count;
  }

  return allResults;
}
