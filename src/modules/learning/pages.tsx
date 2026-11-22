import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { formatMinutes } from "@/components/activity/log-item";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/planning/delete-button";
import { GoalRow } from "@/components/planning/goal-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { addDays, formatDay, localInputValue, startOfDayIso } from "@/core/planning/dates";
import { getGoalOptions, getGoalProgressList, getTimeZone, getToday } from "@/core/planning/queries";
import { weekStart } from "@/core/reviews/periods";
import { getWeekStartsOn } from "@/core/reviews/queries";
import { cn } from "@/lib/utils";

import { deleteAssessment, deleteCourse, deleteSession, deleteSkill, setCourseStatus } from "./actions";
import { CourseForm } from "./components/course-form";
import { SessionForm } from "./components/session-form";
import { AssessmentForm, SkillForm } from "./components/skill-forms";
import { WeekBars } from "./components/week-bars";
import { vocabViews } from "./vocab/pages";
import {
  COURSE_STATUSES,
  getCourse,
  getCourses,
  getLearningAreaId,
  getMinutesByCourse,
  getSession,
  getSessions,
  getSkill,
  getSkillOptions,
  getSkills,
  getWeeklyHours,
  type Course,
  type StudySession,
} from "./queries";

type T = Awaited<ReturnType<typeof getTranslations>>;
type SearchParams = Record<string, string | string[] | undefined>;
const back = (t: T) => ({ href: "/learning", label: t("areas.learning") });
const hours = (t: T, min: number) => formatMinutes(min, t);

function Levels({ current, target, label }: { current: number | null; target: number | null; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={label} title={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "size-2.5 rounded-full border",
            current != null && n <= current ? "bg-primary border-primary" : "border-muted-foreground/40",
            target === n && "ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-background",
          )}
        />
      ))}
    </span>
  );
}

async function courseOptions() {
  const courses = await getCourses();
  return courses.filter((c) => c.status === "in_progress" || c.status === "planned").map((c) => ({ id: c.id, name: c.title }));
}

async function skillOptions() {
  return (await getSkillOptions()).map((s) => ({ id: s.id, name: s.name }));
}

/** Sessions grouped by local day, newest first. */
async function SessionList({ sessions, next, courses }: { sessions: StudySession[]; next: string; courses?: Map<string, string> }) {
  const [t, tz, locale, today] = await Promise.all([getTranslations(), getTimeZone(), getLocale(), getToday()]);
  if (sessions.length === 0) return <p className="text-muted-foreground text-sm">{t("learning.noSessions")}</p>;
  const dayOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));
  const days = Array.from(new Set(sessions.map((s) => dayOf(s.occurred_at))));
  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => {
        const items = sessions.filter((s) => dayOf(s.occurred_at) === day);
        return (
          <div key={day}>
            <h3 className="text-muted-foreground mb-1 flex justify-between text-xs font-medium">
              <span>{day === today ? t("home.today") : formatDay(day, locale, today)}</span>
              <span>{hours(t, items.reduce((s, x) => s + x.duration_min, 0))}</span>
            </h3>
            <ul className="divide-y">
              {items.map((s) => (
                <li key={s.id}>
                  <Link href={`/learning/sessions/${s.id}?next=${encodeURIComponent(next)}`} className="hover:bg-accent/60 -mx-2 flex items-baseline gap-3 rounded-md px-2 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{s.topic}</span>
                      {(s.course_id && courses?.get(s.course_id)) || s.notes ? (
                        <span className="text-muted-foreground block truncate text-xs">
                          {[s.course_id && courses?.get(s.course_id), s.notes].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                    {s.focus_rating && <span className="text-muted-foreground text-xs">{t("learning.focusShort", { value: s.focus_rating })}</span>}
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{hours(t, s.duration_min)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function CourseRow({ course, minutes, t }: { course: Course; minutes: number; t: T }) {
  const pct = course.est_hours ? minutes / 60 / course.est_hours : null;
  return (
    <li>
      <Link href={`/learning/courses/${course.id}`} className="hover:bg-accent/60 -mx-2 flex flex-col gap-1.5 rounded-md px-2 py-2.5">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-medium">{course.title}</span>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {course.est_hours ? `${Math.round((minutes / 60) * 10) / 10} / ${course.est_hours} h` : minutes ? hours(t, minutes) : ""}
          </span>
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {[course.provider, t(`learning.format.${course.format}`)].filter(Boolean).join(" · ")}
        </span>
        {pct != null && course.status === "in_progress" && <Progress value={pct} label={course.title} className="h-1.5" />}
      </Link>
    </li>
  );
}

// ---------------- Pages ----------------

async function GoalsPage() {
  const t = await getTranslations();
  const [areaId, today] = await Promise.all([getLearningAreaId(), getToday()]);
  const goals = areaId ? await getGoalProgressList({ lifeAreaId: areaId }) : [];
  return (
    <>
      <PageHeader
        title={`${t("areas.learning")} · ${t("pages.goals")}`}
        back={back(t)}
        actions={
          <Button asChild>
            <Link href="/goals/new?area=learning">
              <Plus />
              {t("planning.newGoal")}
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("module.noGoals")}</p>
          ) : (
            <ul className="flex flex-col">
              {goals.map((g) => (
                <GoalRow key={g.goal_id} goal={g} today={today} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

async function CoursesPage() {
  const t = await getTranslations();
  const [courses, minutes] = await Promise.all([getCourses(), getMinutesByCourse()]);
  return (
    <>
      <PageHeader
        title={t("pages.courses")}
        subtitle={t("learning.coursesSubtitle")}
        back={back(t)}
        actions={
          <Button asChild>
            <Link href="/learning/courses/new">
              <Plus />
              {t("learning.newCourse")}
            </Link>
          </Button>
        }
      />
      {courses.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("learning.noCourses")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {COURSE_STATUSES.map((status) => {
            const items = courses.filter((c) => c.status === status);
            if (!items.length) return null;
            return (
              <Card key={status} className="h-fit">
                <CardHeader>
                  <CardTitle>
                    {t(`learning.status.${status}`)} <span className="text-muted-foreground font-normal">{items.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col">
                    {items.map((c) => (
                      <CourseRow key={c.id} course={c} minutes={minutes.get(c.id) ?? 0} t={t} />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

async function CourseDetail({ id, searchParams }: { id: string; searchParams: SearchParams }) {
  const t = await getTranslations();
  const [skills, goals] = await Promise.all([skillOptions(), getGoalOptions()]);
  const goalOpts = goals.map((g) => ({ id: g.id, name: g.title }));
  if (id === "new") {
    return (
      <>
        <PageHeader title={t("learning.newCourse")} back={{ href: "/learning/courses", label: t("pages.courses") }} />
        <CourseForm skills={skills} goals={goalOpts} cancelHref="/learning/courses" />
      </>
    );
  }
  if (!z.uuid().safeParse(id).success) notFound();
  const course = await getCourse(id);
  if (!course) notFound();
  if (searchParams.edit) {
    return (
      <>
        <PageHeader title={t("learning.editCourse")} back={{ href: `/learning/courses/${id}`, label: course.title }} />
        <CourseForm course={course} skills={skills} goals={goalOpts} cancelHref={`/learning/courses/${id}`} />
      </>
    );
  }
  const [sessions, locale, today] = await Promise.all([getSessions({ courseId: id }), getLocale(), getToday()]);
  const minutes = sessions.reduce((s, x) => s + x.duration_min, 0);
  const skill = skills.find((s) => s.id === course.skill_id);
  const goal = goalOpts.find((g) => g.id === course.goal_id);
  const nextStatus = { planned: ["in_progress"], in_progress: ["completed", "dropped"], completed: ["in_progress"], dropped: ["in_progress"] }[course.status];
  const next = `/learning/courses/${id}`;

  return (
    <>
      <PageHeader
        title={course.title}
        back={{ href: "/learning/courses", label: t("pages.courses") }}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={course.status === "completed" ? "success" : course.status === "in_progress" ? "default" : "secondary"}>
              {t(`learning.status.${course.status}`)}
            </Badge>
            {[course.provider, t(`learning.format.${course.format}`)].filter(Boolean).join(" · ")}
            {course.url && (
              <a href={course.url} target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline">
                <ExternalLink className="size-3.5" />
                {t("learning.open")}
              </a>
            )}
          </span>
        }
        actions={
          <>
            {nextStatus.map((s) => (
              <form key={s} action={setCourseStatus}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={s} />
                <Button type="submit" size="sm" variant={s === "completed" ? "default" : "outline"}>
                  {t(`learning.statusAction.${s}`)}
                </Button>
              </form>
            ))}
            <Button asChild variant="outline" size="sm">
              <Link href={`${next}?edit=1`}>
                <Pencil />
                {t("planning.edit")}
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {course.status !== "completed" && course.status !== "dropped" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("learning.logSession")}</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionForm courses={[{ id, name: course.title }]} skills={skills} defaultCourseId={id} defaultSkillId={course.skill_id ?? undefined} compact />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.sessions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionList sessions={sessions} next={next} />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("learning.progress")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="text-2xl font-semibold tabular-nums">
                {hours(t, minutes)}
                {course.est_hours ? <span className="text-muted-foreground text-sm font-normal"> / {course.est_hours} h</span> : null}
              </div>
              {course.est_hours ? <Progress value={minutes / 60 / course.est_hours} label={t("learning.progress")} /> : null}
              <dl className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                <dt>{t("learning.fields.startedOn")}</dt>
                <dd>{course.started_on ? formatDay(course.started_on, locale, today) : "–"}</dd>
                <dt>{t("learning.fields.completedOn")}</dt>
                <dd>{course.completed_on ? formatDay(course.completed_on, locale, today) : "–"}</dd>
                <dt>{t("learning.fields.skill")}</dt>
                <dd>{skill ? <Link href={`/learning/skills/${skill.id}`} className="hover:underline">{skill.name}</Link> : "–"}</dd>
                <dt>{t("planning.fields.goal")}</dt>
                <dd>{goal ? <Link href={`/goals/${goal.id}`} className="hover:underline">{goal.name}</Link> : "–"}</dd>
              </dl>
            </CardContent>
          </Card>
          <DeleteButton action={deleteCourse} id={id} label={t("learning.deleteCourse")} />
        </div>
      </div>
    </>
  );
}

async function SessionsPage() {
  const t = await getTranslations();
  const [today, weekStartsOn, tz, locale, courses, skills, allCourses] = await Promise.all([
    getToday(),
    getWeekStartsOn(),
    getTimeZone(),
    getLocale(),
    courseOptions(),
    skillOptions(),
    getCourses(),
  ]);
  const [weeks, sessions] = await Promise.all([
    getWeeklyHours(today, weekStart(today, weekStartsOn)),
    getSessions({ since: startOfDayIso(addDays(today, -90), tz) }),
  ]);
  const thisWeek = weeks.at(-1)?.minutes ?? 0;
  const lastWeek = weeks.at(-2)?.minutes ?? 0;
  const courseNames = new Map(allCourses.map((c) => [c.id, c.title]));

  return (
    <>
      <PageHeader title={t("pages.sessions")} subtitle={t("learning.sessionsSubtitle")} back={back(t)} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("learning.logSession")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionForm courses={courses} skills={skills} compact />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("learning.last90")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionList sessions={sessions} next="/learning/sessions" courses={courseNames} />
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("learning.hoursPerWeek")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{hours(t, thisWeek)}</span>
              <span className="text-muted-foreground text-xs">{t("learning.lastWeek", { value: hours(t, lastWeek) })}</span>
            </div>
            <WeekBars
              weeks={weeks}
              label={t("learning.hoursPerWeek")}
              formatWeek={(d) => formatDay(d, locale, today)}
              formatHours={(m) => hours(t, m)}
            />
            <Link href="/metrics" className="text-muted-foreground hover:text-foreground text-xs">
              {t("learning.metricHint")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

async function SessionDetail({ id, searchParams }: { id: string; searchParams: SearchParams }) {
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations();
  const [session, tz, courses, skills, all] = await Promise.all([getSession(id), getTimeZone(), courseOptions(), skillOptions(), getCourses()]);
  if (!session) notFound();
  const nextParam = typeof searchParams.next === "string" && searchParams.next.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/learning/sessions";
  // Keep the session's own course in the list even if it is finished.
  const own = all.find((c) => c.id === session.course_id);
  const courseOpts = own && !courses.some((c) => c.id === own.id) ? [...courses, { id: own.id, name: own.title }] : courses;
  return (
    <>
      <PageHeader title={t("learning.editSession")} back={{ href: nextParam, label: t("planning.back") }} />
      <div className="flex max-w-2xl flex-col gap-8">
        <SessionForm
          session={session}
          occurredLocal={localInputValue(session.occurred_at, tz)}
          courses={courseOpts}
          skills={skills}
          next={nextParam}
          cancelHref={nextParam}
        />
        <form action={deleteSession}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="next" value={nextParam} />
          <details className="group">
            <summary className="text-muted-foreground hover:text-destructive inline-flex cursor-pointer list-none items-center gap-1.5 text-sm [&::-webkit-details-marker]:hidden">
              <Trash2 className="size-4" />
              {t("learning.deleteSession")}
            </summary>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">{t("planning.deleteConfirm")}</span>
              <Button type="submit" variant="destructive" size="sm">
                {t("planning.delete")}
              </Button>
            </div>
          </details>
        </form>
      </div>
    </>
  );
}

async function SkillsPage() {
  const t = await getTranslations();
  const skills = await getSkills();
  return (
    <>
      <PageHeader
        title={t("pages.skills")}
        subtitle={t("learning.skillsSubtitle")}
        back={back(t)}
        actions={
          <Button asChild>
            <Link href="/learning/skills/new">
              <Plus />
              {t("learning.newSkill")}
            </Link>
          </Button>
        }
      />
      {skills.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("learning.noSkills")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {skills.map((s) => (
            <Link key={s.skill_id} href={`/learning/skills/${s.skill_id}`} className="bg-card hover:border-foreground/20 flex flex-col gap-2 rounded-xl border p-4">
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="text-muted-foreground text-xs">{t(`learning.category.${s.category ?? "other"}`)}</span>
                </span>
                <Levels
                  current={s.current_level}
                  target={s.target_level}
                  label={t("learning.levelLabel", { current: s.current_level ?? "–", target: s.target_level ?? "–" })}
                />
              </span>
              <span className="text-muted-foreground text-xs">
                {s.current_level ? t(`learning.levels.l${s.current_level}`) : t("learning.notAssessed")}
                {s.study_minutes > 0 && ` · ${hours(t, s.study_minutes)}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

async function SkillDetail({ id, searchParams }: { id: string; searchParams: SearchParams }) {
  const t = await getTranslations();
  if (id === "new") {
    return (
      <>
        <PageHeader title={t("learning.newSkill")} back={{ href: "/learning/skills", label: t("pages.skills") }} />
        <SkillForm cancelHref="/learning/skills" />
      </>
    );
  }
  if (!z.uuid().safeParse(id).success) notFound();
  const data = await getSkill(id);
  if (!data) notFound();
  const { skill, assessments } = data;
  if (searchParams.edit) {
    return (
      <>
        <PageHeader title={t("learning.editSkill")} back={{ href: `/learning/skills/${id}`, label: skill.name }} />
        <SkillForm skill={skill} cancelHref={`/learning/skills/${id}`} />
      </>
    );
  }
  const [today, locale, sessions, courses] = await Promise.all([getToday(), getLocale(), getSessions({ skillId: id, limit: 100 }), getCourses()]);
  const current = assessments[0]?.level ?? null;
  const minutes = sessions.reduce((s, x) => s + x.duration_min, 0);
  const skillCourses = courses.filter((c) => c.skill_id === id);
  const next = `/learning/skills/${id}`;

  return (
    <>
      <PageHeader
        title={skill.name}
        back={{ href: "/learning/skills", label: t("pages.skills") }}
        subtitle={
          <span className="flex flex-wrap items-center gap-3">
            <span>{t(`learning.category.${skill.category ?? "other"}`)}</span>
            <Levels current={current} target={skill.target_level} label={t("learning.levelLabel", { current: current ?? "–", target: skill.target_level ?? "–" })} />
            <span>
              {current ? t(`learning.levels.l${current}`) : t("learning.notAssessed")}
              {skill.target_level ? ` → ${t(`learning.levels.l${skill.target_level}`)}` : ""}
            </span>
          </span>
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`${next}?edit=1`}>
              <Pencil />
              {t("planning.edit")}
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("learning.assessments")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <AssessmentForm skillId={id} today={today} />
              {assessments.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("learning.noAssessments")}</p>
              ) : (
                <ul className="divide-y">
                  {assessments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="text-muted-foreground w-20 shrink-0 text-xs tabular-nums">{formatDay(a.assessed_on, locale, today)}</span>
                      <span className="font-medium">
                        {a.level} · {t(`learning.levels.l${a.level}`)}
                      </span>
                      <span className="text-muted-foreground min-w-0 flex-1 truncate">{a.evidence}</span>
                      <form action={deleteAssessment}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="text-muted-foreground hover:text-destructive p-1" aria-label={t("learning.deleteAssessment")} title={t("learning.deleteAssessment")}>
                          <Trash2 className="size-4" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-muted-foreground text-xs">{t("learning.levelsHint")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {t("pages.sessions")} <span className="text-muted-foreground font-normal">{hours(t, minutes)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SessionList sessions={sessions} next={next} />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.courses")}</CardTitle>
            </CardHeader>
            <CardContent>
              {skillCourses.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("learning.noSkillCourses")}</p>
              ) : (
                <ul className="flex flex-col">
                  {skillCourses.map((c) => (
                    <li key={c.id}>
                      <Link href={`/learning/courses/${c.id}`} className="hover:bg-accent/60 -mx-2 flex justify-between gap-2 rounded-md px-2 py-1.5 text-sm">
                        <span className="truncate">{c.title}</span>
                        <span className="text-muted-foreground shrink-0 text-xs">{t(`learning.status.${c.status}`)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {skill.notes && (
            <Card>
              <CardContent className="text-sm whitespace-pre-wrap">{skill.notes}</CardContent>
            </Card>
          )}
          <DeleteButton action={deleteSkill} id={id} label={t("learning.deleteSkill")} />
        </div>
      </div>
    </>
  );
}

/** Card on the Learning area page: this week's study time and courses in progress. */
async function Overview() {
  const t = await getTranslations();
  const [today, weekStartsOn, courses, minutesByCourse] = await Promise.all([getToday(), getWeekStartsOn(), getCourses(), getMinutesByCourse()]);
  const weeks = await getWeeklyHours(today, weekStart(today, weekStartsOn), 2);
  const active = courses.filter((c) => c.status === "in_progress");
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("learning.thisWeek")}</CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link href="/learning/sessions">
            <Plus />
            {t("learning.logSession")}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{hours(t, weeks[1]?.minutes ?? 0)}</span>
          <span className="text-muted-foreground text-xs">{t("learning.lastWeek", { value: hours(t, weeks[0]?.minutes ?? 0) })}</span>
        </div>
        {active.length > 0 ? (
          <ul className="flex flex-col">
            {active.map((c) => (
              <CourseRow key={c.id} course={c} minutes={minutesByCourse.get(c.id) ?? 0} t={t} />
            ))}
          </ul>
        ) : (
          <Link href="/learning/courses/new" className="text-muted-foreground hover:text-foreground text-sm">
            {t("learning.noActiveCourses")}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

async function Overviews() {
  return (
    <>
      <vocabViews.Overview />
      <Overview />
    </>
  );
}

export const learningViews = {
  pages: { vocab: vocabViews.page, goals: GoalsPage, courses: CoursesPage, sessions: SessionsPage, skills: SkillsPage },
  detail: { vocab: vocabViews.detail, courses: CourseDetail, sessions: SessionDetail, skills: SkillDetail },
  Overview: Overviews,
};
