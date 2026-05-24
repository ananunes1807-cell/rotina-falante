# Nova Plataforma Firebase

Esta versao usa **Cloud Firestore**.

URL da nova versao no GitHub Pages:

```txt
https://ananunes1807-cell.github.io/alarme-falante/nova/index.html
```

## 1. Criar app Web no Firebase

1. Abra o Firebase Console.
2. Entre no projeto **Alarme falado**.
3. Clique na engrenagem **Configuracoes do projeto**.
4. Em **Seus apps**, crie ou abra o app Web.
5. Copie o bloco `firebaseConfig`.

## 2. Regras para testar

No Firestore, aba **Regras**, use:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /familias/{familiaId}/plataforma/{docId} {
      allow read, write: if true;
    }
  }
}
```

Essas regras sao simples para teste. Depois, o ideal e colocar login de mae e modo crianca com permissao de leitura.

## 3. Usar no app

1. Abra a nova plataforma.
2. Cole o `firebaseConfig`.
3. Digite o codigo da familia, por exemplo `familia-ana`.
4. Clique em **Conectar Firestore**.

O modo mae edita filhos, idade e rotinas. O modo crianca mostra a rotina atual de cada filho.
