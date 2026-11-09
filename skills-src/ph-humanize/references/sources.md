# Sources

The rules of `signs.md` are written in this package's own words from the findings below; no list or text of a source is copied. Read this file when a rule's reason is needed or a rule changes.

## Findings the rules rest on

- **No detector.** Detectors are unreliable in English (shared benchmarks: RAID; a test of 14 tools), flag plain and non-native text as machine-written (TOEFL essays: 61% false positives on average) and fail worse in Turkic and low-resource languages. So the skill fixes signs by rules and gives no score.
- **What readers notice.** People who use LLMs often caught AI text 92.7% of the time with 4% false positives; their reasons were AI vocabulary, formulaic sentence and text structure, and lack of originality. Other readers were near chance (Russell, Karpinska, Iyyer 2025).
- **The root sign.** A model writes the most likely sentence, which fits any subject; preference training pushes it toward positive, longer prose (Wikipedia, "Signs of AI writing"; Russian editors' guides; an Uzbek study of ChatGPT's "semantic safety").
- **Grammar measured in English.** GPT-4o used present participial clauses 5.3 times and nominalisations 2.1 times as often as human writers (Reinhart et al. 2025). The Russian and Uzbek counterparts (participial and converb chains, verbal nouns) are an inference, not a measurement.
- **Word lists age.** AI-overused words differ by model and year ("delve" peaked in 2023–2024; Kobak et al. 2025); emphasis verbs are overused in 24 of 34 languages (Juzek 2026, a preprint). No Uzbek list exists. So the rules test functions, not words.
- **Mechanical humanizing harms.** Recursive paraphrasing kept the content in 70% of cases (DIPPER, Krishna et al. 2023); lower-tier humanizers add typos and invented citations; synonym spinning makes "tortured phrases". A widely forked humanizer skill keeps legal and factual text plain.
- **One sign is weak.** Many signs together are the evidence; formal style, perfect grammar and transition words alone are no signs (Wikipedia, "Signs of AI writing").
- **Gaps.** No study compares AI-written and human-written letters, reports or regulations; no measured corpus exists for Russian or Uzbek AI text; no study shows that rule-based removal fools readers. The character rule goes beyond the research: it makes the text look typed on an ordinary keyboard.

## Sources and licences

| Source | Licence |
|---|---|
| Wikipedia, "Signs of AI writing" and its subpages, https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing | CC BY-SA 4.0 (Wikipedia's terms); paraphrased, not copied |
| Russian Wikipedia counterpart, https://ru.wikipedia.org/wiki/%D0%92%D0%B8%D0%BA%D0%B8%D0%BF%D0%B5%D0%B4%D0%B8%D1%8F:%D0%9F%D1%80%D0%B8%D0%B7%D0%BD%D0%B0%D0%BA%D0%B8_%D1%81%D0%B3%D0%B5%D0%BD%D0%B5%D1%80%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D0%BE%D1%81%D1%82%D0%B8_%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0 | CC BY-SA 4.0; paraphrased |
| blader/humanizer, https://github.com/blader/humanizer | MIT; its process (mark, rewrite with no added fact, re-check) is described, no text copied |
| Russell, Karpinska, Iyyer 2025, ACL (arXiv 2501.15654) | paper; findings cited |
| Reinhart et al. 2025, PNAS (arXiv 2410.16107) | paper; findings cited |
| Kobak et al. 2025, Science Advances (arXiv 2406.07016) | paper; findings cited |
| Liang et al. 2023, "GPT detectors are biased against non-native English writers" (arXiv 2304.02819) | paper; findings cited |
| Krishna et al. 2023, DIPPER (arXiv 2303.13408); Sadasivan et al. 2023 (arXiv 2303.11156) | papers; findings cited |
| Dugan et al. 2024, RAID (arXiv 2405.07940) | paper; findings cited |
| Juzek 2026, 34 languages (arXiv 2605.25358); Ozaman 2026, Kazakh detectors (arXiv 2610.15870) | preprints; findings cited |
| Russian editors' and journalists' guides on AI text and officialese (vc.ru, Habr, T-Zh, Meduza, Lifehacker) | articles; findings cited |
| Fayziyeva 2025 (inscience.uz); Marimbaeva 2026 (lingvospektr.uz) | Uzbek papers; findings cited |
