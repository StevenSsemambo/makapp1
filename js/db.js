// ================================================================
// MakChat — Local DB Layer + Seed Data
// Uses localStorage as cache. Appwrite syncs on top of this.
// ================================================================

const DB = {
  _get(k)   { try { return JSON.parse(localStorage.getItem('mc:' + k)); } catch { return null; } },
  _set(k, v){ localStorage.setItem('mc:' + k, JSON.stringify(v)); return v; },
  _del(k)   { localStorage.removeItem('mc:' + k); },
  get(k)    { return this._get(k); },
  set(k, v) { this._set(k, v); return v; },
  del(k)    { this._del(k); },
  push(k, v){ const a = this._get(k) || []; a.unshift(v); this._set(k, a); return a; },
  all(k)    { return this._get(k) || []; },
};

// ── DATA ACCESSORS ───────────────────────────────────────────────
const allUsers    = () => DB.all('users');
const allPosts    = () => DB.all('posts');
const allGroups   = () => DB.all('groups');
const allOpps     = () => DB.all('opportunities');
const allListings = () => DB.all('listings');
const allHostels  = () => DB.all('hostels');
const allGigs     = () => DB.all('gigs');
const allEvents   = () => DB.all('events');
const allAnn      = () => DB.all('announcements');
const allLF       = () => DB.all('lostfound');
const allChats    = () => DB.all('chats');
const allNotifs   = () => DB.all('notifications');
const allChannels = () => DB.all('channels');

function getUser(id) { return allUsers().find(u => u.id === id); }

function saveUsers(arr) {
  DB._set('users', arr);
  if (USE_APPWRITE && arr.length) {
    arr.forEach(u => AW.upsertOne('users', u));
  }
}

function saveUser(u) {
  const arr = allUsers();
  const i = arr.findIndex(x => x.id === u.id);
  if (i >= 0) arr[i] = u;
  saveUsers(arr);
  CU = u;
  refreshUI();
}

// ── SEED DATA ────────────────────────────────────────────────────
function seedIfEmpty() {
  if (DB.get('seeded_v2')) return;
  const now = Date.now();

  DB.set('users', [
    { id:'u0', name:'Demo Student', username:'demo', email:'demo@mak.ac.ug',
      password:'demo1234', college:'College of Computing & Information Sciences (COCIS)',
      course:'BSc. Computer Science', year:'Year 3', color:'#003478',
      bio:'MakChat demo account. Explore all features freely! 🎓',
      points:950, verified:true, isMentor:false, connections:['u1','u2','u3'],
      groups:['g1'], portfolio:[], skills:[{name:'Python',level:80},{name:'Research',level:65}],
      interests:'AI, Fintech, Open Source', createdAt: now },
    { id:'u1', name:'Nakato Amara', username:'nakato_a', email:'nakato@mak.ac.ug',
      password:'pass', college:'College of Computing & Information Sciences (COCIS)',
      course:'BSc. Software Engineering', year:'Year 3', color:'#0057cc',
      bio:'Software Engineer in training. Chess lover. Building East Africa\'s tech future. 💻',
      points:1420, verified:true, isMentor:true, connections:['u0','u2'], groups:['g1','g2'],
      portfolio:[{id:'port1',title:'Makerere App Hackathon – 1st Place',type:'Achievement',date:'2025-01',desc:'Won COCIS Hackathon with a health tracking app.',verified:true}],
      skills:[{name:'React',level:85},{name:'Node.js',level:75}], interests:'Web Dev, Chess, East African Tech', createdAt: now-86400000*30 },
    { id:'u2', name:'Kizito Brian', username:'kizito_b', email:'kizito@mak.ac.ug',
      password:'pass', college:'College of Engineering, Design, Art & Technology (CEDAT)',
      course:'BSc. Electrical Engineering', year:'Year 2', color:'#c0392b',
      bio:'Electrical Engineer | Football | Renewable Energy enthusiast ⚡',
      points:780, verified:false, isMentor:false, connections:['u0'], groups:['g3'],
      portfolio:[], skills:[{name:'AutoCAD',level:70},{name:'MATLAB',level:60}],
      interests:'Renewable Energy, Football, Robotics', createdAt: now-86400000*20 },
    { id:'u3', name:'Namukasa Grace', username:'grace_n', email:'grace@mak.ac.ug',
      password:'pass', college:'College of Health Sciences (CHS)',
      course:'MBChB Medicine & Surgery', year:'Year 4', color:'#16a34a',
      bio:'Future doctor. Community health. Research is my passion 🏥',
      points:2300, verified:true, isMentor:true, connections:['u0','u4'], groups:['g2'],
      portfolio:[{id:'port2',title:'Research on Malaria Prevention in Rural Uganda',type:'Research',date:'2025-02',desc:'Co-authored paper submitted to Uganda Medical Journal.',verified:false}],
      skills:[{name:'Clinical Research',level:90},{name:'Public Health',level:85}],
      interests:'Medical Research, Community Health, Running', createdAt: now-86400000*60 },
    { id:'u4', name:'Ssemakula Peter', username:'peter_s', email:'peter@mak.ac.ug',
      password:'pass', college:'School of Law (SoL)', course:'LLB Law', year:'Year 3', color:'#7c3aed',
      bio:'Law student. Human Rights. Debating champion. Justice for all ⚖️',
      points:1650, verified:true, isMentor:false, connections:['u3'], groups:[],
      portfolio:[{id:'port3',title:'Inter-University Moot Court Champion 2024',type:'Achievement',date:'2024-11',desc:'Won the East African Law Students Moot Court Competition.',verified:true}],
      skills:[{name:'Legal Research',level:90},{name:'Public Speaking',level:95}],
      interests:'Human Rights, Debate, Creative Writing', createdAt: now-86400000*45 },
    { id:'u5', name:'Birungi Sharon', username:'sharon_b', email:'sharon@mak.ac.ug',
      password:'pass', college:'College of Business & Management Sciences (CoBAMS)',
      course:'BBA Business Administration', year:'Year 2', color:'#d97706',
      bio:'Business student. Entrepreneur at heart. Social media & marketing 📈',
      points:890, verified:false, isMentor:false, connections:[], groups:['g1'],
      portfolio:[], skills:[{name:'Marketing',level:75},{name:'Excel',level:65}],
      interests:'Entrepreneurship, Marketing, Photography', createdAt: now-86400000*15 },
  ]);

  DB._set('posts', [
    { id:'p1', userId:'u3', body:'Just submitted my research paper on malaria prevention in rural communities! 47 pages of pure dedication 🔥 Thanks to my study group for keeping me accountable.', tag:'study', anon:false, likes:['u1','u4','u0'], comments:[{id:'c1',userId:'u1',body:'Congratulations! That is amazing work Grace!',createdAt:now-3000000}], createdAt: now-3600000 },
    { id:'p2', userId:'u1', body:'The new AI Research Lab in COCIS Block B opens next semester!! Finally real infrastructure for us. Who else is excited? 🔬💻', tag:'study', anon:false, likes:['u2','u3','u4','u0'], comments:[], createdAt: now-7200000 },
    { id:'p3', userId:'u2', body:'CEDAT students — the inter-university bridge building competition deadline is THIS FRIDAY. Teams of 4 max. Walk-ins at Engineering block tomorrow 3pm. 💪', tag:'event', anon:false, likes:['u1','u0'], comments:[], createdAt: now-10800000 },
    { id:'p4', userId:'null', body:'Honest question: how do you survive Law school readings AND maintain a social life? Drowning in case studies 😭', tag:'support', anon:true, anonLabel:'Anonymous Law Student', likes:['u1','u2','u3'], comments:[{id:'c3',userId:'u4',body:'Law student here — Pomodoro + study groups. DM me!',createdAt:now-4000000}], createdAt: now-14400000 },
    { id:'p5', userId:'u5', body:'Selling my Year 1 Business textbooks — all 6 books for 80,000 UGX. Pickup at MUBS. WhatsApp me at 0772-XXXXXX. 📚', tag:'marketplace', anon:false, likes:['u3','u4'], comments:[], createdAt: now-18000000 },
    { id:'p6', userId:'u4', body:'FREE LEGAL CLINIC this Friday at School of Law, 2-5pm. Year 4 & 5 students offering free legal advice. Come with your questions ⚖️', tag:'announcement', anon:false, likes:['u0','u1','u2','u3'], comments:[], createdAt: now-86400000 },
  ]);

  DB._set('groups', [
    { id:'g1', name:'COCIS Code Warriors', emoji:'💻', type:'study', college:'COCIS', members:['u0','u1','u5'], max:'20', days:'Mon, Wed, Fri', desc:'CS & Software Engineering students. Daily coding challenges, project collaboration.', progress:72, streak:14, points:4800, messages:[{id:'gm1',from:'u1',body:'Hey team! Who is ready for the algorithms quiz on Friday? 💪',ts:now-7200000},{id:'gm2',from:'u5',body:'I am! Can we do a session tomorrow?',ts:now-3600000}], createdAt:now-86400000*30 },
    { id:'g2', name:'MedSquad Makerere', emoji:'🏥', type:'study', college:'CHS', members:['u1','u3'], max:'10', days:'Tue, Thu, Sat', desc:'Medical students supporting each other through the toughest years.', progress:88, streak:21, points:8100, messages:[{id:'gm3',from:'u3',body:'Reminder: Pathology MCQs tomorrow 9am at MedLib 🏥',ts:now-86400000}], createdAt:now-86400000*45 },
    { id:'g3', name:'CEDAT Builders', emoji:'⚙️', type:'interest', college:'CEDAT', members:['u2'], max:'20', days:'Mon, Thu', desc:'Engineering and design students. Robotics, renewable energy, and innovation projects.', progress:55, streak:8, points:2300, messages:[], createdAt:now-86400000*20 },
    { id:'g4', name:'MakEntrepreneurs', emoji:'🚀', type:'interest', college:'All', members:[], max:'50', days:'Wed, Sat', desc:'Cross-faculty entrepreneurs. Startup pitches, business plan competitions.', progress:40, streak:5, points:1500, messages:[], createdAt:now-86400000*10 },
    { id:'g5', name:'Mak Debate Society', emoji:'🎤', type:'club', college:'All', members:[], max:'30', days:'Tue, Fri', desc:'Official Makerere debate society. Weekly sessions, competitions.', progress:65, streak:18, points:5200, messages:[], createdAt:now-86400000*60 },
    { id:'g6', name:'Green Mak Initiative', emoji:'🌿', type:'club', college:'All', members:[], max:'Unlimited', days:'Sat', desc:'Environmental sustainability group. Campus clean-ups, tree planting.', progress:30, streak:4, points:900, messages:[], createdAt:now-86400000*14 },
  ]);

  DB._set('listings', [
    { id:'m1', userId:'u1', title:'Data Structures & Algorithms — Cormen 4th Ed', cat:'textbooks', price:45000, contact:'0772-001001', cond:'Good', desc:'Used 1 semester. Some highlights. Essential for Year 1-2 CS.', emoji:'📚', sold:false, createdAt: now-7200000 },
    { id:'m2', userId:'u4', title:'Law Year 1 & 2 Notes — Complete Bundle', cat:'notes', price:30000, contact:'0700-002002', cond:'New', desc:'Typed notes: Constitutional, Contract, Tort, Criminal Law. 200+ pages.', emoji:'📝', sold:false, createdAt: now-14400000 },
    { id:'m3', userId:'u2', title:'Engineering Mathematics Tutoring (Year 1-2)', cat:'tutoring', price:15000, contact:'0783-003003', cond:'N/A', desc:'Scored A in Eng Maths 1 & 2. Online or in-person at CEDAT.', emoji:'🎓', sold:false, createdAt: now-28800000 },
    { id:'m4', userId:'u3', title:'Netter\'s Anatomy Atlas — 7th Edition', cat:'textbooks', price:120000, contact:'0752-004004', cond:'Very Good', desc:'Minimal notes in margins. All plates intact. CHS essential reading.', emoji:'📖', sold:false, createdAt: now-36000000 },
    { id:'m5', userId:'u5', title:'COSTECH Past Exam Papers 2018-2024', cat:'past-papers', price:5000, contact:'0775-005005', cond:'N/A', desc:'6 years of COSTECH papers. Shared via Google Drive.', emoji:'📄', sold:false, createdAt: now-50000000 },
    { id:'m6', userId:'u0', title:'Laptop Bag — Black, 15"', cat:'equipment', price:0, contact:'0770-000000', cond:'Good', desc:'FREE — don\'t need it. Pickup in COCIS Block B.', emoji:'🎒', sold:false, createdAt: now-72000000 },
  ]);

  DB._set('hostels', [
    { id:'h1', userId:'u1', title:'Mitchell Hall — Room Available (Single)', type:'campus', price:350000, location:'Mitchell Hall, Makerere Hill', desc:'Single room in Mitchell Hall. All utilities included. Walking distance to COCIS.', contact:'0772-001001', rating:4, createdAt:now-86400000*5 },
    { id:'h2', userId:'u5', title:'Wandegeya Self-Contained Room — 2 Girls Needed', type:'offcampus', price:250000, location:'Wandegeya, ~10 min walk from main gate', desc:'3-bedroom apartment. 24hr water, secure compound. Looking for 2 more female students.', contact:'0775-005005', rating:0, createdAt:now-86400000*3 },
    { id:'h3', userId:'u2', title:'Lumumba Hall Review — Honest Take After 2 Years', type:'review', price:280000, location:'Lumumba Hall', desc:'After 2 years: PROS — cheap, on campus. CONS — noisy, shared bathrooms. Overall 3.5/5.', contact:'', rating:3, createdAt:now-86400000*7 },
    { id:'h4', userId:'u3', title:'⚠️ WARNING: Kikoni Landlord (Mr. Kasule)', type:'warning', price:0, location:'Kikoni', desc:'DO NOT rent from this compound. Landlord raises rent without notice, keeps deposits.', contact:'', rating:1, createdAt:now-86400000*2 },
    { id:'h5', userId:'u4', title:'Sharing a 2-bedroom in Banda — Need 1 More Male', type:'roommate', price:200000, location:'Banda, ~15 min taxi to Makerere', desc:'Looking for 1 male Law/Social Sciences student. Quiet environment. 200k/month all-inclusive.', contact:'0700-002002', rating:0, createdAt:now-86400000*1 },
  ]);

  DB._set('gigs', [
    { id:'gi1', userId:'u1', title:'Professional Web Development & Design', cat:'tech', rate:'From 150,000 UGX', desc:'React, Node.js, WordPress. Portfolio websites, web apps. 50+ projects completed.', contact:'0772-001001', rating:5, orders:12, reviews:[], createdAt:now-86400000*20 },
    { id:'gi2', userId:'u3', title:'Biology & Medical Sciences Tutoring', cat:'tutoring', rate:'20,000 UGX/hr', desc:'Year 4 Medical student. Biochemistry, Anatomy, Physiology, Microbiology.', contact:'0752-004004', rating:5, orders:24, reviews:[], createdAt:now-86400000*30 },
    { id:'gi3', userId:'u5', title:'Graphic Design & Branding', cat:'design', rate:'From 50,000 UGX', desc:'Logos, flyers, social media graphics. Canva + Adobe Illustrator.', contact:'0775-005005', rating:4, orders:8, reviews:[], createdAt:now-86400000*15 },
    { id:'gi4', userId:'u2', title:'Engineering Drawing & AutoCAD', cat:'tech', rate:'30,000 UGX/hr', desc:'AutoCAD, SolidWorks, technical drawing. Year 1-2 Engineering students.', contact:'0783-003003', rating:4, orders:5, reviews:[], createdAt:now-86400000*10 },
    { id:'gi5', userId:'u4', title:'Legal Research & Writing', cat:'writing', rate:'40,000 UGX/project', desc:'Legal memos, essays, case briefs. SoL Year 5 student.', contact:'0700-002002', rating:5, orders:7, reviews:[], createdAt:now-86400000*8 },
    { id:'gi6', userId:'u0', title:'Photography — Campus Events & Portraits', cat:'photo', rate:'100,000 UGX/event', desc:'Event photography, student portraits. Edited photos delivered within 48 hours.', contact:'0770-000000', rating:4, orders:9, reviews:[], createdAt:now-86400000*25 },
  ]);

  DB._set('events', [
    { id:'ev1', userId:'u1', title:'COCIS Hackathon 2025', cat:'tech', date:'2025-04-12', time:'08:00', venue:'COCIS Block B, Lab 2', desc:'24-hour hackathon open to all Makerere students. Prizes worth 5M UGX. Teams of 2-4.', organizer:'COCIS Student Body', rsvps:['u0','u2','u3'], createdAt:now-86400000*3 },
    { id:'ev2', userId:'u3', title:'Public Health Seminar: COVID Lessons', cat:'academic', date:'2025-03-28', time:'14:00', venue:'CHS Lecture Hall 1', desc:'Guest speakers from MoH Uganda on lessons from COVID-19 and future preparedness.', organizer:'MakSPH', rsvps:['u1','u4'], createdAt:now-86400000*5 },
    { id:'ev3', userId:'u4', title:'Moot Court Competition — Round 1', cat:'academic', date:'2025-04-05', time:'09:00', venue:'School of Law, Court Room A', desc:'First round of the annual intra-university moot court competition.', organizer:'Law Students Society', rsvps:['u0','u2','u5'], createdAt:now-86400000*2 },
    { id:'ev4', userId:'u2', title:'Inter-Faculty Football Tournament', cat:'sports', date:'2025-04-08', time:'14:00', venue:'Makerere Main Football Pitch', desc:'Annual inter-faculty football tournament. 8 colleges competing.', organizer:'Makerere Sports Association', rsvps:['u0','u1','u3'], createdAt:now-86400000*4 },
    { id:'ev5', userId:'u5', title:'Career Fair 2025 — Top Companies at Makerere', cat:'career', date:'2025-04-20', time:'08:00', venue:'University Main Hall', desc:'Over 40 companies including MTN, Stanbic, KPMG, Google attending.', organizer:'Makerere Career Centre', rsvps:['u0','u1','u2','u3','u4'], createdAt:now-86400000*6 },
  ]);

  DB.set('opportunities', [
    { id:'o1', title:'Google Generation Scholarship 2025', type:'scholarship', provider:'Google.org', desc:'Full scholarship for CS/Engineering students in Sub-Saharan Africa. Covers tuition, living stipend, mentorship.', deadline:'2025-04-30', amount:'Full Tuition + $2,400/yr stipend', urgent:true, saved:[], link:'#' },
    { id:'o2', title:'KPMG East Africa Graduate Programme', type:'internship', provider:'KPMG Uganda', desc:'3-month paid internship in Audit, Tax, or Advisory. Final year students in Business, Accounting, Law.', deadline:'2025-05-15', amount:'Paid (Market rate)', urgent:false, saved:[], link:'#' },
    { id:'o3', title:'Makerere Research Support Grant', type:'grant', provider:'Makerere RIF', desc:'Internal grant for undergraduate research with community impact focus.', deadline:'2025-04-15', amount:'UGX 5,000,000', urgent:true, saved:[], link:'#' },
    { id:'o4', title:'MTN MoMo Fintech Challenge 2025', type:'competition', provider:'MTN Uganda', desc:'Build innovative fintech solutions using MTN Mobile Money APIs. Cash prizes + accelerator entry.', deadline:'2025-03-31', amount:'UGX 50M prize pool', urgent:true, saved:[], link:'#' },
    { id:'o5', title:'Andela Fellowship – Technology Leadership Track', type:'fellowship', provider:'Andela', desc:'Competitive tech fellowship for top African engineers. 6-month programme with paid work exposure.', deadline:'2025-04-28', amount:'Paid + Benefits', urgent:false, saved:[], link:'#' },
    { id:'o6', title:'Mastercard Foundation Scholars Program', type:'scholarship', provider:'Mastercard Foundation', desc:'Full scholarship including tuition, accommodation, meals, laptop, and travel.', deadline:'2025-06-01', amount:'Full Scholarship', urgent:false, saved:[], link:'#' },
    { id:'o7', title:'KCCA Graduate Trainee Programme 2025', type:'job', provider:'KCCA', desc:'Graduate trainee positions in Urban Planning, Engineering, IT, and Administration.', deadline:'2025-05-30', amount:'UGX 1.5M/month + Benefits', urgent:false, saved:[], link:'#' },
  ]);

  DB._set('announcements', [
    { id:'an1', userId:'system', title:'Registration Deadline — Semester 2, 2024/2025', cat:'academic', college:'All', body:'All students must complete semester 2 registration and pay tuition fees by 31st March 2025. Late registration incurs a 10% penalty.', createdAt:now-86400000*1, important:true },
    { id:'an2', userId:'system', title:'URGENT: Library Renovation — Partial Closure', cat:'urgent', college:'All', body:'The Main Library will be partially closed (floors 2-4) from 25 March to 10 April. E-library access remains fully available.', createdAt:now-3600000*5, important:true },
    { id:'an3', userId:'u1', title:'COCIS End of Semester Dinner', cat:'academic', college:'COCIS', body:'COCIS students invited to End of Semester Dinner on Friday 5th April, 7pm at COCIS Lawn. Tickets 15,000 UGX.', createdAt:now-86400000*3, important:false },
    { id:'an4', userId:'system', title:'Guild Presidential Election Results', cat:'guild', college:'All', body:'Mwesigwa Davis won with 8,234 votes (54%). Inauguration ceremony on 5th April.', createdAt:now-86400000*2, important:false },
    { id:'an5', userId:'system', title:'CHS — New Clinical Rotation Schedule', cat:'academic', college:'CHS', body:'The revised clinical rotation schedule for MBChB Year 4 and Year 5 is now available on the student portal.', createdAt:now-86400000*4, important:false },
  ]);

  DB._set('lostfound', [
    { id:'lf1', userId:'u2', title:'Student ID Card — Kizito Brian', status:'lost', location:'CEDAT Block A canteen', date:'2025-03-18', desc:'Lost my student ID after lunch. Please contact if found.', contact:'0783-003003', claimed:false, createdAt:now-86400000*2 },
    { id:'lf2', userId:'u5', title:'Black Laptop Bag (Dell Inspiron inside)', status:'found', location:'Main Library, 3rd floor', date:'2025-03-19', desc:'Found a black Dell laptop bag. Left at library security desk.', contact:'0775-005005', claimed:false, createdAt:now-86400000*1 },
    { id:'lf3', userId:'u3', title:'Calculator (Casio fx-991ES)', status:'found', location:'CHS Anatomy Lecture Hall', date:'2025-03-15', desc:'Found a scientific calculator. Name written inside: "Grace".', contact:'0752-004004', claimed:true, createdAt:now-86400000*5 },
    { id:'lf4', userId:'u4', title:'USB Flash Drive (32GB, blue)', status:'lost', location:'School of Law Library', date:'2025-03-20', desc:'Lost a 32GB blue USB. Has all my thesis research. VERY IMPORTANT. Will reward.', contact:'0700-002002', claimed:false, createdAt:now-86400000*0.5 },
  ]);

  DB._set('chats', [
    { id:'ch1', participants:['u0','u1'], messages:[
      { id:'msg1', from:'u1', body:'Hey! Welcome to MakChat 🎓 Hope you\'re settling in well!', ts:now-3600000 },
      { id:'msg2', from:'u0', body:'Thanks Nakato! This app is great, loving the features already', ts:now-3500000 },
      { id:'msg3', from:'u1', body:'Check out the Groups tab — COCIS Code Warriors is waiting for you 💻', ts:now-3400000 },
    ]},
    { id:'ch2', participants:['u0','u3'], messages:[
      { id:'msg4', from:'u3', body:'Hi! I saw you joined MakChat. Are you interested in the study group?', ts:now-86400000 },
      { id:'msg5', from:'u0', body:'Yes definitely! The MedSquad group looks interesting even for CS students', ts:now-86400000+1000 },
    ]},
  ]);

  DB._set('notifications', [
    { id:'n1', icon:'💬', text:'Nakato Amara sent you a message', ts:now-3400000, read:false },
    { id:'n2', icon:'📢', text:'New urgent announcement: Registration Deadline', ts:now-86400000, read:false },
    { id:'n3', icon:'🎉', text:'Kizito Brian connected with you', ts:now-86400000*2, read:true },
  ]);

  DB.set('seeded_v2', true);
}

function seedChannels() {
  if (DB.get('channels_seeded')) return;
  const now = Date.now();
  DB._set('channels', [
    { id:'ch_cs1', name:'CS2201 - Data Structures', type:'course', college:'COCIS', desc:'Discussion for Data Structures & Algorithms', members:['u0','u1'], messages:[
      { id:'cm1', from:'u1', body:'Anyone done the assignment on binary trees? Stuck on AVL rotation', ts:now-3600000 },
      { id:'cm2', from:'u0', body:'Check lecture notes from week 8, explains it really well 📚', ts:now-3000000 },
    ], createdAt:now-86400000*10 },
    { id:'ch_med1', name:'MBChB Year 4 - Clinical Rotations', type:'course', college:'CHS', desc:'Updates and questions about clinical placements', members:['u3','u2'], messages:[
      { id:'cm3', from:'u3', body:'Mulago rotation schedule updated — check the CHS portal!', ts:now-7200000 },
    ], createdAt:now-86400000*7 },
    { id:'ch_law1', name:'SoL - Moot Court Prep', type:'department', college:'SoL', desc:'Resources and practice for moot court', members:['u4'], messages:[], createdAt:now-86400000*5 },
    { id:'ch_research1', name:'Undergraduate Research Network', type:'research', college:'All', desc:'Share research ideas and find collaborators', members:['u0','u1','u3'], messages:[
      { id:'cm4', from:'u1', body:'Anyone interested in co-authoring a paper on ML in Ugandan agriculture?', ts:now-1800000 },
    ], createdAt:now-86400000*3 },
  ]);
  DB.set('channels_seeded', true);
}
