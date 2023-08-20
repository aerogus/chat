# Salon de discussion

## Pour tester rapidement

Après avoir cloné le dépôt localement, installer les dépencances :

```bash
npm install
```

Puis démarrer le serveur

```bash
npm start
```

Le serveur tourne alors sur le port 80 par défaut

Ouvrez votre navigateur avec l'url http://localhost:80

## Installation de prod

- Derrière un serveur nginx en reverse proxy
- Avec Let's Ecnrypt / certbot

cf. /conf/nginx-vhost.conf
cf. chat.service (service systemd)
