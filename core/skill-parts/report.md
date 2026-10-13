## Report

In the owner's language, short and clear: the items are named by their meaning, not by number (the rule in `Core rules` on writing clearly for the owner):
- in work done with a plan, each criterion: ✅ (with evidence), ❌ or ⏳ (when it is checked);
- in work done with a plan, the map of changed components: for each, what changed, whom it affects, the expected cost and quality, how it is turned off or reverted;
- what was done and what was found (with numbers);
- in `ph-doctor`: the count of `ok`, `fail`, `not checked` per section and the defects found in plain language; the full table (with numbers) stays in the history entry;
- `verified` and `unverified` apart;
- the skill limitations (when there are some);
- the questions that need the owner's decision (numbered, with options and a recommendation; the question itself clear, without internal labels);
- the list of changed files, the next step.

Before sending, write the report draft into a temporary file and run three commands:
- `grep -nE '(^|[^[:alnum:]_])[ADFKLPRS][0-9]{1,3}([^[:alnum:]_]|$)' <file>`: replace each label found with its meaning. Done when: the command finds nothing.
- `grep -nE '[A-Za-z0-9_./-]+\.(md|mjs|json)' <file>`: when the owner does not need to open the file or decide by it, write its content in place of the name (for example, "the work plan", "the session state"). Done when: the body keeps only the file names the owner opens or decides by; the other names are in the "changed files" list.
- `grep -nE 'Awaiting owner decision|Later and watch|Working style|Session start|End of task|Changed files|Next step|Accepted warnings' <file>`: replace each harness section name with its content. Done when: the command finds nothing.
