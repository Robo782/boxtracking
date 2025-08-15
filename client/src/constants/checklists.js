// client/src/constants/checklists.js
// Final geprüfte Checklisten (aus deinen Fotos).
// Rein statische Daten + kleine Helper. Keine Seiteneffekte.

export const CHECKLISTS = {
  pure: {
    visual: [
      { nr: 1, title: "Alu-Profile",      desc: "Kantenschutz / Alu-Profile unbeschädigt" },
      { nr: 2, title: "Anfahrschutz",     desc: "Anfahrschutz überall vorhanden und fest montiert (→ ggf. erneut verschrauben/montieren)" },
      { nr: 3, title: "Kufenklötze",      desc: "Alle Kufenklötze vorhanden und fest montiert (→ kurz mit dem Stapler anheben)" },
      { nr: 4, title: "Beschriftungen",   desc: "Alle Beschriftungen und Hinweise lesbar" },
      { nr: 5, title: "Taschen",          desc: "Taschen vorhanden und nicht beschädigt" },
      { nr: 6, title: "Aufkleber",        desc: "Unnötige Aufkleber/Labels von Speditionen entfernen" },
      { nr: 7, title: "Spanngurte",       desc: "Spanngurte ohne Risse (→ einzelne abstehende Fasern unproblematisch)" },
    ],
    functional: [
      { nr: 1, title: "Klappe / Rampe",        desc: "Klappe schließt einwandfrei" },
      { nr: 2, title: "Klappenstütze",         desc: "Klappenstütze unbeschädigt" },
      { nr: 3, title: "Alurampe",              desc: "Alurampe unbeschädigt" },
      { nr: 4, title: "Verschlüsse d. Klappe", desc: "Butterfly Verschlüsse funktionieren einwandfrei" },
      { nr: 5, title: "Bodenplatte",           desc: "Aufnahmen fest mit Dämpfungsplatte verbunden" },
      { nr: 6, title: "Rändelschrauben (a)",   desc: "Sterngriffe / Rändelschrauben vorhanden" },
      { nr: 7, title: "Rändelschrauben (b)",   desc: "Gewinde Rändelschrauben funktioniert einwandfrei" },
      { nr: 8, title: "Ratschenfunktion",      desc: "Ratschenfunktion des Spanngurtes" },
      { nr: 9, title: "Fixierplatte",          desc: "Entnehmen und Einsetzen der vorderen Fixierplatte" },
    ],
  },
  pro: {
    visual: [
      { nr: 1, title: "Alu-Profile",      desc: "Kantenschutz / Alu-Profile unbeschädigt" },
      { nr: 2, title: "Anfahrschutz",     desc: "Anfahrschutz überall vorhanden und fest montiert (→ ggf. erneut verschrauben/montieren)" },
      { nr: 3, title: "Kufenklötze",      desc: "Alle Kufenklötze vorhanden und fest montiert (→ kurz mit dem Stapler anheben)" },
      { nr: 4, title: "Beschriftungen",   desc: "Alle Beschriftungen und Hinweise lesbar" },
      { nr: 5, title: "Taschen",          desc: "Taschen vorhanden und nicht beschädigt" },
      { nr: 6, title: "Aufkleber",        desc: "Unnötige Aufkleber/Labels von Speditionen entfernen" },
      { nr: 7, title: "Spanngurte",       desc: "Spanngurte ohne Risse (→ einzelne abstehende Fasern unproblematisch)" },
      { nr: 8, title: "Sicherungswinkel", desc: "Alle Sicherungswinkel für das Zubehör sind vorhanden" },
    ],
    functional: [
      { nr: 1, title: "Klappe / Rampe",        desc: "Klappe schließt einwandfrei" },
      { nr: 2, title: "Klappenstütze",         desc: "Klappenstütze unbeschädigt" },
      { nr: 3, title: "Alurampe",              desc: "Alurampe unbeschädigt" },
      { nr: 4, title: "Verschlüsse d. Klappe", desc: "Butterfly Verschlüsse funktionieren einwandfrei" },
      { nr: 5, title: "Bodenplatte",           desc: "Aufnahmen fest mit Dämpfungsplatte verbunden" },
      { nr: 6, title: "Rändelschrauben (a)",   desc: "Sterngriffe / Rändelschrauben vorhanden" },
      { nr: 7, title: "Rändelschrauben (b)",   desc: "Gewinde Rändelschrauben funktioniert einwandfrei" },
      { nr: 8, title: "Ratschenfunktion",      desc: "Ratschenfunktion des Spanngurtes" },
      { nr: 9, title: "Fixierplatte",          desc: "Entnehmen und Einsetzen der vorderen Fixierplatte" },
    ],
  },
};

// Auswahl-Helfer: PR… → pro, PU… → pure; Default = pure
export function getChecklistsForSerial(serial) {
  const s = String(serial || "");
  if (/^PR/i.test(s)) return CHECKLISTS.pro;
  if (/^PU/i.test(s)) return CHECKLISTS.pure;
  return CHECKLISTS.pure;
}
