/* ============================================================================
   DATA SOURCE
   Singapore Department of Statistics (SingStat): Census of Population 2000,
   2010, 2020; General Household Survey 2015, 2025. Age-band tabulations,
   "Christianity — Other Christians" category (SingStat's own classification,
   used throughout this site as "Protestant").
   All percentages below are recomputed directly from SingStat's published
   age-band tables, not copied from any secondary source. See /paper for
   the full methodology.
   ============================================================================ */

/* % identifying as Protestant, by age band, at each survey year.
   This is the CROSS-SECTIONAL view: different people, same age, different years. */
const AGE_PCT_BY_YEAR = {
  2000: { "15-19": 8.03, "20-24": 9.37, "25-29": 11.34, "30-34": 11.11, "35-39": 11.41, "40-44": 11.02 },
  2010: { "15-19": 12.28, "20-24": 11.05, "25-29": 10.12, "30-34": 11.24, "35-39": 12.69, "40-44": 12.27 },
  2015: { "15-19": 12.57, "20-24": 12.66, "25-29": 11.30, "30-34": 10.77, "35-39": 11.48, "40-44": 14.01 },
  2020: { "15-19": 11.76, "20-24": 11.67, "25-29": 12.23, "30-34": 11.67, "35-39": 10.90, "40-44": 11.62 },
  2025: { "15-19": 8.95,  "20-24": 9.52,  "25-29": 9.76,  "30-34": 9.43,  "35-39": 9.44,  "40-44": 8.54 },
};

/* Change in % Protestant across each specific age TRANSITION, by five-year
   window. This is the COHORT view: the same birth cohort, tracked as it ages.
   e.g. "15-19→20-24" in "2015-2020" = the cohort that was 15-19 in 2015,
   re-measured five years later as 20-24-year-olds in 2020. */
const COHORT_TRANSITIONS = {
  "2010-2015": { "15-19→20-24": 0.37,  "20-24→25-29": 0.25,  "25-29→30-34": 0.65,  "30-34→35-39": 0.24,  "35-39→40-44": 1.32 },
  "2015-2020": { "15-19→20-24": -0.90, "20-24→25-29": -0.43, "25-29→30-34": 0.37,  "30-34→35-39": 0.13,  "35-39→40-44": 0.13 },
  "2020-2025": { "15-19→20-24": -2.24, "20-24→25-29": -1.91, "25-29→30-34": -2.80, "30-34→35-39": -2.23, "35-39→40-44": -2.36 },
};

/* A single birth cohort followed across its own life course.
   Each point: [year, ageBandLabelAtThatYear, pctProtestant] */
const COHORT_LIFECOURSE = {
  "Turned 15–19 in 2000": [[2000, "15-19", 8.03], [2010, "25-29", 10.12], [2015, "30-34", 10.77], [2020, "35-39", 10.90], [2025, "40-44", 8.54]],
  "Turned 15–19 in 2010": [[2010, "15-19", 12.28], [2015, "20-24", 12.66], [2020, "25-29", 12.23], [2025, "30-34", 9.43]],
  "Turned 15–19 in 2015": [[2015, "15-19", 12.57], [2020, "20-24", 11.67], [2025, "25-29", 9.76]],
  "Turned 15–19 in 2020": [[2020, "15-19", 11.76], [2025, "20-24", 9.52]],
  "Turned 15–19 in 2025": [[2025, "15-19", 8.95]],
};

/* National headline picture */
const NATIONAL = {
  christianity_total: { 2020: 18.9, 2025: 17.1 },
  protestant: { 2015: 12.1, 2020: 11.9, 2025: 9.5 },
  catholic_change_since_2020: "+13%",
  no_religion: { 2020: 20.0, 2025: 23.9 },
  protestant_loss_count_2020_2025: 66000,
  protestant_loss_pct_2020_2025: 16,
};

/* By age band, 2020 vs 2025 (national, all ages, for the "not just youth"
   completeness table) */
const AGE_BAND_CHANGE_2020_2025 = [
  { band: "45–49", y2020: 13.4, y2025: 9.3, change: -4.2 },
  { band: "80–84", y2020: 11.8, y2025: 8.0, change: -3.9 },
  { band: "40–44", y2020: 11.6, y2025: 8.5, change: -3.1 },
  { band: "15–19", y2020: 11.8, y2025: 9.0, change: -2.8 },
  { band: "25–29", y2020: 12.2, y2025: 9.8, change: -2.5 },
  { band: "20–24", y2020: 11.7, y2025: 9.5, change: -2.2 },
  { band: "35–39", y2020: 10.9, y2025: 9.4, change: -1.5 },
];

/* Absolute counts, ages 15-24 */
const YOUTH_COUNTS = {
  count_2010: 60000,
  count_2025: 37500,
  pct_decline: 38,
  share_of_all_protestants_2010: 17.2,
  share_of_all_protestants_2025: 10.8,
};

/* Education gradient */
const BY_EDUCATION = {
  christian_university_grads: { 2010: 32.2, 2020: 28.3, 2025: 24.9 },
};

/* Sources, all independently verified and fetched during preparation of this site */
const SOURCES = {
  ghs2025_release: "https://www.singstat.gov.sg/publication-resources/general-household-survey-2025",
  ghs2025_pdf: "https://www.singstat.gov.sg/files/1559c94a-efc1-4262-84fd-042c9bd96e68.pdf",
  singstat_religion_theme: "https://www.singstat.gov.sg/find-data/explore-data-themes/population/religion",
  saltlight_ghs2025: "https://saltandlight.sg/news/wake-up-call-we-needed-general-household-survey-2025-findings-on-religion/",
  sotc2022: "https://saltandlight.sg/sotc2022/",
  sotc2023: "https://saltandlight.sg/sotc2023/",
  sotc2024: "https://saltandlight.sg/sotc2024/",
  sotc2025: "https://saltandlight.sg/sotc2025/",
  generations_project: "https://graceworks.com.sg/store/category/pastoral-resources/the-generations-project/",
  ips_religious_identity: "https://lkyspp.nus.edu.sg/docs/default-source/ips/ips-working-papers-65_religious-identity-and-practice-among-singaporeans.pdf",
  ips_moral_attitudes: "https://lkyspp.nus.edu.sg/ips/news/details/ips-working-papers-no.-66---moral-attitudes-in-flux--comparing-trends-across-religions-in-singapore",
};
