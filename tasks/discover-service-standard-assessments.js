import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const servicesPath = path.join(import.meta.dirname, "..", "data", "services");

// Load all existing services
const existingServices = [];
const serviceFilenames = fs
  .readdirSync(servicesPath)
  .filter((filename) => filename !== "_template.json")
  .filter((filename) => filename.endsWith(".json"));

for (const filename of serviceFilenames) {
  const filePath = path.join(servicesPath, filename);
  const service = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  service.file = filePath;
  existingServices.push(service);
}

// Collect all existing timeline URLs
const existingTimelineUrls = existingServices.flatMap((service) =>
  (service.timeline?.items ?? []).flatMap((item) =>
    (item.links ?? []).map((link) => link.href),
  ),
);

const ignoredReports = [
  "https://www.gov.uk/service-standard-reports/national-parking-platform",
  "https://www.gov.uk/service-standard-reports/get-healthcare-cover-for-travelling-abroad",
  "https://www.gov.uk/service-standard-reports/nhs-digital-weight-management-programme-referral-hub",
  "https://www.gov.uk/service-standard-reports/record-a-patient-safety-event",
  "https://www.gov.uk/service-standard-reports/integrated-data-service",
  "https://www.gov.uk/service-standard-reports/prevent-duty-training-learn-how-to-safeguard-individuals-vulnerable-to-radicalisation-beta-assessment",
  "https://www.gov.uk/service-standard-reports/census-test-2017-beta-assessment",
  "https://www.gov.uk/service-standard-reports/office-for-national-statistics-ons-website-voluntary-service-assessment",
  "https://www.gov.uk/service-standard-reports/keep-notes-on-my-performance-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/nhs-uk",
  "https://www.gov.uk/service-standard-reports/adult-social-care-jobs",
  "https://www.gov.uk/service-standard-reports/find-and-manage-a-foster-placement",
  "https://www.gov.uk/service-standard-reports/apply-for-local-growth-funding",
  "https://www.gov.uk/service-standard-reports/non-domestic-renewable-heat-incentive-alpha-re-assessment-report",
  "https://www.gov.uk/service-standard-reports/non-domestic-renewable-heat-incentive-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/apply-for-a-large-countryside-productivity-grant-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/check-your-energy-deal-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/check-your-energy-deal-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/civil-service-apprenticeships",
  "https://www.gov.uk/service-standard-reports/direct-debit-online-payment-service-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/dfe-developer-hub-alpha-reassessment-report",
  "https://www.gov.uk/service-standard-reports/pharmacy-returns-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/digital-submissions-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/adult-social-care-provider-information-return-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/adult-social-care-provider-information-return-alpha",
  "https://www.gov.uk/service-standard-reports/legal-advice-for-civil-servants-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/manage-your-referral",
  "https://www.gov.uk/service-standard-reports/your-nhs-pension",
  "https://www.gov.uk/service-standard-reports/maternity-exemption-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/check-local-environmental-data-for-agriculture-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/civil-service-learning-service-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/patient-appointment-booking-service",
  "https://www.gov.uk/service-standard-reports/civil-service-learning-course-booking-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/take-an-online-test-when-i-apply-for-a-job-in-the-civil-service-beta-reassessment-report",
  "https://www.gov.uk/service-standard-reports/prevent-e-learning-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/prevent-e-learning-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/take-an-online-test-when-i-apply-for-a-job-in-the-civil-service",
  "https://www.gov.uk/service-standard-reports/the-centre-for-evaluation-and-monitoring-alpha-service-assessment-report",
  "https://www.gov.uk/service-standard-reports/express-an-interest-in-a-repatriation-flight-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/readiness-reporting-and-deployability-discovery-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/award-a-contract-for-goods-and-services-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/award-a-contract-for-goods-and-services-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/report-a-cyber-incident",
  "https://www.gov.uk/service-standard-reports/apply-for-the-armed-forces-compensation-and-war-pension-scheme",
  "https://www.gov.uk/service-standard-reports/nhs-jobs-get-a-job-with-the-nhs",
  "https://www.gov.uk/service-standard-reports/apply-for-a-maternity-exemption-certificate-beta-assessment",
  "https://www.gov.uk/service-standard-reports/dvla-webchat-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/electronic-data-collection-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/apply-for-healthy-start-alpha",
  "https://www.gov.uk/service-standard-reports/commercial-vehicle-service-alpha",
  "https://www.gov.uk/service-standard-reports/development-of-the-patient-safety-incident-management-system-dpsims-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/guaranteed-minimum-pension",
  "https://www.gov.uk/service-standard-reports/guaranteed-minimum-pension-beta-assessment",
  "https://www.gov.uk/service-standard-reports/check-your-self-employment-details",
  "https://www.gov.uk/service-standard-reports/new-secure-access-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/new-secure-access-alpha",
  "https://www.gov.uk/service-standard-reports/ukvi-contact-centre-procurement-beta-assessment",
  "https://www.gov.uk/service-standard-reports/identity-and-access-management-alpha",
  "https://www.gov.uk/service-standard-reports/ig-toolkit-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/overseas-healthcare-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/authorisation-service-agent-services-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/submit-monthly-contributions-for-nhs-pension-scheme-beta-assessment-report",
  "https://www.gov.uk/service-standard-reports/medical-examiners-examining-a-cause-of-death-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/register-for-cqc",
  "https://www.gov.uk/service-standard-reports/renewable-electricity-register-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/contract-and-award-service-previous-name-award-a-contract-for-goods-and-services-alpha-reassessment",
  "https://www.gov.uk/service-standard-reports/apply-for-the-armed-forces-compensation-and-war-pension-schemes-service",
  "https://www.gov.uk/service-standard-reports/help-to-buy-apply-for-an-equity-loan-alpha-assessment-report",
  "https://www.gov.uk/service-standard-reports/prove-your-eligibility-to-a-foreign-government",
  "https://www.gov.uk/service-standard-reports/examining-a-cause-of-death-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/sign-up-to-report-your-income-and-expenses-quarterly-beta-assessment",
  "https://www.gov.uk/service-standard-reports/manage-my-adult-social-care-workforce-data-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/manage-key-stage-2-and-3-curriculum-resources-alpha-assessment",
  "https://www.gov.uk/service-standard-reports/export-green-list-waste",
  "https://www.gov.uk/service-standard-reports/renewable-electricity-register-beta-reassessment-report",
  "https://www.gov.uk/service-standard-reports/renewable-electricity-register-beta-assessment-report",
];

// Fetch all service assessment URLs from the Atom feed
const serviceAssessmentUrls = [];
let page = 1;
let count;

do {
  process.stdout.write(".");
  const response = await fetch(
    `https://www.gov.uk/service-standard-reports.atom?page=${page}`,
  );
  const xml = await response.text();

  const newLinks = [
    ...xml.matchAll(
      /<link rel="alternate" type="text\/html" href="([^"]+)"\/>/g,
    ),
  ]
    .map((match) => match[1])
    .filter((link) => link !== "https://www.gov.uk");

  count = newLinks.length;
  serviceAssessmentUrls.push(...newLinks);
  page++;
} while (count !== 0);

const assessmentDateRegex = /Assessment date:?<\/(?:td|th)>\s*<td>([^<]+)/i;
const stageRegex = /(alpha|beta|live)/i;
const stageBodyRegex = /(?:service\s+)?stage:?<\/(?:td|th)>\s*<td>([^<]+)/i;
const resultBodyRegex = /(?:result|outcome):?<\/(?:td|th)>\s*<td>([^<]+)/i;

const ignoredWords = [
  "alpha",
  "beta",
  "live",
  "service",
  "standard",
  "re-assessment",
  "reassessment",
  "assessment",
  "report",
];

let missing = 0;

for (const url of serviceAssessmentUrls) {
  if (!existingTimelineUrls.includes(url) && !ignoredReports.includes(url)) {
    const apiUrl = url.replace(
      "https://www.gov.uk/",
      "https://www.gov.uk/api/content/",
    );

    const response = await fetch(apiUrl);
    const json = await response.json();

    let title = json.title;

    for (const word of ignoredWords) {
      title = title.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
    }

    title = title
      .replace(/ - /g, "")
      .replace(/ – /g, "")
      .replace(/ {2,}/g, " ")
      .trim();

    const stageMatch = json.title.match(stageRegex);
    const stageBodyMatch =
      !stageMatch && json.details?.body?.match(stageBodyRegex);
    const bodyStage = stageBodyMatch?.[1]?.trim().match(stageRegex)?.[0];
    const stage = (stageMatch?.[0] ?? bodyStage)?.toLowerCase() ?? null;

    const isReassessment = /re-?assessment/i.test(url);
    const assessmentType = isReassessment ? "reassessment" : "assessment";

    const resultMatch = json.details?.body?.match(resultBodyRegex);
    const resultText = resultMatch?.[1]?.trim().toLowerCase() ?? "";
    const colourMatch = resultText.match(/\b(red|amber|green)\b/);

    let label;
    if (colourMatch) {
      label = `Assessed as ${colourMatch[1]} at ${stage} ${assessmentType}`;
    } else if (/\bnot\s+pass\b|\bfail\b/.test(resultText)) {
      label = `Did not pass ${stage} ${assessmentType}`;
    } else if (/\bpass\b/.test(resultText)) {
      label = `Passed ${stage} ${assessmentType}`;
    } else {
      // Outcome could not be detected automatically – requires manual editing
      label = `Passed|Did not pass ${stage} ${assessmentType}`;
    }

    const assessmentDateMatch = json.details?.body?.match(assessmentDateRegex);
    let assessmentDate = null;
    if (assessmentDateMatch) {
      const dateStr = assessmentDateMatch[1].trim();
      // Handle "D Month YYYY" / "DD Month YYYY" (e.g. "3 August 2021")
      const longMatch = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
      // Handle "DD/MM/YYYY" / "D/M/YYYY" UK numeric format (e.g. "03/08/2021")
      const ukMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      let parsed;
      if (longMatch) {
        const [, day, month, year] = longMatch;
        parsed = Date.parse(`${month} ${day}, ${year}`);
      } else if (ukMatch) {
        const [, day, month, year] = ukMatch;
        const d = Number(day);
        const m = Number(month);
        if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
          parsed = Date.parse(
            `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
          );
        }
      } else {
        parsed = Date.parse(dateStr);
      }
      if (!isNaN(parsed)) {
        assessmentDate = new Date(parsed).toISOString().split("T")[0];
      }
    }

    const existingService =
      existingServices.find(
        (s) => s.name.toLowerCase().trim() === title.toLowerCase().trim(),
      ) ||
      existingServices.find((s) =>
        (s.synonyms ?? [])
          .map((a) => a.toLowerCase().trim())
          .includes(title.toLowerCase().trim()),
      );

    if (existingService) {
      existingService.timeline ??= {};
      existingService.timeline.items ??= [];

      const existingTimelineItems = existingService.timeline.items.flatMap(
        (item) => (item.links ?? []).map((link) => link.href),
      );

      if (!existingTimelineItems.includes(url)) {
        existingService.timeline.items.push({
          label,
          date: assessmentDate,
          links: [
            {
              href: url,
              text: "Service assessment report",
              visuallyHiddenText: `for ${stage} ${assessmentType}`,
            },
          ],
        });

        const serviceToWrite = { ...existingService };
        delete serviceToWrite.file;

        fs.writeFileSync(
          existingService.file,
          `${JSON.stringify(serviceToWrite, null, 2)}\n`,
          "utf-8",
        );
      }
    } else {
      missing++;
      console.log(title);
      console.log(url);
      console.log("-");
    }
  }
}

console.log(`\n${missing} service assessments missing`);
