/** Localized error content is shared across presentation themes. */
export function errorCopy(status: 404 | 500, german: boolean) {
    const introduction = german
        ? status === 404
            ? 'Diese Adresse führt gerade ins Grüne.'
            : 'Auf dem Server ist gerade eine kleine Pause angesagt.'
        : status === 404
          ? 'This address leads a little off the garden path.'
          : 'The server is taking an unscheduled breather.';
    const sectionTitle = german
        ? status === 404
            ? 'Zurück auf den Gartenweg'
            : 'Kurz durchatmen, dann weiter'
        : status === 404
          ? 'Back on the garden path'
          : 'Take a breath, then try again';
    const copy = german
        ? status === 404
            ? {
                  title: 'Hier wächst gerade nichts.',
                  eyebrow: '404 · Seite nicht gefunden',
                  description:
                      'Der Agent hat überall nachgesehen. Sogar unter den Blättern. Diese Adresse konnte er leider nicht finden.',
                  detail: 'Vielleicht hat sich ein Tippfehler eingeschlichen oder die Seite ist umgezogen. Auf der Startseite geht es weiter.',
                  action: 'Zur Startseite',
              }
            : {
                  title: 'Der Agent ist kurz im Funkloch.',
                  eyebrow: '500 · Serverfehler',
                  description:
                      'Wir haben gerufen. Auch ein zweites Mal. Der Agent ist gerade nicht erreichbar.',
                  detail: 'Hier hakt es auf dem Server. Versuch es später noch einmal. Deine Ideen laufen in der Zwischenzeit nicht weg.',
                  action: 'Zur Startseite',
              }
        : status === 404
          ? {
                title: 'Nothing growing here.',
                eyebrow: '404 · Page not found',
                description:
                    'The agent looked everywhere. Even under the leaves. This address is still nowhere to be found.',
                detail: 'There might be a typo, or the page may have moved. The homepage is a good place to pick up the trail.',
                action: 'Back to the homepage',
            }
          : {
                title: 'The agent has lost signal.',
                eyebrow: '500 · Server error',
                description:
                    'We called. Twice, actually. The agent is currently out of reach.',
                detail: 'Something on the server needs a little attention. Try again later. Your ideas can wait a moment.',
                action: 'Back to the homepage',
            };
    return { introduction, sectionTitle, ...copy };
}
