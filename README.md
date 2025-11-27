# lost-found-uii

![TypeScript](https://img.shields.io/badge/-TypeScript-blue?logo=typescript&logoColor=white)

## 📝 Description

Lost & Found UII System is a comprehensive solution built with Angular on the frontend and Express.js with TypeScript on the backend, designed to streamline the process of managing lost and found items. This web application provides a user-friendly interface for both reporting lost items and searching for found items. Key features include secure authentication to protect user data and ensure authorized access, and a responsive web design for accessibility across various devices. The system aims to efficiently connect individuals who have lost items with those who have found them, improving the chances of successful recovery.

## ✨ Features

- 🔐 Auth
- 🕸️ Web


## 🛠️ Tech Stack

- 🅰️ Angular
- 🚀 Express.js
- 📜 TypeScript


## 📦 Key Dependencies

```
@angular/animations: ^17.3.0
@angular/common: ^17.3.0
@angular/compiler: ^17.3.0
@angular/core: ^17.3.0
@angular/forms: ^17.3.0
@angular/platform-browser: ^17.3.0
@angular/platform-browser-dynamic: ^17.3.0
@angular/platform-server: ^17.3.0
@angular/router: ^17.3.0
@angular/ssr: ^17.3.17
@phosphor-icons/web: ^2.1.2
@types/leaflet: ^1.9.21
angularx-qrcode: ^17.0.1
express: ^4.18.2
html5-qrcode: ^2.3.8
```

## 🚀 Run Commands

- **ng**: `npm run ng`
- **start**: `npm run start`
- **build**: `npm run build`
- **watch**: `npm run watch`
- **test**: `npm run test`
- **serve:ssr:frontend**: `npm run serve:ssr:frontend`


## 📁 Project Structure

```
frontend
├── angular.json
├── package.json
├── server.ts
├── src
│   ├── app
│   │   ├── app.component.css
│   │   ├── app.component.html
│   │   ├── app.component.spec.ts
│   │   ├── app.component.ts
│   │   ├── app.config.server.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── core
│   │   │   ├── guards
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── index.ts
│   │   │   ├── mocks
│   │   │   │   ├── index.ts
│   │   │   │   ├── item.mock.ts
│   │   │   │   ├── location.mock.ts
│   │   │   │   └── user.mock.ts
│   │   │   ├── models
│   │   │   │   ├── index.ts
│   │   │   │   ├── item.model.ts
│   │   │   │   └── user.model.ts
│   │   │   └── services
│   │   │       ├── auth.service.ts
│   │   │       └── index.ts
│   │   ├── features
│   │   │   ├── auth
│   │   │   │   └── login
│   │   │   │       ├── login.component.css
│   │   │   │       ├── login.component.html
│   │   │   │       └── login.component.ts
│   │   │   ├── home
│   │   │   │   ├── home.component.css
│   │   │   │   ├── home.component.html
│   │   │   │   ├── home.component.spec.ts
│   │   │   │   └── home.component.ts
│   │   │   ├── item-detail
│   │   │   │   ├── item-detail.component.css
│   │   │   │   ├── item-detail.component.html
│   │   │   │   ├── item-detail.component.spec.ts
│   │   │   │   └── item-detail.component.ts
│   │   │   ├── notification
│   │   │   │   ├── notification.component.css
│   │   │   │   ├── notification.component.html
│   │   │   │   ├── notification.component.spec.ts
│   │   │   │   └── notification.component.ts
│   │   │   ├── post-item
│   │   │   │   ├── post-item.component.css
│   │   │   │   ├── post-item.component.html
│   │   │   │   ├── post-item.component.spec.ts
│   │   │   │   └── post-item.component.ts
│   │   │   ├── profile
│   │   │   │   ├── profile.component.css
│   │   │   │   ├── profile.component.html
│   │   │   │   ├── profile.component.spec.ts
│   │   │   │   └── profile.component.ts
│   │   │   ├── public-profile
│   │   │   │   ├── public-profile.component.css
│   │   │   │   ├── public-profile.component.html
│   │   │   │   └── public-profile.component.ts
│   │   │   └── radar
│   │   │       ├── radar.component.css
│   │   │       ├── radar.component.html
│   │   │       ├── radar.component.spec.ts
│   │   │       └── radar.component.ts
│   │   ├── layouts
│   │   │   ├── bottom-nav
│   │   │   │   ├── bottom-nav.component.css
│   │   │   │   ├── bottom-nav.component.html
│   │   │   │   ├── bottom-nav.component.spec.ts
│   │   │   │   └── bottom-nav.component.ts
│   │   │   ├── footer
│   │   │   │   ├── footer.component.css
│   │   │   │   ├── footer.component.html
│   │   │   │   ├── footer.component.spec.ts
│   │   │   │   └── footer.component.ts
│   │   │   ├── main-layout
│   │   │   │   ├── main-layout.component.css
│   │   │   │   ├── main-layout.component.html
│   │   │   │   ├── main-layout.component.spec.ts
│   │   │   │   └── main-layout.component.ts
│   │   │   └── navbar
│   │   │       ├── navbar.component.css
│   │   │       ├── navbar.component.html
│   │   │       ├── navbar.component.spec.ts
│   │   │       └── navbar.component.ts
│   │   └── shared
│   │       ├── components
│   │       │   ├── category-filter
│   │       │   │   ├── category-filter.component.css
│   │       │   │   ├── category-filter.component.html
│   │       │   │   ├── category-filter.component.spec.ts
│   │       │   │   └── category-filter.component.ts
│   │       │   ├── confirm-modal
│   │       │   │   ├── confirm-modal.component.css
│   │       │   │   ├── confirm-modal.component.html
│   │       │   │   └── confirm-modal.component.ts
│   │       │   ├── cube-loader
│   │       │   │   ├── cube-loader.component.css
│   │       │   │   ├── cube-loader.component.html
│   │       │   │   └── cube-loader.component.ts
│   │       │   ├── empty-state
│   │       │   │   ├── empty-state.component.css
│   │       │   │   ├── empty-state.component.html
│   │       │   │   ├── empty-state.component.spec.ts
│   │       │   │   └── empty-state.component.ts
│   │       │   ├── index.ts
│   │       │   ├── item-card
│   │       │   │   ├── item-card.component.css
│   │       │   │   ├── item-card.component.html
│   │       │   │   ├── item-card.component.spec.ts
│   │       │   │   └── item-card.component.ts
│   │       │   ├── leaflet-map
│   │       │   │   ├── leaflet-map.component.css
│   │       │   │   ├── leaflet-map.component.html
│   │       │   │   └── leaflet-map.component.ts
│   │       │   ├── qr-display
│   │       │   │   ├── qr-display.component.css
│   │       │   │   ├── qr-display.component.html
│   │       │   │   └── qr-display.component.ts
│   │       │   ├── qr-scanner
│   │       │   │   ├── qr-scanner.component.css
│   │       │   │   ├── qr-scanner.component.html
│   │       │   │   └── qr-scanner.component.ts
│   │       │   ├── search-bar
│   │       │   │   ├── search-bar.component.css
│   │       │   │   ├── search-bar.component.html
│   │       │   │   ├── search-bar.component.spec.ts
│   │       │   │   └── search-bar.component.ts
│   │       │   ├── status-badge
│   │       │   │   ├── status-badge.component.css
│   │       │   │   ├── status-badge.component.html
│   │       │   │   ├── status-badge.component.spec.ts
│   │       │   │   └── status-badge.component.ts
│   │       │   ├── theme-toggle
│   │       │   │   ├── theme-toggle.component.css
│   │       │   │   ├── theme-toggle.component.html
│   │       │   │   ├── theme-toggle.component.spec.ts
│   │       │   │   └── theme-toggle.component.ts
│   │       │   └── user-badge
│   │       │       └── user-badge.component.ts
│   │       └── index.ts
│   ├── assets
│   │   └── LogoUII.png
│   ├── favicon.ico
│   ├── index.html
│   ├── main.server.ts
│   ├── main.ts
│   └── styles.css
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

## 🛠️ Development Setup

### Node.js/JavaScript Setup
1. Install Node.js (v18+ recommended)
2. Install dependencies: `npm install` or `yarn install`
3. Start development server: (Check scripts in `package.json`, e.g., `npm run dev`)


## 👥 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/iza-aa/lost-found-uii.git`
3. **Create** a new branch: `git checkout -b feature/your-feature`
4. **Commit** your changes: `git commit -am 'Add some feature'`
5. **Push** to your branch: `git push origin feature/your-feature`
6. **Open** a pull request

Please ensure your code follows the project's style guidelines and includes tests where applicable.

---
*This README was generated with ❤️ by ReadmeBuddy*
