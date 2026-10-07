// A node --test reporter for GitHub Actions: every failing test becomes an error
// annotation on the run, so the reason is visible without opening the job log.
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

export default async function* annotate(source) {
  for await (const { type, data } of source) {
    if (type !== 'test:fail' || !data.details) continue;
    const error = data.details.error || {};
    const cause = error.cause || error;
    const message = String(cause.message || error.message || 'failed').slice(0, 2000);
    const title = String(data.name).replace(/[,:]/g, ' ').slice(0, 200);
    yield `::error title=${esc(title)}::${esc(message)}\n`;
  }
}
