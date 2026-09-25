// Test-only DEMO product. Not real marketing, not a real customer: it only exercises the validator/export.
import fs from 'node:fs';
import path from 'node:path';

const filler = (n) => Array.from({ length: n }, () => 'זה טקסט בדיקה בלבד ואין בו שום תוכן אמיתי.').join(' ');

export function demoProduct() {
  const input = {
    slug: 'demo-cardigan',
    product_name: 'Demo',
    hebrew_product_name: 'דמו | קרדיגן בדיקה',
    product_type: 'Test cardigan',
    regular_price: 300,
    sale_price: 150,
    promotion: '50% discount — test promotion',
    sale_reason: 'Test sale reason',
    colors: ['Blue', 'Gray'],
    sizes: ['S–5XL'],
    features: ['test feature one', 'test feature two', 'test feature three', 'test feature four', 'test feature five'],
    existing_product_page: { url: 'https://example.com/demo', content: '' },
    existing_product_images: ['https://example.com/demo-1.jpg'],
    testimonials: [
      { id: 't1', name: null, age: null, source: 'TEST FIXTURE — not a real customer', text: 'TEST FIXTURE testimonial one.', details: '' },
      { id: 't2', name: null, age: null, source: 'TEST FIXTURE — not a real customer', text: 'TEST FIXTURE testimonial two.', details: '' },
    ],
    known_customer_problems: '',
    central_problem_hint: '',
    competitor_reference: '',
    extra_info: '',
    ugc_needed: false,
    launch_month: '2026-10',
    created_at: '2026-09-25',
  };
  const features = input.features.map((fact, i) => ({ id: `f${i + 1}`, fact, source: 'input' }));
  const facts = {
    product_name: input.product_name,
    hebrew_product_name: input.hebrew_product_name,
    product_type: input.product_type,
    price: { regular: 300, sale: 150, currency: 'ILS' },
    promotion: input.promotion,
    sale_reason: input.sale_reason,
    colors: [{ name: 'Blue', he: 'כחול' }, { name: 'Gray', he: 'אפור' }],
    sizes: ['S–5XL'],
    features,
    page_facts: [],
    image_observations: [],
    testimonials: [
      { id: 't1', supported_statements: ['test'], sufficient_for_ad: true, gaps: [] },
      { id: 't2', supported_statements: ['test'], sufficient_for_ad: true, gaps: [] },
    ],
    unverified: [],
    missing: [],
    status: 'complete',
  };
  const benefits = [1, 2, 3, 4, 5].map((n) => ({ n, human_problem: 'test', feature_ids: [`f${n}`], practical_effect: 'test', real_life_benefit: 'test', situations: ['test'] }));
  const angle = {
    questions: Object.fromEntries(['who', 'everyday_problem', 'current_workaround', 'why_frustrating', 'what_changes', 'adina_observation', 'core_belief', 'easiest_comparison', 'why_now'].map((k) => [k, 'test'])),
    central_problem: 'Test problem',
    customer_insight: 'test',
    product_solution: 'test',
    adina_belief: 'test',
    core_promise: 'test',
    old_alternative_a: 'A',
    old_alternative_b: 'B',
    why_now: 'test',
    founder_letter_hook: 'test',
    benefits,
  };
  angle.questions.enabling_features = ['f1'];

  const images = ['IMG-02', 'IMG-03', 'IMG-04', 'IMG-05', 'IMG-06'];
  const he = (t) => `${t} בדיקה`;
  const gempage = (lang) => {
    const H = lang === 'he';
    const T = (s) => (H ? he('טקסט') : s);
    return {
      lang,
      dir: H ? 'rtl' : 'ltr',
      blocks: [
        { id: 'founder_header', type: 'founder_header', byline: H ? 'מכתב מעדינה · מייסדת Adina Fashion' : 'Letter', place_date: T('Tel Aviv'), note: H ? 'הערה מעדינה — בעיה לבדיקה' : 'Note', badge: H ? 'מכתב מהמייסדת' : 'Badge' },
        { id: 'headline', type: 'headline', headline: T('Headline'), subtitle: T('Subtitle') },
        { id: 'hero', type: 'hero', image: 'IMG-01', alt: T('alt') },
        {
          id: 'founder_story',
          type: 'founder_story',
          greeting: H ? 'שלום, אני עדינה.' : 'Hello',
          parts: ['intro', 'observation', 'problem', 'alternatives', 'search', 'discovery'].map((role) => ({ role, text: T('story') })),
        },
        { id: 'benefits', type: 'benefits', title: T('Benefits'), items: images.map((image, i) => ({ n: i + 1, headline: T('h'), text: T('t'), feature_ids: [`f${i + 1}`], image })) },
        { id: 'comparison', type: 'comparison', title: T('Compare'), columns: { a: T('A'), b: T('B'), product: T('P') }, rows: [1, 2, 3].map(() => ({ label: T('l'), a: '✗', b: '✗', product: '✓' })) },
        { id: 'founder_quote', type: 'founder_quote', quote: T('quote'), author: H ? 'עדינה' : 'Adina' },
        { id: 'sale', type: 'sale', title: T('Sale'), paragraphs: [T('p')], regular_price: 300, sale_price: 150 },
        { id: 'trust_bar', type: 'trust_bar', items: [{ value: '₪150', label: T('l') }, { value: '15+', label: T('l') }, { value: '2,550+', label: T('l') }, { value: '30', label: T('l') }] },
        { id: 'packing', type: 'packing', image: 'IMG-07', caption: T('caption') },
        { id: 'founder_observation', type: 'founder_observation', text: T('obs') },
        { id: 'social_proof', type: 'social_proof', rating: 4.7, reviews_label: '2,550+', text: T('proof'), quotes: [] },
        {
          id: 'offer_box',
          type: 'offer_box',
          product_name: H ? input.hebrew_product_name : 'Demo',
          rating_line: '★★★★★ 4.7/5 · 2,550+',
          regular_price: 300,
          sale_price: 150,
          bullets: [1, 2, 3, 4].map(() => T('b')),
        },
        {
          id: 'bundle',
          type: 'bundle',
          title: T('Bundle'),
          tiers: [
            { items: 2, extra_discount_pct: 10, label: H ? '2 פריטים — 10% הנחה נוספת' : '2 items' },
            { items: 3, extra_discount_pct: 15, label: H ? '3 פריטים — 15% הנחה נוספת' : '3 items' },
            { items: 4, extra_discount_pct: 20, label: H ? '4 פריטים — 20% הנחה נוספת' : '4 items' },
            { items: 5, extra_discount_pct: 25, label: H ? '5 פריטים ומעלה — 25% הנחה נוספת' : '5+ items' },
          ],
        },
        { id: 'cta', type: 'cta', button: H ? 'בדקי אם המידה והצבע שלך עדיין במלאי' : 'Check', subtext: '' },
        { id: 'about', type: 'about', title: H ? 'אודות הכותבת' : 'About', text: H ? 'אני עדינה, 15+ שנים באופנה.' : 'About 15+', signoff: H ? 'מתל אביב, באהבה!' : 'Love' },
        { id: 'sticky_cta', type: 'sticky_cta', text: H ? 'דמו עכשיו ב־₪150 — בדקי אם המידה שלך עדיין במלאי' : 'Demo now ₪150' },
      ],
    };
  };
  const roles = ['hero', 'benefit_detail', 'functional_detail', 'functional_detail_2', 'real_life_use', 'variation', 'packing'];
  const plan = {
    images: roles.map((role, i) => ({
      id: `IMG-0${i + 1}`,
      role,
      block: role === 'hero' ? 'hero' : role === 'packing' ? 'packing' : 'benefits',
      benefit_n: role === 'hero' || role === 'packing' ? null : i,
      purpose: 'test purpose',
      source: 'generate',
      existing_image: null,
      product_color: role === 'variation' ? 'Gray' : 'Blue',
      model: role === 'variation' ? 'model B' : 'model A',
      setting: 'test',
      url: `https://cdn.example.com/demo/IMG-0${i + 1}.png`,
    })),
    existing_images_reviewed: input.existing_product_images,
    notes: '',
  };
  const promptFields = ['subject', 'age', 'product', 'styling', 'action', 'environment', 'framing', 'light', 'mood', 'must_be_visible', 'realism', 'must_not_change'];
  const prompts = {
    prompts: plan.images.map((i) => ({
      image_id: i.id,
      aspect_ratio: '4:5',
      reference_images: input.existing_product_images,
      fields: { ...Object.fromEntries(promptFields.map((k) => [k, 'test'])), exact_color: i.product_color },
      prompt: 'Test prompt. No text in image. Consistent with the reference images.',
    })),
  };
  const adText = (opening) => `${opening} ${filler(22)} עדינה כתבה על זה. ${filler(8)} עכשיו ב־₪150 במקום ₪300. אם זה מוכר לך, הייתי מתחילה מהמכתב של עדינה.`;
  const ads = {
    status: 'ready',
    flags: [],
    ads: [
      { id: 'ad1', type: 'discovery', angle: 'Test discovery', testimonial_id: 't1', primary_text: adText('פתיחה ראשונה שונה לגמרי.'), headline: 'כותרת בדיקה', description: 'תיאור בדיקה ₪150', trace: [{ claim: 'x', source: 'testimonial:t1' }, { claim: 'y', source: 'input:sale_price' }], review_en: 'test' },
      { id: 'ad2', type: 'routine', angle: 'Test routine', testimonial_id: 't2', primary_text: adText('יש לי כלל קבוע.'), headline: 'כותרת שנייה', description: 'תיאור שני', trace: [{ claim: 'x', source: 'testimonial:t2' }, { claim: 'z', source: 'config:trust.shipping' }], review_en: 'test' },
    ],
  };
  const creatives = {
    creatives: ['customer_discovery', 'raw_boutique_offer', 'everyday_use', 'designed_hook'].map((type, i) => ({
      id: 'ABCD'[i],
      type,
      matches: i === 0 ? 'ad1' : i === 2 ? 'ad2' : 'both',
      concept: 'test',
      visual: `visual ${type}`,
      overlay_text_he: type === 'designed_hook' ? 'שאלה לבדיקה?' : null,
      product_color: i % 2 ? 'Gray' : 'Blue',
      format: '4:5',
      prompt: 'test',
    })),
  };
  const ugc = { needed: false, reason: 'not requested in input' };
  return { input, facts, angle, gempageEn: gempage('en'), gempageHe: gempage('he'), plan, prompts, ads, creatives, ugc };
}

export function writeDemo(productsDir, mutate = (d) => d, { omit = [] } = {}) {
  const d = demoProduct();
  mutate(d);
  const dir = path.join(productsDir, d.input.slug);
  fs.mkdirSync(dir, { recursive: true });
  const files = {
    'input.json': d.input,
    '01-product-facts.json': d.facts,
    '02-central-angle.json': d.angle,
    '03-gempage-copy.en.json': d.gempageEn,
    '04-gempage-image-plan.json': d.plan,
    '05-image-prompts.json': d.prompts,
    '03-gempage-copy.he.json': d.gempageHe,
    '06-meta-ads.json': d.ads,
    '07-creative-plan.json': d.creatives,
    '08-ugc.json': d.ugc,
  };
  for (const [name, data] of Object.entries(files)) if (!omit.includes(name)) fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2));
  if (!omit.includes('09-qa-report.md')) fs.writeFileSync(path.join(dir, '09-qa-report.md'), '# QA — demo\n');
  return d.input.slug;
}
