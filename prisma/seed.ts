import 'dotenv/config'
import { PrismaClient, LeadStatus, ItemType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

function nameHash(name: string): number {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

function generatePeaks(name: string): number[] {
  const hash = nameHash(name)
  return Array.from({ length: 100 }, (_, i) =>
    Math.sin(i * 0.3 + hash) * 0.8 + (Math.random() - 0.5) * 0.4
  )
}

function randomPhone(): string {
  const ops = ['90', '91', '93', '94', '95', '97', '98', '99', '33']
  const op = ops[Math.floor(Math.random() * ops.length)]
  const n1 = Math.floor(Math.random() * 900 + 100)
  const n2 = Math.floor(Math.random() * 90 + 10)
  const n3 = Math.floor(Math.random() * 90 + 10)
  return `+998 ${op} ${n1} ${n2} ${n3}`
}

function randomDuration(): number {
  return Math.floor(120 + Math.random() * 420)
}

function randomDate(daysAgo: number): Date {
  return new Date(Date.now() - Math.floor(Math.random() * daysAgo * 86400000))
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function calcScore(verdicts: Record<string, { verdict: string }>, items: { id: string; weight: number }[]): number {
  let total = 0, earned = 0
  for (const item of items) {
    const v = verdicts[item.id]
    if (!v) continue
    total += item.weight
    if (v.verdict === 'pass') earned += item.weight
    else if (v.verdict === 'unclear') earned += item.weight * 0.5
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0
}

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.review.deleteMany()
  await prisma.transcript.deleteMany()
  await prisma.callRecording.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.checklist.deleteMany()
  await prisma.salesRep.deleteMany()
  await prisma.settings.deleteMany()

  // ─── Sales Reps ──────────────────────────────────────────────────────────────
  const [bobur, sarvinoz, dilshod, malika, rustam] = await Promise.all([
    prisma.salesRep.create({ data: { name: 'Bobur Karimov', email: 'bobur@sotai.uz' } }),
    prisma.salesRep.create({ data: { name: 'Sarvinoz Yusupova', email: 'sarvinoz@sotai.uz' } }),
    prisma.salesRep.create({ data: { name: 'Dilshod Nazarov', email: 'dilshod@sotai.uz' } }),
    prisma.salesRep.create({ data: { name: 'Malika Ergasheva', email: 'malika@sotai.uz' } }),
    prisma.salesRep.create({ data: { name: 'Rustam Mirzayev', email: 'rustam@sotai.uz' } }),
  ])
  const reps = [bobur, sarvinoz, dilshod, malika, rustam]
  console.log('Created 5 sales reps')

  // ─── Checklists ──────────────────────────────────────────────────────────────
  const coldCallChecklist = await prisma.checklist.create({
    data: {
      name: 'Cold Call Checklist',
      description: "Sovuq qo'ng'iroq sifatini baholash uchun namunaviy chek-list",
      isDefault: true,
      items: {
        create: [
          { text: "Salomlashish va o'zini tanishtirish (Greeting and self-introduction)", type: ItemType.YES_NO, weight: 1.0, order: 1 },
          { text: "Qo'ng'iroq sababini tushuntirish (Explained reason for call)", type: ItemType.YES_NO, weight: 1.0, order: 2 },
          { text: "Mijozning ehtiyojini aniqlash (Identified customer need)", type: ItemType.YES_NO, weight: 1.5, order: 3 },
          { text: "Mahsulot haqida qisqa taqdimot (Brief product pitch)", type: ItemType.YES_NO, weight: 1.5, order: 4 },
          { text: "E'tirozlarni qayta ishlash (Handled objections)", type: ItemType.SCORE, weight: 2.0, order: 5 },
          { text: "Narx yoki taklif berish (Gave price or offer)", type: ItemType.YES_NO, weight: 1.0, order: 6 },
          { text: "Keyingi qadam kelishib olish (Agreed on next step)", type: ItemType.YES_NO, weight: 2.0, order: 7 },
          { text: "Muloqot tonusi va professionallik (Tone and professionalism)", type: ItemType.SCORE, weight: 1.5, order: 8 },
          { text: "Qo'ng'iroq davomiyligi maqbul (Appropriate call length)", type: ItemType.YES_NO, weight: 0.5, order: 9 },
          { text: "Xayrlashuv va minnatdorchilik (Proper closing and thank-you)", type: ItemType.YES_NO, weight: 0.5, order: 10 },
        ],
      },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  const demoCallChecklist = await prisma.checklist.create({
    data: {
      name: 'Product Demo Checklist',
      description: "Mahsulot namoyishi qo'ng'iroqlari uchun baholash chek-listi",
      isDefault: false,
      items: {
        create: [
          { text: 'Introduction and agenda setting', type: ItemType.YES_NO, weight: 1.0, order: 1 },
          { text: 'Customer pain point confirmed before demo', type: ItemType.YES_NO, weight: 2.0, order: 2 },
          { text: "Demo personalized to customer's use case", type: ItemType.SCORE, weight: 2.0, order: 3 },
          { text: 'Key product features demonstrated', type: ItemType.YES_NO, weight: 1.5, order: 4 },
          { text: 'ROI or business value clearly stated', type: ItemType.YES_NO, weight: 2.0, order: 5 },
          { text: 'Competitor or alternative comparison handled', type: ItemType.YES_NO, weight: 1.0, order: 6 },
          { text: 'Technical questions answered satisfactorily', type: ItemType.SCORE, weight: 1.5, order: 7 },
          { text: 'Integration and compatibility discussed', type: ItemType.YES_NO, weight: 1.0, order: 8 },
          { text: 'Trial, pilot, or next step offered', type: ItemType.YES_NO, weight: 2.0, order: 9 },
          { text: 'Pricing or budget range mentioned', type: ItemType.YES_NO, weight: 1.0, order: 10 },
          { text: 'Decision maker or budget holder identified', type: ItemType.YES_NO, weight: 1.5, order: 11 },
          { text: 'Follow-up call or meeting scheduled', type: ItemType.YES_NO, weight: 2.0, order: 12 },
        ],
      },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  const closingChecklist = await prisma.checklist.create({
    data: {
      name: 'Closing Call Checklist',
      description: "Savdoni yopish qo'ng'iroqlari uchun baholash chek-listi",
      isDefault: false,
      items: {
        create: [
          { text: 'Oldingi muloqot qisqacha takrorlandi (Recap of previous discussion)', type: ItemType.YES_NO, weight: 1.0, order: 1 },
          { text: "Qaror qabul qilishga to'siqlar aniqlandi (Decision obstacles identified)", type: ItemType.SCORE, weight: 2.0, order: 2 },
          { text: "Yakuniy e'tirozlar hal qilindi (Final objections handled)", type: ItemType.SCORE, weight: 2.5, order: 3 },
          { text: 'Shartnoma yoki taklif yuborildi (Contract or proposal sent)', type: ItemType.YES_NO, weight: 1.5, order: 4 },
          { text: 'Shoshilinchlik yaratildi (Urgency created)', type: ItemType.YES_NO, weight: 1.5, order: 5 },
          { text: 'Qaror muddati kelishildi (Decision timeline confirmed)', type: ItemType.YES_NO, weight: 2.0, order: 6 },
          { text: "To'lov shartlari muhokama qilindi (Payment terms discussed)", type: ItemType.YES_NO, weight: 1.0, order: 7 },
          { text: 'Majburiyat yoki imzo olindi (Commitment or signature obtained)', type: ItemType.SCORE, weight: 3.0, order: 8 },
        ],
      },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })

  console.log('Created 3 checklists')

  const ccItems = coldCallChecklist.items
  const demoItems = demoCallChecklist.items
  const closingItems = closingChecklist.items

  type VerdictRecord = Record<string, { verdict: string; reasoning: string; manualOverride: boolean }>

  const ccPassR = ["Salomlashdi va kompaniya nomini aniq aytdi", "Qo'ng'iroq sababini aniq tushuntirdi", "Mijozning ehtiyojini to'liq aniqladi", "Mahsulot haqida qisqa va aniq taqdimot qildi", "Возражение клиента было успешно обработано", "Narxni va taklifni aniq bildirdi", "Keyingi qadamni aniq kelishib oldi", "Чётко обозначил следующий шаг", "Muloqot davomiyligi maqbul doirada bo'ldi", "Xayrlashdi va minnatdorchilik bildirdi"]
  const ccFailR = ["Salomlashmadi, to'g'ridan-to'g'ri taklifga o'tib ketdi", "Qo'ng'iroq sababini tushuntirmadi", "Mijozning ehtiyojini aniqlamadi", "Mahsulot taqdimoti o'tkazilmadi", "E'tiroz e'tiborga olinmadi", "Narx haqida gapirmadi", "Keyingi qadam kelishilmadi, qo'ng'iroq yakunlanib qoldi", "Следующий шаг не был согласован", "Qo'ng'iroq juda qisqa yoki juda uzun bo'ldi", "Xayrlashuvda professionallik etishmadi"]
  const ccUnclearR = ["Qisman bajarildi, lekin to'liq emas", "Частично выполнено, требует уточнения", "Narx haqida gaplashildi, lekin aniq kelishuv bo'lmadi"]

  const demoPassR = ['Introduction was clear and agenda was set', 'Customer pain points were confirmed before starting the demo', "Demo was fully customized to their industry use case", 'All key features were demonstrated effectively', 'ROI and business value were clearly communicated', 'Competitor comparison was handled professionally', 'All technical questions were answered satisfactorily', 'Integration capabilities were discussed in detail', 'A pilot trial was offered with clear next steps', 'Budget range was discussed openly', 'Decision maker was identified and involved', 'Follow-up meeting was scheduled before call ended']
  const demoFailR = ['No introduction or agenda was set at the start', 'Pain points were not confirmed prior to demo', 'Demo was generic, not tailored to customer', 'Key features were skipped or rushed', 'No ROI or business value was mentioned', 'Competitor questions were avoided', 'Technical questions were left unanswered', 'Integration was not discussed', 'No next step or trial was offered', 'Pricing was not mentioned at all', 'Decision maker was not identified', 'No follow-up was scheduled']
  const demoUnclearR = ['Частично выполнено, требует уточнения', "Qisman bajarildi, lekin to'liq emas", 'Mentioned briefly but not explored in depth']

  const closingPassR = ['Oldingi muloqot qisqacha takrorlandi', "Qaror qabul qilishga to'siqlar aniqlandi va muhokama qilindi", "Yakuniy e'tirozlar muvaffaqiyatli hal qilindi", 'Shartnoma mijozga yuborildi', 'Muddatni eslatib, shoshilinchlik yaratildi', 'Qaror muddati kelishildi', "To'lov shartlari muhokama qilindi", 'Majburiyat olindi va imzo bosqichi kelishildi']
  const closingFailR = ['Oldingi muloqot takrorlanmadi', "Qaror qabul qilishga to'siqlar aniqlanmadi", "Yakuniy e'tirozlar hal qilinmadi", 'Shartnoma yuborilmadi', 'Shoshilinchlik yaratilmadi', 'Qaror muddati kelishilmadi', "To'lov shartlari muhokama qilinmadi", 'Majburiyat yoki imzo olinmadi']
  const closingUnclearR = ["Qisman bajarildi, lekin to'liq emas", 'Частично выполнено, требует уточнения', 'Briefly touched but not resolved']

  function buildVerdicts(
    items: { id: string }[],
    passR: string[], failR: string[], unclearR: string[],
    tier: 'high' | 'medium' | 'low',
    seed: number
  ): VerdictRecord {
    const rand = seededRandom(seed)
    const verdicts: VerdictRecord = {}
    for (let i = 0; i < items.length; i++) {
      let verdict: string
      const r = rand()
      if (tier === 'high') verdict = r < 0.8 ? 'pass' : r < 0.93 ? 'unclear' : 'fail'
      else if (tier === 'medium') verdict = r < 0.5 ? 'pass' : r < 0.75 ? 'unclear' : 'fail'
      else verdict = r < 0.25 ? 'pass' : r < 0.5 ? 'unclear' : 'fail'
      const reasoning = verdict === 'pass' ? passR[i % passR.length] : verdict === 'fail' ? failR[i % failR.length] : unclearR[i % unclearR.length]
      verdicts[items[i].id] = { verdict, reasoning, manualOverride: false }
    }
    return verdicts
  }

  // Transcript line pools (Uzbek/Russian mixed)
  const transcriptPools = {
    coldCall: [
      (rep: string, lead: string) => [
        { timestamp: 2, speaker: rep, speakerRole: 'rep', text: `Assalomu alaykum, ${lead}! Men SotAI kompaniyasidan ${rep}. Bir daqiqangiz bormi?` },
        { timestamp: 9, speaker: lead, speakerRole: 'lead', text: 'Ha, salom. Kimdan deysiz?' },
        { timestamp: 13, speaker: rep, speakerRole: 'rep', text: "SotAI — savdo qo'ng'iroqlari sifatini avtomatik baholash platformasi. Sizning jamoangizda nechi menejer ishlaydi?" },
        { timestamp: 24, speaker: lead, speakerRole: 'lead', text: 'Bizda bir necha savdo menejeri bor. Nazorat qilishda qiyinchilik bor.' },
        { timestamp: 31, speaker: rep, speakerRole: 'rep', text: "Aynan shu muammoni yechamiz. Har bir qo'ng'iroq avtomatik transkripsiya va AI baholovi bilan ishlaydi." },
        { timestamp: 44, speaker: lead, speakerRole: 'lead', text: 'Qiziq. Narxi qancha?' },
        { timestamp: 48, speaker: rep, speakerRole: 'rep', text: "Menejer boshiga oyiga $30 dan. Demo ko'rishni xohlaysizmi?" },
        { timestamp: 58, speaker: lead, speakerRole: 'lead', text: "Ha, ko'rish mumkin." },
        { timestamp: 63, speaker: rep, speakerRole: 'rep', text: "Ajoyib! Emailingizni bering, link yuboraman." },
        { timestamp: 70, speaker: lead, speakerRole: 'lead', text: "Xo'p, kutaman." },
      ],
      (rep: string, lead: string) => [
        { timestamp: 2, speaker: rep, speakerRole: 'rep', text: `Здравствуйте, ${lead}! Меня зовут ${rep}, звоню из SotAI. Вы занимаетесь продажами?` },
        { timestamp: 12, speaker: lead, speakerRole: 'lead', text: 'Ha, biz savdo kompaniyasimiz.' },
        { timestamp: 16, speaker: rep, speakerRole: 'rep', text: "Siz uchun maxsus yechim bor — savdo menejerlari qo'ng'iroqlari sifatini avtomatik baholash." },
        { timestamp: 26, speaker: lead, speakerRole: 'lead', text: "Bu qanday ishlaydi?" },
        { timestamp: 30, speaker: rep, speakerRole: 'rep', text: "AI har qo'ng'iroqni tinglaydi, transkripsiya qiladi va chek-list bo'yicha baholaydi." },
        { timestamp: 41, speaker: lead, speakerRole: 'lead', text: "Qiziq. Bitrix24 bilan ishlaydi?" },
        { timestamp: 46, speaker: rep, speakerRole: 'rep', text: "Ha, to'liq integratsiya mavjud." },
        { timestamp: 54, speaker: lead, speakerRole: 'lead', text: "Narxi?" },
        { timestamp: 58, speaker: rep, speakerRole: 'rep', text: "10 menejer uchun $300 oyiga." },
        { timestamp: 66, speaker: lead, speakerRole: 'lead', text: "Ko'rib chiqaman. Rahmat." },
        { timestamp: 70, speaker: rep, speakerRole: 'rep', text: "Xo'p, materiallar yuboraymi?" },
        { timestamp: 74, speaker: lead, speakerRole: 'lead', text: "Ha, yuboring." },
      ],
      (rep: string, lead: string) => [
        { timestamp: 3, speaker: rep, speakerRole: 'rep', text: `Assalomu alaykum! Bu ${rep}, SotAI dan. ${lead} bilan gaplashyapmanmi?` },
        { timestamp: 10, speaker: lead, speakerRole: 'lead', text: 'Ha, o\'zim.' },
        { timestamp: 14, speaker: rep, speakerRole: 'rep', text: "Savdo jamoangiz sifatini yaxshilash haqida gaplashaymi? Biz AI bilan har qo'ng'iroqni tahlil qilamiz." },
        { timestamp: 24, speaker: lead, speakerRole: 'lead', text: "Hozir bunday muammo bormi deb o'ylardim. Qanday ishlaydi?" },
        { timestamp: 30, speaker: rep, speakerRole: 'rep', text: "Oddiy — qo'ng'iroq tugagach, tizim avtomatik baholaydi. Menejerlarga ball va izoh beradi." },
        { timestamp: 42, speaker: lead, speakerRole: 'lead', text: "Demo bo'lishi mumkinmi?" },
        { timestamp: 46, speaker: rep, speakerRole: 'rep', text: "Albatta. Qachon qulay bo'ladi?" },
        { timestamp: 52, speaker: lead, speakerRole: 'lead', text: "Ertaga soat 14 da." },
        { timestamp: 56, speaker: rep, speakerRole: 'rep', text: "Zo'r! Link va material yuboraman. Ko'rishguncha!" },
      ],
    ],
    demo: [
      (rep: string, lead: string) => [
        { timestamp: 2, speaker: rep, speakerRole: 'rep', text: `Assalomu alaykum, ${lead}! Bu ${rep} SotAI dan. Demo uchun vaqt ajratganingiz uchun katta rahmat.` },
        { timestamp: 11, speaker: lead, speakerRole: 'lead', text: 'Marhamat, boshlayvering.' },
        { timestamp: 15, speaker: rep, speakerRole: 'rep', text: "Avval bitta savol: hozir savdo menejerlar sifatini qanday nazorat qilasiz?" },
        { timestamp: 24, speaker: lead, speakerRole: 'lead', text: "Qo'lda qo'ng'iroqlarni tinglashimiz kerak. Juda ko'p vaqt sarflanadi." },
        { timestamp: 32, speaker: rep, speakerRole: 'rep', text: "Aynan. Biz bu muammoni hal qilamiz. Mana bizning platforma — real vaqtda transkripsiya bo'ladi." },
        { timestamp: 45, speaker: lead, speakerRole: 'lead', text: "Bu juda zo'r. Tillarni ham qo'llab-quvvatlaydimi?" },
        { timestamp: 53, speaker: rep, speakerRole: 'rep', text: "Ha, aynan! O'zbek, rus va ingliz tillarini qo'llaydi." },
        { timestamp: 65, speaker: lead, speakerRole: 'lead', text: "Integratsiya qanday?" },
        { timestamp: 69, speaker: rep, speakerRole: 'rep', text: "Bitrix24, AmoCRM, Salesforce bilan integratsiya mavjud. API ham bor." },
        { timestamp: 80, speaker: lead, speakerRole: 'lead', text: "Narxi?" },
        { timestamp: 84, speaker: rep, speakerRole: 'rep', text: "20 menejer uchun oyiga $600. Birinchi 30 kun bepul." },
        { timestamp: 95, speaker: lead, speakerRole: 'lead', text: "Shartnomani ko'rsating." },
        { timestamp: 101, speaker: rep, speakerRole: 'rep', text: "Hoziroq emailingizga yuboraman. Ertaga javob berasizmi?" },
        { timestamp: 107, speaker: lead, speakerRole: 'lead', text: "Ha, kutaman." },
      ],
      (rep: string, lead: string) => [
        { timestamp: 2, speaker: rep, speakerRole: 'rep', text: `Добрый день, ${lead}! Это ${rep} из SotAI. Готовы начать демо?` },
        { timestamp: 10, speaker: lead, speakerRole: 'lead', text: 'Ha, tayyor.' },
        { timestamp: 14, speaker: rep, speakerRole: 'rep', text: "Mana bosh sahifa — barcha qo'ng'iroqlar ro'yxati va AI bahosi." },
        { timestamp: 25, speaker: lead, speakerRole: 'lead', text: "Baho qanday hisoblanadi?" },
        { timestamp: 30, speaker: rep, speakerRole: 'rep', text: "Chek-listga ko'ra. Har bir mezon uchun AI pass/fail/unclear deb belgilaydi." },
        { timestamp: 42, speaker: lead, speakerRole: 'lead', text: "Chek-listni o'zim yaratishim mumkinmi?" },
        { timestamp: 47, speaker: rep, speakerRole: 'rep', text: "Ha, to'liq sozlash mumkin. Har bir mezon uchun og'irlik ham belgilaysiz." },
        { timestamp: 58, speaker: lead, speakerRole: 'lead', text: "ROI bo'yicha misol bor?" },
        { timestamp: 63, speaker: rep, speakerRole: 'rep', text: "Mijozlar o'rtacha savdo ko'rsatkichini 28% ga oshirdi. Supervisor vaqtini 65% ga tejadi." },
        { timestamp: 76, speaker: lead, speakerRole: 'lead', text: "Ishonchli ko'rinadi. Trial boshlasak bo'ladimi?" },
        { timestamp: 82, speaker: rep, speakerRole: 'rep', text: "Ha, bugunoq! Emailingizni bering." },
        { timestamp: 87, speaker: lead, speakerRole: 'lead', text: "Yaxshi, email yuboraman." },
      ],
    ],
    closing: [
      (rep: string, lead: string) => [
        { timestamp: 2, speaker: rep, speakerRole: 'rep', text: `Assalomu alaykum, ${lead}! Bu ${rep}. O'tgan demo qo'ng'iroqimizdan keyin shartnoma haqida gaplashaymi?` },
        { timestamp: 12, speaker: lead, speakerRole: 'lead', text: 'Ha, salom. Tayyor edim.' },
        { timestamp: 17, speaker: rep, speakerRole: 'rep', text: "Ajoyib. Oldingi suhbatimizda 20 menejer uchun yechim kerakligini aytgandingiz." },
        { timestamp: 27, speaker: lead, speakerRole: 'lead', text: "Ha, 20 nafar. IT bo'lim ham integratsiya haqida savol qo'ydi." },
        { timestamp: 36, speaker: rep, speakerRole: 'rep', text: "IT uchun texnik hujjatlarimiz bor. API xavfsizligi ISO 27001 bo'yicha sertifikatlangan." },
        { timestamp: 48, speaker: lead, speakerRole: 'lead', text: "Ma'lumotlar qayerda saqlanadi?" },
        { timestamp: 52, speaker: rep, speakerRole: 'rep', text: "AWS EU serverlarida. GDPR talablariga to'liq mos." },
        { timestamp: 61, speaker: lead, speakerRole: 'lead', text: "Yaxshi. Shartnoma shartlari?" },
        { timestamp: 65, speaker: rep, speakerRole: 'rep', text: "Yillik to'lovda 20% chegirma. Kontrakt hoziroq yuboraman." },
        { timestamp: 75, speaker: lead, speakerRole: 'lead', text: "Yuborin, ko'rib chiqamiz." },
        { timestamp: 79, speaker: rep, speakerRole: 'rep', text: "Erta aytasizmi? Bu haftada boshlasak ajoyib bo'lardi." },
        { timestamp: 85, speaker: lead, speakerRole: 'lead', text: "Ha, erta javob beraman." },
        { timestamp: 88, speaker: rep, speakerRole: 'rep', text: "Zo'r! Ko'rishguncha, rahmat!" },
      ],
    ],
  }

  const AUDIO_URL = '/demo-call.wav'

  // ─── Lead data: 75 leads ─────────────────────────────────────────────────────
  const leadDefs = [
    // name, repIndex, status, scoreTarget, checklistType, recordingCount
    ['Jasur Toshmatov', 0, 'REVIEWED', 'high', 'cold', 3],
    ['Nilufar Rashidova', 1, 'REVIEWED', 'medium', 'demo', 2],
    ['Alisher Xolmatov', 2, 'REVIEWED', 'low', 'cold', 1],
    ['Mohira Qodirov', 3, 'REVIEWED', 'high', 'demo', 2],
    ['Dilorom Hamidova', 1, 'REVIEWED', 'high', 'demo', 3],
    ['Behruz Tursunov', 0, 'REVIEWED', 'low', 'cold', 1],
    ['Feruza Usmonova', 4, 'REVIEWED', 'medium', 'closing', 2],
    ['Sardor Qoraboyev', 2, 'REVIEWED', 'high', 'closing', 2],
    ['Murod Ismoilov', 3, 'AI_READY', 'medium', 'cold', 1],
    ['Zulfiya Nazarova', 0, 'REVIEWED', 'high', 'demo', 2],
    ['Otabek Yunusov', 2, 'NOT_REVIEWED', 'medium', 'cold', 1],
    ['Kamola Saidova', 3, 'REVIEWED', 'medium', 'cold', 2],
    ['Ravshan Kalandarov', 0, 'REVIEWED', 'medium', 'demo', 1],
    ['Shahnoza Ergasheva', 1, 'NOT_REVIEWED', 'high', 'cold', 1],
    ['Mirzo Hasanov', 2, 'REVIEWED', 'high', 'closing', 3],
    ['Gulsanam Tojiboyeva', 3, 'REVIEWED', 'low', 'cold', 1],
    ['Nodir Rahimov', 0, 'AI_READY', 'medium', 'cold', 2],
    ['Barno Qosimova', 1, 'REVIEWED', 'medium', 'demo', 1],
    ['Sherzod Nazarov', 4, 'REVIEWED', 'high', 'cold', 2],
    ['Xurmo Tosheva', 2, 'AI_READY', 'medium', 'demo', 1],
    ['Bekzod Mirzaev', 0, 'REVIEWED', 'high', 'closing', 2],
    ['Lobar Yusupova', 1, 'REVIEWED', 'medium', 'cold', 2],
    ['Sanjar Holiqov', 3, 'NOT_REVIEWED', 'low', 'cold', 1],
    ['Maftuna Sotvoldiyeva', 4, 'REVIEWED', 'high', 'demo', 3],
    ['Husan Qurbonov', 2, 'REVIEWED', 'medium', 'closing', 1],
    ['Aziza Mamatova', 0, 'AI_READY', 'high', 'cold', 2],
    ['Islom Rashidov', 1, 'REVIEWED', 'low', 'cold', 1],
    ['Dildora Xasanova', 4, 'REVIEWED', 'high', 'demo', 2],
    ['Utkir Razzaqov', 2, 'REVIEWED', 'medium', 'cold', 1],
    ['Nozima Sultonova', 3, 'NOT_REVIEWED', 'medium', 'cold', 1],
    ['Abdulaziz Karimov', 0, 'REVIEWED', 'high', 'closing', 3],
    ['Ziyoda Ibragimova', 1, 'REVIEWED', 'medium', 'demo', 2],
    ['Davron Xoliqov', 4, 'AI_READY', 'high', 'cold', 1],
    ['Munira Eshmatova', 2, 'REVIEWED', 'low', 'cold', 1],
    ['Javlon Tursunov', 0, 'REVIEWED', 'medium', 'demo', 2],
    ['Gulnora Raxmatullayeva', 3, 'REVIEWED', 'high', 'closing', 2],
    ['Muazzam Xudoyberdiyeva', 1, 'NOT_REVIEWED', 'medium', 'cold', 1],
    ['Shamsiddin Nazarov', 4, 'REVIEWED', 'high', 'demo', 3],
    ['Malika Toshmatova', 2, 'REVIEWED', 'medium', 'cold', 2],
    ['Bahodir Qosimov', 0, 'REVIEWED', 'low', 'closing', 1],
    ['Kamola Yusupova', 1, 'AI_READY', 'medium', 'cold', 2],
    ['Farhodjon Mirzayev', 3, 'REVIEWED', 'high', 'demo', 2],
    ['Sabohat Sobirova', 4, 'REVIEWED', 'medium', 'cold', 1],
    ['Eldor Rajabov', 2, 'NOT_REVIEWED', 'low', 'cold', 1],
    ['Nargiza Hamidova', 0, 'REVIEWED', 'high', 'demo', 2],
    ['Tulkin Ergashev', 1, 'REVIEWED', 'medium', 'closing', 2],
    ['Yulduz Normatova', 3, 'AI_READY', 'high', 'cold', 1],
    ['Mansur Qodirov', 4, 'REVIEWED', 'high', 'demo', 3],
    ['Dilnoza Tursunova', 2, 'REVIEWED', 'low', 'cold', 1],
    ['Bobur Xoliqov', 0, 'REVIEWED', 'medium', 'cold', 2],
    ['Sitora Yusupova', 1, 'REVIEWED', 'high', 'closing', 2],
    ['Jasur Valiyev', 4, 'NOT_REVIEWED', 'medium', 'cold', 1],
    ['Nafisa Nabiyeva', 3, 'REVIEWED', 'high', 'demo', 3],
    ['Elmurod Pulatov', 2, 'REVIEWED', 'medium', 'cold', 1],
    ['Xilola Hamroyeva', 0, 'AI_READY', 'high', 'cold', 2],
    ['Shohruh Toshqoʻziyev', 1, 'REVIEWED', 'medium', 'demo', 2],
    ['Gulbahor Raximova', 4, 'REVIEWED', 'high', 'closing', 2],
    ['Mirzohid Qoraboyev', 2, 'NOT_REVIEWED', 'low', 'cold', 1],
    ['Sarvar Nazarov', 0, 'REVIEWED', 'medium', 'demo', 1],
    ['Xurshida Umarova', 3, 'REVIEWED', 'high', 'cold', 3],
    ['Dilshod Yusupov', 1, 'AI_READY', 'medium', 'closing', 1],
    ['Fotima Ochilov', 4, 'REVIEWED', 'high', 'demo', 2],
    ['Anvar Raximov', 2, 'REVIEWED', 'medium', 'cold', 2],
    ['Mukaddas Salimova', 0, 'NOT_REVIEWED', 'low', 'cold', 1],
    ['Baxtiyor Toshqoʻziyev', 3, 'REVIEWED', 'high', 'closing', 3],
    ['Nozimaxon Jurayeva', 1, 'REVIEWED', 'medium', 'demo', 2],
    ['Otabek Ismoilov', 4, 'REVIEWED', 'low', 'cold', 1],
    ['Sevinch Qoraboyeva', 2, 'AI_READY', 'high', 'cold', 2],
    ['Hamidjon Toshmatov', 0, 'REVIEWED', 'high', 'demo', 3],
    ['Mohinur Yusupova', 1, 'REVIEWED', 'medium', 'closing', 1],
    ['Ibrohim Nazarov', 3, 'REVIEWED', 'medium', 'cold', 2],
    ['Zilola Raxmatova', 4, 'NOT_REVIEWED', 'low', 'cold', 1],
    ['Nurillo Qodirov', 2, 'REVIEWED', 'high', 'demo', 2],
    ['Madinabonu Sotvoldiyeva', 0, 'REVIEWED', 'medium', 'cold', 1],
    ['Behzod Islomov', 1, 'AI_READY', 'high', 'cold', 2],
  ] as const

  type ChecklistType = 'cold' | 'demo' | 'closing'

  let totalRecordings = 0
  let totalReviews = 0

  for (let i = 0; i < leadDefs.length; i++) {
    const [name, repIdx, statusStr, tier, clType, recCount] = leadDefs[i]
    const rep = reps[repIdx as number]
    const status = statusStr === 'REVIEWED' ? LeadStatus.REVIEWED
      : statusStr === 'AI_READY' ? LeadStatus.AI_READY
      : LeadStatus.NOT_REVIEWED

    const lead = await prisma.lead.create({
      data: {
        name: name as string,
        phone: randomPhone(),
        repId: rep.id,
        status,
      },
    })

    const checklist = clType === 'cold' ? coldCallChecklist : clType === 'demo' ? demoCallChecklist : closingChecklist
    const items = clType === 'cold' ? ccItems : clType === 'demo' ? demoItems : closingItems
    const passR = clType === 'cold' ? ccPassR : clType === 'demo' ? demoPassR : closingPassR
    const failR = clType === 'cold' ? ccFailR : clType === 'demo' ? demoFailR : closingFailR
    const unclearR = clType === 'cold' ? ccUnclearR : clType === 'demo' ? demoUnclearR : closingUnclearR

    const transcriptPool = clType === 'cold' ? transcriptPools.coldCall
      : clType === 'demo' ? transcriptPools.demo
      : transcriptPools.closing

    // Create recordings
    for (let r = 0; r < (recCount as number); r++) {
      const daysAgoMax = 60 - r * 10
      const callDate = randomDate(daysAgoMax)
      const duration = randomDuration()

      const recording = await prisma.callRecording.create({
        data: {
          leadId: lead.id,
          audioUrl: AUDIO_URL,
          audioPeaks: generatePeaks(`${name}-${r}`),
          duration,
          callDate,
          order: r + 1,
        },
      })
      totalRecordings++

      // Transcript for reviewed/ai_ready leads, or first recording of any lead
      const needsTranscript = status !== LeadStatus.NOT_REVIEWED || r === 0
      if (needsTranscript && status !== LeadStatus.NOT_REVIEWED) {
        const tFn = transcriptPool[(i + r) % transcriptPool.length]
        const lines = (tFn as Function)(rep.name.split(' ')[0], (name as string).split(' ')[0])
        await prisma.transcript.create({
          data: {
            recordingId: recording.id,
            language: r % 2 === 0 ? 'uz' : 'ru',
            detectedLanguages: ['uz', 'ru'],
            lines,
          },
        })
      }

      // Reviews: REVIEWED leads get review on all recordings; AI_READY on first only; NOT_REVIEWED none
      const needsReview = status === LeadStatus.REVIEWED
        || (status === LeadStatus.AI_READY && r === 0)
      if (needsReview) {
        const scoreSeed = nameHash(name as string) + i * 100 + r * 13
        const verdicts = buildVerdicts(items, passR, failR, unclearR, tier as 'high' | 'medium' | 'low', scoreSeed)
        const score = calcScore(verdicts, items)
        const isLocked = status === LeadStatus.REVIEWED
        const summaryByType: Record<ChecklistType, string> = {
          cold: `${rep.name.split(' ')[0]} bu qo'ng'iroqda ${tier === 'high' ? "a'lo" : tier === 'medium' ? 'o\'rtacha' : 'past'} natija ko\'rsatdi. ${tier === 'high' ? "Mijoz bilan yaxshi aloqa o'rnatildi va keyingi qadam kelishildi." : tier === 'medium' ? "Ba'zi mezonlar to'liq bajarilmadi, takomillashtirish kerak." : "Asosiy mezonlar bajarilmadi, qayta o'qitish tavsiya etiladi."}`,
          demo: `Demo qo'ng'iroq ${tier === 'high' ? 'muvaffaqiyatli' : tier === 'medium' ? "o'rtacha darajada" : 'zaif darajada'} o'tkazildi. ${tier === 'high' ? "Mijozning muammosi chuqur tushunildi va yechim aniq taqdim etildi." : tier === 'medium' ? "Asosiy fikrlar yetkazildi, lekin ba'zi imkoniyatlar o'tkazib yuborildi." : "Demo generik bo'lib qoldi, mijozga moslashtirish kerak edi."}`,
          closing: `Yopish qo'ng'iroqi ${tier === 'high' ? "muvaffaqiyatli yakunlandi" : tier === 'medium' ? "qisman muvaffaqiyatli bo'ldi" : "maqsadga yetmadi"}. ${tier === 'high' ? "Barcha e'tirozlar hal qilindi va shartnoma imzolandi." : tier === 'medium' ? "Ba'zi to'siqlar qoldi, keyingi qadam kelishildi." : "Asosiy to'siqlar hal qilinmadi."}`,
        }
        await prisma.review.create({
          data: {
            recordingId: recording.id,
            checklistId: checklist.id,
            verdicts,
            score,
            isLocked,
            summary: summaryByType[clType as ChecklistType],
          },
        })
        totalReviews++
      }
    }
  }

  // Settings
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, aiProvider: 'gemini', aiModel: 'gemini-1.5-pro', scorePassThreshold: 70 },
  })

  console.log(`Created ${leadDefs.length} leads, ${totalRecordings} recordings, ${totalReviews} reviews`)
  console.log('Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await pool.end() })
