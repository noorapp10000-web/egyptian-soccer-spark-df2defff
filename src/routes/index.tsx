import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  MapPin,
  Trophy,
  Users,
  Newspaper,
  Radio,
  RefreshCw,
  ExternalLink,
  Shield,
  Shirt,
  Goal,
  Star,
  Flag,
} from "lucide-react";

import {
  getMatches,
  getSquad,
  getStandings,
  getNews,
  getMatchDetail,
} from "@/lib/hub.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MatchesData = Awaited<ReturnType<typeof getMatches>>;
type Match = MatchesData["matches"][number];
type SquadData = Awaited<ReturnType<typeof getSquad>>;
type StandingsData = Awaited<ReturnType<typeof getStandings>>;
type NewsData = Awaited<ReturnType<typeof getNews>>;
type DetailData = Awaited<ReturnType<typeof getMatchDetail>>;
type Source = MatchesData["source"];

const CREST =
  "https://semedia.filgoal.com/Photos/Team/Medium/8.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المصري بورسعيد | مباريات وأخبار وترتيب لحظة بلحظة" },
      {
        name: "description",
        content:
          "مركز النادي المصري البورسعيدي: نتائج ومباريات الموسم 2026-2027، جدول ترتيب الدوري، قائمة اللاعبين والهدافين، وآخر الأخبار من فيل جول ويلا كورة.",
      },
      { property: "og:title", content: "المصري بورسعيد | Egyptian Football Hub" },
      {
        property: "og:description",
        content:
          "نتائج ومباريات المصري، ترتيب الدوري، اللاعبون والأخبار — بيانات حية من فيل جول ويلا كورة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HubPage,
});

/* ------------------------------- عناصر مشتركة ------------------------------ */

function SourceNote({ source }: { source?: Source | undefined }) {
  if (!source) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {source.status === "live" ? (
        <Radio className="size-3.5 text-primary" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
      المصدر: {source.name} · آخر مزامنة{" "}
      {new Date(source.fetchedAt).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      })}
      {source.status === "cached" && " (نسخة محفوظة)"}
    </p>
  );
}

function TeamMark({ name, crestUrl }: { name: string; crestUrl: string | null }) {
  return (
    <span className="flex flex-col items-center gap-1.5 min-w-16">
      {crestUrl ? (
        <img src={crestUrl} alt={name} className="size-10 object-contain" loading="lazy" />
      ) : (
        <Shield className="size-8 text-muted-foreground" />
      )}
      <span className="text-xs font-semibold leading-tight text-center">{name}</span>
    </span>
  );
}

function StatusBadge({ match }: { match: Match }) {
  if (match.status === "live")
    return <Badge className="bg-destructive text-destructive-foreground animate-pulse">مباشر</Badge>;
  if (match.status === "finished")
    return <Badge variant="secondary">انتهت</Badge>;
  if (match.status === "postponed")
    return <Badge variant="outline">مؤجلة</Badge>;
  return <Badge className="bg-primary/15 text-primary border-primary/30">قادمة</Badge>;
}

/* --------------------------------- المباريات -------------------------------- */

function MatchCard({ match, onOpen }: { match: Match; onOpen: (m: Match) => void }) {
  const played = match.homeScore != null && match.awayScore != null;
  return (
    <button
      onClick={() => onOpen(match)}
      className="w-full text-start rounded-xl border bg-card card-sheen p-4 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Trophy className="size-3.5 text-gold" />
          {match.competition}
        </span>
        <StatusBadge match={match} />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamMark {...match.homeTeam} />
        <div className="text-center">
          {played ? (
            <p className="text-3xl font-black tabular-nums tracking-tight">
              {match.homeScore} - {match.awayScore}
            </p>
          ) : (
            <p className="text-lg font-extrabold text-muted-foreground">VS</p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">{match.statusText}</p>
        </div>
        <TeamMark {...match.awayTeam} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {match.kickoffText && (
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {match.kickoffText}
          </span>
        )}
        {match.venue && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {match.venue}
          </span>
        )}
      </div>
    </button>
  );
}

function MatchesSection({ onOpen }: { onOpen: (m: Match) => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["matches"],
    queryFn: () => getMatches(),
  });

  if (isLoading) return <SectionSkeleton cards={4} />;
  if (isError || !data)
    return <p className="text-sm text-muted-foreground">تعذر تحميل المباريات الآن، حاول لاحقًا.</p>;

  const upcoming = data.matches.filter((m) => m.status === "upcoming" || m.status === "postponed");
  const played = data.matches.filter((m) => m.status === "finished" || m.status === "live");

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">المباريات القادمة ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="results">النتائج ({played.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 grid gap-3 sm:grid-cols-2">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد مباريات قادمة معلنة حاليًا.</p>
          )}
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} onOpen={onOpen} />
          ))}
        </TabsContent>
        <TabsContent value="results" className="mt-4 grid gap-3 sm:grid-cols-2">
          {played.map((m) => (
            <MatchCard key={m.id} match={m} onOpen={onOpen} />
          ))}
        </TabsContent>
      </Tabs>
      <SourceNote source={data.source} />
    </div>
  );
}

/* ------------------------------- تفاصيل مباراة ------------------------------ */

const EVENT_LABEL: Record<string, string> = {
  goal: "هدف",
  "own-goal": "هدف عكسي",
  penalty: "ضربة جزاء",
  "missed-penalty": "ضربة جزاء ضائعة",
  "yellow-card": "بطاقة صفراء",
  "red-card": "بطاقة حمراء",
  substitution: "تبديل",
};

function MatchDetailDialog({
  match,
  onClose,
}: {
  match: Match | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["match-detail", match?.matchId],
    queryFn: () => getMatchDetail({ data: { matchId: match!.matchId } }),
    enabled: match != null,
  });
  const detail: DetailData["match"] | undefined = data?.match;

  return (
    <Dialog open={match != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="size-4 text-gold" />
            {match?.competition}
          </DialogTitle>
        </DialogHeader>
        {match && (
          <div className="rounded-xl border bg-secondary/40 p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <TeamMark {...match.homeTeam} />
              <p className="text-3xl font-black tabular-nums">
                {match.homeScore != null ? `${match.homeScore} - ${match.awayScore}` : "VS"}
              </p>
              <TeamMark {...match.awayTeam} />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {match.kickoffText} {match.venue ? `· ${match.venue}` : ""}
            </p>
          </div>
        )}

        {isLoading && <SectionSkeleton cards={2} />}
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {detail.stadium && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {detail.stadium}
                </span>
              )}
              {detail.referee && (
                <span className="flex items-center gap-1">
                  <Flag className="size-3.5" /> الحكم: {detail.referee}
                </span>
              )}
              {detail.homeCoach && <span>مدرب {detail.homeTeam.name}: {detail.homeCoach}</span>}
              {detail.awayCoach && <span>مدرب {detail.awayTeam.name}: {detail.awayCoach}</span>}
              {detail.tvChannels.length > 0 && <span>القنوات: {detail.tvChannels.join("، ")}</span>}
            </div>

            {detail.events.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                  <Goal className="size-4 text-primary" /> أحداث المباراة
                </h4>
                <ul className="space-y-1.5">
                  {detail.events.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {EVENT_LABEL[e.type] ?? e.type}
                        </Badge>
                        <span>{e.player ?? "—"}</span>
                        {e.relatedPlayer && (
                          <span className="text-xs text-muted-foreground">({e.relatedPlayer})</span>
                        )}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-muted-foreground">
                        {e.minute != null ? `${e.minute}’` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(detail.lineups.home.length > 0 || detail.lineups.away.length > 0) && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                  <Shirt className="size-4 text-primary" /> التشكيل
                  {detail.homeFormation && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({detail.homeFormation} ضد {detail.awayFormation})
                    </span>
                  )}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      [detail.homeTeam.name, detail.lineups.home, detail.lineups.homeBench],
                      [detail.awayTeam.name, detail.lineups.away, detail.lineups.awayBench],
                    ] as const
                  ).map(([teamName, starters, bench]) => (
                    <div key={teamName} className="rounded-lg border bg-card p-3">
                      <p className="mb-2 text-xs font-bold text-primary">{teamName}</p>
                      <ul className="space-y-1 text-sm">
                        {starters.map((p) => (
                          <li key={p.id} className="flex items-center gap-2">
                            <span className="w-6 text-center text-xs tabular-nums text-muted-foreground">
                              {p.number ?? "—"}
                            </span>
                            <span>{p.name}</span>
                            {p.isCaptain && <Star className="size-3 text-gold" />}
                          </li>
                        ))}
                      </ul>
                      {bench.length > 0 && (
                        <>
                          <p className="mt-3 mb-1 text-[11px] font-semibold text-muted-foreground">
                            البدلاء
                          </p>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {bench.map((p) => (
                              <li key={p.id} className="flex items-center gap-2">
                                <span className="w-6 text-center tabular-nums">{p.number ?? "—"}</span>
                                <span>{p.name}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SourceNote source={data?.source} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- الترتيب ---------------------------------- */

function StandingsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["standings"],
    queryFn: () => getStandings(),
  });

  if (isLoading) return <SectionSkeleton cards={2} />;
  if (isError || !data)
    return <p className="text-sm text-muted-foreground">تعذر تحميل جدول الترتيب الآن.</p>;

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-start">#</TableHead>
                <TableHead className="text-start">الفريق</TableHead>
                <TableHead className="text-center">لعب</TableHead>
                <TableHead className="text-center">فاز</TableHead>
                <TableHead className="text-center">تعادل</TableHead>
                <TableHead className="text-center">خسر</TableHead>
                <TableHead className="text-center">له/عليه</TableHead>
                <TableHead className="text-center font-bold">نقاط</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.standings.map((row) => (
                <TableRow
                  key={row.rank}
                  className={row.isMasry ? "bg-primary/10 font-bold" : undefined}
                >
                  <TableCell className="tabular-nums">{row.rank}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {row.team.crestUrl ? (
                        <img
                          src={row.team.crestUrl}
                          alt={row.team.name}
                          className="size-6 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <Shield className="size-4 text-muted-foreground" />
                      )}
                      {row.team.name}
                      {row.isMasry && <Badge className="bg-primary text-primary-foreground">المصري</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{row.played}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.won}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.drawn}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.lost}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    {row.goalsFor}/{row.goalsAgainst}
                  </TableCell>
                  <TableCell className="text-center font-black tabular-nums text-primary">
                    {row.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SourceNote source={data.source} />
    </div>
  );
}

/* --------------------------------- اللاعبون --------------------------------- */

function SquadSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["squad"],
    queryFn: () => getSquad(),
  });

  if (isLoading) return <SectionSkeleton cards={6} />;
  if (isError || !data)
    return <p className="text-sm text-muted-foreground">تعذر تحميل قائمة اللاعبين الآن.</p>;

  const topScorers = data.players
    .filter((p) => (p.goals ?? 0) > 0)
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {data.coach?.name && (
        <Card className="card-sheen">
          <CardContent className="flex items-center gap-4 p-4">
            {data.coach.photoUrl ? (
              <img
                src={data.coach.photoUrl}
                alt={data.coach.name}
                className="size-16 rounded-full border-2 border-gold object-cover"
                loading="lazy"
              />
            ) : (
              <Users className="size-10 text-muted-foreground" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">{data.coach.role}</p>
              <p className="text-lg font-extrabold">{data.coach.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {topScorers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Goal className="size-4 text-gold" /> الهدافون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topScorers.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-5 text-center font-black text-gold tabular-nums">{i + 1}</span>
                  {p.photoUrl && (
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="size-8 rounded-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className="font-semibold">{p.name}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {p.goals} هدف · {p.appearances ?? "—"} مباراة
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {data.players.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="group rounded-xl border bg-card card-sheen p-3 text-center transition-colors hover:bg-accent/60"
          >
            {p.photoUrl ? (
              <img
                src={p.photoUrl}
                alt={p.name}
                className="mx-auto size-16 rounded-full border object-cover"
                loading="lazy"
              />
            ) : (
              <span className="mx-auto flex size-16 items-center justify-center rounded-full border bg-secondary">
                <Shirt className="size-6 text-muted-foreground" />
              </span>
            )}
            <p className="mt-2 text-sm font-bold leading-tight group-hover:text-primary">
              {p.name}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {p.number != null ? `#${p.number} · ` : ""}
              {p.position}
            </p>
            {(p.goals ?? 0) > 0 && (
              <Badge variant="outline" className="mt-1.5 text-[10px]">
                {p.goals} هدف
              </Badge>
            )}
          </a>
        ))}
      </div>
      <SourceNote source={data.source} />
    </div>
  );
}

/* ---------------------------------- الأخبار ---------------------------------- */

function NewsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["news"],
    queryFn: () => getNews(),
  });

  if (isLoading) return <SectionSkeleton cards={4} />;
  if (isError || !data)
    return <p className="text-sm text-muted-foreground">تعذر تحميل الأخبار الآن.</p>;
  if (data.news.length === 0)
    return <p className="text-sm text-muted-foreground">لا توجد أخبار جديدة عن النادي المصري حاليًا.</p>;


  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {data.news.map((item: NewsData["news"][number]) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex gap-3 rounded-xl border bg-card card-sheen p-3 transition-colors hover:bg-accent/60"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                className="size-20 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug group-hover:text-primary line-clamp-2">
                {item.title}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">
                  {item.sourceName}
                </Badge>
                {item.publishedText}
                <ExternalLink className="size-3" />
              </div>
            </div>
          </a>
        ))}
      </div>
      <SourceNote source={data.source} />
    </div>
  );
}

/* ---------------------------------- الصفحة ---------------------------------- */

function SectionSkeleton({ cards }: { cards: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

function SectionTitle({ icon, title, id }: { icon: React.ReactNode; title: string; id: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-xl font-black tracking-tight scroll-mt-6">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      {title}
    </h2>
  );
}

function HubPage() {
  const [selected, setSelected] = useState<Match | null>(null);

  return (
    <div className="min-h-screen pitch-lines">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <img src={CREST} alt="شعار النادي المصري" className="size-10 object-contain" />
          <div>
            <h1 className="text-lg font-black leading-tight">النادي المصري البورسعيدي</h1>
            <p className="text-[11px] text-muted-foreground">
              مركز المباريات والأخبار · موسم 2026-2027
            </p>
          </div>
          <nav className="ms-auto hidden gap-4 text-xs font-semibold text-muted-foreground sm:flex">
            <a href="#matches" className="hover:text-primary">المباريات</a>
            <a href="#standings" className="hover:text-primary">الترتيب</a>
            <a href="#squad" className="hover:text-primary">اللاعبون</a>
            <a href="#news" className="hover:text-primary">الأخبار</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        <section className="space-y-4">
          <SectionTitle id="matches" icon={<CalendarDays className="size-5" />} title="المباريات" />
          <MatchesSection onOpen={setSelected} />
        </section>

        <section className="space-y-4">
          <SectionTitle id="standings" icon={<Trophy className="size-5" />} title="جدول الدوري" />
          <StandingsSection />
        </section>

        <section className="space-y-4">
          <SectionTitle id="squad" icon={<Users className="size-5" />} title="اللاعبون والجهاز الفني" />
          <SquadSection />
        </section>

        <section className="space-y-4">
          <SectionTitle id="news" icon={<Newspaper className="size-5" />} title="آخر الأخبار" />
          <NewsSection />
        </section>

        <footer className="border-t pt-4 pb-8 text-center text-[11px] text-muted-foreground">
          البيانات من FilGoal وYallakora وتُحدَّث تلقائيًا · غير تابع رسميًا للنادي
        </footer>
      </main>

      <MatchDetailDialog match={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
