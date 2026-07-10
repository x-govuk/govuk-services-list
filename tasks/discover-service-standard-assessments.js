import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const servicesPath = path.join(import.meta.dirname, "..", "data", "services");
const defaultTheme = "*** Please use one of the existing themes from the website ***";

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
const descriptionLabels = [
  "service description",
  "description",
  "service summary",
  "summary",
];
const maxFilenameAttempts = 1000;
const organisationLabels = [
  "service provider",
  "organisation",
  "organization",
  "department",
  "service team",
  "service owner",
];

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
let created = 0;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function cleanText(value) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

function extractTableValue(body, labels) {
  if (!body) {
    return null;
  }

  const patterns = labels.map(
    (label) =>
      new RegExp(
        `<(?:td|th)[^>]*>\\s*${escapeRegex(label)}:?\\s*<\\/(?:td|th)>\\s*<(?:td|th)[^>]*>([\\s\\S]*?)<\\/(?:td|th)>`,
        "i",
      ),
  );

  for (const regex of patterns) {
    const match = body.match(regex);
    const value = cleanText(match?.[1] ?? "");

    if (value) {
      return value;
    }
  }

  return null;
}

function firstSentence(value) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  const match = text.match(/^(.+?[.!?])(?=\s|$)/);
  return match?.[1] ?? text;
}

function extractSectionFirstSentence(body, sectionTitle) {
  if (!body) {
    return null;
  }

  const headingRegex = new RegExp(
    `<h[1-6][^>]*>[\\s\\S]*?${escapeRegex(sectionTitle)}[\\s\\S]*?<\\/h[1-6]>`,
    "i",
  );
  const headingMatch = body.match(headingRegex);

  if (!headingMatch || headingMatch.index === undefined) {
    return null;
  }

  const afterHeading = body.slice(headingMatch.index + headingMatch[0].length);
  const paragraphMatch = afterHeading.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return firstSentence(paragraphMatch?.[1] ?? "");
}

function toServiceFilename(name) {
  const slug = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "service"}.json`;
}

function capitalizeFirst(value) {
  return typeof value === "string" && value.length > 0
    ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`
    : "";
}

function selectDescription(body, metaDescription, title) {
  const descriptionFromSection = extractSectionFirstSentence(
    body,
    "service description",
  );
  const descriptionFromBody = extractTableValue(body, descriptionLabels);
  const descriptionFromMeta = cleanText(metaDescription ?? "");

  if (descriptionFromSection) {
    return descriptionFromSection;
  }

  if (descriptionFromBody) {
    return firstSentence(descriptionFromBody);
  }

  if (
    descriptionFromMeta &&
    !/service standard report/i.test(descriptionFromMeta)
  ) {
    return descriptionFromMeta;
  }

  return title;
}

function selectOrganisation(json) {
  return (
    extractTableValue(json.details?.body, organisationLabels) ||
    cleanText(json.expanded_links?.organisations?.[0]?.title ?? "") ||
    cleanText(json.links?.organisations?.[0]?.title ?? "") ||
    "Unknown"
  );
}

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
    const visuallyHiddenText = `for ${stage} ${assessmentType}`;

    const resultMatch = json.details?.body?.match(resultBodyRegex);
    const resultText = resultMatch?.[1]?.trim().toLowerCase() ?? "";
    const colourMatch = resultText.match(/\b(red|amber|green)\b/);

    let label;
    if (colourMatch) {
      label = `Assessed as ${colourMatch[1]} at ${stage} ${assessmentType}`;
    } else if (/\bnot\s+met\b|\bdid\s+not\s+meet\b/.test(resultText)) {
      label = `Did not meet ${stage} ${assessmentType}`;
    } else if (/(?<!not\s)\bmet\b/.test(resultText)) {
      label = `Met ${stage} ${assessmentType}`;
    } else if (
      /\b(?:did\s+)?not\s+pass(?:ed)?\b|\bfail(?:ed)?\b/.test(resultText)
    ) {
      label = `Did not pass ${stage} ${assessmentType}`;
    } else if (/\bpass(?:ed)?\b/.test(resultText)) {
      label = `Passed ${stage} ${assessmentType}`;
    } else {
      // Outcome could not be detected automatically (result/outcome field missing
      // or contains an unrecognised value) – requires manual editing
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
              visuallyHiddenText,
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
      if (stage && stage !== "alpha") {
        const description = selectDescription(
          json.details?.body,
          json.description,
          title,
        );
        const organisation = selectOrganisation(json);

        let filename = toServiceFilename(title);
        let filePath = path.join(servicesPath, filename);
        let suffix = 2;

        while (fs.existsSync(filePath) && suffix <= maxFilenameAttempts) {
          filename = toServiceFilename(`${title} ${suffix}`);
          filePath = path.join(servicesPath, filename);
          suffix++;
        }

        if (fs.existsSync(filePath)) {
          throw new Error(
            `Could not generate unique filename for service: ${title}`,
          );
        }

        const newService = {
          name: title,
          description,
          organisation,
          theme: defaultTheme,
          phase: capitalizeFirst(stage) || "Unknown",
          timeline: {
            items: [
              {
                label,
                date: assessmentDate,
                links: [
                  {
                    href: url,
                    text: "Service assessment report",
                    visuallyHiddenText,
                  },
                ],
              },
            ],
          },
        };

        fs.writeFileSync(
          filePath,
          `${JSON.stringify(newService, null, 2)}\n`,
          "utf-8",
        );
        existingServices.push({ ...newService, file: filePath });
        created++;
      } else {
        missing++;
        console.log(title);
        console.log(url);
        console.log("-");
      }
    }
  }
}

console.log(`\n${missing} service assessments missing`);
console.log(`${created} new services created`);
