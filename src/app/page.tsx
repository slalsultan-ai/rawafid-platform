import Link from "next/link";
import { Waves, ArrowLeft, Star, Users, BookOpen, TrendingUp, CheckCircle, Zap, Shield, BarChart3, ChevronLeft } from "lucide-react";

export default function LandingPage() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-white font-arabic overflow-x-hidden">

      {/* ====== NAV ====== */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-md shadow-teal-200">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">روافد</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600 font-medium">
            <a href="#features" className="hover:text-teal-600 transition-colors">المميزات</a>
            <a href="#how" className="hover:text-teal-600 transition-colors">كيف يعمل؟</a>
            <a href="#stats" className="hover:text-teal-600 transition-colors">الأثر</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ar/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              دخول
            </Link>
            <Link
              href="/ar/login"
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-200"
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute top-40 left-1/4 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-50 rounded-full blur-2xl opacity-50 -z-10" />

        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              منصة الإرشاد المهني الذكي للمؤسسات
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-4xl mx-auto">
            اربط الخبرة{" "}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-600 to-emerald-500">بالطموح</span>
              <svg className="absolute -bottom-2 inset-x-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M3 9C50 3 100 1 150 3C200 5 250 3 297 9" stroke="url(#u1)" strokeWidth="4" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="u1" x1="0" y1="0" x2="300" y2="0">
                    <stop stopColor="#0d9488"/>
                    <stop offset="1" stopColor="#059669"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            {" "}داخل مؤسستك
          </h1>

          <p className="text-center text-xl text-slate-500 mt-8 max-w-2xl mx-auto leading-relaxed font-normal">
            روافد تُطابق الموظفين بالمرشدين المناسبين تلقائياً، وتُدير رحلة الإرشاد كاملة —
            من أول جلسة حتى تحقيق الهدف.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/ar/login"
              className="group flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 hover:-translate-y-0.5"
            >
              ابدأ مجاناً اليوم
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-6 py-4 rounded-xl hover:bg-slate-50 transition-colors text-lg"
            >
              كيف يعمل؟
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-slate-400">
            {["بدون بطاقة ائتمان", "إعداد في 5 دقائق", "دعم عربي كامل"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero Dashboard Mockup */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
            {/* Browser chrome */}
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 mx-4 bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400 text-center">
                rawafid-platform.vercel.app
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="bg-slate-50 p-6 min-h-72">
              <div className="flex gap-4 mb-5">
                {[
                  { label: "المستخدمون", val: "1,247", color: "bg-teal-500" },
                  { label: "المرشدون", val: "89", color: "bg-emerald-500" },
                  { label: "الجلسات", val: "342", color: "bg-blue-500" },
                  { label: "نسبة الرضا", val: "94%", color: "bg-violet-500" },
                ].map((s, i) => (
                  <div key={i} className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className={`w-8 h-1 ${s.color} rounded-full mb-3`} />
                    <div className="text-2xl font-bold text-slate-900">{s.val}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="text-sm font-semibold text-slate-700 mb-3">المرشدون المقترحون</div>
                  {[
                    { name: "م. خالد العتيبي", role: "التحول الرقمي", score: 94 },
                    { name: "د. نورة الشمري", role: "تطوير المواهب", score: 89 },
                    { name: "أ. فهد الدوسري", role: "التخطيط الاستراتيجي", score: 85 },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                          {m.name.split(" ")[1]?.[0] ?? "م"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{m.name}</div>
                          <div className="text-xs text-slate-400">{m.role}</div>
                        </div>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">{m.score}%</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="text-sm font-semibold text-slate-700 mb-3">نشاط الأسبوع</div>
                  <div className="flex items-end gap-1.5 h-24">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 bg-teal-100 rounded-sm relative overflow-hidden">
                        <div
                          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-teal-600 to-teal-400 rounded-sm"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                    {["أح", "إث", "ثل", "أر", "خم", "جم", "سب"].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating cards */}
          <div className="absolute -right-8 top-16 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-52 hidden lg:block rotate-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">تمت المطابقة!</div>
                <div className="text-[10px] text-slate-400">قبل دقيقتين</div>
              </div>
            </div>
            <div className="text-xs text-slate-600">نسبة التوافق <span className="font-bold text-teal-600">92%</span> مع د. نورة الشمري</div>
          </div>
          <div className="absolute -left-8 bottom-16 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-52 hidden lg:block -rotate-2">
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">"أفضل استثمار في مسيرتي المهنية"</div>
            <div className="text-[10px] text-slate-400 mt-1">— متدرب في الهيئة</div>
          </div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section id="stats" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: "+85%", label: "نسبة رضا المتدربين", sub: "عن جودة المطابقة" },
              { num: "3×", label: "متوسط الجلسات المكتملة", sub: "لكل علاقة إرشاد" },
              { num: "<3ث", label: "وقت استجابة الخوارزمية", sub: "لحساب نتائج المطابقة" },
              { num: "100%", label: "بيانات موظفين مبدئية", sub: "جاهزة للاختبار" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{s.num}</div>
                <div className="text-slate-300 font-semibold text-sm">{s.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm">المميزات الأساسية</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2 leading-tight">
              كل ما تحتاجه للإرشاد المؤسسي
            </h2>
            <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto">
              منصة متكاملة تُغطي كامل دورة حياة الإرشاد المهني داخل مؤسستك
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                color: "bg-amber-50 text-amber-600",
                title: "مطابقة ذكية فورية",
                desc: "خوارزمية تحسب درجة التوافق بين المتدرب والمرشد بناءً على 5 معايير: التخصص، المهارات، الخبرة، التوفر، والتقييمات السابقة.",
                badge: "AI-Powered",
                badgeColor: "bg-amber-100 text-amber-700",
              },
              {
                icon: Users,
                color: "bg-teal-50 text-teal-600",
                title: "إدارة علاقات الإرشاد",
                desc: "نظام متكامل لإدارة طلبات الإرشاد، قبول/رفض المرشدين، وتتبع جميع العلاقات النشطة في لوحة واحدة.",
                badge: "Multi-Tenant",
                badgeColor: "bg-teal-100 text-teal-700",
              },
              {
                icon: BookOpen,
                color: "bg-violet-50 text-violet-600",
                title: "جلسات منظمة بأجندة",
                desc: "جدولة الجلسات بالتفاصيل الكاملة، إضافة أجندة مشتركة قبل الجلسة، وتوثيق الملاحظات والملخصات بعدها.",
                badge: "Phase 2",
                badgeColor: "bg-violet-100 text-violet-700",
              },
              {
                icon: TrendingUp,
                color: "bg-emerald-50 text-emerald-600",
                title: "خطط التطوير الفردية",
                desc: "أهداف ومعالم قابلة للقياس لكل علاقة إرشاد، مع لوحة تقدم بصرية تُحفّز المتدرب وتُبقي المرشد على المستجدات.",
                badge: "Phase 3",
                badgeColor: "bg-emerald-100 text-emerald-700",
              },
              {
                icon: BarChart3,
                color: "bg-blue-50 text-blue-600",
                title: "تقارير HR متقدمة",
                desc: "لوحة إدارة بمؤشرات KPI دقيقة: نسبة تسجيل المرشدين، معدل إكمال الأهداف، متوسط التقييمات، وأكثر المجالات طلباً.",
                badge: "Analytics",
                badgeColor: "bg-blue-100 text-blue-700",
              },
              {
                icon: Shield,
                color: "bg-rose-50 text-rose-600",
                title: "أمان وعزل بيانات",
                desc: "بنية Multi-Tenant مع Row Level Security في PostgreSQL، RBAC صارم، وتوافق كامل مع نظام حماية البيانات الشخصية PDPL.",
                badge: "PDPL Ready",
                badgeColor: "bg-rose-100 text-rose-700",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-5`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{f.title}</h3>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${f.badgeColor}`}>{f.badge}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section id="how" className="py-24 bg-gradient-to-b from-slate-50 to-white px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm">الرحلة</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2">كيف يعمل روافد؟</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-10 right-10 left-10 h-px bg-gradient-to-l from-transparent via-teal-200 to-transparent hidden md:block" />

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "١",
                  icon: "👤",
                  title: "سجّل ملفك",
                  desc: "أضف تخصصاتك ومهاراتك وأوقات توفرك في دقائق",
                },
                {
                  step: "٢",
                  icon: "🤝",
                  title: "اعتماد المرشد",
                  desc: "مسؤول الجهة يراجع الطلب ويعتمده بضغطة واحدة",
                },
                {
                  step: "٣",
                  icon: "⚡",
                  title: "مطابقة فورية",
                  desc: "الخوارزمية تقترح أنسب المرشدين مرتّبين بنسبة التوافق",
                },
                {
                  step: "٤",
                  icon: "🚀",
                  title: "ابدأ رحلتك",
                  desc: "جلسات، أهداف، وتقدم موثّق نحو تطوير مهني حقيقي",
                },
              ].map((s, i) => (
                <div key={i} className="text-center relative">
                  <div className="relative inline-flex">
                    <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-3xl shadow-sm mx-auto mb-5 relative z-10">
                      {s.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center z-20">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900">ماذا يقول المستخدمون؟</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "د. نورة الشمري",
                role: "مديرة تطوير المواهب — مرشدة",
                text: "روافد غيّر طريقة عملي كمرشدة. أستطيع الآن إدارة 5 متدربين بكفاءة عالية، مع رؤية واضحة لتقدم كل واحد منهم.",
                rating: 5,
                avatar: "ن",
                color: "from-teal-400 to-teal-600",
              },
              {
                name: "م. خالد العتيبي",
                role: "مدير التحول الرقمي — مرشد",
                text: "الخوارزمية ذكية بشكل مدهش. كل المتدربين الذين طابقتهم المنصة كان بيننا توافق حقيقي منذ الجلسة الأولى.",
                rating: 5,
                avatar: "خ",
                color: "from-emerald-400 to-emerald-600",
              },
              {
                name: "أ. بدر العسيري",
                role: "محلل استراتيجي — متدرب",
                text: "في 3 أشهر مع مرشدي، حققت ما لم أحققه في 3 سنوات من التعلم الذاتي. المنصة تنظّم الرحلة بطريقة محترفة جداً.",
                rating: 5,
                avatar: "ب",
                color: "from-violet-400 to-violet-600",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== MATCHING HIGHLIGHT ====== */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-teal-400 font-semibold text-sm">الخوارزمية الذكية</span>
              <h2 className="text-4xl font-black text-white mt-3 leading-tight">
                مطابقة دقيقة لا مجرد بحث
              </h2>
              <p className="text-slate-400 mt-4 leading-relaxed">
                لا تعتمد على الكلمات المفتاحية. روافد يحسب درجة توافق حقيقية بناءً على معايير موزونة ومُدرَسة.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { label: "تطابق التخصص", pct: 30, color: "bg-teal-500" },
                  { label: "تقاطع المهارات", pct: 25, color: "bg-emerald-500" },
                  { label: "مستوى الخبرة", pct: 20, color: "bg-cyan-500" },
                  { label: "توافق التوفر", pct: 15, color: "bg-violet-500" },
                  { label: "التقييمات السابقة", pct: 10, color: "bg-amber-500" },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300">{m.label}</span>
                      <span className="text-slate-400 font-mono">{m.pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full`}
                        style={{ width: `${m.pct * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="text-slate-400 text-xs mb-4 font-mono">// نتائج المطابقة</div>
              {[
                { name: "م. خالد العتيبي", area: "التحول الرقمي", score: 94, active: true },
                { name: "أ. فهد الدوسري", area: "التخطيط الاستراتيجي", score: 87 },
                { name: "د. عبدالرحمن القرشي", area: "الاستراتيجية", score: 81 },
                { name: "أ. شيماء الجهني", area: "إدارة التغيير", score: 76 },
              ].map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl mb-2 last:mb-0 ${r.active ? "bg-teal-600/20 border border-teal-500/30" : "hover:bg-slate-700/30"} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                      {r.name.split(" ")[1]?.[0] ?? "م"}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{r.name}</div>
                      <div className="text-slate-400 text-xs">{r.area}</div>
                    </div>
                  </div>
                  <div className={`font-black text-lg ${r.score >= 90 ? "text-emerald-400" : r.score >= 80 ? "text-teal-400" : "text-slate-400"}`}>
                    {r.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA SECTION ====== */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50 -z-10" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent" />
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl mb-8 shadow-2xl shadow-teal-200">
            <Waves className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
            ابدأ رحلة الإرشاد<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-600 to-emerald-500">في مؤسستك اليوم</span>
          </h2>
          <p className="text-xl text-slate-500 mt-6 leading-relaxed">
            جاهز للاستخدام الفوري مع بيانات اختبارية واقعية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/ar/login"
              className="group flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl shadow-teal-200 hover:shadow-2xl hover:shadow-teal-300 hover:-translate-y-1"
            >
              جرّب المنصة مجاناً
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/ar/login"
              className="flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700 font-bold px-10 py-4 rounded-xl text-lg transition-all hover:bg-teal-50"
            >
              دخول الإدارة
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-6">
            حساب Admin التجريبي: <span className="font-mono text-slate-600">admin@goid.gov.sa</span> / <span className="font-mono text-slate-600">Rawafid@2024</span>
          </p>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-bold">روافد</div>
                <div className="text-xs">منصة الإرشاد المهني الذكي</div>
              </div>
            </div>
            <div className="text-sm text-center">
              مبني بـ Next.js 15 · Neon · tRPC · TypeScript
            </div>
            <div className="text-sm">
              © 2026 روافد — جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
