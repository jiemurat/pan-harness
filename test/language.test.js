// The package's own texts are in English: the skill sources, the shared references, templates and
// scripts, the CLI library, the tests and the eval scenarios. The one exception is the language
// question ph-init asks first: its Uzbek and Russian lines (QUESTION) are taken out of a line before
// the line is checked. A line is flagged when it holds a Cyrillic letter, an apostrophe between two
// letters that is not an English contraction (Uzbek writes o and g with one, and joins suffixes to
// English terms with one), an Uzbek word, a word that starts with an Uzbek stem, or a word that
// ends in an Uzbek verb or case ending. In a Python file the string prefixes (f'', r'', b'', u'',
// rb'') are taken out first: they are not an apostrophe between two letters. The words below carry
// a "_" after their first letter and are joined at run time, so this file holds none of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['skills-src', 'core', 'lib', 'test', 'evals'];
const QUESTION = ['Qaysi tilda gaplashamiz?', 'На каком языке будем общаться?', "b. O'zbek", 'c. Русский',
  "Men COOPER'man, bu loyihaning asosiy agentiman.", 'Я COOPER, главный агент этого проекта.'];

const joined = (list) => list.map((w) => w.split('_').join(''));
// whole words, in any letter case
const WORDS = joined([
  'v_a', 'b_ilan', 'y_oki', 'h_ar', 'f_aqat', 'e_gasi', 'e_gasining', 'e_gasiga', 'e_gasidan', 'u_chun', 'd_agi',
  's_hu', 'k_eyin', 'o_ldin', 'k_erak', 'e_mas', 'a_gar', 'l_ekin', 'c_hunki', 'h_amma', 'h_ammasi', 'b_archa',
  'b_or', 'b_itta', 'i_kki', 'u_chta', 'n_ima', 'q_anday', 'q_achon', 'q_aysi', 'q_ayerda', 'n_ega', 'k_abi',
  'o_rqali', 'h_aqida', 'b_oshqa', 'y_angi', 'e_ski', 'o_ldingi', 'k_eyingi', 'b_irinchi', 'o_xirgi', 'o_xirida',
  'b_oshida', 'a_vval', 'd_arhol', 'q_ayta', 'a_lohida', 'm_asalan', 'm_umkin', 'm_avjud', 'k_ichik', 'k_atta',
  'o_ddiy', 'a_niq', 'q_isqa', 'o_chiq', 'd_oimiy', 'j_oriy', 'i_chki', 't_ashqi', 't_ashqari', 'b_utun', 'x_os',
  'x_il', 'v_aqt', 'j_uda', 'y_oz', 'q_il', 'a_yt', 'b_er', 't_ushir', 's_olishtir', 'n_arsa', 'q_ator',
  'x_ato', 'm_atn', 'm_aqsad', 't_arix', 's_inov', 's_hart', 'r_aqam', 'r_aqami', 'n_omi', 'k_od', 'o_lib',
  's_inab', 'q_arab', 't_ili', 't_ugadi', 'q_oladi', 't_uradi', 'b_eradi', 'a_ytadi', 'o_ladi', 'k_iradi', 'c_hiqadi',
  'q_iladi', 'q_ilingan', 'q_ilinmagan', 'm_ajburiy', 'i_xtiyoriy', 'u_lar', 'u_larni', 'u_nga', 'u_ning',
  's_huning', 'd_avom', 't_anlov', 'r_eja', 'r_ejada', 'i_shga', 'i_shni', 'i_shlar',
]);
// word starts: a stem with any ending
const STEMS = joined([
  'l_oyiha', 'h_ujjat', 'f_ayl', 'q_oida', 's_avol', 'j_avob', 'n_atija', 'q_adam', 'b_osqich', 't_ekshir',
  'k_riteriya', 'v_ersiya', 'y_ozuv', 'y_ozil', 'y_ozish', 'b_ajar', 't_ushun', 't_aklif', 'x_abar', 's_ozla',
  'y_arat', 'h_isobot', 't_artib', 'h_avola', 'b_uyruq', 's_essiya', 'a_tama', 't_avsiya', 's_uhbat', 'm_urojaat',
  'j_urnal', 's_hablon', 'i_shla', 'b_oshla', 'y_angila', 's_aqla', 'q_aror', 'h_ajm', 'a_niqla', 'e_slat',
  'u_sul', 'i_ngliz', 'i_zoh', 'v_azifa', 'c_heklov', 'b_andma', 's_arlavha', 'e_skir', 's_tandart', 's_kript',
  't_amoyil', 't_alab', 'n_uqson', 'm_oslik', 't_uzat', 't_ashla', 'r_uxsat', 'x_avf', 's_abab', 'm_aydon',
  'j_adval', 'u_stun', 'p_apka', 'n_usxa', 'b_aho', 'c_hegara', 'm_uddat',
]);
// word ends after at least two letters: Uzbek verb forms and case endings
const ENDINGS = joined([
  'i_ladi', 'l_adi', 'a_ydi', 'm_aydi', 'm_oqda', 'l_arni', 'l_arga', 'l_ardan', 'i_lgan', 'i_lsa', 'd_agi',
  'i_ldi', 'i_shni', 'i_shga', 'g_ach',
]);

const W = '[\\p{L}\\p{N}_]';
const PY_PREFIX = new RegExp(`(?<!${W})(?:[rbuf]|rb|br|rf|fr)(?=['"])`, 'giu');
const APOSTROPHES = "'\\u2019\\u02BB\\u02BC\\u2018"; // regex escapes of the right, turned, modifier and left single quotes
const RULES = [
  ['Cyrillic letter', /\p{Script=Cyrillic}/u],
  // a letter, an apostrophe and a small letter, unless they start an English contraction or
  // possessive (it's, don't, we'll, they're, I've, I'm, he'd, exec'ing, exec'ed)
  ['Uzbek apostrophe', new RegExp(`\\p{L}[${APOSTROPHES}](?!(?:s|t|d|m|ll|re|ve|ing|ed)(?!\\p{L}))\\p{Ll}`, 'u')],
  ['Uzbek word', new RegExp(`(?<!${W})(?:${WORDS.join('|')})(?!${W})`, 'iu')],
  ['Uzbek stem', new RegExp(`(?<!${W})(?:${STEMS.join('|')})\\p{L}*`, 'iu')],
  ['Uzbek ending', new RegExp(`\\p{L}{2,}(?:${ENDINGS.join('|')})(?!${W})`, 'iu')],
];

/** The first rule a line breaks, after the language question lines are taken out, or null. */
function foreign(line) {
  const bare = QUESTION.reduce((s, q) => s.split(q).join(' '), line);
  for (const [name, rule] of RULES) {
    const m = rule.exec(bare);
    if (m) return `${name} "${m[0]}"`;
  }
  return null;
}

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : [p];
  });
}

test('the package texts hold no Uzbek or Russian beyond the language question', () => {
  const found = [];
  for (const dir of DIRS) {
    for (const p of files(path.join(ROOT, dir))) {
      fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
        const why = foreign(p.endsWith('.py') ? line.replace(PY_PREFIX, '') : line);
        if (why) found.push(`${path.relative(ROOT, p).split(path.sep).join('/')}:${i + 1}: ${why}: ${line.trim().slice(0, 80)}`);
      });
    }
  }
  assert.deepEqual(found.slice(0, 40), [], `${found.length} line(s)`);
});

test('the detector flags Uzbek and Russian and passes English', () => {
  const char = (...codes) => String.fromCodePoint(...codes);
  const uzbek = [...joined(['H_ar f_ayl', 'L_oyihaning m_aqsadi', 'y_ozi_ladi']), `o${char(0x2019)}qi`, `check${char(0x2bb)}lar`,
    char(0x41f, 0x440, 0x438)];
  for (const line of uzbek) assert.ok(foreign(line), line);
  for (const line of ["It's the owner's call; don't push.", 'Run `git status` and read the plan.', QUESTION.join(' / ')]) {
    assert.equal(foreign(line), null, line);
  }
  assert.equal(foreign(joined(["print(f_'cell {x}', rb_'raw', u_'text')"])[0].replace(PY_PREFIX, '')), null);
});
