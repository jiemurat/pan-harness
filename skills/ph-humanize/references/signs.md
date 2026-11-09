# The rules

Each rule names what a sentence or a text does and gives a test any reader applies in any language. A place is a sign only when it fails the test plainly: a human text has a few places that fail one arguably, and those stay as written. The English examples are here; the Russian and Uzbek ones are in `examples.md`, under the same rule numbers.

## Contents

- Sentence read: rules 1–13
- Whole-text read: rules 14–16
- Content: rule 17

## Sentence read

### 1. Generic sentence

The root sign: a specific fact smoothed into a statement that fits any subject.
- **Test:** could the sentence stand unchanged in a text on another subject or organisation? A sentence that names this text's subject, people or events passes.
- **Fix:** put in the fact, number, name or case the text gives. With none, cut it when it is padding; ask the user for the fact when it carries meaning.
- **Example:** "The situation should be assessed carefully." becomes "Clause 4.2 of the contract forbids this." when the text gives clause 4.2.

### 2. Importance and emphasis words

- **Test:** count the evaluations: words or phrases that only praise or stress, so that deleting them loses no fact (one phrase counts once, whatever its length or its endings). The sign is three or more in one paragraph, an evaluation in a sentence that fails another rule too, or one evaluation repeated across many items. Fewer, alone, stay: a human text evaluates too.
- **Fix:** keep the fact, drop the evaluations of the failing place; use the plain word. A claim of importance stays when the text gives the measure that shows it.
- **Example:** "This pivotal project plays a crucial role in our vibrant community." (three evaluations) becomes "The project serves 300 families." when the text gives 300, else "The project serves the district's families."

### 3. Vague source or link

- **Test:** does the attribution claim more support than the text shows (unnamed experts who agree, studies that show, many who believe), or hide a link the text could name (a vague "connected with" or "the relevant unit")? A modest attribution that states the claim's real support (several theories, some historians) is no sign and stays.
- **Fix:** name the source, the unit or the relationship the text gives; else drop the inflated attribution and keep the claim itself at the strength the text gives it, with no hedge added. A source is never invented.
- **Example:** "Experts agree remote work raises output." becomes "A 2023 Stanford study found remote work raised output by 13%." when the text gives the study, else "Remote work raises output."

### 4. Signpost and writing about the text

- **Test:** delete the sentence or phrase: is information lost? Is the text itself, or its next part, the subject of the sentence?
- **Fix:** cut it and state the point. A required part of the document (a scope clause, a required summary box) stays.
- **Example:** "It is worth noting that the deadline is 1 December." becomes "The deadline is 1 December."; "The main results are presented below." is cut.

### 5. Formula connectors and closers

- **Test:** do three or more sentences or paragraphs open with a word or a phrase whose only job is to say "and also"? Does a closing sentence or a one-line closer that announces a conclusion or a moral add a fact? A linking word alone is no sign.
- **Fix:** cut the connector: the order of the sentences carries the link. End on the last fact.
- **Example:** three sentences that open "Additionally", "Moreover", "Furthermore" lose the connectors; a paragraph that ends "In conclusion, this approach is highly effective." loses that sentence.

### 6. Contrast against nobody

- **Test:** a sentence that denies X to assert Y, or adds Y to X as a surprise: did the text or its reader claim X?
- **Fix:** state Y plainly. The contrast stays when X corrects a belief the text names, or when it is an exact legal exclusion.
- **Example:** "It's not just a tool, it's a platform." (no one called it just a tool) becomes "The platform has three modules: billing, reports and access."

### 7. Padded pairs and triads

- **Test:** remove one item: does the meaning change? Do the items name different things?
- **Fix:** keep the items the meaning needs. An exhaustive list of a legal or technical text stays.
- **Example:** "We will analyse, study and evaluate the results." becomes "We will evaluate the results."

### 8. False range and forced figure

- **Test:** in a range "from X to Y", are X and Y on one scale? Can the figure of speech be said plainly with no loss of meaning?
- **Fix:** list the items or state the fact; a borrowed metaphor becomes the plain wording.
- **Example:** "from small start-ups to global giants" about two clients becomes "two clients: a start-up and a bank"; "Time is your most valuable resource." is cut.

### 9. Stacked hedges

- **Test:** does one claim carry more than one hedge (a word, a phrase or an ending that only weakens the claim: possibility, frequency, degree), or does nearly every claim carry one?
- **Fix:** keep one hedge where the evidence is uncertain and drop the rest. Legal, safety and scope notices stay.
- **Example:** "This could potentially, to some extent, improve results." becomes "This may improve results."

### 10. Action chains and significance tails

- **Test:** does one sentence pack three or more separate steps of one actor into a chain the reader has to unpack to follow the order, or repeat one verb in the chain? Does it end in a trailing clause that claims importance or impact with no fact ("..., highlighting its significance")? Chained verb forms are ordinary grammar in many languages: the sign is the overload, not the form.
- **Fix:** split the overloaded chain into sentences or numbered steps; cut the tail unless the text supports it.
- **Example:** "Preparing the report, checking the figures and sending it to the head, the team ensures quality." becomes "The team prepares the report and checks the figures. Then it sends the report to the head."; "..., underscoring its commitment to excellence" is cut.

### 11. Verb as noun and missing actor

- **Test:** does one verb of the same root say what the noun phrase says (a "carry out an inspection" built from an action noun and a light verb)? Does the noun take a verb that does not go with it? Can the reader tell who acts?
- **Fix:** use the verb, and name the actor where it makes the sentence clearer. A noun-and-verb phrase that is the language's ordinary way to name the action stays; the sign is a longer phrase where a plain verb exists. A passive that names its actor ("was conquered by Alexander") and the passive of an official rule stay.
- **Example:** "An inspection of the premises is carried out on a monthly basis." becomes "The facilities team inspects the premises monthly." when the text names the team.

### 12. Synonym cycling

- **Test:** do different words in neighbouring sentences name one and the same thing?
- **Fix:** one term per concept, the first one or the defined one.
- **Example:** "The department... The unit... The division..." for one body becomes "the department" throughout.

### 13. Chatbot residue, placeholders, leaked markup

- **Test:** does a sentence address the user, offer more help, refuse, flatter or mention a knowledge limit? Is a field left unfilled (`[Your Name]`, `XX`, `[Date]`)? Is there a chat-tool string (`oaicite`, `contentReference`, `utm_source=chatgpt.com`)? The scan lists the last two as strong signs.
- **Fix:** cut the wrapper and keep the content; a placeholder becomes a question for its value; a tool string is deleted.
- **Example:** "Certainly! Here is the letter you asked for:" is cut; "[Date]" becomes a question.

## Whole-text read

### 14. Stamped formula, repeated openings and endings

- **Test:** the scan's lists: the same 2–4 word phrase in three or more sentences or items; three or more sentences or items with the same first or last two words. The rows are candidates: a phrase is a stamp when it is a formula (a qualifier, a connector, an evaluation, a stock ending) that tells the reader nothing new where it stands. The text's subject, a name, a term, a place or a date repeated ("the city", "Central Asia", "the contract") is no stamp and stays, at the start of a sentence too. In a language that puts the verb last, sentences that end in the same verb are grammar: an ending is a stamp only when the words before the verb repeat too.
- **Fix:** keep a phrase where it carries information the reader can check, tied to its reference; drop it elsewhere. Start a sentence with its actor or action. An ending that is real for each item (the actual recipient, the actual deadline) stays; a varied ending made only for variety is no fix.
- **Example:** "in a timely manner" on 12 duties stays on the two that have a deadline, as "by the date in the work plan", and leaves the other ten.

### 15. Padding and restating

- **Test:** does the paragraph, or the closing sentence of a section, add a fact not already stated? Does the first sentence repeat the heading?
- **Fix:** cut it. A sentence that states a fact found nowhere else in the text is never cut under this rule.
- **Example:** "Thus, in this section we have looked at the main causes of delay." is cut; under the heading "Performance", "Performance matters." is cut.

### 16. Format

- **Test:** do the sections have equal size and mirror a plan? Is there a list where prose reads better? Does every item open with a bold label and a colon? Are there decorative bold, icons, horizontal rules between short parts? Are there Markdown marks (`**`, `##`, `---`) in a text that is not Markdown (a `.txt` file, a letter, a message to paste)? Do the headings break the heading convention of the text's language (every word capitalised in a language that writes headings with one capital, such as Russian or Uzbek)?
- **Fix:** turn a list into prose where it is not needed; remove the decoration and the stray Markdown marks; give headings the heading convention of the text's language (one capital in Russian and Uzbek; in English, the style most of the text's headings use). A shape the document type requires stays.
- **Example:** in a short letter, "- **Deadline:** 1 December / - **Owner:** the head" becomes "The head owns the task; the deadline is 1 December."

## Content

### 17. Invented facts

- **Test:** does every number, name, law, quote, link and cross-reference trace to the text or a source the user gave? Do the section numbers it refers to exist?
- **Fix:** no rewrite: list each untraceable item for the user, and remove it only on the user's word.
- **Example:** "Article 512 of the Labour Code" with no source becomes a question: "Which article do you mean? Article 512 is not in the text you gave."
