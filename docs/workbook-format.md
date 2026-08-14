# Workbook format contracts

The application supports two stable structures. Header case, surrounding whitespace, and documented aliases are tolerated. Category values and all other taxonomy values are data, not schema: they can vary freely between client workbooks.

## Shared import behavior

- The strongest recognized header row is selected from the first ten non-empty rows.
- Only the first worksheet is imported; additional sheets are disclosed in preflight.
- Blank rows are ignored.
- Invalid identity rows are quarantined and reported.
- Unknown named columns are retained in source order and full-fidelity exports.
- Missing optional values do not stop an import.
- Source values remain available alongside normalized values.

## Creator list

Identity requires `Creator / Page Name` and at least one platform/identity signal.

| Group | Columns |
|---|---|
| Identity | `#`, `Creator / Page Name`, `Creator Type`, `Catagory`, `Subcategory`, `Primary Platform`, `Region`, `Language`, `Description Notes` |
| Channels | `TikTok URL`, `Instagram URL`, `YouTube URL`, `X/Twitter URL`, `Other Platform`, `Link-in-Bio` |
| Reach | `Audience Size`, `Total Likes`, `Video Count` |
| Contact | `Contact Name`, `Email`, `Agency`, `DM Viable` |
| Qualification | `Content Fit`, `Audience & Engagement`, `Authority & Opinion Strength`, `Access & Partnership Viability`, `Total Score`, `Tier` |
| Pipeline | `Status`, `First Contact`, `Channel`, `Last Touch`, `Touches`, `Call Date`, `Call Outcome`, `Deal Potential` |
| Research | `Observed Activity`, `Partnership Angle`, `Outreach Angle`, `Content Fit Evidence`, `Audience & Engagement Signal Evidence`, `Authority & Opinion Strength Evidence`, `Access & Partnership Viability Evidence`, `Observed Activity Evidence`, `Partnership Angle Evidence`, `High Level Notes` |

The source spelling `Catagory` and the corrected alias `Category` are both accepted.

## B2B prospect list

Identity requires `Company Name` and at least one of website, LinkedIn company page, decision maker, or location.

| Group | Columns |
|---|---|
| Identity | `Company Name`, `Category`, `Subcategory`, `Location (City)`, `Date Added` |
| Company links | `Website`, `Instagram Handle`, `LinkedIn Page` |
| Decision maker | `Decision Maker`, `Role`, `LinkedIn Profile`, `Email`, `IG DM Viable` |
| Qualification | `Campaign Readiness`, `Spend Signal`, `Execution Pain`, `Access`, `Total Score`, `Tier` |
| Pipeline | `Status`, `First Contact Date`, `Channel`, `Last Touch Date`, `Number of Touches`, `Response Type`, `Call Date`, `Call Outcome`, `Deal Potential`, `Notes` |
| Research | `Observed Campaign Activity`, `Hypothesized Pain`, `Outreach Angle`, `Campaign Readiness Evidence`, `Spend Signal Evidence`, `Execution Pain Evidence`, `Access Evidence`, `Observed Campaign Activity Evidence`, `Hypothesized Pain Evidence` |

## Normalization

- `K`, `M`, and `B` numeric suffixes are supported.
- Safe embedded Excel hyperlink targets take precedence over shortened display text; the displayed source value is still retained for audit and export.
- Scheme-less and multi-label domains such as `.co.za`, `.co.uk`, and `.com.au` become complete `https://` links when valid.
- Instagram handles and URLs become a display handle and canonical profile link.
- Semicolon-, comma-, or newline-separated email addresses are validated individually.
- Qualified yes/no text retains both its boolean meaning and qualifier.
- Native dates, ISO dates, unambiguous date strings, and Excel serial dates are supported.
- Source totals are retained and compared with the sum of the four qualification dimensions.
- Source tiers are retained as provided; BNTYFUL does not invent a universal tier ordering.

## Dynamic taxonomy guarantee

Category, subcategory, location, tier, status, channel, response type, call outcome, and deal potential options are derived from the active normalized dataset. Comparison is case-insensitive with collapsed whitespace, while a source display spelling is retained. Values containing `/`, `&`, commas, punctuation, or non-ASCII text remain a single value.
