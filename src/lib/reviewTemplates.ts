export type ReviewQuestion = {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
};

export type ReviewTemplate = {
  type: "weekly" | "monthly";
  title: string;
  questions: ReviewQuestion[];
};

export const WEEKLY_TEMPLATE: ReviewTemplate = {
  type: "weekly",
  title: "Wochenreview",
  questions: [
    {
      key: "best_trades",
      label: "Was waren meine 3 besten Trades und warum?",
      placeholder: "Beschreibe die Trades, das Setup, deine Entscheidungen...",
      hint: "Du kannst Trades mit #ID verlinken, z. B. #abc123",
    },
    {
      key: "worst_trades",
      label: "Was waren meine 3 schlechtesten Trades und warum?",
      placeholder: "Was ist schiefgelaufen? War es ein Setup-, Execution- oder Psychologie-Problem?",
      hint: "Du kannst Trades mit #ID verlinken, z. B. #abc123",
    },
    {
      key: "winning_setups",
      label: "Welche Setups haben am besten funktioniert?",
      placeholder: "Welche Muster haben sich ausgezahlt? Was war anders als bei den Verlierern?",
    },
    {
      key: "patterns",
      label: "Welche Muster sind mir aufgefallen?",
      placeholder: "Psychologische oder strategische Muster — was wiederholte sich?",
    },
    {
      key: "discipline",
      label: "Habe ich meinen Trading-Plan eingehalten?",
      placeholder: "Wo bist du abgewichen? Was hat dich dazu verleitet?",
    },
    {
      key: "next_week",
      label: "Was nehme ich mir konkret für nächste Woche vor?",
      placeholder: "Konkrete, umsetzbare Vorsätze — nicht zu viele, max. 3.",
    },
    {
      key: "emotional",
      label: "Wie war meine emotionale Verfassung diese Woche?",
      placeholder: "Was hat sie beeinflusst? Stress, Schlaf, externe Faktoren?",
    },
  ],
};

export const MONTHLY_TEMPLATE: ReviewTemplate = {
  type: "monthly",
  title: "Monatsreview",
  questions: [
    {
      key: "performance",
      label: "Wie hat sich meine Performance im Vergleich zu meinen Zielen entwickelt?",
      placeholder: "Hast du deine Ziele erreicht? Was war der Grund für Abweichungen?",
    },
    {
      key: "insights",
      label: "Welche Erkenntnisse haben sich diesen Monat gefestigt?",
      placeholder: "Was weißt du jetzt sicher, was du vorher nur geahnt hast?",
    },
    {
      key: "recurring_issues",
      label: "Welche Probleme treten wiederholt auf?",
      placeholder: "Was ist die gemeinsame Ursache? Wie kannst du sie systematisch lösen?",
    },
    {
      key: "wins",
      label: "Was sind meine größten Lernmomente oder Durchbrüche gewesen?",
      placeholder: "Auch kleine Fortschritte zählen — Disziplin, Geduld, neue Erkenntnisse.",
    },
    {
      key: "next_month_focus",
      label: "Was ist mein klarer Fokus für nächsten Monat?",
      placeholder: "Ein Hauptfokus ist wirksamer als fünf gleichzeitige Baustellen.",
    },
  ],
};

export const TEMPLATES: Record<string, ReviewTemplate> = {
  weekly: WEEKLY_TEMPLATE,
  monthly: MONTHLY_TEMPLATE,
};

export const MONTH_NAMES = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember",
];
