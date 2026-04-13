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
  return Math.floor(150 + Math.random() * 300)
}

function randomDate(daysAgo: number): Date {
  return new Date(Date.now() - Math.floor(Math.random() * daysAgo * 86400000))
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
  await prisma.lead.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.checklist.deleteMany()
  await prisma.salesRep.deleteMany()
  await prisma.settings.deleteMany()

  const [bobur, sarvinoz, dilshod, malika] = await Promise.all([
    prisma.salesRep.create({ data: { name: 'Bobur Karimov', email: 'bobur@sotai.uz' } }),
    prisma.salesRep.create({ data: { name: 'Sarvinoz Yusupova', email: 'sarvinoz@sotai.uz' } }),
    prisma.salesRep.create({ data: { name: 'Dilshod Nazarov', email: 'dilshod@sotai.uz' } }),
    prisma.salesRep.create({ data: { name: 'Malika Ergasheva', email: 'malika@sotai.uz' } }),
  ])
  console.log('Created 4 sales reps')

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

  function buildColdCallVerdicts(targetScore: 'high' | 'medium' | 'low'): VerdictRecord {
    const verdicts: VerdictRecord = {}
    const passR = ["Salomlashdi va kompaniya nomini aniq aytdi","Qo'ng'iroq sababini aniq tushuntirdi","Mijozning ehtiyojini to'liq aniqladi","Mahsulot haqida qisqa va aniq taqdimot qildi","Возражение клиента было успешно обработано","Narxni va taklifni aniq bildirdi","Keyingi qadamni aniq kelishib oldi","Чётко обозначил следующий шаг","Muloqot davomiyligi maqbul doirada bo'ldi","Xayrlashdi va minnatdorchilik bildirdi"]
    const failR = ["Salomlashmadi, to'g'ridan-to'g'ri taklifga o'tib ketdi","Qo'ng'iroq sababini tushuntirmadi","Mijozning ehtiyojini aniqlamadi","Mahsulot taqdimoti o'tkazilmadi","E'tiroz e'tiborga olinmadi","Narx haqida gapirmadi","Keyingi qadam kelishilmadi, qo'ng'iroq yakunlanib qoldi","Следующий шаг не был согласован","Qo'ng'iroq juda qisqa yoki juda uzun bo'ldi","Xayrlashuvda professionallik etishmadi"]
    const unclearR = ["Qisman bajarildi, lekin to'liq emas","Частично выполнено, требует уточнения","Narx haqida gaplashildi, lekin aniq kelishuv bo'lmadi"]
    for (let i = 0; i < ccItems.length; i++) {
      let verdict: string
      if (targetScore === 'high') verdict = i < 8 ? 'pass' : (i === 8 ? 'unclear' : 'fail')
      else if (targetScore === 'medium') verdict = i % 3 === 0 ? 'fail' : (i % 3 === 1 ? 'pass' : 'unclear')
      else verdict = i < 3 ? 'pass' : (i < 5 ? 'unclear' : 'fail')
      const reasoning = verdict === 'pass' ? passR[i] : verdict === 'fail' ? failR[i] : unclearR[i % 3]
      verdicts[ccItems[i].id] = { verdict, reasoning, manualOverride: false }
    }
    return verdicts
  }

  function buildDemoVerdicts(targetScore: 'high' | 'medium' | 'low'): VerdictRecord {
    const verdicts: VerdictRecord = {}
    const passR = ['Introduction was clear and agenda was set','Customer pain points were confirmed before starting the demo',"Demo was fully customized to their industry use case",'All key features were demonstrated effectively','ROI and business value were clearly communicated','Competitor comparison was handled professionally','All technical questions were answered satisfactorily','Integration capabilities were discussed in detail','A pilot trial was offered with clear next steps','Budget range was discussed openly','Decision maker was identified and involved','Follow-up meeting was scheduled before call ended']
    const failR = ['No introduction or agenda was set at the start','Pain points were not confirmed prior to demo','Demo was generic, not tailored to customer','Key features were skipped or rushed','No ROI or business value was mentioned','Competitor questions were avoided','Technical questions were left unanswered','Integration was not discussed','No next step or trial was offered','Pricing was not mentioned at all','Decision maker was not identified','No follow-up was scheduled']
    const unclearR = ['Частично выполнено, требует уточнения',"Qisman bajarildi, lekin to'liq emas",'Mentioned briefly but not explored in depth']
    for (let i = 0; i < demoItems.length; i++) {
      let verdict: string
      if (targetScore === 'high') verdict = i < 10 ? 'pass' : (i === 10 ? 'unclear' : 'fail')
      else if (targetScore === 'medium') verdict = i % 4 === 3 ? 'fail' : (i % 4 === 2 ? 'unclear' : 'pass')
      else verdict = i < 4 ? 'pass' : (i < 6 ? 'unclear' : 'fail')
      const reasoning = verdict === 'pass' ? passR[i] : verdict === 'fail' ? failR[i] : unclearR[i % 3]
      verdicts[demoItems[i].id] = { verdict, reasoning, manualOverride: false }
    }
    return verdicts
  }

  function buildClosingVerdicts(targetScore: 'high' | 'medium' | 'low'): VerdictRecord {
    const verdicts: VerdictRecord = {}
    const passR = ['Oldingi muloqot qisqacha takrorlandi',"Qaror qabul qilishga to'siqlar aniqlandi va muhokama qilindi","Yakuniy e'tirozlar muvaffaqiyatli hal qilindi",'Shartnoma mijozga yuborildi','Muddatni eslatib, shoshilinchlik yaratildi','Qaror muddati kelishildi',"To'lov shartlari muhokama qilindi",'Majburiyat olindi va imzo bosqichi kelishildi']
    const failR = ['Oldingi muloqot takrorlanmadi',"Qaror qabul qilishga to'siqlar aniqlanmadi","Yakuniy e'tirozlar hal qilinmadi",'Shartnoma yuborilmadi','Shoshilinchlik yaratilmadi','Qaror muddati kelishilmadi',"To'lov shartlari muhokama qilinmadi",'Majburiyat yoki imzo olinmadi']
    const unclearR = ["Qisman bajarildi, lekin to'liq emas",'Частично выполнено, требует уточнения','Briefly touched but not resolved']
    for (let i = 0; i < closingItems.length; i++) {
      let verdict: string
      if (targetScore === 'high') verdict = i < 6 ? 'pass' : (i === 6 ? 'unclear' : 'pass')
      else if (targetScore === 'medium') verdict = i % 3 === 0 ? 'pass' : (i % 3 === 1 ? 'fail' : 'unclear')
      else verdict = i < 2 ? 'pass' : (i < 4 ? 'unclear' : 'fail')
      const reasoning = verdict === 'pass' ? passR[i] : verdict === 'fail' ? failR[i] : unclearR[i % 3]
      verdicts[closingItems[i].id] = { verdict, reasoning, manualOverride: false }
    }
    return verdicts
  }

  const AUDIO_URL = '/demo-call.wav'

  // LEAD 1: Jasur Toshmatov, Bobur, REVIEWED, Cold Call ~87%
  const lead1 = await prisma.lead.create({ data: { name: 'Jasur Toshmatov', phone: randomPhone(), repId: bobur.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Jasur Toshmatov') } })
  await prisma.transcript.create({ data: { leadId: lead1.id, language: 'uz', detectedLanguages: ['uz'], lines: [{ timestamp: 2, speaker: 'Bobur', speakerRole: 'rep', text: "Assalomu alaykum, Jasur aka! Men SotAI kompaniyasidan Bobur. Bir daqiqangiz bormi?" },{ timestamp: 9, speaker: 'Jasur', speakerRole: 'lead', text: "Ha, salom. Kimdan deysiz?" },{ timestamp: 13, speaker: 'Bobur', speakerRole: 'rep', text: "SotAI — savdo qo'ng'iroqlari sifatini avtomatik baholash platformasi. Sizning jamoangizda nechi menejer ishlaydi?" },{ timestamp: 24, speaker: 'Jasur', speakerRole: 'lead', text: "Bizda 12 ta savdo menejeri bor. Lekin nazorat qilishda qiyinchilik bor." },{ timestamp: 31, speaker: 'Bobur', speakerRole: 'rep', text: "Aynan shu muammoni yechamiz. Har bir qo'ng'iroq avtomatik transkripsiya va AI baholovi bilan ishlaydi." },{ timestamp: 44, speaker: 'Jasur', speakerRole: 'lead', text: "Qiziq. Narxi qancha?" },{ timestamp: 48, speaker: 'Bobur', speakerRole: 'rep', text: "Menejer boshiga oyiga $30 dan. 12 nafar uchun to'liq demo ko'rsata olamiz — bu haftada qulaymi?" },{ timestamp: 61, speaker: 'Jasur', speakerRole: 'lead', text: "Xo'p, juma kuni soat 3 da bo'lsin." },{ timestamp: 68, speaker: 'Bobur', speakerRole: 'rep', text: "Zo'r! Emailingizni yuboring, taklif xatini yuboraman. Ko'rishguncha!" },{ timestamp: 75, speaker: 'Jasur', speakerRole: 'lead', text: "Yaxshi, kutaman." }] } })
  const v1 = buildColdCallVerdicts('high')
  await prisma.review.create({ data: { leadId: lead1.id, checklistId: coldCallChecklist.id, verdicts: v1, score: calcScore(v1, ccItems), isLocked: true, summary: "Bobur aka bu qo'ng'iroqda yuqori professional daraja ko'rsatdi. Mijozning muammosini aniqladi va to'g'ri yechim taklif qildi. Keyingi qadam — demo — aniq kelishildi. Umumiy natija a'lo." } })

  // LEAD 2: Nilufar Rashidova, Sarvinoz, REVIEWED, Cold Call ~72%
  const lead2 = await prisma.lead.create({ data: { name: 'Nilufar Rashidova', phone: randomPhone(), repId: sarvinoz.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Nilufar Rashidova') } })
  await prisma.transcript.create({ data: { leadId: lead2.id, language: 'ru', detectedLanguages: ['ru', 'uz'], lines: [{ timestamp: 1, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Здравствуйте, Нилуфар ханум! Это Сарвиноз из SotAI компании." },{ timestamp: 8, speaker: 'Nilufar', speakerRole: 'lead', text: "Salom, eshityapman." },{ timestamp: 11, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Qo'ng'iroq sifati nazorati bo'yicha yangi yechimimiz haqida gaplashmoqchi edim." },{ timestamp: 20, speaker: 'Nilufar', speakerRole: 'lead', text: "Ну давайте, только быстро пожалуйста." },{ timestamp: 24, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Albatta! Bizning platforma har bir savdo qo'ng'iroqni avtomatik tahlil qiladi va menejerlarga baho beradi." },{ timestamp: 36, speaker: 'Nilufar', speakerRole: 'lead', text: "А с CRM системами интегрируется?" },{ timestamp: 41, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Ha, Bitrix24 va boshqa CRM lar bilan. Demo ko'rsatishimiz mumkin." },{ timestamp: 52, speaker: 'Nilufar', speakerRole: 'lead', text: "Хорошо, пришлите материалы на почту." },{ timestamp: 58, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Albatta, hoziroq yuboraman. Emailingiz qaysi?" },{ timestamp: 64, speaker: 'Nilufar', speakerRole: 'lead', text: "nilufar@example.com" },{ timestamp: 68, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Rahmat! Yaqin orada siz bilan bog'lanaman. Xo'p bo'lsin." }] } })
  const v2 = buildColdCallVerdicts('medium')
  await prisma.review.create({ data: { leadId: lead2.id, checklistId: coldCallChecklist.id, verdicts: v2, score: calcScore(v2, ccItems), isLocked: true, summary: "Sarvinoz qo'ng'iroqni o'rtacha darajada o'tkazdi. Salomlashuv va taqdimot yaxshi bo'ldi, lekin mijozning ehtiyoji to'liq aniqlanmadi. Keyingi qadam noaniq qoldi." } })

  // LEAD 3: Alisher Xolmatov, Dilshod, REVIEWED, Cold Call ~45%
  const lead3 = await prisma.lead.create({ data: { name: 'Alisher Xolmatov', phone: randomPhone(), repId: dilshod.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Alisher Xolmatov') } })
  await prisma.transcript.create({ data: { leadId: lead3.id, language: 'uz', detectedLanguages: ['uz'], lines: [{ timestamp: 3, speaker: 'Dilshod', speakerRole: 'rep', text: "Allo, bu SotAI. Bizning yangi mahsulotimiz haqida gaplashamizmi?" },{ timestamp: 10, speaker: 'Alisher', speakerRole: 'lead', text: "Salom. Qanaqa mahsulot bu?" },{ timestamp: 14, speaker: 'Dilshod', speakerRole: 'rep', text: "Savdo qo'ng'iroqlarini kuzatish uchun platforma." },{ timestamp: 21, speaker: 'Alisher', speakerRole: 'lead', text: "Bizga bunday narsa kerak emas aslida." },{ timestamp: 26, speaker: 'Dilshod', speakerRole: 'rep', text: "Lekin bu juda foydali. Oyiga atigi $30." },{ timestamp: 33, speaker: 'Alisher', speakerRole: 'lead', text: "Boshqa kompaniyalar bilan ishlayapmiz." },{ timestamp: 38, speaker: 'Dilshod', speakerRole: 'rep', text: "Ok, rahmat." },{ timestamp: 42, speaker: 'Alisher', speakerRole: 'lead', text: "Xo'p." }] } })
  const v3 = buildColdCallVerdicts('low')
  await prisma.review.create({ data: { leadId: lead3.id, checklistId: coldCallChecklist.id, verdicts: v3, score: calcScore(v3, ccItems), isLocked: true, summary: "Dilshod bu qo'ng'iroqda bir qancha muhim xatolarga yo'l qo'ydi. Mijozning ehtiyoji aniqlanmadi, e'tirozlar boshqarilmadi va keyingi qadam kelishilmadi. Jiddiy yaxshilash zarur." } })

  // LEAD 4: Mohira Qodirov, Malika, REVIEWED, Product Demo ~91%
  const lead4 = await prisma.lead.create({ data: { name: 'Mohira Qodirov', phone: randomPhone(), repId: malika.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Mohira Qodirov') } })
  await prisma.transcript.create({ data: { leadId: lead4.id, language: 'uz', detectedLanguages: ['uz', 'ru'], lines: [{ timestamp: 2, speaker: 'Malika', speakerRole: 'rep', text: "Assalomu alaykum, Mohira xonim! Bu demo qo'ng'iroqimizga vaqt ajratganingiz uchun katta rahmat." },{ timestamp: 10, speaker: 'Mohira', speakerRole: 'lead', text: "Marhamat. Boshlayvering." },{ timestamp: 14, speaker: 'Malika', speakerRole: 'rep', text: "Avval sizning jamoangizda qanday muammolar borligini bilib olsam. Menejerlar sifatini qanday nazorat qilasiz hozir?" },{ timestamp: 25, speaker: 'Mohira', speakerRole: 'lead', text: "Hozir qo'ng'iroqlarni qo'lda tinglashimiz kerak. Juda ko'p vaqt ketadi." },{ timestamp: 33, speaker: 'Malika', speakerRole: 'rep', text: "Aynan. Bizning SotAI platformasi bu jarayonni to'liq avtomatlashtiradigan. Ruxsat bersangiz, ekranni ulashaman." },{ timestamp: 44, speaker: 'Mohira', speakerRole: 'lead', text: "Ha, ko'rsating." },{ timestamp: 48, speaker: 'Malika', speakerRole: 'rep', text: "Mana bu — asosiy dashboard. Har bir qo'ng'iroq transkripsiya qilinadi, AI baho beradi." },{ timestamp: 65, speaker: 'Mohira', speakerRole: 'lead', text: "Bu juda qulay. Bizning Bitrix24 bilan integratsiya bo'ladimi?" },{ timestamp: 71, speaker: 'Malika', speakerRole: 'rep', text: "Ha, to'liq integratsiya qilingan. Leads avtomatik import bo'ladi." },{ timestamp: 82, speaker: 'Mohira', speakerRole: 'lead', text: "Narxi qancha?" },{ timestamp: 86, speaker: 'Malika', speakerRole: 'rep', text: "15 menejer uchun oyiga $450. Birinchi oy bepul sinab ko'rishingiz mumkin." },{ timestamp: 98, speaker: 'Mohira', speakerRole: 'lead', text: "Juda yaxshi. Rahbariyat bilan gaplashib, sizga javob beraman." },{ timestamp: 106, speaker: 'Malika', speakerRole: 'rep', text: "Albatta! Kelasi seshanba kuni qo'ng'iroq qilsam qulaymi?" },{ timestamp: 112, speaker: 'Mohira', speakerRole: 'lead', text: "Ha, seshanba soat 11 da bo'lsa yaxshi." },{ timestamp: 116, speaker: 'Malika', speakerRole: 'rep', text: "Ajoyib! Taklif materiallarini ham emailingizga yuboraman. Rahmat, xayr!" }] } })
  const v4 = buildDemoVerdicts('high')
  await prisma.review.create({ data: { leadId: lead4.id, checklistId: demoCallChecklist.id, verdicts: v4, score: calcScore(v4, demoItems), isLocked: true, summary: "Malika ushbu demo qo'ng'iroqni a'lo darajada o'tkazdi. Mijozning muammosi avval aniqlandi, demo shaxsiylashtirildi va barcha savollarga javob berildi. Keyingi qo'ng'iroq va trial taklifi qilinganidan so'ng mijoz ijobiy munosabat bildirdi." } })

  // LEAD 5: Sanjar Mirzayev, Bobur, AI_READY, Product Demo ~68%
  const lead5 = await prisma.lead.create({ data: { name: 'Sanjar Mirzayev', phone: randomPhone(), repId: bobur.id, callDate: randomDate(20), callDuration: randomDuration(), status: LeadStatus.AI_READY, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Sanjar Mirzayev') } })
  await prisma.transcript.create({ data: { leadId: lead5.id, language: 'uz', detectedLanguages: ['uz', 'ru'], lines: [{ timestamp: 2, speaker: 'Bobur', speakerRole: 'rep', text: "Assalomu alaykum, Sanjar aka. Demo boshlasak bo'ladimi?" },{ timestamp: 8, speaker: 'Sanjar', speakerRole: 'lead', text: "Ha, boshlayvering." },{ timestamp: 12, speaker: 'Bobur', speakerRole: 'rep', text: "Mana SotAI platformamiz. Qo'ng'iroqlarni avtomatik tahlil qiladi." },{ timestamp: 24, speaker: 'Sanjar', speakerRole: 'lead', text: "Bizda qancha menejer uchun mo'ljallangan?" },{ timestamp: 28, speaker: 'Bobur', speakerRole: 'rep', text: "Istalgan sondagi menejerlar uchun. Narxi ham moslashuvchan." },{ timestamp: 38, speaker: 'Sanjar', speakerRole: 'lead', text: "Конкуренты какие есть?" },{ timestamp: 43, speaker: 'Bobur', speakerRole: 'rep', text: "Gong, Chorus kabi yirik xorijiy kompaniyalar bor, lekin biz O'zbekiston bozoriga moslashtirilganmiz." },{ timestamp: 55, speaker: 'Sanjar', speakerRole: 'lead', text: "Narxi qancha?" },{ timestamp: 59, speaker: 'Bobur', speakerRole: 'rep', text: "Menejer boshiga $30 dan boshlanadi." },{ timestamp: 66, speaker: 'Sanjar', speakerRole: 'lead', text: "Hmm, ko'rib chiqaman." },{ timestamp: 70, speaker: 'Bobur', speakerRole: 'rep', text: "Xo'p, materiallar yuboray, keyin gaplashamiz." }] } })
  const v5 = buildDemoVerdicts('medium')
  await prisma.review.create({ data: { leadId: lead5.id, checklistId: demoCallChecklist.id, verdicts: v5, score: calcScore(v5, demoItems), isLocked: false, summary: "AI tahlili: Demo qo'ng'iroqda bir qancha zaif tomonlar aniqlandi. Mijozning og'riq nuqtasi avvaldan aniqlanmadi. Shaxsiylashtirilgan demo o'tkazilmadi. Keyingi qadam kelishilmadi." } })

  // LEAD 6: Zulfiya Abdullayeva, Sarvinoz, REVIEWED, Closing Call ~55%
  const lead6 = await prisma.lead.create({ data: { name: 'Zulfiya Abdullayeva', phone: randomPhone(), repId: sarvinoz.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Zulfiya Abdullayeva') } })
  await prisma.transcript.create({ data: { leadId: lead6.id, language: 'ru', detectedLanguages: ['ru', 'uz'], lines: [{ timestamp: 2, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Здравствуйте, Зулфия ханум! Это Сарвиноз. Я звоню чтобы обсудить наше предложение." },{ timestamp: 12, speaker: 'Zulfiya', speakerRole: 'lead', text: "Salom. Ha, kutayotgan edim." },{ timestamp: 16, speaker: 'Sarvinoz', speakerRole: 'rep', text: "O'tgan safar demo qo'ng'iroqimizdan keyin qanday fikrlar paydo bo'ldi?" },{ timestamp: 24, speaker: 'Zulfiya', speakerRole: 'lead', text: "Narxi biroz qimmat tuyildi menga. Budget muammolari bor." },{ timestamp: 32, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Tushundim. Sizga maxsus chegirmali taklif qilishim mumkin — 3 oylik kontraktda 20% chegirma." },{ timestamp: 45, speaker: 'Zulfiya', speakerRole: 'lead', text: "Hmm, bu yaxshilanadi. Lekin rahbarlik ruxsat berishi kerak." },{ timestamp: 52, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Albatta. Rahbariyatingizga qachon murojaat qilishingiz mumkin?" },{ timestamp: 60, speaker: 'Zulfiya', speakerRole: 'lead', text: "Bu haftada gaplashaman." },{ timestamp: 65, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Yaxshi, keyingi dushanba qo'ng'iroq qilsam qulaymi?" },{ timestamp: 71, speaker: 'Zulfiya', speakerRole: 'lead', text: "Ha, bo'ladi." }] } })
  const v6 = buildClosingVerdicts('medium')
  await prisma.review.create({ data: { leadId: lead6.id, checklistId: closingChecklist.id, verdicts: v6, score: calcScore(v6, closingItems), isLocked: true, summary: "Sarvinoz bu yopish qo'ng'iroqida o'rta natija ko'rsatdi. Narx bo'yicha e'tiroz qisman hal qilindi va chegirma taklif qilindi. Ammo shartnoma yuborilmadi va qaror muddati aniq belgilanmadi." } })

  // LEAD 7: Ulugbek Ismoilov, Dilshod, REVIEWED, Cold Call ~83%
  const lead7 = await prisma.lead.create({ data: { name: 'Ulugbek Ismoilov', phone: randomPhone(), repId: dilshod.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Ulugbek Ismoilov') } })
  await prisma.transcript.create({ data: { leadId: lead7.id, language: 'uz', detectedLanguages: ['uz'], lines: [{ timestamp: 2, speaker: 'Dilshod', speakerRole: 'rep', text: "Assalomu alaykum, Ulugbek aka! Men Dilshod, SotAI kompaniyasidan. Bir daqiqa vaqtingiz bormi?" },{ timestamp: 10, speaker: 'Ulugbek', speakerRole: 'lead', text: "Ha, bor. Nima haqida?" },{ timestamp: 14, speaker: 'Dilshod', speakerRole: 'rep', text: "Savdo jamoangiz uchun qo'ng'iroq sifatini avtomatik baholash yechimi haqida." },{ timestamp: 25, speaker: 'Ulugbek', speakerRole: 'lead', text: "Supervisor tomonidan qo'lda nazorat qilinadi. Juda qiyin." },{ timestamp: 31, speaker: 'Dilshod', speakerRole: 'rep', text: "Biz shu jarayonni avtomatlashtiramiz. Har bir qo'ng'iroq AI orqali baholanadi." },{ timestamp: 43, speaker: 'Ulugbek', speakerRole: 'lead', text: "Qiziq. Faqat menga boshqa yechimlarga qaraganda qimmat bo'lmasin." },{ timestamp: 50, speaker: 'Dilshod', speakerRole: 'rep', text: "Narxi menejer boshiga $30 dan — bu bozordagi eng arzonlaridan biri. Bepul demo ko'rishingiz mumkin." },{ timestamp: 62, speaker: 'Ulugbek', speakerRole: 'lead', text: "Demo ko'rsamiz bo'ladi. Keyingi hafta?" },{ timestamp: 67, speaker: 'Dilshod', speakerRole: 'rep', text: "Albatta! Dushanba yoki seshanba qaysi qulay?" },{ timestamp: 72, speaker: 'Ulugbek', speakerRole: 'lead', text: "Dushanba soat 10 da bo'lsa yaxshi." },{ timestamp: 76, speaker: 'Dilshod', speakerRole: 'rep', text: "Ajoyib! Emailingizni bering, taklif va kalendar yuboraman. Rahmat!" },{ timestamp: 83, speaker: 'Ulugbek', speakerRole: 'lead', text: "ulugbek@tashkentholding.uz. Kutaman." }] } })
  const v7 = buildColdCallVerdicts('high')
  await prisma.review.create({ data: { leadId: lead7.id, checklistId: coldCallChecklist.id, verdicts: v7, score: calcScore(v7, ccItems), isLocked: true, summary: "Dilshod ushbu qo'ng'iroqda yaxshi natija ko'rsatdi. Mijozning muammosi aniqlanib, tegishli yechim taklif qilindi. Narx e'tirozi muvaffaqiyatli hal qilindi. Demo kelishildi." } })

  // LEAD 8: Feruza Nazarova, Malika, AI_READY, Cold Call ~79%
  const lead8 = await prisma.lead.create({ data: { name: 'Feruza Nazarova', phone: randomPhone(), repId: malika.id, callDate: randomDate(15), callDuration: randomDuration(), status: LeadStatus.AI_READY, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Feruza Nazarova') } })
  await prisma.transcript.create({ data: { leadId: lead8.id, language: 'uz', detectedLanguages: ['uz', 'ru'], lines: [{ timestamp: 1, speaker: 'Malika', speakerRole: 'rep', text: "Assalomu alaykum, Feruza xonim! Bu Malika, SotAI dan. Qo'ng'iroq sifatini yaxshilash bo'yicha gaplashaymi?" },{ timestamp: 9, speaker: 'Feruza', speakerRole: 'lead', text: "Salom. Ha, eshityapman." },{ timestamp: 13, speaker: 'Malika', speakerRole: 'rep', text: "Jamoangizda savdo menejerlari bormi? Ularning qo'ng'iroq sifatini kuzatasizmi?" },{ timestamp: 22, speaker: 'Feruza', speakerRole: 'lead', text: "Ha, 8 nafar menejerimiz bor. Nazorat qilish qiyin." },{ timestamp: 28, speaker: 'Malika', speakerRole: 'rep', text: "SotAI orqali har bir qo'ng'iroq avtomatik transkripsiya va AI tomonidan baholanadi. Vaqtingizni 10 barobar tejaysiz." },{ timestamp: 40, speaker: 'Feruza', speakerRole: 'lead', text: "Bu qiziq. Boshqa CRM bilan ishlaydi?" },{ timestamp: 45, speaker: 'Malika', speakerRole: 'rep', text: "Ha, Bitrix24, AmoCRM va boshqalar bilan integratsiya bor." },{ timestamp: 55, speaker: 'Feruza', speakerRole: 'lead', text: "Narxi?" },{ timestamp: 59, speaker: 'Malika', speakerRole: 'rep', text: "8 menejer uchun oyiga $240. Demo bepul." },{ timestamp: 68, speaker: 'Feruza', speakerRole: 'lead', text: "Mayli, demo ko'rsating. Ertaga bo'lsa yaxshi edi." },{ timestamp: 73, speaker: 'Malika', speakerRole: 'rep', text: "Ertaga soat 14 da bo'ladimi? Link yuboraman." },{ timestamp: 78, speaker: 'Feruza', speakerRole: 'lead', text: "Xo'p, yaxshi." }] } })
  const v8 = buildColdCallVerdicts('high')
  await prisma.review.create({ data: { leadId: lead8.id, checklistId: coldCallChecklist.id, verdicts: v8, score: calcScore(v8, ccItems), isLocked: false, summary: "AI tahlili: Malika qo'ng'iroqni yaxshi o'tkazdi. Mijozning muammosi aniqlandi, yechim taqdim etildi va narx aytildi. Demo kelishildi." } })

  // LEAD 9: Behruz Tursunov, Bobur, REVIEWED, Closing Call ~40%
  const lead9 = await prisma.lead.create({ data: { name: 'Behruz Tursunov', phone: randomPhone(), repId: bobur.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Behruz Tursunov') } })
  await prisma.transcript.create({ data: { leadId: lead9.id, language: 'uz', detectedLanguages: ['uz'], lines: [{ timestamp: 2, speaker: 'Bobur', speakerRole: 'rep', text: "Allo, Behruz aka, bu Bobur. Shartnoma haqida gaplashamizmi?" },{ timestamp: 9, speaker: 'Behruz', speakerRole: 'lead', text: "Ha, gaplashing." },{ timestamp: 13, speaker: 'Bobur', speakerRole: 'rep', text: "O'tgan demo yoqdimi?" },{ timestamp: 18, speaker: 'Behruz', speakerRole: 'lead', text: "Ha, lekin narxi biroz ko'p. Budget yetishmayapti." },{ timestamp: 24, speaker: 'Bobur', speakerRole: 'rep', text: "Hmm, 5 menejer uchun $150 qilsa bo'ladi." },{ timestamp: 31, speaker: 'Behruz', speakerRole: 'lead', text: "Ha, ko'rib chiqaman." },{ timestamp: 35, speaker: 'Bobur', speakerRole: 'rep', text: "Yaxshi, javobingizni kutaman." },{ timestamp: 40, speaker: 'Behruz', speakerRole: 'lead', text: "Xo'p." }] } })
  const v9 = buildClosingVerdicts('low')
  await prisma.review.create({ data: { leadId: lead9.id, checklistId: closingChecklist.id, verdicts: v9, score: calcScore(v9, closingItems), isLocked: true, summary: "Bobur bu yopish qo'ng'iroqini zaif o'tkazdi. Oldingi muhokama takrorlanmadi, qaror to'siqlariga chuqur kirishilmadi. Shartnoma yuborilmadi, muddatlar kelishilmadi." } })

  // LEAD 10: Dilorom Hamidova, Sarvinoz, REVIEWED, Product Demo ~94%
  const lead10 = await prisma.lead.create({ data: { name: 'Dilorom Hamidova', phone: randomPhone(), repId: sarvinoz.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Dilorom Hamidova') } })
  await prisma.transcript.create({ data: { leadId: lead10.id, language: 'uz', detectedLanguages: ['uz', 'ru'], lines: [{ timestamp: 2, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Assalomu alaykum, Dilorom xonim! Bu Sarvinoz SotAI dan. Demo uchun vaqt ajratganingiz uchun katta rahmat." },{ timestamp: 11, speaker: 'Dilorom', speakerRole: 'lead', text: "Marhamat, boshlayvering." },{ timestamp: 15, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Avval bitta savol: hozir savdo menejerlar sifatini qanday nazorat qilasiz?" },{ timestamp: 24, speaker: 'Dilorom', speakerRole: 'lead', text: "Qo'lda qo'ng'iroqlarni tinglashimiz kerak. Juda ko'p vaqt va kuch sarflanadi." },{ timestamp: 32, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Aynan. Biz bu muammoni hal qilamiz. Mana bizning platforma — real vaqtda qo'ng'iroqlar transkripsiya bo'ladi." },{ timestamp: 45, speaker: 'Dilorom', speakerRole: 'lead', text: "Bu juda zo'r. Tillarni ham qo'llab-quvvatlaydimi? Bizda o'zbek va ruscha gaplashadi." },{ timestamp: 53, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Ha, aynan! O'zbek, rus va ingliz tillarini qo'llaydi." },{ timestamp: 65, speaker: 'Dilorom', speakerRole: 'lead', text: "Ajoyib. Integratsiya qanday?" },{ timestamp: 69, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Bitrix24, AmoCRM, Salesforce bilan integratsiya mavjud. API ham bor." },{ timestamp: 80, speaker: 'Dilorom', speakerRole: 'lead', text: "Narxi?" },{ timestamp: 84, speaker: 'Sarvinoz', speakerRole: 'rep', text: "20 menejer uchun oyiga $600. Birinchi 30 kun bepul." },{ timestamp: 95, speaker: 'Dilorom', speakerRole: 'lead', text: "Kontrakt oldindan to'lansa chegirma bo'ladimi?" },{ timestamp: 101, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Ha, yillik to'lovda 20% chegirma. Shartnomani hoziroq yuboray?" },{ timestamp: 108, speaker: 'Dilorom', speakerRole: 'lead', text: "Ha, yuboring. Kecha kelishib olamiz." },{ timestamp: 113, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Ajoyib! Ertaga soat 11 da qo'ng'iroq qilamanmi?" },{ timestamp: 120, speaker: 'Dilorom', speakerRole: 'lead', text: "Ha, ertaga kutaman. Rahmat!" }] } })
  const v10 = buildDemoVerdicts('high')
  await prisma.review.create({ data: { leadId: lead10.id, checklistId: demoCallChecklist.id, verdicts: v10, score: calcScore(v10, demoItems), isLocked: true, summary: "Sarvinoz ushbu demo qo'ng'iroqni a'lo darajada o'tkazdi. Mijozning muammosi chuqur tushunildi, demo shaxsiylashtirildi. Shartnoma yuborildi va follow-up kelishildi." } })

  // LEAD 11: Otabek Yunusov, Dilshod, NOT_REVIEWED
  await prisma.lead.create({ data: { name: 'Otabek Yunusov', phone: randomPhone(), repId: dilshod.id, callDate: randomDate(5), callDuration: randomDuration(), status: LeadStatus.NOT_REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Otabek Yunusov') } })

  // LEAD 12: Kamola Saidova, Malika, REVIEWED, Cold Call ~61%
  const lead12 = await prisma.lead.create({ data: { name: 'Kamola Saidova', phone: randomPhone(), repId: malika.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Kamola Saidova') } })
  await prisma.transcript.create({ data: { leadId: lead12.id, language: 'uz', detectedLanguages: ['uz'], lines: [{ timestamp: 2, speaker: 'Malika', speakerRole: 'rep', text: "Assalomu alaykum, Kamola xonim! Men Malika, SotAI dan." },{ timestamp: 9, speaker: 'Kamola', speakerRole: 'lead', text: "Salom." },{ timestamp: 12, speaker: 'Malika', speakerRole: 'rep', text: "Savdo qo'ng'iroqlari sifatini yaxshilash haqida gaplashaymi?" },{ timestamp: 19, speaker: 'Kamola', speakerRole: 'lead', text: "Ha, nima taklif qilasiz?" },{ timestamp: 23, speaker: 'Malika', speakerRole: 'rep', text: "AI asosida qo'ng'iroqlarni baholash platformasi. Avtomatik transkripsiya va chek-list baho." },{ timestamp: 34, speaker: 'Kamola', speakerRole: 'lead', text: "Hmm. Bizda hozirgacha bunday yo'q." },{ timestamp: 39, speaker: 'Malika', speakerRole: 'rep', text: "Demo ko'rishni xohlaysizmi?" },{ timestamp: 44, speaker: 'Kamola', speakerRole: 'lead', text: "Balki. Narxi qancha?" },{ timestamp: 48, speaker: 'Malika', speakerRole: 'rep', text: "Oyiga menejer boshiga $30 dan." },{ timestamp: 55, speaker: 'Kamola', speakerRole: 'lead', text: "Ko'rib chiqaman. Keyinroq javob beraman." },{ timestamp: 60, speaker: 'Malika', speakerRole: 'rep', text: "Xo'p, emailingizga ma'lumot yuboraymi?" },{ timestamp: 65, speaker: 'Kamola', speakerRole: 'lead', text: "Ha, yuboring." }] } })
  const v12 = buildColdCallVerdicts('medium')
  await prisma.review.create({ data: { leadId: lead12.id, checklistId: coldCallChecklist.id, verdicts: v12, score: calcScore(v12, ccItems), isLocked: true, summary: "Malika bu qo'ng'iroqda o'rtacha natija ko'rsatdi. Taqdimot qilingan, narx aytilgan, lekin mijozning ehtiyojlari chuqur o'rganilmagan. Keyingi qadam noaniq bo'lib qoldi." } })

  // LEAD 13: Ravshan Kalandarov, Bobur, REVIEWED, Product Demo ~76%
  const lead13 = await prisma.lead.create({ data: { name: 'Ravshan Kalandarov', phone: randomPhone(), repId: bobur.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Ravshan Kalandarov') } })
  await prisma.transcript.create({ data: { leadId: lead13.id, language: 'uz', detectedLanguages: ['uz', 'ru'], lines: [{ timestamp: 3, speaker: 'Bobur', speakerRole: 'rep', text: "Assalomu alaykum, Ravshan aka! Bu Bobur. Demo qo'ng'iroqqa tayyor bo'lsangiz boshlayvering." },{ timestamp: 11, speaker: 'Ravshan', speakerRole: 'lead', text: "Ha, boshlayvering." },{ timestamp: 15, speaker: 'Bobur', speakerRole: 'rep', text: "Avval bitta savol: hozir savdo jamoangizni qanday nazorat qilasiz?" },{ timestamp: 24, speaker: 'Ravshan', speakerRole: 'lead', text: "CRM bilan, lekin qo'ng'iroq sifatini kuzatmaymiz." },{ timestamp: 31, speaker: 'Bobur', speakerRole: 'rep', text: "Aynan shu bo'shliqni to'ldiramiz. Mana platforma..." },{ timestamp: 45, speaker: 'Ravshan', speakerRole: 'lead', text: "Qiziq. Bitrix24 bilan ishlaydi?" },{ timestamp: 50, speaker: 'Bobur', speakerRole: 'rep', text: "Ha, to'liq integratsiya bor." },{ timestamp: 58, speaker: 'Ravshan', speakerRole: 'lead', text: "ROI qanday bo'ladi?" },{ timestamp: 63, speaker: 'Bobur', speakerRole: 'rep', text: "Mijozlar o'rtacha savdo ko'rsatkichini 25-30% ga oshirmoqda." },{ timestamp: 75, speaker: 'Ravshan', speakerRole: 'lead', text: "Narxi?" },{ timestamp: 79, speaker: 'Bobur', speakerRole: 'rep', text: "10 menejer uchun $300 oyiga. Trial bepul." },{ timestamp: 88, speaker: 'Ravshan', speakerRole: 'lead', text: "Trial boshlasak bo'ladimi?" },{ timestamp: 92, speaker: 'Bobur', speakerRole: 'rep', text: "Ha, shu bugundan boshlaymiz. Emailingizni bering." }] } })
  const v13 = buildDemoVerdicts('medium')
  demoItems.slice(0, 7).forEach(item => { v13[item.id] = { verdict: 'pass', reasoning: 'Successfully completed', manualOverride: false } })
  await prisma.review.create({ data: { leadId: lead13.id, checklistId: demoCallChecklist.id, verdicts: v13, score: calcScore(v13, demoItems), isLocked: true, summary: "Bobur ushbu demo qo'ng'iroqni yaxshi darajada o'tkazdi. Mijozning muammosi aniqlandi va integratsiya bo'yicha savollarga javob berildi. ROI tushuntirildi. Trial taklifi qabul qilindi." } })

  // LEAD 14: Shahnoza Ergasheva, Sarvinoz, NOT_REVIEWED
  await prisma.lead.create({ data: { name: 'Shahnoza Ergasheva', phone: randomPhone(), repId: sarvinoz.id, callDate: randomDate(3), callDuration: randomDuration(), status: LeadStatus.NOT_REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Shahnoza Ergasheva') } })

  // LEAD 15: Mirzo Hasanov, Dilshod, REVIEWED, Closing Call ~88%
  const lead15 = await prisma.lead.create({ data: { name: 'Mirzo Hasanov', phone: randomPhone(), repId: dilshod.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Mirzo Hasanov') } })
  await prisma.transcript.create({ data: { leadId: lead15.id, language: 'uz', detectedLanguages: ['uz'], lines: [{ timestamp: 2, speaker: 'Dilshod', speakerRole: 'rep', text: "Assalomu alaykum, Mirzo aka! Bu Dilshod. O'tgan demo qo'ng'iroqimizdan keyin shartnoma haqida gaplashaymi?" },{ timestamp: 12, speaker: 'Mirzo', speakerRole: 'lead', text: "Ha, salom. Ha, tayyor edim." },{ timestamp: 17, speaker: 'Dilshod', speakerRole: 'rep', text: "Ajoyib. Oldingi suhbatimizda siz 20 menejer uchun yechim kerakligini aytgandingiz. Shu talabda qolayapsizmi?" },{ timestamp: 27, speaker: 'Mirzo', speakerRole: 'lead', text: "Ha, 20 nafar. Lekin IT bo'lim integratsiya haqida savol qo'ydi." },{ timestamp: 36, speaker: 'Dilshod', speakerRole: 'rep', text: "Tushundim. IT bo'lim uchun texnik hujjatlarimiz bor." },{ timestamp: 44, speaker: 'Mirzo', speakerRole: 'lead', text: "Asosan API xavfsizligi va ma'lumotlar qayerda saqlanadi degan savollar." },{ timestamp: 51, speaker: 'Dilshod', speakerRole: 'rep', text: "Ma'lumotlar AWS EU serverlarida saqlanadi, ISO 27001 sertifikatlangan. API OAuth 2.0 bilan himoyalangan." },{ timestamp: 64, speaker: 'Mirzo', speakerRole: 'lead', text: "Ha, albatta. Unda qaror qabul qilishimiz osonlashadi." },{ timestamp: 70, speaker: 'Dilshod', speakerRole: 'rep', text: "Xo'p, hoziroq emailingizga yuboraman. Ertaga yoki indin qaror qila olasizmi?" },{ timestamp: 80, speaker: 'Mirzo', speakerRole: 'lead', text: "Ha, erta ertaga javob beraman." },{ timestamp: 85, speaker: 'Dilshod', speakerRole: 'rep', text: "Zo'r! Shartnomani ham yuboraymi shu bilan?" },{ timestamp: 90, speaker: 'Mirzo', speakerRole: 'lead', text: "Ha, yuboring. Ko'rib chiqamiz." },{ timestamp: 94, speaker: 'Dilshod', speakerRole: 'rep', text: "Ajoyib, hamma narsani emailingizga yuboraman. Kutaman! Rahmat!" }] } })
  const v15 = buildClosingVerdicts('high')
  await prisma.review.create({ data: { leadId: lead15.id, checklistId: closingChecklist.id, verdicts: v15, score: calcScore(v15, closingItems), isLocked: true, summary: "Dilshod bu yopish qo'ng'iroqini a'lo darajada o'tkazdi. Oldingi suhbat takrorlandi, IT e'tirozlari professional tarzda hal qilindi. Shartnoma va texnik hujjatlar yuborildi. Qaror muddati kelishildi." } })

  // LEAD 16: Gulsanam Tojiboyeva, Malika, REVIEWED, Cold Call ~52%
  const lead16 = await prisma.lead.create({ data: { name: 'Gulsanam Tojiboyeva', phone: randomPhone(), repId: malika.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Gulsanam Tojiboyeva') } })
  await prisma.transcript.create({ data: { leadId: lead16.id, language: 'uz', detectedLanguages: ['uz'], lines: [{ timestamp: 2, speaker: 'Malika', speakerRole: 'rep', text: "Assalomu alaykum! Men SotAI dan qo'ng'iroq qilayapman." },{ timestamp: 8, speaker: 'Gulsanam', speakerRole: 'lead', text: "Ha, salom. Nima haqida?" },{ timestamp: 12, speaker: 'Malika', speakerRole: 'rep', text: "Bizning platforma savdo menejerlari sifatini yaxshilaydi." },{ timestamp: 20, speaker: 'Gulsanam', speakerRole: 'lead', text: "Bizga bunday kerak emas hozircha." },{ timestamp: 25, speaker: 'Malika', speakerRole: 'rep', text: "Lekin juda foydali, bir demo ko'ring." },{ timestamp: 32, speaker: 'Gulsanam', speakerRole: 'lead', text: "Vaqtim yo'q." },{ timestamp: 37, speaker: 'Malika', speakerRole: 'rep', text: "Faqat 15 daqiqa. Narxi ham arzon." },{ timestamp: 44, speaker: 'Gulsanam', speakerRole: 'lead', text: "Keyinroq gaplashamiz." },{ timestamp: 48, speaker: 'Malika', speakerRole: 'rep', text: "Xo'p, email yuboraymi?" },{ timestamp: 52, speaker: 'Gulsanam', speakerRole: 'lead', text: "Ha bo'lar." }] } })
  const v16 = buildColdCallVerdicts('low')
  v16[ccItems[0].id] = { verdict: 'pass', reasoning: "Salomlashdi va kompaniya nomini aytdi", manualOverride: false }
  v16[ccItems[1].id] = { verdict: 'pass', reasoning: "Qo'ng'iroq sababini aytdi", manualOverride: false }
  await prisma.review.create({ data: { leadId: lead16.id, checklistId: coldCallChecklist.id, verdicts: v16, score: calcScore(v16, ccItems), isLocked: true, summary: "Malika ushbu qo'ng'iroqda jiddiy kamchiliklar ko'rsatdi. Mijozning ehtiyoji aniqlanmadi, e'tirozlar to'g'ri boshqarilmadi. Faqat email so'rash bilan yakunlandi." } })

  // LEAD 17: Nodir Rahimov, Bobur, AI_READY, Cold Call ~71%
  const lead17 = await prisma.lead.create({ data: { name: 'Nodir Rahimov', phone: randomPhone(), repId: bobur.id, callDate: randomDate(10), callDuration: randomDuration(), status: LeadStatus.AI_READY, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Nodir Rahimov') } })
  await prisma.transcript.create({ data: { leadId: lead17.id, language: 'ru', detectedLanguages: ['ru', 'uz'], lines: [{ timestamp: 2, speaker: 'Bobur', speakerRole: 'rep', text: "Здравствуйте, Нодир! Это Бобур из SotAI. Звоню рассказать о нашем решении для контроля качества звонков." },{ timestamp: 13, speaker: 'Nodir', speakerRole: 'lead', text: "Salom. Nima haqida?" },{ timestamp: 17, speaker: 'Bobur', speakerRole: 'rep', text: "Savdo menejerlari qo'ng'iroqlari sifatini avtomatik baholash. Sizda nechta menejer bor?" },{ timestamp: 25, speaker: 'Nodir', speakerRole: 'lead', text: "6 nafar. Lekin hozirgacha bunday tizim ishlatmaganmiz." },{ timestamp: 32, speaker: 'Bobur', speakerRole: 'rep', text: "Bu sizga o'rtacha 3 soat supervisor vaqtini tejaydi. Platforma har qo'ng'iroqni AI bilan baholaydi." },{ timestamp: 44, speaker: 'Nodir', speakerRole: 'lead', text: "Qiziq. Интеграция с Bitrix24 есть?" },{ timestamp: 49, speaker: 'Bobur', speakerRole: 'rep', text: "Da, polnaya integratsiya. Lidy avtomatik yuklanadi." },{ timestamp: 58, speaker: 'Nodir', speakerRole: 'lead', text: "Narxi?" },{ timestamp: 62, speaker: 'Bobur', speakerRole: 'rep', text: "6 menejer uchun $180 oyiga. Demo bepul." },{ timestamp: 72, speaker: 'Nodir', speakerRole: 'lead', text: "Demo ko'rishni xohlayman." },{ timestamp: 76, speaker: 'Bobur', speakerRole: 'rep', text: "Ajoyib! Qachon qulay? Ertaga yoki indinga bo'lsa?" },{ timestamp: 82, speaker: 'Nodir', speakerRole: 'lead', text: "Ertaga soat 15 da." },{ timestamp: 86, speaker: 'Bobur', speakerRole: 'rep', text: "Yaxshi, link yuboraman. Rahmat!" }] } })
  const v17 = buildColdCallVerdicts('medium')
  v17[ccItems[0].id] = { verdict: 'pass', reasoning: "Salomlashdi va o'zini tanishtirdi", manualOverride: false }
  v17[ccItems[2].id] = { verdict: 'pass', reasoning: "Mijozning jamoasi haqida so'radi", manualOverride: false }
  v17[ccItems[6].id] = { verdict: 'pass', reasoning: "Demo kelishildi", manualOverride: false }
  await prisma.review.create({ data: { leadId: lead17.id, checklistId: coldCallChecklist.id, verdicts: v17, score: calcScore(v17, ccItems), isLocked: false, summary: "AI tahlili: Bobur bu qo'ng'iroqda yaxshi natija ko'rsatdi. Salomlashuv, taqdimot va demo kelishish yaxshi bo'ldi. E'tirozlarni boshqarish va muloqot tonusi yaxshilanishi mumkin." } })

  // LEAD 18: Barno Qosimova, Sarvinoz, REVIEWED, Product Demo ~66%
  const lead18 = await prisma.lead.create({ data: { name: 'Barno Qosimova', phone: randomPhone(), repId: sarvinoz.id, callDate: randomDate(30), callDuration: randomDuration(), status: LeadStatus.REVIEWED, audioUrl: AUDIO_URL, audioPeaks: generatePeaks('Barno Qosimova') } })
  await prisma.transcript.create({ data: { leadId: lead18.id, language: 'uz', detectedLanguages: ['uz', 'ru'], lines: [{ timestamp: 2, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Assalomu alaykum, Barno xonim! Bu Sarvinoz SotAI dan. Demo boshlasak bo'ladimi?" },{ timestamp: 10, speaker: 'Barno', speakerRole: 'lead', text: "Ha, boshlayvering." },{ timestamp: 14, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Mana platformamizning asosiy sahifasi. Qo'ng'iroqlar royhati va har birining AI bahosi ko'rinadi." },{ timestamp: 27, speaker: 'Barno', speakerRole: 'lead', text: "Bu kerak bo'lishi mumkin. Lekin bizda ko'proq WhatsApp orqali muloqot bo'ladi." },{ timestamp: 35, speaker: 'Sarvinoz', speakerRole: 'rep', text: "WhatsApp integratsiyasi hozir ishlanmoqda, yil oxirigacha tayyor bo'ladi." },{ timestamp: 45, speaker: 'Barno', speakerRole: 'lead', text: "Telefon qo'ng'iroqlari ham borku. Ko'rsating." },{ timestamp: 49, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Mana — telefon qo'ng'iroqlari uchun full funksional ishlaydi. Transkripsiya, baholash, hisobot." },{ timestamp: 62, speaker: 'Barno', speakerRole: 'lead', text: "Narxi?" },{ timestamp: 66, speaker: 'Sarvinoz', speakerRole: 'rep', text: "10 menejer uchun $300 oyiga." },{ timestamp: 74, speaker: 'Barno', speakerRole: 'lead', text: "Hmm, ko'rib chiqaman. Rahmat." },{ timestamp: 79, speaker: 'Sarvinoz', speakerRole: 'rep', text: "Xo'p, materiallar yuboraymi?" },{ timestamp: 83, speaker: 'Barno', speakerRole: 'lead', text: "Ha, yuboring." }] } })
  const v18 = buildDemoVerdicts('medium')
  await prisma.review.create({ data: { leadId: lead18.id, checklistId: demoCallChecklist.id, verdicts: v18, score: calcScore(v18, demoItems), isLocked: true, summary: "Sarvinoz bu demo qo'ng'iroqda o'rtacha natija ko'rsatdi. Demo o'tkazildi, ammo mijozning asosiy muammosi — WhatsApp integratsiyasi — hali tayyor emasligi muammo yaratdi. Keyingi qadam noaniq qoldi." } })

  // Settings
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, aiProvider: 'gemini', aiModel: 'gemini-1.5-pro', scorePassThreshold: 70 } })

  console.log('Created 18 leads with transcripts and reviews')
  console.log('Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
