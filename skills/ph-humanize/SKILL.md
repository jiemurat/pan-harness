---
name: ph-humanize
description: Humanizes a text or a file: removes the stock phrases, generic claims, formula structure and odd characters that make it read machine-written. Use it whenever the user asks, in any language, to humanize or de-AI a text, even a pasted paragraph. Not for AI detection or translation.
license: MIT
metadata:
  version: "3.15.9"
  package: "@jiemurat/pan-harness"
---

# Humanize a text

Find each place that fails a rule's test and fix it, keeping every fact. The rules test what a sentence or a text does, not its words, so they work the same in English, Russian, Uzbek and any other language.

**No verdict.** You never judge whether the text is machine-written: you fix each place that fails a test. Characters are replaced in every text (step 2). Another weak sign alone (a transition word, a formal style, a passive) is touched only when it fails its own rule's test.

**Done when** the file holds the fixed text, each place the scan and the two reads found is fixed or kept for a stated reason, and the user has the report of step 8.

`scripts/humanize.mjs` and `references/` are in the folder that holds this SKILL.md. Run the script as `node <that folder>/scripts/humanize.mjs`.

## The fixed limits

- **Leave alone** the wording of quotations, names, titles, the numbers and dates of the source, defined terms, and the fixed formulas of the document type (a salutation, a legal formula, a required template sentence or section). Their characters still follow step 2; only code and URLs keep theirs.
- **Register:** an official text stays official, a casual one casual. Vary sentence and paragraph length only in narrative or explanatory prose, where the content varies; a list, a form, a legal or an official text keeps its shape. Rhythm made for its own sake is no fix.
- **Facts:** every fact of the result comes from the text or from the user. A sentence that needs a fact the text lacks is cut when it is padding, and becomes a question to the user when it carries meaning; it stays unchanged until the answer.
- **Only the failing place:** change only the words that fail the test and the endings and agreement the change forces; the rest of the sentence, its spelling, its grammar and its voice stay as written.
- **How to fix:** cut the sign, or replace an evaluation with the fact the text gives; name the actor, the document or the number the text gives. Each wording keeps one term per concept. Humanizer tools, detector scores, synonym swaps, typos, shuffled sentences, added opinions, a first person or an anecdote damage the meaning: the fix is always a cut or a fact.

## 1. Get the file

- A file in `.md` or `.txt`: work on it in place.
- Text in the chat: write it to a file in your scratch folder and work on that file.
- An Office file (a Word `.docx`, a PowerPoint `.pptx` or an Excel `.xlsx`): run `humanize.mjs extract FILE TEXT`, with TEXT a new `.txt` file in your scratch folder. It writes the file's text one paragraph per line, each line starting with its ID (`[p12]` in Word, `[s2p3]` slide 2 and `[n2p1]` its speaker notes in PowerPoint, `[c4]` a text cell in Excel, where a text used in several cells is one line; a kind may follow: `h1` a heading or a slide title, `li` a list item, `td` a table cell). In Excel, apply the sentence rules (steps 4-6) only to a line that holds a sentence: a label, a name or a code keeps its words; step 2 covers every line. Steps 2-7 work on TEXT, and step 7 writes it back into FILE. In TEXT, change a line's text, or empty it after its ID to remove the paragraph; never join, split, add or move lines, and keep each ID, `<br>`, `<sym>` and tab as it is. No copy of FILE is kept: `apply` checks the new file before it replaces FILE. When `extract` stops (an old `.doc`, `.ppt` or `.xls`, a password, tracked changes), tell the user its message; when it names parts it leaves out (charts, SmartArt, comments), say so in the report.
- A PDF: convert it to Markdown first with `ph-pdf-to-md`, work on the Markdown and tell the user the result is the Markdown file.

Done when you have one text file path.

## 2. Characters

Run `humanize.mjs fix FILE`. Before any change it copies the original next to the file as `NAME.before-humanize.EXT`, unless git can restore the file; its first line says which. It replaces every character an ordinary keyboard cannot type (long and short dashes, curly and angle quotes, the Uzbek turned-comma apostrophe, the ellipsis character, bullets, arrows, math signs, special spaces, invisible characters, styled letters, emoji) and leaves code and URLs alone.

The replacements hold in every language, Russian and Uzbek typography included: they are the user's standing choice, so report them and leave them.

Then decide each line it lists:
- `unknown characters`: replace one with what a user types when the meaning stays (`½` with `1/2`); keep one that carries meaning (`©`) and name it in the report.
- `mixed-script words`: a word of the text's language typed with a look-alike letter of the other script gets the right letter; a name or term written in its own script on purpose stays.

Done when each listed character and word is decided. Keep the `characters replaced` lines for the report.

## 3. Scan

Run `humanize.mjs scan FILE` and keep its output: the repeated phrases, the same openings and endings, the sentence and paragraph lengths, the strong signs, the Markdown marks and the list share. It is a list to judge, never a score.

## 4. Whole-text read

Read `references/signs.md` in full. When the text is not in English, read the rows of `references/examples.md` for the text's language, or the nearest one. Then read the whole text once, for the whole-text rules 14–16:
- each row of the scan's repeated phrases, openings and endings (rule 14);
- each paragraph or closing sentence that adds no new fact (rule 15);
- the shape: the list share, the bold-label items, the Markdown marks in a text that is not Markdown, the headings (rule 16).

A long text gets this read whole before step 5 goes section by section. Done when each row of the scan has a decision (change, or keep with its reason) and each place found has its rule number. Most rows of a human-written text are its subject and its terms, and stay.

## 5. Sentence read

Read the text sentence by sentence, a long text section by section, and apply rules 1–13 and 17 to each sentence. A rule applies when the sentence fails its test plainly; when it fails only arguably, keep the sentence. The strong signs of the scan are rule 13.

Done when every sentence is read and each failing place has its rule number.

## 6. Fix

Fix every place of steps 4 and 5 in the file, inside the fixed limits above. After each fix, re-read the new sentence against the rules: a fix often swaps one stock phrase for another. Rule 17 items and the sentences waiting for a fact stay unchanged and go to the questions.

In the text of an Office file the shape stays: a list stays a list and a heading stays a heading. A rule 16 change of the shape goes to the questions as a proposal, not into the text.

Count as you go: each sentence changed under its rule, each sentence cut, each question. Done when every place is fixed or in the questions.

## 7. Check

Run `humanize.mjs scan FILE` again and compare it with step 3: each repeated phrase, opening or ending still there has its reason.

When you can start a sub-agent, give it the original (the backup copy, or `git show HEAD:FILE`), the fixed file and `references/signs.md`, and ask for two lists: each place that still fails a rule, and each fact added or claim lost. Fix what it finds that holds, and say in the report what you refuted and why. Without sub-agents, make this comparison yourself, sentence against sentence.

For an Office file, run `humanize.mjs apply FILE TEXT`. It writes each changed line into the runs it came from, so the formatting stays, checks the new file and then replaces FILE. When it names lines, fix them in TEXT and run it again.

Done when the second scan is read, both lists are empty or answered, and for an Office file `apply` printed `the file is checked and saved` or `changed: 0`.

## 8. Report

Report in the language the user writes in; the text keeps its own language.

1. The total number of changes, and then the split: characters replaced (by kind, from step 2), sentences changed (by rule), sentences cut. For example: "47 changes in total: 31 characters (24 long dashes, 7 quotes), 14 sentences changed (rule 2: 6, rule 5: 4, rule 10: 4), 2 sentences cut."
2. Where the original is: the backup path, or git. For an Office file: no copy is kept, and the file was checked before it was saved.
3. The questions: each missing fact, each placeholder's value, each rule 17 item, each kept unknown character, each shape proposal for an Office file.
4. For text from the chat, the fixed text itself.

When the answers come, put the facts in, and run step 7 on the changed sentences.
