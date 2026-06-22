# Rotina Falante - Firestore

Versao atual: v34.3.

O app usa Cloud Firestore para sincronizar a rotina da familia entre aparelhos. A tela tambem guarda a ultima atualizacao em `localStorage`, e o Firestore tenta manter cache offline no navegador.

URL publicada:

```txt
https://ananunes1807-cell.github.io/rotina-falante/
```

## Documento principal

Com login Google, os dois responsaveis usam o mesmo documento:

```txt
familias/familia-ana/plataforma/principal
```

O documento guarda um campo `state` com:

- `children`: perfis das criancas e responsaveis;
- `messages`: recados individuais por `childId`;
- `events`: registros de ajuda ou confusao;
- `childProtection`: configuracao do modo crianca protegido;
- `family`: responsaveis, convites e avisos de mudanca;
- `lastSyncedAt`: data/hora da ultima sincronizacao confirmada.

## Recados

Cada recado fica em `state.messages` usando o id da crianca:

```js
messages: {
  "childId": {
    childId: "childId",
    text: "Texto do recado",
    type: "normal", // normal, importante, carinho ou alerta
    createdAt: "2026-06-18T20:00:00.000Z",
    updatedAt: "2026-06-18T20:00:00.000Z",
    author: "email-do-responsavel"
  }
}
```

No modo familia, o responsavel edita um recado por crianca. No modo crianca, o recado aparece em um card separado e pode ser ouvido com o botao **Ouvir recado**.

## Eventos

Quando a crianca toca em **Estou confuso** ou **Preciso de ajuda**, o app registra em `state.events`:

```js
{
  id: "uuid",
  type: "confused", // ou "help"
  childId: "id-da-crianca",
  childName: "Nome",
  taskId: "id-da-tarefa-atual",
  taskName: "Nome da tarefa atual",
  at: "2026-06-18T20:00:00.000Z"
}
```

O app guarda os eventos mais recentes para o responsavel consultar futuramente.

## Offline

O app usa tres camadas:

1. Service worker para manter arquivos do app em cache.
2. Firestore offline com IndexedDB quando o navegador permitir.
3. `localStorage` como fallback da ultima rotina e ultimo recado carregados.

Quando o aparelho fica sem internet, aparece:

```txt
Sem internet. Mostrando ultima atualizacao salva.
```

Tambem aparece a data/hora da ultima sincronizacao bem-sucedida.

## Login Google no celular

A v34.3 tenta popup/aba no celular antes do redirect, porque alguns navegadores voltam do Google sem entregar usuario para `getRedirectResult`.

A tela mostra um diagnostico no inicio e no modo familia com:

- resultado do `getRedirectResult`;
- se `auth.currentUser` existe;
- se `onAuthStateChanged` ja chamou;
- URL atual;
- navegador mobile ou desktop;
- PWA instalado ou navegador normal;
- ultimo erro real de login.

Quando o celular volta do Google, o app mostra `Voltamos do Google, conferindo login...` antes de decidir se entrou ou se houve erro.

## Regras recomendadas

Use estas regras no Firestore para liberar somente os dois e-mails responsaveis:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function responsavelLiberado() {
      return request.auth != null
        && request.auth.token.email in [
          "anacarolinamoraisdosreis@gmail.com",
          "carlionison.43@gmail.com"
        ];
    }

    match /familias/familia-ana/plataforma/{docId} {
      allow read, write: if responsavelLiberado();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Observacao

O botao **Conectar Firestore** sem Google existe por compatibilidade, mas o uso recomendado e entrar com Google.
