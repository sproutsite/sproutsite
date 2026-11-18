# Deployment security checks

These checks concern the production hosting configuration of `https://sproutsite.dev/`. They do not certify the Sproutsite library or the configuration of consumer websites.

## Recorded results

| Recorded on | Domain         | Service                  | Reported result | Report                                                                                                                   |
| ----------- | -------------- | ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-11-18  | sproutsite.dev | SSL Labs SSL Server Test | A+              | [TLS report](https://www.ssllabs.com/ssltest/analyze.html?d=sproutsite.dev&hideResults=on)                               |
| 2026-11-18  | sproutsite.dev | SecurityHeaders          | A+              | [HTTP security-header report](https://securityheaders.com/?q=https%3A%2F%2Fsproutsite.dev%2F&hide=on&followRedirects=on) |

Source: results supplied by the website operator on 2026-11-18. The report URLs could not be retrieved by the agent's browsing tool during documentation. No independent scan, report archive or server configuration review was performed. The date records the operator's report, not an independently verified scan timestamp. Public report URLs may show newer results and are not immutable evidence of the recorded grades.

SSL Labs assesses TLS configuration. SecurityHeaders assesses selected HTTP response headers. These are scoped checks, not a complete security audit or a promise of continued A+ grades.

## Repeatable review

1. Open both report links for the production domain and run or refresh the scans where supported.
2. Review findings and the tested endpoint, not just the overall grade. When relevant, inspect all reported server addresses.
3. Record the actual scan date, domain, grades and report URLs in a new table entry. Keep earlier entries as history; do not silently treat an older grade as current.
4. If retaining a report export or screenshot, review it for operational or personal data before committing it. No exports are currently stored here.
5. Recheck after changes to TLS, certificates, reverse proxies or response headers. Confirm that the website still works after changing policies.

Do not add these public-service scans to `npm run build` or npm publication checks. They depend on a deployed host and external services; a successful static build cannot establish the live server's TLS or header configuration.

## Website integration

The bilingual deployment guides present the recorded results under “HTTPS and security headers”. The footer links directly to that section through `src/content/site.yaml` and `src/content/site.de.yaml`. Existing locale and base-path handling applies to these links. No badge service, tracking script or third-party content is embedded.
